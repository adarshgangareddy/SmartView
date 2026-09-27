import { WebSocketServer, WebSocket } from 'ws';
import { logger } from '../utils/logger.js';

class RealtimeService {
  constructor() {
    this.wss = null;
    this.clients = new Set();
  }

  initialize(server) {
    this.wss = new WebSocketServer({ server, path: '/ws' });

    this.wss.on('connection', (ws, req) => {
      this.clients.add(ws);
      logger.info(`[WEBSOCKET] Client connected. Total active clients: ${this.clients.size}`);

      // Send initial welcome & connection confirmation
      ws.send(JSON.stringify({
        event: 'CONNECTION_ESTABLISHED',
        data: {
          timestamp: new Date().toISOString(),
          server: 'SmartView Unified IoT Gateway',
        },
      }));

      ws.isAlive = true;
      ws.on('pong', () => {
        ws.isAlive = true;
      });

      ws.on('message', (message) => {
        try {
          const parsed = JSON.parse(message.toString());
          logger.debug('[WEBSOCKET RX]', parsed);

          // Handle client ping
          if (parsed.type === 'PING') {
            ws.send(JSON.stringify({ event: 'PONG', timestamp: new Date().toISOString() }));
          }
        } catch {
          // Ignore non-JSON client messages
        }
      });

      ws.on('close', () => {
        this.clients.delete(ws);
        logger.info(`[WEBSOCKET] Client disconnected. Remaining clients: ${this.clients.size}`);
      });

      ws.on('error', (err) => {
        logger.warn('[WEBSOCKET ERROR]', err.message);
        this.clients.delete(ws);
      });
    });

    // Heartbeat ping interval to prune dead sockets
    setInterval(() => {
      for (const ws of this.clients) {
        if (!ws.isAlive) {
          this.clients.delete(ws);
          ws.terminate();
          continue;
        }
        ws.isAlive = false;
        ws.ping();
      }
    }, 30000);

    logger.info('[WEBSOCKET] Realtime WebSocket Server initialized at /ws');
  }

  /**
   * Broadcast real-time event to all connected dashboard clients
   * @param {string} event - Event name (e.g. 'TELEMETRY_UPDATE', 'DEVICE_STATUS', 'COMMAND_ACK')
   * @param {object} data - Payload data
   */
  broadcast(event, data) {
    if (!this.wss || this.clients.size === 0) return;

    const payload = JSON.stringify({
      event,
      data,
      timestamp: new Date().toISOString(),
    });

    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    }
    logger.debug(`[WEBSOCKET TX] Broadcast '${event}' to ${this.clients.size} clients`);
  }
}

export const realtimeService = new RealtimeService();
