import { io } from 'socket.io-client';

// Same host as API, without trailing /api (Socket.IO mounts on server root)
const rawBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  String(rawBase).replace(/\/api\/?$/, '') ||
  'http://localhost:5000';

let socket = null;

/**
 * Singleton Socket.IO client using the stored access token.
 * Returns null if not logged in.
 */
export function getSocket() {
  const token = localStorage.getItem('accessToken');
  if (!token) return null;

  if (socket?.connected) return socket;

  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
  }

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
    autoConnect: true,
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
}
