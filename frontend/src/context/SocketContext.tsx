import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { NotificationItem, Booking } from '../types';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  notifications: NotificationItem[];
  latestRequest: Booking | null;
  clearLatestRequest: () => void;
  markNotificationRead: (id: number) => void;
}

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://127.0.0.1:5000';

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  notifications: [],
  latestRequest: null,
  clearLatestRequest: () => {},
  markNotificationRead: () => {},
});

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [latestRequest, setLatestRequest] = useState<Booking | null>(null);

  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const s = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
    });

    s.on('connect', () => {
      setIsConnected(true);
      s.emit('join_user_room', { user_id: user.id });
    });

    s.on('disconnect', () => {
      setIsConnected(false);
    });

    s.on('new_notification', (notif: NotificationItem) => {
      setNotifications((prev) => [notif, ...prev]);
    });

    s.on('new_provider_request', (data: { booking: Booking }) => {
      if (user.role === 'PROVIDER' && data.booking) {
        setLatestRequest(data.booking);
      }
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, [user?.id]);

  const clearLatestRequest = () => setLatestRequest(null);

  const markNotificationRead = (id: number) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        notifications,
        latestRequest,
        clearLatestRequest,
        markNotificationRead,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
