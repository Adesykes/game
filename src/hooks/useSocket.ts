import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { GameState, Question, AnswerResult } from '../types/game';

// Generate a unique player ID
const generateUniqueId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
};

// Ensure player has a persistent ID
const getPlayerPersistentId = (): string => {
  if (!localStorage.getItem('persistentPlayerId')) {
    localStorage.setItem('persistentPlayerId', generateUniqueId());
  }
  return localStorage.getItem('persistentPlayerId') as string;
};

export const useSocket = () => {
  const [connected, setConnected] = useState(false);
  const [persistentId] = useState(getPlayerPersistentId());
  const socketRef = useRef<Socket | null>(null);
  const socketCreatedRef = useRef(false);

  // Return the socket from ref, not state
  const socket = socketRef.current;

  useEffect(() => {
    // Only create socket once
    if (socketCreatedRef.current) {
      return;
    }
    
    console.log('Creating new socket connection...');
    socketCreatedRef.current = true;
    
    // Use window.location to dynamically determine server URL
    const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
    const host = window.location.hostname;
    const port = 3001; // Your Socket.IO server port
    
    // If we're in development and using localhost, just use the port directly
    // Otherwise, use the full URL (for production or network testing)
    const serverUrl = host === 'localhost' || host === '127.0.0.1' 
      ? `${protocol}//${host}:${port}`
      : host.includes('192.168.') ? `${protocol}//${host}:${port}` : '/';
    
    console.log(`Connecting to Socket.IO server at: ${serverUrl}`);
    
    const newSocket = io(serverUrl, {
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 30000,
      transports: ['websocket', 'polling'], // Try websocket first, then fall back to polling
      auth: { persistentId },
      forceNew: true,
      autoConnect: true
    });
    
    // Store in ref immediately
    socketRef.current = newSocket;
    
    newSocket.on('connect', () => {
      console.log('Connected to game server with ID:', newSocket.id);
      setConnected(true);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
      console.error('Connection details:', {
        url: serverUrl,
        transport: newSocket.io.engine?.transport?.name
      });
      setConnected(false);
      
      // Display error in UI for better debugging
      const errorEl = document.createElement('div');
      errorEl.style.position = 'fixed';
      errorEl.style.bottom = '10px';
      errorEl.style.left = '10px';
      errorEl.style.backgroundColor = 'rgba(255,0,0,0.7)';
      errorEl.style.color = 'white';
      errorEl.style.padding = '10px';
      errorEl.style.borderRadius = '5px';
      errorEl.style.zIndex = '9999';
      errorEl.textContent = `Socket Error: ${error.message}. Check console for details.`;
      document.body.appendChild(errorEl);
      
      // Remove after 10 seconds
      setTimeout(() => errorEl.remove(), 10000);
    });

    newSocket.on('disconnect', () => {
      setConnected(false);
      console.log('Disconnected from game server');
    });

    // No cleanup function - let the socket persist
  }, [persistentId]);

  return { socket, connected };
};
