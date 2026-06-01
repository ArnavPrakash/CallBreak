import { useEffect, useRef, useState } from 'react';
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
import * as sounds from './utils/sounds';

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
  const [lastTrickWon, setLastTrickWon] = useState<{ winnerSeat: number; trick: import('@callbreak/shared').TrickPlay[] } | null>(null);

  interface Toast {
    id: string;
    message: string;
    type: 'info' | 'error' | 'success';
  }
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (message: string, type: 'info' | 'error' | 'success' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const roomRef = useRef<RoomUpdatePayload | null>(null);
  useEffect(() => {
    roomRef.current = room;
  }, [room]);

  useEffect(() => {
    sessionStorage.setItem('username', username);
  }, [username]);

  useEffect(() => {
    const socket = connectSocket();
    let errorTimeout: any = null;
    let wasDisconnected = false;

    const setErrorWithTimeout = (message: string) => {
      setError(message);
      if (errorTimeout) clearTimeout(errorTimeout);
      errorTimeout = setTimeout(() => {
        setError(null);
      }, 4000);
    };

    const tryReconnect = () => {
      const session = loadSession();
      if (session && session.username === username.trim()) {
        socket.emit('room:reconnect', {
          code: session.code,
          username: session.username,
        });
      }
    };

    socket.on('connect', () => {
      tryReconnect();
      if (wasDisconnected) {
        addToast('Reconnected to server.', 'success');
        wasDisconnected = false;
      }
    });

    socket.io.on('reconnect', () => {
      tryReconnect();
      if (wasDisconnected) {
        addToast('Reconnected to server.', 'success');
        wasDisconnected = false;
      }
    });

    socket.on('disconnect', () => {
      wasDisconnected = true;
      addToast('Server connection lost. Trying to reconnect...', 'error');
    });

    socket.on('room:updated', (data) => {
      const prev = roomRef.current;
      if (prev) {
        const prevHost = prev.players.find((p) => p.socketId === prev.hostId);
        const nextHost = data.players.find((p) => p.socketId === data.hostId);

        // Detect players who left
        const leftPlayer = prev.players.find(
          (p) => !data.players.some((dp) => dp.username === p.username)
        );

        if (leftPlayer) {
          const wasHost = leftPlayer.socketId === prev.hostId;
          if (wasHost && nextHost) {
            addToast(
              `Host ${leftPlayer.username} left the room. ${nextHost.username} is now the host.`,
              'info'
            );
          } else {
            addToast(`${leftPlayer.username} left the room.`, 'info');
          }
        } else {
          // Detect players who joined
          const joinedPlayer = data.players.find(
            (dp) => !prev.players.some((p) => p.username === dp.username)
          );
          if (joinedPlayer && joinedPlayer.username !== username.trim()) {
            addToast(`${joinedPlayer.username} joined the room.`, 'success');
          } else if (prev.hostId !== data.hostId && prevHost && nextHost) {
            addToast(`${nextHost.username} is now the host.`, 'info');
          }
        }
      }

      setRoom((prevVal) => {
        const codeChanged = !prevVal || prevVal.code !== data.code;
        const playerJoined = prevVal && prevVal.code === data.code && data.players.length > prevVal.players.length;
        if (codeChanged || playerJoined) {
          sounds.playLobbyJoinSound();
        }

        if (prevVal?.code !== data.code) {
          setChatMessages([]);
        }
        return data;
      });
      setError(null);
      if (errorTimeout) clearTimeout(errorTimeout);
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
      setErrorWithTimeout(message);
    });

    const applyGameStarted = (data: GameStartedPayload) => {
      setGameStarted(data);
      setHand(data.hand);
      setView('game');
      setMatchOver(null);
      sounds.playShuffleSound();
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
      if (data.winner === username.trim()) {
        sounds.playWinSound();
      } else {
        sounds.playLossSound();
      }
    });

    socket.on('game:error', ({ message }) => {
      setErrorWithTimeout(message);
    });

    socket.on('game:cardPlayed', ({ seatIndex, card }) => {
      sounds.playCardPlaySound();
      if (gameStarted && seatIndex === gameStarted.seatIndex) {
        setHand((prev) => prev.filter((c) => !(c.suit === card.suit && c.rank === card.rank)));
      }
    });

    socket.on('room:messageReceived', (data) => {
      setChatMessages((prev) => [...prev, data]);
      if (data.username !== username.trim()) {
        sounds.playChatSound();
      }
    });

    socket.on('game:trickWon', (data) => {
      setLastTrickWon(data);
      if (data.winnerSeat === gameStarted?.seatIndex) {
        sounds.playTrickWonSound();
      } else {
        sounds.playCardPlaySound();
      }
      setTimeout(() => {
        setLastTrickWon(null);
      }, 1500);
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
      socket.off('game:trickWon');
      socket.off('game:cardPlayed');
      if (errorTimeout) clearTimeout(errorTimeout);
    };
  }, [username, gameStarted]);

  // Global click audio listener
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (target) {
        const interactiveElement = target.closest('button, .cursor-pointer');
        if (interactiveElement) {
          sounds.playClickSound();
        }
      }
    };

    window.addEventListener('click', handleGlobalClick);
    return () => {
      window.removeEventListener('click', handleGlobalClick);
    };
  }, []);

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

  const handleLeaveRoom = () => {
    getSocket().emit('room:leave');
    clearSession();
    setRoom(null);
    setChatMessages([]);
  };

  const handleSendChatMessage = (message: string) => {
    getSocket().emit('room:message', { message });
  };

  if (view === 'game' && gameStarted) {
    return (
      <>
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
          lastTrickWon={lastTrickWon}
        />
        {/* Toast Notification Container */}
        <div className="fixed bottom-4 left-4 z-50 flex flex-col gap-2 pointer-events-none max-w-sm">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`pointer-events-auto px-4 py-2.5 rounded-lg shadow-lg border text-sm font-semibold transition-all duration-300 animate-slide-up flex items-center gap-2
                ${
                  t.type === 'error'
                    ? 'bg-red-950/90 text-red-200 border-red-800/40'
                    : t.type === 'success'
                    ? 'bg-emerald-950/90 text-emerald-200 border-emerald-800/40'
                    : 'bg-felt-dark/95 text-gold border-gold/20'
                }`}
            >
              <span>
                {t.type === 'error' ? '⚠️' : t.type === 'success' ? '✅' : 'ℹ️'}
              </span>
              <span>{t.message}</span>
            </div>
          ))}
        </div>
      </>
    );
  }

  return (
    <>
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
        onLeaveRoom={handleLeaveRoom}
      />
      {/* Toast Notification Container */}
      <div className="fixed bottom-4 left-4 z-50 flex flex-col gap-2 pointer-events-none max-w-sm">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto px-4 py-2.5 rounded-lg shadow-lg border text-sm font-semibold transition-all duration-300 animate-slide-up flex items-center gap-2
              ${
                t.type === 'error'
                  ? 'bg-red-950/90 text-red-200 border-red-800/40'
                  : t.type === 'success'
                  ? 'bg-emerald-950/90 text-emerald-200 border-emerald-800/40'
                  : 'bg-felt-dark/95 text-gold border-gold/20'
              }`}
          >
            <span>
              {t.type === 'error' ? '⚠️' : t.type === 'success' ? '✅' : 'ℹ️'}
            </span>
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </>
  );
}

export default App;
