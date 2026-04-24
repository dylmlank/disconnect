import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { verifyToken } from '../config/clerk';
import { db } from '../config/database';
import { env } from '../config/env';
import { hasRsvp } from '../models/event';
import { createChatMessage } from '../models/chatMessage';
import { sendChatNotification } from '../services/push';

interface AuthenticatedSocket extends WebSocket {
  userId: string;
  eventId: string;
  isAlive: boolean;
}

// Map: eventId -> Set of connected sockets
const rooms = new Map<string, Set<AuthenticatedSocket>>();

export function setupWebSocket(server: Server) {
  const wss = new WebSocketServer({ server, path: '/ws/chat' });

  wss.on('connection', async (ws: WebSocket, req) => {
    const socket = ws as AuthenticatedSocket;
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const token = url.searchParams.get('token');
    const eventId = url.searchParams.get('eventId');

    if (!token || !eventId) {
      socket.close(4001, 'Missing token or eventId');
      return;
    }

    // Verify Clerk session token
    let userId: string;
    try {
      // Test bypass: UUID tokens in test env
      if (env.NODE_ENV === 'test' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(token)) {
        userId = token;
      } else if (env.NODE_ENV === 'development' && token.startsWith('dev:')) {
        const user = await db('users').where('clerk_id', token.slice(4)).first();
        if (!user) { socket.close(4003, 'Dev user not found'); return; }
        userId = user.id;
      } else {
        const payload = await verifyToken(token);
        const clerkId = payload.sub;
        const user = await db('users').where('clerk_id', clerkId).first();
        if (!user) {
          socket.close(4003, 'Profile not found');
          return;
        }
        userId = user.id;
      }
    } catch {
      socket.close(4001, 'Invalid token');
      return;
    }

    // Verify user has RSVP'd to the event
    const rsvped = await hasRsvp(eventId, userId);
    if (!rsvped) {
      socket.close(4003, 'Must RSVP to join chat');
      return;
    }

    socket.userId = userId;
    socket.eventId = eventId;
    socket.isAlive = true;

    // Join room
    if (!rooms.has(eventId)) {
      rooms.set(eventId, new Set());
    }
    rooms.get(eventId)!.add(socket);

    socket.on('pong', () => {
      socket.isAlive = true;
    });

    socket.on('message', async (data) => {
      try {
        const parsed = JSON.parse(data.toString());
        if (parsed.type !== 'message' || !parsed.text || typeof parsed.text !== 'string') return;

        const text = parsed.text.slice(0, 500); // Max message length
        const chatMessage = await createChatMessage({
          eventId,
          senderId: socket.userId,
          message: text,
        });

        // Broadcast to all users in the room
        const room = rooms.get(eventId);
        const connectedUserIds = new Set<string>();
        if (room) {
          const broadcast = JSON.stringify({ type: 'message', message: chatMessage });
          for (const client of room) {
            if (client.readyState === WebSocket.OPEN) {
              client.send(broadcast);
              connectedUserIds.add(client.userId);
            }
          }
        }

        // Push-notify RSVP'd users who are offline (fire-and-forget)
        const rsvps = await db('event_rsvps').where('event_id', eventId).select('user_id');
        const event = await db('events').where('id', eventId).select('title').first();
        const sender = await db('users').where('id', socket.userId).select('first_name').first();
        if (event && sender) {
          for (const { user_id } of rsvps) {
            if (!connectedUserIds.has(user_id) && user_id !== socket.userId) {
              sendChatNotification(user_id, sender.first_name, event.title, eventId).catch(() => {});
            }
          }
        }
      } catch {
        // Ignore malformed messages
      }
    });

    socket.on('close', () => {
      const room = rooms.get(eventId);
      if (room) {
        room.delete(socket);
        if (room.size === 0) {
          rooms.delete(eventId);
        }
      }
    });
  });

  // Heartbeat to clean up dead connections
  const interval = setInterval(() => {
    for (const [eventId, room] of rooms.entries()) {
      for (const socket of room) {
        if (!socket.isAlive) {
          socket.terminate();
          room.delete(socket);
          continue;
        }
        socket.isAlive = false;
        socket.ping();
      }
      if (room.size === 0) rooms.delete(eventId);
    }
  }, 30000);

  wss.on('close', () => {
    clearInterval(interval);
  });
}
