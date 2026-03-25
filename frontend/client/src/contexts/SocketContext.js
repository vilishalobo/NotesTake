import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';

const SocketContext = createContext();

// For K8s/Docker with Nginx Proxy: 
// If REACT_APP_API_URL is "/api", the socket should connect to the root "/"
// because Nginx handles the /socket.io path separately.
const SOCKET_URL = window.location.origin; 

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children, user }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!user) return;

    // By passing SOCKET_URL (which is http://localhost in your case),
    // the socket-client will hit the Nginx proxy on port 80.
    const newSocket = io(SOCKET_URL, {
      autoConnect: true,
      transports: ['websocket', 'polling'], // Allow both for better compatibility
    });

    newSocket.on('connect', () => {
      console.log('✅ Connected to Socket.IO via Proxy');
      setIsConnected(true);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('❌ Disconnected:', reason);
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