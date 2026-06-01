import { useEffect, useState } from 'react';
import type { RoomUpdatePayload } from '@callbreak/shared';
import { fetchHistory, type HistoryResponse } from '../api/history';
import { connectSocket, getSocket } from '../socket/client';
import { ChatDrawer } from '../components/ChatDrawer';
import { loadSession } from '../utils/session';

interface LobbyProps {
  username: string;
  onUsernameChange: (name: string) => void;
  room: RoomUpdatePayload | null;
  error: string | null;
  onReconnect: () => void;
  chatMessages: import('../components/ChatDrawer').ChatMessage[];
  onSendChatMessage: (message: string) => void;
  onLeaveRoom: () => void;
}

export function Lobby({
  username,
  onUsernameChange,
  room,
  error,
  onReconnect,
  chatMessages,
  onSendChatMessage,
  onLeaveRoom,
}: LobbyProps) {
  const [joinCode, setJoinCode] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<HistoryResponse | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [totalRounds, setTotalRounds] = useState(5);

  const [lobbies, setLobbies] = useState<import('../api/lobbies').LobbySummary[]>([]);
  const [lobbiesLoading, setLobbiesLoading] = useState(false);
  const [lobbiesError, setLobbiesError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const loadLobbies = async () => {
    setLobbiesLoading(true);
    setLobbiesError(null);
    try {
      const { fetchLobbies } = await import('../api/lobbies');
      const data = await fetchLobbies();
      setLobbies(data);
    } catch (err) {
      setLobbiesError(err instanceof Error ? err.message : 'Could not load lobbies');
    } finally {
      setLobbiesLoading(false);
    }
  };

  useEffect(() => {
    if (!room) {
      loadLobbies();
      const interval = setInterval(loadLobbies, 10000);
      return () => clearInterval(interval);
    }
  }, [room]);

  const handleJoinLobby = (code: string) => {
    if (!username.trim()) return;
    connectSocket().emit('room:join', {
      code: code.toUpperCase(),
      username: username.trim(),
    });
  };

  const filteredLobbies = lobbies.filter(
    (l) =>
      l.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.hostUsername.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const socket = getSocket();
  const isHost = room?.hostId === socket.id;
  const canStart = room && room.players.length === 4 && isHost;
  const displayRounds = room?.totalRounds ?? totalRounds;

  useEffect(() => {
    if (room?.totalRounds !== undefined) {
      setTotalRounds(room.totalRounds);
    }
  }, [room?.totalRounds]);

  const handleRoundsChange = (n: number) => {
    setTotalRounds(n);
    if (isHost && room) {
      connectSocket().emit('room:setRounds', { totalRounds: n });
    }
  };

  const handleCreate = () => {
    if (!username.trim()) return;
    connectSocket().emit('room:create', { username: username.trim() });
  };

  const handleJoin = () => {
    if (!username.trim() || !joinCode.trim()) return;
    connectSocket().emit('room:join', {
      code: joinCode.trim().toUpperCase(),
      username: username.trim(),
    });
  };

  const handleLeave = () => {
    onLeaveRoom();
  };

  const handleStart = () => {
    connectSocket().emit('game:start', { totalRounds: displayRounds });
  };

  const loadHistory = async () => {
    if (!username.trim()) return;
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const data = await fetchHistory(username.trim());
      setHistory(data);
      setShowHistory(true);
    } catch (err) {
      setHistory(null);
      setHistoryError(err instanceof Error ? err.message : 'Could not load history');
      setShowHistory(true);
    } finally {
      setHistoryLoading(false);
    }
  };

  const storedSession = loadSession();
  const canRejoin =
    username.trim() &&
    (storedSession?.username === username.trim() || (room && room.status !== 'lobby'));

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <header className="text-center">
          <h1 className="text-4xl font-bold text-gold tracking-wide">Callbreak</h1>
          <p className="text-gray-300 mt-2">Multiplayer card game</p>
        </header>

        <div className="bg-felt rounded-xl p-6 border border-felt-light/50 shadow-lg space-y-4">
          <label className="block">
            <span className="text-sm text-gray-300">Username</span>
            <input
              type="text"
              value={username}
              onChange={(e) => onUsernameChange(e.target.value)}
              placeholder="Enter your name"
              maxLength={20}
              className="mt-1 w-full px-4 py-2 rounded-lg bg-felt-dark border border-felt-light text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gold"
              disabled={!!room}
            />
          </label>

          {error && (
            <p className="text-red-400 text-sm bg-red-900/30 px-3 py-2 rounded">{error}</p>
          )}

          {!room ? (
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleCreate}
                disabled={!username.trim()}
                className="w-full py-3 rounded-lg bg-gold text-felt-dark font-semibold hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Create Room
              </button>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="Room code"
                  maxLength={4}
                  className="flex-1 px-4 py-2 rounded-lg bg-felt-dark border border-felt-light text-white uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-gold"
                />
                <button
                  type="button"
                  onClick={handleJoin}
                  disabled={!username.trim() || joinCode.length !== 4}
                  className="px-6 py-2 rounded-lg bg-felt-light font-semibold hover:bg-felt-light/80 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Join
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-gray-300">Room Code</p>
                <p className="text-3xl font-mono font-bold text-gold tracking-[0.3em]">{room.code}</p>
              </div>

              <div>
                <p className="text-sm text-gray-300 mb-2">
                  Players ({room.players.length}/4)
                </p>
                <ul className="space-y-2">
                  {room.players.map((p) => (
                    <li
                      key={p.socketId}
                      className="px-3 py-2 rounded-lg bg-felt-dark flex justify-between items-center"
                    >
                      <span className={p.connected ? '' : 'text-gray-400'}>
                        {p.username}
                        {!p.connected && ' (away)'}
                      </span>
                      {p.socketId === room.hostId && (
                        <span className="text-xs text-gold">Host</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-2">
                <label className="block text-sm text-gray-300">
                  Rounds per match
                  {isHost ? '' : ` (host set: ${displayRounds})`}
                </label>
                {isHost ? (
                  <select
                    value={displayRounds}
                    onChange={(e) => handleRoundsChange(Number(e.target.value))}
                    className="w-full px-4 py-2 rounded-lg bg-felt-dark border border-felt-light text-white focus:outline-none focus:ring-2 focus:ring-gold"
                  >
                    {Array.from({ length: 20 }, (_, i) => i + 1).map((n) => (
                      <option key={n} value={n}>
                        {n} round{n > 1 ? 's' : ''}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-gold font-medium">{displayRounds} rounds</p>
                )}
              </div>

              {canStart && (
                <button
                  type="button"
                  onClick={handleStart}
                  className="w-full py-3 rounded-lg bg-gold text-felt-dark font-semibold hover:bg-yellow-400 transition-colors"
                >
                  Start Game ({displayRounds} rounds)
                </button>
              )}

              {!canStart && room.players.length < 4 && (
                <p className="text-center text-sm text-gray-400">Waiting for {4 - room.players.length} more player(s)...</p>
              )}

              <button
                type="button"
                onClick={handleLeave}
                className="w-full py-2 rounded-lg border border-gray-500 text-gray-300 hover:bg-felt-dark transition-colors"
              >
                Leave Room
              </button>
            </div>
          )}
        </div>

        {/* Public Lobbies List / Finder */}
        {!room && (
          <div className="bg-felt rounded-xl p-6 border border-felt-light/50 shadow-lg space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-gold flex items-center gap-1.5 select-none">
                <span>🌐</span> Public Lobbies
              </h2>
              <button
                type="button"
                onClick={loadLobbies}
                disabled={lobbiesLoading}
                className="text-xs bg-felt-light/80 hover:bg-felt-light border border-gold/15 px-2.5 py-1 rounded-full text-white cursor-pointer transition-all active:scale-95 bg-transparent outline-none"
              >
                {lobbiesLoading ? 'Refreshing...' : '🔄 Refresh'}
              </button>
            </div>

            {/* Lobby Finder search input */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by code or host..."
                className="w-full px-4 py-2 rounded-lg bg-felt-dark border border-felt-light text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gold text-sm"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-white text-xs bg-transparent border-0 cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            {lobbiesError && (
              <p className="text-red-400 text-xs bg-red-900/30 px-3 py-2 rounded">{lobbiesError}</p>
            )}

            {filteredLobbies.length === 0 ? (
              <div className="text-center py-6 text-gray-400 text-sm">
                {lobbies.length === 0 ? (
                  <>
                    <p>No active lobbies found.</p>
                    <p className="text-xs opacity-60 mt-1">Be the first to create one!</p>
                  </>
                ) : (
                  <p>No matches for your search.</p>
                )}
              </div>
            ) : (
              <div className="max-h-48 overflow-y-auto space-y-2 pr-1 scrollbar-thin scrollbar-thumb-felt-light">
                {filteredLobbies.map((lobby) => (
                  <div
                    key={lobby.code}
                    className="p-3 bg-felt-dark/60 hover:bg-felt-dark border border-felt-light/20 rounded-lg flex items-center justify-between transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-gold tracking-wider text-sm">
                          {lobby.code}
                        </span>
                        <span className="text-[10px] bg-felt-light px-1.5 py-0.5 rounded text-gray-300">
                          {lobby.totalRounds} rounds
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Host: <span className="text-gray-300 font-semibold">{lobby.hostUsername}</span>
                      </p>
                      <p className="text-[10px] text-gray-500 truncate max-w-[200px]">
                        Players: {lobby.players.join(', ')}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <span className="text-xs text-gray-300 font-medium">
                        👥 {lobby.playerCount}/4
                      </span>
                      <button
                        type="button"
                        onClick={() => handleJoinLobby(lobby.code)}
                        disabled={!username.trim()}
                        className="px-3 py-1 bg-gold hover:bg-yellow-400 text-felt-dark rounded text-xs font-bold transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer border-0 outline-none"
                        title={!username.trim() ? 'Enter username to join' : 'Join this room'}
                      >
                        Join
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex justify-center gap-4 flex-wrap">
          <button
            type="button"
            onClick={loadHistory}
            disabled={!username.trim() || historyLoading}
            className="text-sm text-gold hover:underline disabled:opacity-50"
          >
            {historyLoading ? 'Loading...' : 'View match history'}
          </button>
          {canRejoin && !room && (
            <button
              type="button"
              onClick={onReconnect}
              className="text-sm text-green-400 hover:underline"
            >
              Rejoin last game
            </button>
          )}
        </div>

        {showHistory && (
          <div className="bg-felt rounded-xl p-6 border border-felt-light/50">
            <h2 className="text-lg font-semibold text-gold mb-3">Your stats</h2>
            {historyError && (
              <p className="text-red-400 text-sm mb-3 bg-red-900/30 px-3 py-2 rounded">{historyError}</p>
            )}
            {history && (
              <>
                <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                  <span>Wins: {history.stats.wins}</span>
                  <span>Losses: {history.stats.losses}</span>
                  <span>Games: {history.stats.totalGames}</span>
                  <span>Avg score: {history.stats.avgScore.toFixed(1)}</span>
                </div>
                {history.matches.length === 0 ? (
                  <p className="text-gray-400 text-sm">No matches yet. Finish a game to see history here.</p>
                ) : (
                  <ul className="space-y-2 max-h-48 overflow-y-auto">
                    {history.matches.map((m) => (
                      <li key={m.id} className="text-sm px-3 py-2 bg-felt-dark rounded">
                        <span className={m.won ? 'text-green-400' : 'text-red-400'}>
                          {m.won ? 'W' : 'L'}
                        </span>
                        {' vs '}
                        {m.players.filter((p) => p !== username).join(', ')}
                        {' — '}
                        {m.playerScore.toFixed(1)} pts
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
            <button
              type="button"
              onClick={() => {
                setShowHistory(false);
                setHistoryError(null);
              }}
              className="mt-3 text-sm text-gray-400 hover:text-white"
            >
              Close
            </button>
          </div>
        )}
      </div>
      {room && (
        <ChatDrawer
          messages={chatMessages}
          currentUsername={username}
          onSendMessage={onSendChatMessage}
        />
      )}
    </div>
  );
}
