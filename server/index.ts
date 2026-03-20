import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { randomScrambleForEvent } from 'cubing/scramble';

// ── Types ────────────────────────────────────────────────────────────────────

type Penalty = 'none' | '+2' | 'DNF';

interface Player {
  id: string;
  name: string;
  isHost: boolean;
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
}

interface Room {
  code: string;
  hostId: string;
  eventId: string;
  currentScramble: string;
  currentRound: number;
  players: Map<string, Player>;
  solves: Solve[];
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
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*' },
});

const rooms = new Map<string, Room>();

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
    });

    // Auto-advance when all players have submitted
    const submittedCount = room.solves.filter(
      s => s.round === room.currentRound,
    ).length;
    const roundAtSubmit = room.currentRound;

    if (submittedCount >= room.players.size) {
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

    room.players.delete(playerId);

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

  socket.on('leave-room', () => handleLeave());
  socket.on('disconnect', () => handleLeave());

  function handleLeave() {
    if (!currentRoom) return;
    const room = rooms.get(currentRoom);
    if (!room) return;

    room.players.delete(socket.id);
    socket.leave(currentRoom);

    if (room.players.size === 0) {
      rooms.delete(currentRoom);
    } else if (room.hostId === socket.id) {
      const nextHost = room.players.values().next().value;
      if (nextHost) {
        room.hostId = nextHost.id;
        nextHost.isHost = true;
      }
      broadcastRoomState(room);
    } else {
      broadcastRoomState(room);
    }

    currentRoom = null;
  }
});

// ── Start ────────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
