import React, { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

interface QRCodeDisplayProps {
  roomCode: string;
}

const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({ roomCode }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      // Get the current origin, ensuring it's using the client-facing URL
      const meta = import.meta as unknown as { env?: { VITE_PUBLIC_ORIGIN?: string } };
      // Try to get a public-facing URL from env, or fall back to window.location
      let publicOrigin = meta.env?.VITE_PUBLIC_ORIGIN || window.location.origin;
      
      // If we're running on localhost with an IP address, use that instead
      // This helps mobile devices on the same network connect properly
      if (publicOrigin.includes('localhost')) {
        try {
          // Try to use the network IP if available
          const hostParts = window.location.host.split(':');
          const port = hostParts.length > 1 ? `:${hostParts[1]}` : '';
          if (window.location.hostname === 'localhost') {
            publicOrigin = `${window.location.protocol}//${window.location.hostname}${port}`;
          }
        } catch (e) {
          console.error('Failed to parse origin:', e);
        }
      }
      
      const joinUrl = `${publicOrigin}/join/${roomCode}`;
      console.log('Generated QR code URL:', joinUrl);
      
      QRCode.toCanvas(canvasRef.current, joinUrl, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
    }
  }, [roomCode]);

  return (
    <div className="text-center">
      <div className="bg-white p-4 rounded-xl inline-block">
        <canvas ref={canvasRef} />
      </div>
      <p className="text-white/80 mt-2 text-sm">
        Or use room code: <span className="font-mono font-bold text-yellow-400">{roomCode}</span>
      </p>
    </div>
  );
};

export default QRCodeDisplay;