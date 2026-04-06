export type Color = 'red' | 'blue' | 'green' | 'yellow' | 'wild';
export type CardType = 'number' | 'skip' | 'reverse' | 'draw_two' | 'wild' | 'wild_draw_four';

export interface Card {
  id: string;
  color: Color;
  type: CardType;
  value: number | null;
}

export interface Player {
  id: string;
  name: string;
  hand_count: number;
  hand: Card[];
  is_connected: boolean;
}

export interface GameState {
  game_id: string;
  state: 'waiting' | 'playing' | 'finished';
  players: Player[];
  top_card: Card | null;
  chosen_color: Color | null;
  current_player_id: string | null;
  direction: 1 | -1;
  deck_count: number;
  draw_stack: number;
  winner: string | null;
  message: string;
  uno_called: string[];
  my_hand: Card[];
  my_id: string;
}

export type WSMessage =
  | { type: 'joined'; player_id: string; player_name: string; game_id: string }
  | { type: 'game_state'; data: GameState }
  | { type: 'error'; message: string };