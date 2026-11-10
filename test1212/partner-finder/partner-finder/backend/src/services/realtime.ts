import type { Server } from 'socket.io';

// Holds the Socket.IO server so any module can push events to a user
// without importing socket.ts (that would create an import cycle).
let io: Server | null = null;
export const setIo = (server: Server) => { io = server; };

// Every user has a private "room" named user:<id>. All of their open tabs are in it.
export const emitToUser = (userId: number, event: string, payload: unknown) => {
  io?.to(`user:${userId}`).emit(event, payload);
};
