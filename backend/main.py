import uuid
import json
import asyncio
from typing import Optional
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from game import UNOGame, GameState

app = FastAPI(title="UNO Game Server")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory stores
games: dict[str, UNOGame] = {}
# Maps player_id -> (game_id, websocket)
connections: dict[str, tuple[str, WebSocket]] = {}


async def broadcast_game_state(game: UNOGame):
    """Send updated game state to all connected players."""
    disconnected = []
    for player in game.players:
        if player.id in connections:
            _, ws = connections[player.id]
            try:
                state = game.to_dict(viewer_id=player.id)
                # Include the player's own hand
                my_player = next((p for p in game.players if p.id == player.id), None)
                if my_player:
                    state["my_hand"] = [c.to_dict() for c in my_player.hand]
                    state["my_id"] = player.id
                await ws.send_json({"type": "game_state", "data": state})
            except Exception:
                disconnected.append(player.id)

    for pid in disconnected:
        if pid in connections:
            del connections[pid]


async def send_error(ws: WebSocket, message: str):
    await ws.send_json({"type": "error", "message": message})


@app.get("/")
def root():
    return {"status": "UNO Game Server running"}


@app.post("/games")
def create_game():
    game_id = str(uuid.uuid4())[:6].upper()
    games[game_id] = UNOGame(game_id)
    return {"game_id": game_id}


@app.get("/games/{game_id}")
def get_game(game_id: str):
    game = games.get(game_id)
    if not game:
        raise HTTPException(404, "Game not found")
    return game.to_dict()


@app.websocket("/ws/{game_id}/{player_name}")
async def websocket_endpoint(websocket: WebSocket, game_id: str, player_name: str):
    await websocket.accept()

    game = games.get(game_id)
    if not game:
        await websocket.send_json({"type": "error", "message": "Game not found"})
        await websocket.close()
        return

    # Create a player
    player_id = str(uuid.uuid4())

    try:
        player = game.add_player(player_id, player_name)
    except ValueError as e:
        await websocket.send_json({"type": "error", "message": str(e)})
        await websocket.close()
        return

    connections[player_id] = (game_id, websocket)

    # Welcome message
    await websocket.send_json({
        "type": "joined",
        "player_id": player_id,
        "player_name": player_name,
        "game_id": game_id,
    })

    await broadcast_game_state(game)

    try:
        while True:
            raw = await websocket.receive_text()
            try:
                msg = json.loads(raw)
            except json.JSONDecodeError:
                await send_error(websocket, "Invalid JSON")
                continue

            action = msg.get("action")

            try:
                if action == "start_game":
                    if game.players[0].id != player_id:
                        raise ValueError("Only the host can start the game")
                    game.start_game()
                    await broadcast_game_state(game)

                elif action == "play_card":
                    card_id = msg.get("card_id")
                    chosen_color = msg.get("chosen_color")
                    game.play_card(player_id, card_id, chosen_color)
                    await broadcast_game_state(game)

                elif action == "draw_card":
                    game.draw_card(player_id)
                    await broadcast_game_state(game)

                elif action == "call_uno":
                    game.call_uno(player_id)
                    await broadcast_game_state(game)

                elif action == "catch_uno":
                    target_id = msg.get("target_id")
                    game.catch_uno(player_id, target_id)
                    await broadcast_game_state(game)

                else:
                    await send_error(websocket, f"Unknown action: {action}")

            except ValueError as e:
                await send_error(websocket, str(e))

    except WebSocketDisconnect:
        if player_id in connections:
            del connections[player_id]
        game.remove_player(player_id)
        if not game.players:
            # Clean up empty games
            if game_id in games:
                del games[game_id]
        else:
            await broadcast_game_state(game)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)