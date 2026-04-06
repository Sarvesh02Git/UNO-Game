import React from 'react';
import { GameState } from '../types';

interface WaitingRoomProps {
  gameState: GameState;
  myId: string;
  gameId: string;
  onStartGame: () => void;
}

export function WaitingRoom({ gameState, myId, gameId, onStartGame }: WaitingRoomProps) {
  const isHost = gameState.players[0]?.id === myId;

  const copyCode = () => {
    navigator.clipboard.writeText(gameId);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'radial-gradient(ellipse at center, #1a0a2e 0%, #0d0d1a 100%)' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-black text-white mb-2"
            style={{
              background: 'conic-gradient(from 180deg, #ef4444, #3b82f6, #22c55e, #eab308, #ef4444)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
            UNO
          </h1>
          <p className="text-white/50">Waiting for players...</p>
        </div>

        {/* Game Code */}
        <div className="bg-white/5 border border-white/15 rounded-2xl p-6 mb-6 text-center">
          <p className="text-white/40 text-xs uppercase tracking-widest mb-2">Game Code</p>
          <button
            onClick={copyCode}
            className="text-4xl font-black text-white font-mono tracking-widest hover:text-yellow-400 transition-colors"
            title="Click to copy"
          >
            {gameId}
          </button>
          <p className="text-white/30 text-xs mt-2">Click to copy • Share with friends</p>
        </div>

        {/* Players */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-6">
          <p className="text-white/40 text-xs uppercase tracking-widest mb-3">
            Players ({gameState.players.length}/4)
          </p>
          <div className="space-y-2">
            {gameState.players.map((player, i) => (
              <div key={player.id} className="flex items-center gap-3 py-2 px-3 rounded-xl bg-white/5">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white"
                  style={{
                    background: ['#ef4444', '#3b82f6', '#22c55e', '#eab308'][i],
                  }}>
                  {player.name[0].toUpperCase()}
                </div>
                <span className="text-white font-medium">{player.name}</span>
                {i === 0 && <span className="ml-auto text-yellow-400 text-xs">HOST</span>}
                {player.id === myId && <span className="text-white/30 text-xs ml-auto">(you)</span>}
              </div>
            ))}
            {Array.from({ length: 4 - gameState.players.length }).map((_, i) => (
              <div key={`empty-${i}`} className="flex items-center gap-3 py-2 px-3 rounded-xl border border-dashed border-white/10">
                <div className="w-8 h-8 rounded-full border border-dashed border-white/20" />
                <span className="text-white/20 text-sm">Waiting...</span>
              </div>
            ))}
          </div>
        </div>

        {isHost ? (
          <button
            onClick={onStartGame}
            disabled={gameState.players.length < 2}
            className="w-full py-4 rounded-2xl font-black text-xl text-white disabled:opacity-40 transition-all hover:scale-105 active:scale-95 shadow-2xl"
            style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}
          >
            {gameState.players.length < 2 ? 'Need 2+ Players' : 'Start Game!'}
          </button>
        ) : (
          <div className="text-center text-white/40">
            Waiting for host to start the game...
          </div>
        )}
      </div>
    </div>
  );
}