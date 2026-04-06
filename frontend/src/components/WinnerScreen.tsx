import React from 'react';
import { GameState } from '../types';

interface WinnerScreenProps {
  gameState: GameState;
  myId: string;
  onPlayAgain: () => void;
}

export function WinnerScreen({ gameState, myId, onPlayAgain }: WinnerScreenProps) {
  const winner = gameState.players.find(p => p.id === gameState.winner);
  const isWinner = gameState.winner === myId;

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: isWinner
        ? 'radial-gradient(ellipse at center, #0f3a1f 0%, #0d0d1a 100%)'
        : 'radial-gradient(ellipse at center, #1a0a2e 0%, #0d0d1a 100%)' }}>

      {/* Confetti for winner */}
      {isWinner && Array.from({ length: 20 }).map((_, i) => (
        <div
          key={i}
          className="absolute w-3 h-3 rounded-sm animate-bounce"
          style={{
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            background: ['#ef4444', '#3b82f6', '#22c55e', '#eab308'][i % 4],
            animationDelay: `${Math.random() * 2}s`,
            opacity: 0.6,
          }}
        />
      ))}

      <div className="text-center z-10 px-6">
        <div className="text-6xl mb-4">{isWinner ? '🏆' : '💀'}</div>
        <h1 className="text-5xl font-black text-white mb-2">
          {isWinner ? 'You Win!' : `${winner?.name} Wins!`}
        </h1>
        <p className="text-white/50 mb-8 text-lg">
          {isWinner ? 'Congratulations! You played all your cards!' : 'Better luck next time!'}
        </p>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-8 text-left">
          <p className="text-white/40 text-xs uppercase tracking-widest mb-3">Final Standings</p>
          {gameState.players.map((p, i) => (
            <div key={p.id} className="flex items-center gap-3 py-2">
              <span className="text-white/30 w-6">{i + 1}.</span>
              <span className={`font-medium ${p.id === gameState.winner ? 'text-yellow-400' : 'text-white/70'}`}>
                {p.name} {p.id === myId && '(you)'}
              </span>
              {p.id === gameState.winner && <span className="ml-auto text-yellow-400">🏆 Winner</span>}
              {p.id !== gameState.winner && (
                <span className="ml-auto text-white/30 text-sm">{p.hand_count} cards left</span>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={onPlayAgain}
          className="w-full py-4 rounded-2xl font-black text-xl text-white transition-all hover:scale-105 active:scale-95 shadow-2xl"
          style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}
        >
          Play Again
        </button>
      </div>
    </div>
  );
}