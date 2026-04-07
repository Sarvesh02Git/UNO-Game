import { useCallback, useEffect, useRef, useState } from 'react';
import { GameState, WSMessage } from './types';

// const WS_BASE = 'ws://localhost:8000/ws';
// const API_BASE = 'http://localhost:8000';

const WS_BASE = 'wss://uno-game-3.onrender.com/ws'
const API_BASE = 'https://uno-game-3.onrender.com'

export function useUNOGame() {
  const wsRef = useRef<WebSocket | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [myId, setMyId] = useState<string | null>(null);
  const [myName, setMyName] = useState<string | null>(null);
  const [gameId, setGameId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);

  const send = useCallback((data: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  const createGame = useCallback(async (playerName: string) => {
    const res = await fetch(`${API_BASE}/games`, { method: 'POST' });
    const { game_id } = await res.json();
    joinGame(game_id, playerName);
    return game_id;
  }, []);

  const joinGame = useCallback((gid: string, playerName: string) => {
    if (wsRef.current) wsRef.current.close();
    const ws = new WebSocket(`${WS_BASE}/${gid}/${encodeURIComponent(playerName)}`);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onerror = () => setError('Connection error');

    ws.onmessage = (event) => {
      const msg: WSMessage = JSON.parse(event.data);
      if (msg.type === 'joined') {
        setMyId(msg.player_id);
        setMyName(msg.player_name);
        setGameId(msg.game_id);
        setError(null);
      } else if (msg.type === 'game_state') {
        setGameState(msg.data);
      } else if (msg.type === 'error') {
        setError(msg.message);
        setTimeout(() => setError(null), 3000);
      }
    };
  }, []);

  const startGame = useCallback(() => send({ action: 'start_game' }), [send]);
  const drawCard = useCallback(() => send({ action: 'draw_card' }), [send]);
  const playCard = useCallback((card_id: string, chosen_color?: string) =>
    send({ action: 'play_card', card_id, chosen_color }), [send]);
  const callUno = useCallback(() => send({ action: 'call_uno' }), [send]);
  const catchUno = useCallback((target_id: string) =>
    send({ action: 'catch_uno', target_id }), [send]);

  useEffect(() => () => wsRef.current?.close(), []);

  return {
    gameState, myId, myName, gameId, error, connected,
    createGame, joinGame, startGame, drawCard, playCard, callUno, catchUno,
  };
}