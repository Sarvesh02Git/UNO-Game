import random
import uuid
from enum import Enum
from typing import Optional
from dataclasses import dataclass, field


class Color(str, Enum):
    RED = "red"
    BLUE = "blue"
    GREEN = "green"
    YELLOW = "yellow"
    WILD = "wild"


class CardType(str, Enum):
    NUMBER = "number"
    SKIP = "skip"
    REVERSE = "reverse"
    DRAW_TWO = "draw_two"
    WILD = "wild"
    WILD_DRAW_FOUR = "wild_draw_four"


@dataclass
class Card:
    id: str
    color: Color
    card_type: CardType
    value: Optional[int] = None  # 0-9 for number cards

    def to_dict(self):
        return {
            "id": self.id,
            "color": self.color.value,
            "type": self.card_type.value,
            "value": self.value,
        }

    def can_play_on(self, other: "Card", chosen_color: Optional[Color] = None) -> bool:
        if self.color == Color.WILD:
            return True
        if other.color == Color.WILD:
            return self.color == chosen_color
        if self.color == other.color:
            return True
        if self.card_type == other.card_type and self.card_type != CardType.NUMBER:
            return True
        if self.card_type == CardType.NUMBER and other.card_type == CardType.NUMBER and self.value == other.value:
            return True
        return False


def make_deck() -> list[Card]:
    cards = []

    def card_id():
        return str(uuid.uuid4())[:8]

    for color in [Color.RED, Color.BLUE, Color.GREEN, Color.YELLOW]:
        # One 0 card
        cards.append(Card(card_id(), color, CardType.NUMBER, 0))
        # Two of each 1-9, Skip, Reverse, Draw Two
        for value in range(1, 10):
            for _ in range(2):
                cards.append(Card(card_id(), color, CardType.NUMBER, value))
        for _ in range(2):
            cards.append(Card(card_id(), color, CardType.SKIP))
            cards.append(Card(card_id(), color, CardType.REVERSE))
            cards.append(Card(card_id(), color, CardType.DRAW_TWO))

    # Wild cards
    for _ in range(4):
        cards.append(Card(card_id(), Color.WILD, CardType.WILD))
        cards.append(Card(card_id(), Color.WILD, CardType.WILD_DRAW_FOUR))

    random.shuffle(cards)
    return cards


@dataclass
class Player:
    id: str
    name: str
    hand: list[Card] = field(default_factory=list)
    is_connected: bool = True

    def to_dict(self, hide_hand=False):
        return {
            "id": self.id,
            "name": self.name,
            "hand_count": len(self.hand),
            "hand": [] if hide_hand else [c.to_dict() for c in self.hand],
            "is_connected": self.is_connected,
        }


class GameState(str, Enum):
    WAITING = "waiting"
    PLAYING = "playing"
    FINISHED = "finished"


class UNOGame:
    def __init__(self, game_id: str):
        self.game_id = game_id
        self.players: list[Player] = []
        self.deck: list[Card] = []
        self.discard_pile: list[Card] = []
        self.state = GameState.WAITING
        self.current_player_idx = 0
        self.direction = 1  # 1 = clockwise, -1 = counter-clockwise
        self.chosen_color: Optional[Color] = None  # for wild cards
        self.winner: Optional[str] = None
        self.draw_stack = 0  # accumulated draw cards
        self.pending_draw = 0  # cards current player must draw if they can't stack
        self.message = "Waiting for players..."
        self.uno_called: set[str] = set()  # players who called UNO

    def add_player(self, player_id: str, name: str) -> Player:
        if self.state != GameState.WAITING:
            raise ValueError("Game already started")
        if len(self.players) >= 4:
            raise ValueError("Game is full")
        player = Player(id=player_id, name=name)
        self.players.append(player)
        return player

    def remove_player(self, player_id: str):
        self.players = [p for p in self.players if p.id != player_id]

    def start_game(self):
        if len(self.players) < 2:
            raise ValueError("Need at least 2 players")
        self.deck = make_deck()
        # Deal 7 cards each
        for player in self.players:
            player.hand = [self.deck.pop() for _ in range(7)]
        # Find a valid starting card (not wild)
        start_card = None
        while True:
            card = self.deck.pop()
            if card.color != Color.WILD:
                start_card = card
                break
            self.deck.insert(0, card)  # put wild back at bottom

        self.discard_pile = [start_card]
        self.chosen_color = None

        # Handle special starting cards
        if start_card.card_type == CardType.SKIP:
            self.current_player_idx = 1 % len(self.players)
            self.message = f"Game started! {start_card.color.value} SKIP — {self.current_player.name}'s turn is skipped!"
            self.advance_turn()
        elif start_card.card_type == CardType.REVERSE:
            self.direction = -1
            self.message = f"Game started! {start_card.color.value} REVERSE — direction flipped!"
        elif start_card.card_type == CardType.DRAW_TWO:
            self.draw_stack = 2
            self.message = f"Game started! {start_card.color.value} DRAW TWO — {self.current_player.name} must draw 2 or stack!"
        else:
            self.message = f"Game started! {self.current_player.name}'s turn."

        self.state = GameState.PLAYING

    @property
    def current_player(self) -> Player:
        return self.players[self.current_player_idx]

    @property
    def top_card(self) -> Card:
        return self.discard_pile[-1]

    def draw_card(self, player_id: str) -> list[Card]:
        player = self._get_player(player_id)
        if player.id != self.current_player.id:
            raise ValueError("Not your turn")

        if self.draw_stack > 0:
            count = self.draw_stack
            self.draw_stack = 0
        else:
            count = 1

        drawn = []
        for _ in range(count):
            if not self.deck:
                self._reshuffle()
            if self.deck:
                drawn.append(self.deck.pop())

        player.hand.extend(drawn)
        self.uno_called.discard(player_id)
        self.message = f"{player.name} drew {count} card(s)."
        self.advance_turn()
        return drawn

    def play_card(self, player_id: str, card_id: str, chosen_color: Optional[str] = None) -> dict:
        player = self._get_player(player_id)
        if player.id != self.current_player.id:
            raise ValueError("Not your turn")

        card = next((c for c in player.hand if c.id == card_id), None)
        if not card:
            raise ValueError("Card not in hand")

        top = self.top_card
        current_color = self.chosen_color if top.color == Color.WILD else top.color

        # Check draw stack stacking rules
        if self.draw_stack > 0:
            if card.card_type == CardType.DRAW_TWO and top.card_type == CardType.DRAW_TWO:
                pass  # stack allowed
            elif card.card_type == CardType.WILD_DRAW_FOUR:
                pass  # stack allowed
            else:
                raise ValueError("You must play a draw card to stack, or draw the stack")

        if not card.can_play_on(top, current_color):
            raise ValueError("Cannot play this card")

        # Handle wild color choice
        new_chosen_color = None
        if card.color == Color.WILD:
            if not chosen_color:
                raise ValueError("Must choose a color for wild card")
            new_chosen_color = Color(chosen_color)

        # Play the card
        player.hand.remove(card)
        self.discard_pile.append(card)
        self.chosen_color = new_chosen_color
        self.uno_called.discard(player_id)

        result = {"card": card.to_dict(), "effects": []}

        # Check win
        if len(player.hand) == 0:
            self.state = GameState.FINISHED
            self.winner = player.id
            self.message = f"🎉 {player.name} wins!"
            return result

        # Apply card effects
        if card.card_type == CardType.SKIP:
            self.advance_turn()
            skipped = self.current_player.name
            self.advance_turn()
            self.message = f"{player.name} played SKIP — {skipped} is skipped! {self.current_player.name}'s turn."
            result["effects"].append("skip")

        elif card.card_type == CardType.REVERSE:
            self.direction *= -1
            if len(self.players) == 2:
                # In 2-player, reverse acts like skip
                self.advance_turn()
                self.message = f"{player.name} played REVERSE — plays again! {self.current_player.name}'s turn."
            else:
                self.advance_turn()
                self.message = f"{player.name} played REVERSE — direction changed! {self.current_player.name}'s turn."
            result["effects"].append("reverse")

        elif card.card_type == CardType.DRAW_TWO:
            self.draw_stack += 2
            self.advance_turn()
            self.message = f"{player.name} played DRAW TWO — {self.current_player.name} must draw {self.draw_stack} or stack!"
            result["effects"].append("draw_two")

        elif card.card_type == CardType.WILD_DRAW_FOUR:
            self.draw_stack += 4
            self.advance_turn()
            self.message = f"{player.name} played WILD DRAW FOUR ({new_chosen_color.value}) — {self.current_player.name} must draw {self.draw_stack} or stack!"
            result["effects"].append("wild_draw_four")

        elif card.card_type == CardType.WILD:
            self.advance_turn()
            self.message = f"{player.name} played WILD — color is now {new_chosen_color.value}! {self.current_player.name}'s turn."
            result["effects"].append("wild")

        else:
            self.advance_turn()
            self.message = f"{player.name} played {card.color.value} {card.value}. {self.current_player.name}'s turn."

        return result

    def call_uno(self, player_id: str):
        player = self._get_player(player_id)
        if len(player.hand) == 1:
            self.uno_called.add(player_id)
            self.message = f"🃏 {player.name} called UNO!"
        else:
            raise ValueError("Can only call UNO with 1 card left")

    def catch_uno(self, caller_id: str, target_id: str):
        """Catch a player who forgot to call UNO."""
        target = self._get_player(target_id)
        if len(target.hand) == 1 and target_id not in self.uno_called:
            # Give them 2 penalty cards
            for _ in range(2):
                if not self.deck:
                    self._reshuffle()
                if self.deck:
                    target.hand.append(self.deck.pop())
            caller = self._get_player(caller_id)
            self.message = f"{caller.name} caught {target.name} — they draw 2 cards!"
        else:
            raise ValueError("Cannot catch this player")

    def advance_turn(self):
        self.current_player_idx = (self.current_player_idx + self.direction) % len(self.players)

    def _get_player(self, player_id: str) -> Player:
        player = next((p for p in self.players if p.id == player_id), None)
        if not player:
            raise ValueError("Player not found")
        return player

    def _reshuffle(self):
        if len(self.discard_pile) <= 1:
            return
        top = self.discard_pile[-1]
        reshuffled = self.discard_pile[:-1]
        random.shuffle(reshuffled)
        self.deck = reshuffled
        self.discard_pile = [top]

    def to_dict(self, viewer_id: Optional[str] = None) -> dict:
        return {
            "game_id": self.game_id,
            "state": self.state.value,
            "players": [
                p.to_dict(hide_hand=(viewer_id is not None and p.id != viewer_id))
                for p in self.players
            ],
            "top_card": self.top_card.to_dict() if self.discard_pile else None,
            "chosen_color": self.chosen_color.value if self.chosen_color else None,
            "current_player_id": self.current_player.id if self.players else None,
            "direction": self.direction,
            "deck_count": len(self.deck),
            "draw_stack": self.draw_stack,
            "winner": self.winner,
            "message": self.message,
            "uno_called": list(self.uno_called),
        }