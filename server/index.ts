import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { randomScrambleForEvent } from 'cubing/scramble';

// ── Types ────────────────────────────────────────────────────────────────────

type Penalty = 'none' | '+2' | 'DNF';
type CrossColor = 'w' | 'y' | 'r' | 'o' | 'b' | 'g';

interface Player {
  id: string;
  name: string;
  isHost: boolean;
  disconnected?: boolean;
}

interface Solve {
  id: string;
  playerId: string;
  playerName: string;
  time: number;
  penalty: Penalty;
  round: number;
  scramble: string;
  date: number;
  crossColor?: CrossColor;
}

interface Room {
  code: string;
  hostId: string;
  eventId: string;
  currentScramble: string;
  currentRound: number;
  players: Map<string, Player>;
  solves: Solve[];
  disconnectTimers: Map<string, ReturnType<typeof setTimeout>>;
}

interface RoomState {
  code: string;
  hostId: string;
  eventId: string;
  currentScramble: string;
  currentRound: number;
  players: Player[];
  solves: Solve[];
}

// ── Setup ────────────────────────────────────────────────────────────────────

const app = express();
app.use(cors());
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*' },
  pingTimeout: 60000,
  pingInterval: 25000,
  maxHttpBufferSize: 5e6,
});

const DISCONNECT_GRACE_MS = 30000;

const rooms = new Map<string, Room>();

// ── Health check ─────────────────────────────────────────────────────────────

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// ── REST endpoint for scramble generation ────────────────────────────────────

app.get('/api/scramble/:eventId', async (req, res) => {
  try {
    const scramble = await generateScramble(req.params.eventId);
    res.json({ scramble });
  } catch {
    res.status(500).json({ error: 'Failed to generate scramble' });
  }
});

// ── Helpers ──────────────────────────────────────────────────────────────────

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code: string;
  do {
    code = '';
    for (let i = 0; i < 4; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
  } while (rooms.has(code));
  return code;
}

function getRoomState(room: Room): RoomState {
  return {
    code: room.code,
    hostId: room.hostId,
    eventId: room.eventId,
    currentScramble: room.currentScramble,
    currentRound: room.currentRound,
    players: Array.from(room.players.values()),
    solves: room.solves,
  };
}

function broadcastRoomState(room: Room) {
  io.to(room.code).emit('room-state', getRoomState(room));
}

async function generateScramble(eventId: string): Promise<string> {
  try {
    const scramble = await randomScrambleForEvent(eventId);
    return scramble.toString();
  } catch {
    return 'Error generating scramble';
  }
}

function removePlayerFully(room: Room, playerId: string) {
  room.players.delete(playerId);
  const timer = room.disconnectTimers.get(playerId);
  if (timer) {
    clearTimeout(timer);
    room.disconnectTimers.delete(playerId);
  }
}

// ── Socket handlers ──────────────────────────────────────────────────────────

io.on('connection', socket => {
  let currentRoom: string | null = null;

  socket.on('create-room', async ({ playerName }, callback) => {
    const code = generateRoomCode();
    const scramble = await generateScramble('333');

    const room: Room = {
      code,
      hostId: socket.id,
      eventId: '333',
      currentScramble: scramble,
      currentRound: 1,
      players: new Map(),
      solves: [],
      disconnectTimers: new Map(),
    };

    room.players.set(socket.id, {
      id: socket.id,
      name: playerName,
      isHost: true,
    });

    rooms.set(code, room);
    socket.join(code);
    currentRoom = code;

    callback({ roomCode: code });
    broadcastRoomState(room);
  });

  socket.on('join-room', ({ roomCode, playerName }, callback) => {
    const room = rooms.get(roomCode.toUpperCase());
    if (!room) {
      callback({ error: 'Room not found' });
      return;
    }

    room.players.set(socket.id, {
      id: socket.id,
      name: playerName,
      isHost: false,
    });

    socket.join(room.code);
    currentRoom = room.code;

    callback({ success: true });
    broadcastRoomState(room);
  });

  socket.on(
    'rejoin-room',
    ({ roomCode, playerName, oldPlayerId }, callback) => {
      const room = rooms.get(roomCode.toUpperCase());
      if (!room) {
        callback({ error: 'Room not found' });
        return;
      }

      // Clear disconnect timer for old player
      const timer = room.disconnectTimers.get(oldPlayerId);
      if (timer) {
        clearTimeout(timer);
        room.disconnectTimers.delete(oldPlayerId);
      }

      const oldPlayer = room.players.get(oldPlayerId);
      if (oldPlayer && oldPlayer.disconnected) {
        // Restore: transfer old player data to new socket id
        const wasHost = oldPlayer.isHost || room.hostId === oldPlayerId;
        room.players.delete(oldPlayerId);
        room.players.set(socket.id, {
          id: socket.id,
          name: playerName,
          isHost: wasHost,
        });
        if (wasHost) {
          room.hostId = socket.id;
        }
        // Update all solves to point to new socket id
        for (const solve of room.solves) {
          if (solve.playerId === oldPlayerId) {
            solve.playerId = socket.id;
          }
        }
      } else {
        // Old player not found or not disconnected, join as new
        room.players.set(socket.id, {
          id: socket.id,
          name: playerName,
          isHost: false,
        });
      }

      socket.join(room.code);
      currentRoom = room.code;

      callback({ success: true });
      broadcastRoomState(room);
    },
  );

  socket.on('submit-time', async ({ time, dnf }) => {
    if (!currentRoom) return;
    const room = rooms.get(currentRoom);
    if (!room) return;

    const player = room.players.get(socket.id);
    if (!player) return;

    const alreadySubmitted = room.solves.some(
      s => s.playerId === socket.id && s.round === room.currentRound,
    );
    if (alreadySubmitted) return;

    room.solves.push({
      id: crypto.randomUUID(),
      playerId: socket.id,
      playerName: player.name,
      time,
      penalty: dnf ? 'DNF' : 'none',
      round: room.currentRound,
      scramble: room.currentScramble,
      date: Date.now(),
      crossColor: 'w',
    });

    // Auto-advance when all connected players have submitted
    const connectedPlayers = Array.from(room.players.values()).filter(
      p => !p.disconnected,
    );
    const submittedCount = room.solves.filter(
      s => s.round === room.currentRound,
    ).length;
    const roundAtSubmit = room.currentRound;

    if (submittedCount >= connectedPlayers.length) {
      const newScramble = await generateScramble(room.eventId);
      // Guard: only advance if round hasn't been changed during await
      if (room.currentRound === roundAtSubmit) {
        room.currentScramble = newScramble;
        room.currentRound += 1;
      }
    }

    broadcastRoomState(room);
  });

  socket.on('update-penalty', ({ solveId, penalty }) => {
    if (!currentRoom) return;
    const room = rooms.get(currentRoom);
    if (!room) return;

    const solve = room.solves.find(s => s.id === solveId);
    if (!solve || solve.playerId !== socket.id) return;

    solve.penalty = solve.penalty === penalty ? 'none' : penalty;
    broadcastRoomState(room);
  });

  socket.on('update-cross-color', ({ solveId, crossColor }) => {
    if (!currentRoom) return;
    const room = rooms.get(currentRoom);
    if (!room) return;

    const solve = room.solves.find(s => s.id === solveId);
    if (!solve || solve.playerId !== socket.id) return;

    const valid: CrossColor[] = ['w', 'y', 'r', 'o', 'b', 'g'];
    if (!valid.includes(crossColor)) return;

    solve.crossColor = crossColor;
    broadcastRoomState(room);
  });

  socket.on('change-event', async ({ eventId }) => {
    if (!currentRoom) return;
    const room = rooms.get(currentRoom);
    if (!room || room.hostId !== socket.id) return;

    room.eventId = eventId;
    room.currentScramble = await generateScramble(eventId);
    room.currentRound += 1;
    broadcastRoomState(room);
  });

  socket.on('kick-player', ({ playerId }) => {
    if (!currentRoom) return;
    const room = rooms.get(currentRoom);
    if (!room || room.hostId !== socket.id || playerId === socket.id) return;

    removePlayerFully(room, playerId);

    const kickedSocket = io.sockets.sockets.get(playerId);
    if (kickedSocket) {
      kickedSocket.emit('kicked');
      kickedSocket.leave(room.code);
    }

    broadcastRoomState(room);
  });

  socket.on('next-scramble', async () => {
    if (!currentRoom) return;
    const room = rooms.get(currentRoom);
    if (!room || room.hostId !== socket.id) return;

    room.currentScramble = await generateScramble(room.eventId);
    room.currentRound += 1;
    broadcastRoomState(room);
  });

  socket.on('reset-room', async () => {
    if (!currentRoom) return;
    const room = rooms.get(currentRoom);
    if (!room || room.hostId !== socket.id) return;

    room.solves = [];
    room.currentScramble = await generateScramble(room.eventId);
    room.currentRound = 1;
    broadcastRoomState(room);
  });

  socket.on('timer-start', () => {
    if (!currentRoom) return;
    const room = rooms.get(currentRoom);
    if (!room) return;
    socket.to(room.code).emit('player-solving', { playerId: socket.id });
  });

  socket.on('leave-room', () => handleLeave(false));
  socket.on('disconnect', () => handleLeave(true));

  function handleLeave(isDisconnect: boolean) {
    if (!currentRoom) return;
    const room = rooms.get(currentRoom);
    if (!room) return;

    if (isDisconnect) {
      // Mark player as disconnected, start grace period
      const player = room.players.get(socket.id);
      if (player) {
        player.disconnected = true;
        broadcastRoomState(room);

        const playerId = socket.id;
        const timer = setTimeout(() => {
          // Grace period expired, remove fully
          room.disconnectTimers.delete(playerId);
          removePlayerFully(room, playerId);

          if (room.players.size === 0) {
            rooms.delete(room.code);
          } else if (room.hostId === playerId) {
            const nextHost = Array.from(room.players.values()).find(
              p => !p.disconnected,
            );
            if (nextHost) {
              room.hostId = nextHost.id;
              nextHost.isHost = true;
            }
            broadcastRoomState(room);
          } else {
            broadcastRoomState(room);
          }
        }, DISCONNECT_GRACE_MS);

        room.disconnectTimers.set(playerId, timer);
      }
    } else {
      // Explicit leave — remove immediately
      removePlayerFully(room, socket.id);
      socket.leave(currentRoom);

      if (room.players.size === 0) {
        rooms.delete(currentRoom);
      } else if (room.hostId === socket.id) {
        const nextHost = Array.from(room.players.values()).find(
          p => !p.disconnected,
        );
        if (nextHost) {
          room.hostId = nextHost.id;
          nextHost.isHost = true;
        }
        broadcastRoomState(room);
      } else {
        broadcastRoomState(room);
      }
    }

    currentRoom = null;
  }
});

// ── Start ────────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
