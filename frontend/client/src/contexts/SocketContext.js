import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';

const SocketContext = createContext();

// Add API_URL from environment variable
const API_URL = process.env.REACT_APP_API_URL;

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children, user }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!user) return;

    // Connect to Socket.IO server using environment variable
    const newSocket = io(API_URL, {
      autoConnect: true,
    });

    newSocket.on('connect', () => {
      console.log('✅ Connected to Socket.IO');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Disconnected from Socket.IO');
      setIsConnected(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};