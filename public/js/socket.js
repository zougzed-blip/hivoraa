import { io } from '/socket.io/socket.io.js';
import { SOCKET_URL } from './config.js';

export const socket = io(SOCKET_URL);

export function subscribeTo(event, callback) {
  socket.on(event, callback);
}

export function sendEvent(event, payload) {
  socket.emit(event, payload);
}
