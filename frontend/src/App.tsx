import React from 'react';
import { useUNOGame } from './useUNOGame';
import { Lobby } from './components/Lobby';
import { WaitingRoom } from './components/WaitingRoom';
import { GameBoard } from './components/GameBoard';
import { WinnerScreen } from './components/WinnerScreen';

function App() {
  const {
    gameState, myId, gameId, error,
    createGame, joinGame, startGame,
    playCard, drawCard, callUno, catchUno,
  } = useUNOGame();

  const handlePlayAgain = () => {
    window.location.reload();
  };

  // No game yet → Lobby
  if (!gameState || !myId) {
    return (
      <Lobby
        onCreateGame={createGame}
        onJoinGame={joinGame}
        error={error}
      />
    );
  }

  // Waiting for players
  if (gameState.state === 'waiting') {
    return (
      <WaitingRoom
        gameState={gameState}
        myId={myId}
        gameId={gameId!}
        onStartGame={startGame}
      />
    );
  }

  // Game finished
  if (gameState.state === 'finished') {
    return (
      <WinnerScreen
        gameState={gameState}
        myId={myId}
        onPlayAgain={handlePlayAgain}
      />
    );
  }

  // Playing
  return (
    <GameBoard
      gameState={gameState}
      myId={myId}
      onPlayCard={playCard}
      onDrawCard={drawCard}
      onCallUno={callUno}
      onCatchUno={catchUno}
      error={error}
    />
  );
}

export default App;