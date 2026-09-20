import { useState, useEffect, useRef, useCallback } from 'react';

export const useRealtime = (onMessageCallback) => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const savedCallback = useRef(onMessageCallback);

  useEffect(() => {
    savedCallback.current = onMessageCallback;
  }, [onMessageCallback]);

  const connect = useCallback(() => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    let wsUrl;
    try {
      const url = new URL(apiUrl);
      const wsProtocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
      wsUrl = `${wsProtocol}//${url.host}/ws`;
    } catch {
      wsUrl = 'ws://localhost:5000/ws';
    }

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          setLastMessage(parsed);
          if (savedCallback.current) {
            savedCallback.current(parsed);
          }
        } catch {
          // Non-JSON message
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        // Attempt reconnect in 4 seconds
        reconnectTimeoutRef.current = setTimeout(connect, 4000);
      };

      ws.onerror = () => {
        ws.close();
      };
    } catch {
      reconnectTimeoutRef.current = setTimeout(connect, 5000);
    }
  }, []);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, [connect]);

  return { isConnected, lastMessage };
};
