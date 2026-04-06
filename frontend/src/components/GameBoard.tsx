import { useState } from 'react';
import type { GameState, Card, Color } from '../types';
import { UNOCard, ColorPicker } from './UNOCard';

interface GameBoardProps {
  gameState: GameState;
  myId: string;
  onPlayCard: (cardId: string, chosenColor?: string) => void;
  onDrawCard: () => void;
  onCallUno: () => void;
  onCatchUno: (targetId: string) => void;
  error: string | null;
}

const COLOR_NAMES: Record<string, string> = {
  red: 'Red', blue: 'Blue', green: 'Green', yellow: 'Yellow'
};

const PLAYER_COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#eab308'];

export function GameBoard({ gameState, myId, onPlayCard, onDrawCard, onCallUno, onCatchUno, error }: GameBoardProps) {
  const [pendingWild, setPendingWild] = useState<string | null>(null);

  const isMyTurn = gameState.current_player_id === myId;
  const myPlayer = gameState.players.find(p => p.id === myId);
  const myHand = gameState.my_hand || [];
  const topCard = gameState.top_card;
  const effectiveColor = gameState.chosen_color || topCard?.color;

  const canPlayCard = (card: Card): boolean => {
    if (!isMyTurn) return false;
    if (card.color === 'wild') return true;
    if (gameState.draw_stack > 0) {
      if (gameState.top_card?.type === 'draw_two' && card.type === 'draw_two') return true;
      if (card.type === 'wild_draw_four') return true;
      return false;
    }
    if (!topCard) return true;
    const currentColor = effectiveColor;
    if (card.color === currentColor) return true;
    if (topCard.type !== 'number' && card.type === topCard.type) return true;
    if (topCard.type === 'number' && card.type === 'number' && card.value === topCard.value) return true;
    return false;
  };

  const handleCardClick = (card: Card) => {
    if (!canPlayCard(card)) return;
    if (card.color === 'wild') {
      setPendingWild(card.id);
    } else {
      onPlayCard(card.id);
    }
  };

  const handleColorPick = (color: Color) => {
    if (pendingWild) {
      onPlayCard(pendingWild, color);
      setPendingWild(null);
    }
  };

  const otherPlayers = gameState.players.filter(p => p.id !== myId);

  const getPlayerColorStyle = (playerIdx: number) => PLAYER_COLORS[playerIdx % PLAYER_COLORS.length];

  return (
    <div className="min-h-screen flex flex-col overflow-hidden select-none"
      style={{ background: 'radial-gradient(ellipse at 50% 40%, #0f2027 0%, #0d0d1a 100%)' }}>

      {pendingWild && (
        <ColorPicker
          onPick={handleColorPick}
          onCancel={() => setPendingWild(null)}
        />
      )}

      {/* Error Toast */}
      {error && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-red-500/90 text-white px-6 py-3 rounded-2xl shadow-2xl text-sm font-semibold backdrop-blur-md">
          ⚠️ {error}
        </div>
      )}

      {/* Top: Other players */}
      <div className="flex justify-around items-start pt-4 px-4 gap-2 flex-wrap">
        {otherPlayers.map((player) => {
          const playerIdx = gameState.players.findIndex(p => p.id === player.id);
          const isTheirTurn = gameState.current_player_id === player.id;
          const calledUno = gameState.uno_called.includes(player.id);
          const canCatch = !calledUno && player.hand_count === 1 && !isTheirTurn;

          return (
            <div key={player.id}
              className={`flex flex-col items-center transition-all duration-300 ${isTheirTurn ? 'scale-105' : 'opacity-70'}`}>
              {/* Player avatar */}
              <div className="relative">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-black text-lg shadow-lg"
                  style={{ background: getPlayerColorStyle(playerIdx) }}>
                  {player.name[0].toUpperCase()}
                </div>
                {isTheirTurn && (
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full animate-ping" />
                )}
                {calledUno && (
                  <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-black px-1.5 py-0.5 rounded-full">
                    UNO!
                  </div>
                )}
              </div>
              <div className="text-white text-xs font-medium mt-1">{player.name}</div>
              {/* Mini hand display */}
              <div className="flex mt-1">
                {Array.from({ length: Math.min(player.hand_count, 10) }).map((_, i) => (
                  <div key={i}
                    className="w-6 h-9 rounded border border-white/20 bg-gray-700 -ml-1 first:ml-0 shadow"
                    style={{ background: 'linear-gradient(135deg, #374151, #1f2937)' }} />
                ))}
                {player.hand_count > 10 && (
                  <div className="text-white/50 text-xs ml-1 self-end">+{player.hand_count - 10}</div>
                )}
              </div>
              <div className="text-white/40 text-xs mt-1">{player.hand_count} cards</div>

              {canCatch && (
                <button
                  onClick={() => onCatchUno(player.id)}
                  className="mt-1 bg-orange-500 hover:bg-orange-400 text-white text-xs font-bold px-2 py-1 rounded-lg transition-all hover:scale-105 active:scale-95"
                >
                  Catch UNO!
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Center: Game area */}
      <div className="flex-1 flex items-center justify-center gap-12 py-4">
        {/* Direction indicator */}
        <div className="text-white/30 text-3xl"
          style={{ transform: gameState.direction === 1 ? 'none' : 'scaleX(-1)' }}>
          ↻
        </div>

        {/* Discard pile */}
        <div className="flex flex-col items-center gap-2">
          {/* Chosen color indicator */}
          {gameState.chosen_color && (
            <div className="text-xs text-white/50 uppercase tracking-widest">
              Color: <span className="font-bold" style={{
                color: gameState.chosen_color && gameState.chosen_color !== 'wild'
                  ? { red: '#ef4444', blue: '#3b82f6', green: '#22c55e', yellow: '#eab308' }[gameState.chosen_color]
                  : undefined
              }}>{COLOR_NAMES[gameState.chosen_color]}</span>
            </div>
          )}
          {topCard && (
            <div style={{
              filter: 'drop-shadow(0 0 20px rgba(255,255,255,0.2))',
              transform: 'rotate(-5deg)',
            }}>
              <UNOCard card={topCard} />
            </div>
          )}
          {gameState.draw_stack > 0 && (
            <div className="bg-orange-500/20 border border-orange-500/50 text-orange-300 text-sm font-bold px-3 py-1 rounded-full">
              Stack: {gameState.draw_stack} cards!
            </div>
          )}
        </div>

        {/* Draw pile */}
        <button
          onClick={onDrawCard}
          disabled={!isMyTurn}
          className={`flex flex-col items-center gap-2 transition-all ${isMyTurn ? 'cursor-pointer hover:scale-105 active:scale-95' : 'opacity-50 cursor-not-allowed'}`}
        >
          <div style={{ transform: 'rotate(5deg)', filter: isMyTurn ? 'drop-shadow(0 0 15px rgba(99,102,241,0.5))' : 'none' }}>
            <UNOCard card={{ id: 'deck', color: 'wild', type: 'wild', value: null }} faceDown />
          </div>
          <span className="text-white/40 text-xs">{gameState.deck_count} left</span>
        </button>
      </div>

      {/* Status message */}
      <div className="text-center px-4 pb-2">
        <div className={`inline-block px-4 py-2 rounded-full text-sm font-medium
          ${isMyTurn ? 'bg-yellow-400/20 border border-yellow-400/40 text-yellow-300' : 'text-white/40'}`}>
          {gameState.message}
        </div>
      </div>

      {/* Bottom: My hand */}
      <div className="pb-6 pt-2">
        {/* My info */}
        <div className="flex items-center justify-center gap-4 mb-3 px-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-black text-sm"
              style={{ background: getPlayerColorStyle(gameState.players.findIndex(p => p.id === myId)) }}>
              {myPlayer?.name[0].toUpperCase()}
            </div>
            <span className="text-white/70 text-sm font-medium">{myPlayer?.name}</span>
            {isMyTurn && <span className="text-yellow-400 text-xs font-bold animate-pulse">YOUR TURN</span>}
          </div>

          <div className="flex gap-2 ml-auto">
            {myHand.length === 1 && !gameState.uno_called.includes(myId) && (
              <button
                onClick={onCallUno}
                className="bg-red-500 hover:bg-red-400 text-white font-black text-sm px-4 py-2 rounded-full shadow-lg transition-all hover:scale-105 active:scale-95 animate-bounce"
              >
                UNO!
              </button>
            )}
          </div>
        </div>

        {/* Hand cards */}
        <div className="overflow-x-auto px-4">
          <div className="flex items-end justify-center gap-1 min-w-max mx-auto pb-2">
            {myHand.map((card, i) => {
              const playable = canPlayCard(card);
              return (
                <div
                  key={card.id}
                  style={{
                    transition: 'transform 0.15s ease',
                    transform: playable && isMyTurn ? 'translateY(-8px)' : 'translateY(0)',
                    filter: !isMyTurn || !playable ? 'brightness(0.6) saturate(0.5)' : 'brightness(1.1)',
                  }}
                >
                  <UNOCard
                    card={card}
                    onClick={() => handleCardClick(card)}
                    selectable={playable && isMyTurn}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}