import { Server } from 'socket.io';
import { verifyAccessToken } from '../config/jwt.js';
import pool from '../config/database.js';
import { checkChatRoomAccess } from '../utils/chatRoomAccess.js';

let io = null;

/**
 * Attach Socket.IO to the same HTTP server as Express.
 * Clients authenticate with the JWT access token (same as REST).
 */
export function initSocket(httpServer) {
  const corsOrigin = process.env.FRONTEND_URL || 'http://localhost:5173';

  io = new Server(httpServer, {
    cors: {
      origin: corsOrigin,
      credentials: true,
    },
  });

  io.use((socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.query?.token;
      if (!token || typeof token !== 'string') {
        return next(new Error('auth_required'));
      }
      const payload = verifyAccessToken(token);
      socket.userId = payload.userId;
      socket.userRole = payload.role;
      next();
    } catch {
      next(new Error('auth_invalid'));
    }
  });

  io.on('connection', (socket) => {
    socket.join(`user:${String(socket.userId)}`);

    socket.on('chat:join', async (roomId) => {
      if (roomId == null || roomId === '') return;
      try {
        const { allowed, notFound } = await checkChatRoomAccess(
          pool,
          roomId,
          socket.userId,
          socket.userRole
        );
        if (notFound || !allowed) return;
        socket.join(`chat:${String(roomId)}`);
      } catch (e) {
        console.error('chat:join error:', e);
      }
    });

    socket.on('chat:leave', (roomId) => {
      if (roomId != null) socket.leave(`chat:${String(roomId)}`);
    });
  });

  return io;
}

export function getIO() {
  return io;
}

/** Push a new chat message to everyone subscribed to this room (instant delivery). */
export function emitChatMessage(roomId, payload) {
  if (!io) return;
  io.to(`chat:${String(roomId)}`).emit('chat:message', payload);
}

/** Tell a user to refetch notifications (lightweight; reuses existing REST shape). */
export function notifyUserRefresh(userId) {
  if (!io) return;
  io.to(`user:${String(userId)}`).emit('notifications:refresh');
}

/** Push notification refresh to every active admin (e.g. exchange created). */
export async function notifyAdminsRefresh() {
  if (!io) return;
  try {
    const [admins] = await pool.query(
      `SELECT user_id FROM users WHERE LOWER(TRIM(role)) IN ('admin', 'staff') AND is_active = TRUE`
    );
    for (const row of admins) {
      io.to(`user:${String(row.user_id)}`).emit('notifications:refresh');
    }
  } catch (e) {
    console.error('notifyAdminsRefresh:', e);
  }
}
