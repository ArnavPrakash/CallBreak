import { useEffect, useState } from 'react';
import type {
  GameStartedPayload,
  MatchOverPayload,
  PublicGameState,
  RoomUpdatePayload,
} from '@callbreak/shared';
import { connectSocket, getSocket } from './socket/client';
import { GameTable } from './pages/GameTable';
import { Lobby } from './pages/Lobby';

type View = 'lobby' | 'game';

function App() {
  const [username, setUsername] = useState(() => sessionStorage.getItem('username') || '');
  const [view, setView] = useState<View>('lobby');
  const [room, setRoom] = useState<RoomUpdatePayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [gameStarted, setGameStarted] = useState<GameStartedPayload | null>(null);
  const [gameState, setGameState] = useState<PublicGameState | null>(null);
  const [hand, setHand] = useState<import('@callbreak/shared').Card[]>([]);
  const [matchOver, setMatchOver] = useState<MatchOverPayload | null>(null);

  useEffect(() => {
    sessionStorage.setItem('username', username);
  }, [username]);

  useEffect(() => {
    const socket = connectSocket();

    socket.on('room:updated', (data) => {
      setRoom(data);
      setError(null);
      if (data.status === 'lobby') {
        setView('lobby');
        setGameStarted(null);
        setGameState(null);
        setMatchOver(null);
      }
    });

    socket.on('room:error', ({ message }) => {
      setError(message);
    });

    socket.on('game:started', (data) => {
      setGameStarted(data);
      setHand(data.hand);
      setView('game');
      setMatchOver(null);
    });

    socket.on('game:hand', ({ hand: newHand }) => {
      setHand(newHand);
    });

    socket.on('game:state', (state) => {
      setGameState(state);
    });

    socket.on('game:matchOver', (data) => {
      setMatchOver(data);
    });

    socket.on('game:error', ({ message }) => {
      setError(message);
    });

    return () => {
      socket.off('room:updated');
      socket.off('room:error');
      socket.off('game:started');
      socket.off('game:hand');
      socket.off('game:state');
      socket.off('game:matchOver');
      socket.off('game:error');
    };
  }, []);

  const handleLeaveGame = () => {
    getSocket().emit('room:leave');
    setView('lobby');
    setGameStarted(null);
    setGameState(null);
    setMatchOver(null);
    setRoom(null);
  };

  if (view === 'game' && gameStarted) {
    return (
      <GameTable
        gameStarted={gameStarted}
        gameState={gameState}
        hand={hand}
        onLeave={handleLeaveGame}
        matchOver={matchOver ? { winner: matchOver.winner, totals: matchOver.totals } : null}
      />
    );
  }

  return (
    <Lobby
      username={username}
      onUsernameChange={setUsername}
      room={room}
      error={error}
    />
  );
}

export default App;
