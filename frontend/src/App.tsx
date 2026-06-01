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
import { clearSession, loadSession, saveSession } from './utils/session';
import type { ChatMessage } from './components/ChatDrawer';

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
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    sessionStorage.setItem('username', username);
  }, [username]);

  useEffect(() => {
    const socket = connectSocket();

    const tryReconnect = () => {
      const session = loadSession();
      if (session && session.username === username.trim()) {
        socket.emit('room:reconnect', {
          code: session.code,
          username: session.username,
        });
      }
    };

    socket.on('connect', tryReconnect);
    socket.io.on('reconnect', tryReconnect);

    socket.on('room:updated', (data) => {
      setRoom((prev) => {
        if (prev?.code !== data.code) {
          setChatMessages([]);
        }
        return data;
      });
      setError(null);
      saveSession(data.code, username.trim());

      if (data.status === 'lobby') {
        setView('lobby');
        setGameStarted(null);
        setGameState(null);
        setMatchOver(null);
      } else {
        setView('game');
        if (data.status !== 'matchEnd') {
          setMatchOver(null);
        }
      }
    });

    socket.on('room:error', ({ message }) => {
      setError(message);
    });

    const applyGameStarted = (data: GameStartedPayload) => {
      setGameStarted(data);
      setHand(data.hand);
      setView('game');
      setMatchOver(null);
    };

    socket.on('game:started', applyGameStarted);
    socket.on('game:resync', applyGameStarted);

    socket.on('game:hand', ({ hand: newHand }) => {
      setHand(newHand);
    });

    socket.on('game:state', (state) => {
      setGameState(state);
    });

    socket.on('game:matchOver', (data) => {
      setMatchOver(data);
      setView('game');
    });

    socket.on('game:error', ({ message }) => {
      setError(message);
    });

    socket.on('room:messageReceived', (data) => {
      setChatMessages((prev) => [...prev, data]);
    });

    if (socket.connected) {
      tryReconnect();
    }

    return () => {
      socket.off('connect', tryReconnect);
      socket.io.off('reconnect', tryReconnect);
      socket.off('room:updated');
      socket.off('room:error');
      socket.off('game:started', applyGameStarted);
      socket.off('game:resync', applyGameStarted);
      socket.off('game:hand');
      socket.off('game:state');
      socket.off('game:matchOver');
      socket.off('game:error');
      socket.off('room:messageReceived');
    };
  }, [username]);

  const handleLeaveGame = () => {
    const socket = getSocket();
    if (matchOver || room?.status === 'matchEnd') {
      socket.emit('room:returnToLobby');
    } else {
      socket.emit('room:leave');
    }
    clearSession();
    setView('lobby');
    setGameStarted(null);
    setGameState(null);
    setMatchOver(null);
    setRoom(null);
    setChatMessages([]);
  };

  const handleSendChatMessage = (message: string) => {
    getSocket().emit('room:message', { message });
  };

  if (view === 'game' && gameStarted) {
    return (
      <GameTable
        gameStarted={gameStarted}
        gameState={gameState}
        hand={hand}
        room={room}
        onLeave={handleLeaveGame}
        matchOver={matchOver}
        error={error}
        chatMessages={chatMessages}
        onSendChatMessage={handleSendChatMessage}
        username={username.trim()}
      />
    );
  }

  return (
    <Lobby
      username={username}
      onUsernameChange={setUsername}
      room={room}
      error={error}
      onReconnect={() => {
        const session = loadSession();
        if (session) {
          connectSocket().emit('room:reconnect', session);
        } else if (room) {
          connectSocket().emit('room:reconnect', {
            code: room.code,
            username: username.trim(),
          });
        }
      }}
      chatMessages={chatMessages}
      onSendChatMessage={handleSendChatMessage}
    />
  );
}

export default App;
