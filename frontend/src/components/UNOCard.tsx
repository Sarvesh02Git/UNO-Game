import React from 'react';
import { Card, Color } from '../types';

interface UNOCardProps {
  card: Card;
  onClick?: () => void;
  selectable?: boolean;
  small?: boolean;
  faceDown?: boolean;
}

const COLOR_STYLES: Record<string, string> = {
  red: 'bg-gradient-to-br from-red-500 to-red-700 border-red-300',
  blue: 'bg-gradient-to-br from-blue-500 to-blue-700 border-blue-300',
  green: 'bg-gradient-to-br from-green-500 to-green-700 border-green-300',
  yellow: 'bg-gradient-to-br from-yellow-400 to-yellow-600 border-yellow-200',
  wild: 'border-gray-300',
};

const SYMBOL: Record<string, string> = {
  skip: '🚫',
  reverse: '🔄',
  draw_two: '+2',
  wild: '🌈',
  wild_draw_four: '+4',
};

export function UNOCard({ card, onClick, selectable = false, small = false, faceDown = false }: UNOCardProps) {
  const sizeClass = small
    ? 'w-12 h-18 text-xs rounded-md'
    : 'w-20 h-30 text-base rounded-xl';

  const cardContent = card.type === 'number' ? card.value : SYMBOL[card.type] || '?';

  const isWild = card.color === 'wild';

  if (faceDown) {
    return (
      <div className={`
        relative ${sizeClass} border-2 border-white/30
        bg-gradient-to-br from-gray-800 to-gray-900
        flex items-center justify-center
        shadow-lg
      `} style={{ width: small ? 48 : 80, height: small ? 72 : 120 }}>
        <div className="absolute inset-1 rounded-lg border border-white/20 flex items-center justify-center">
          <span className="text-white font-black text-lg">UNO</span>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`
        relative border-2 border-white/40
        ${isWild ? '' : COLOR_STYLES[card.color]}
        flex items-center justify-center
        shadow-xl transition-all duration-150
        ${selectable ? 'cursor-pointer hover:-translate-y-3 hover:shadow-2xl hover:scale-105 active:scale-95' : ''}
        select-none
      `}
      style={{
        width: small ? 48 : 80,
        height: small ? 72 : 120,
        borderRadius: 12,
        background: isWild
          ? 'conic-gradient(from 0deg, #ef4444, #3b82f6, #22c55e, #eab308, #ef4444)'
          : undefined,
        boxShadow: selectable ? '0 4px 20px rgba(0,0,0,0.5)' : '0 2px 8px rgba(0,0,0,0.3)',
      }}
    >
      {/* Inner oval */}
      <div
        className="absolute flex items-center justify-center"
        style={{
          inset: small ? 4 : 8,
          borderRadius: 8,
          background: isWild ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.18)',
          border: '1.5px solid rgba(255,255,255,0.3)',
        }}
      >
        <span
          className={`font-black text-white drop-shadow-md leading-none`}
          style={{ fontSize: small ? 14 : card.type === 'number' ? 28 : 20 }}
        >
          {cardContent}
        </span>
      </div>
      {/* Corner numbers */}
      {!small && (
        <>
          <span className="absolute top-1.5 left-2 text-white font-black text-xs leading-none drop-shadow">
            {card.type === 'number' ? card.value : SYMBOL[card.type]}
          </span>
          <span className="absolute bottom-1.5 right-2 text-white font-black text-xs leading-none drop-shadow rotate-180">
            {card.type === 'number' ? card.value : SYMBOL[card.type]}
          </span>
        </>
      )}
    </div>
  );
}

interface ColorPickerProps {
  onPick: (color: Color) => void;
  onCancel: () => void;
}

export function ColorPicker({ onPick, onCancel }: ColorPickerProps) {
  const colors: { color: Color; label: string; bg: string }[] = [
    { color: 'red', label: 'Red', bg: 'bg-red-500 hover:bg-red-400' },
    { color: 'blue', label: 'Blue', bg: 'bg-blue-500 hover:bg-blue-400' },
    { color: 'green', label: 'Green', bg: 'bg-green-500 hover:bg-green-400' },
    { color: 'yellow', label: 'Yellow', bg: 'bg-yellow-400 hover:bg-yellow-300' },
  ];

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-gray-900 border border-white/20 rounded-2xl p-8 text-center shadow-2xl">
        <h3 className="text-white text-xl font-bold mb-6">Choose a Color</h3>
        <div className="grid grid-cols-2 gap-4">
          {colors.map(({ color, label, bg }) => (
            <button
              key={color}
              onClick={() => onPick(color)}
              className={`${bg} text-white font-bold py-4 px-8 rounded-xl transition-all
                          hover:scale-105 active:scale-95 shadow-lg text-lg`}
            >
              {label}
            </button>
          ))}
        </div>
        <button
          onClick={onCancel}
          className="mt-4 text-gray-400 hover:text-white text-sm underline"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}