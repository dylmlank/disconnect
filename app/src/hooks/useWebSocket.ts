import { useEffect, useRef, useCallback, useState } from 'react';
import { WS_URL } from '../constants/config';
import type { ChatMessage } from '@disconnect/shared';

// Token provider is set by DevApp or ClerkApp
let _wsGetToken: (() => Promise<string | null>) | null = null;

export function setWsTokenProvider(fn: () => Promise<string | null>) {
  _wsGetToken = fn;
}

export function useWebSocket(eventId: string) {
  const wsRef = useRef<WebSocket | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const token = _wsGetToken ? await _wsGetToken() : null;
      if (!token || cancelled) return;

      const ws = new WebSocket(`${WS_URL}/chat?eventId=${eventId}&token=${token}`);
      wsRef.current = ws;

      ws.onopen = () => setConnected(true);
      ws.onclose = () => setConnected(false);

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'message' && data.message) {
            setMessages((prev) => [...prev, data.message]);
          }
        } catch {
          // ignore
        }
      };
    })();

    return () => {
      cancelled = true;
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [eventId]);

  const sendMessage = useCallback((text: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'message', text }));
    }
  }, []);

  return { messages, setMessages, connected, sendMessage };
}
