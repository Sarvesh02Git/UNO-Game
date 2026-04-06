import React, { useState } from 'react';

interface LobbyProps {
  onCreateGame: (name: string) => void;
  onJoinGame: (gameId: string, name: string) => void;
  error: string | null;
}

export function Lobby({ onCreateGame, onJoinGame, error }: LobbyProps) {
  const [name, setName] = useState('');
  const [gameId, setGameId] = useState('');
  const [mode, setMode] = useState<'menu' | 'create' | 'join'>('menu');

  const handleCreate = () => {
    if (!name.trim()) return;
    onCreateGame(name.trim());
  };

  const handleJoin = () => {
    if (!name.trim() || !gameId.trim()) return;
    onJoinGame(gameId.trim().toUpperCase(), name.trim());
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at center, #1a0a2e 0%, #0d0d1a 100%)' }}>
      {/* Animated background cards */}
      {['🔴', '🔵', '🟢', '🟡'].map((emoji, i) => (
        <div
          key={i}
          className="absolute text-6xl opacity-5 animate-pulse select-none"
          style={{
            top: `${15 + i * 20}%`,
            left: `${5 + i * 25}%`,
            animationDelay: `${i * 0.5}s`,
            transform: `rotate(${i * 15 - 20}deg)`,
          }}
        >
          🃏
        </div>
      ))}

      <div className="relative z-10 w-full max-w-md px-6">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-block relative">
            <h1
              className="text-8xl font-black tracking-tighter leading-none"
              style={{
                background: 'conic-gradient(from 180deg, #ef4444, #3b82f6, #22c55e, #eab308, #ef4444)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: 'none',
                filter: 'drop-shadow(0 0 30px rgba(239,68,68,0.3))',
              }}
            >
              UNO
            </h1>
          </div>
          <p className="text-white/50 text-sm tracking-widest uppercase mt-2">Multiplayer Card Game</p>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-300 rounded-xl px-4 py-3 text-sm mb-4 text-center">
            {error}
          </div>
        )}

        {mode === 'menu' && (
          <div className="space-y-4">
            <button
              onClick={() => setMode('create')}
              className="w-full py-4 rounded-2xl font-black text-lg text-white transition-all hover:scale-105 active:scale-95 shadow-2xl"
              style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}
            >
              Create Game
            </button>
            <button
              onClick={() => setMode('join')}
              className="w-full py-4 rounded-2xl font-black text-lg text-white transition-all hover:scale-105 active:scale-95 shadow-2xl"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}
            >
              Join Game
            </button>
          </div>
        )}

        {mode === 'create' && (
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Your name"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              maxLength={16}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-4 text-white placeholder-white/30 focus:outline-none focus:border-white/50 text-lg"
            />
            <button
              onClick={handleCreate}
              disabled={!name.trim()}
              className="w-full py-4 rounded-2xl font-black text-lg text-white disabled:opacity-40 transition-all hover:scale-105 active:scale-95"
              style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}
            >
              Create & Host Game
            </button>
            <button onClick={() => setMode('menu')} className="w-full text-white/40 hover:text-white/70 text-sm">
              ← Back
            </button>
          </div>
        )}

        {mode === 'join' && (
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Your name"
              value={name}
              onChange={e => setName(e.target.value)}
              maxLength={16}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-4 text-white placeholder-white/30 focus:outline-none focus:border-white/50 text-lg"
            />
            <input
              type="text"
              placeholder="Game code (e.g. AB12CD)"
              value={gameId}
              onChange={e => setGameId(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && handleJoin()}
              maxLength={8}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-4 text-white placeholder-white/30 focus:outline-none focus:border-white/50 text-lg font-mono"
            />
            <button
              onClick={handleJoin}
              disabled={!name.trim() || !gameId.trim()}
              className="w-full py-4 rounded-2xl font-black text-lg text-white disabled:opacity-40 transition-all hover:scale-105 active:scale-95"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}
            >
              Join Game
            </button>
            <button onClick={() => setMode('menu')} className="w-full text-white/40 hover:text-white/70 text-sm">
              ← Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
}