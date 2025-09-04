import React, { useRef, useEffect, useState } from 'react';

interface DrawingCanvasProps {
  onDrawingUpdate: (drawingData: string) => void;
  width: number;
  height: number;
}

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({ onDrawingUpdate, width, height }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });
  const lastUpdateRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      console.error('Canvas element not found');
      return;
    }

    console.log('Canvas dimensions:', canvas.width, 'x', canvas.height);
    console.log('Canvas rect:', canvas.getBoundingClientRect());

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('Failed to get 2D context from canvas');
      return;
    }

    console.log('Canvas context obtained, setting up drawing properties');
    // Set up canvas
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#ffffff';
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);
    console.log('Canvas initialized with black background, canvas state:', canvas.toDataURL().substring(0, 50) + '...');

    // Send initial canvas state after a short delay
    setTimeout(() => {
      const initialData = canvas.toDataURL();
      console.log('Sending initial drawing data');
      onDrawingUpdate(initialData);
    }, 100);
  }, [width, height]);

  useEffect(() => {
    console.log('DrawingCanvas component rendered/updated, canvas ref:', canvasRef.current);
  });

  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const pos = {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
    console.log('Mouse position:', pos, 'client:', e.clientX, e.clientY, 'rect:', rect, 'scale:', scaleX, scaleY);
    return pos;
  };

  const getTouchPos = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    // Use the first touch point
    const touch = e.touches[0] || e.changedTouches[0];
    if (!touch) return { x: 0, y: 0 };
    
    const pos = {
      x: (touch.clientX - rect.left) * scaleX,
      y: (touch.clientY - rect.top) * scaleY
    };
    console.log('Touch position:', pos, 'scale:', scaleX, scaleY, 'rect:', rect);
    return pos;
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    // Only prevent default for touch events to avoid scrolling
    if ('touches' in e) {
      e.preventDefault();
    }
    console.log('Drawing started', 'touches' in e ? '(touch)' : '(mouse)');
    setIsDrawing(true);
    const pos = 'touches' in e ? getTouchPos(e) : getMousePos(e as React.MouseEvent<HTMLCanvasElement>);
    console.log('Start position:', pos);
    setLastPos(pos);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    // Only prevent default for touch events to avoid scrolling
    if ('touches' in e) {
      e.preventDefault();
    }

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    const currentPos = 'touches' in e ? getTouchPos(e) : getMousePos(e as React.MouseEvent<HTMLCanvasElement>);
    console.log('Drawing to:', currentPos);

    ctx.beginPath();
    ctx.moveTo(lastPos.x, lastPos.y);
    ctx.lineTo(currentPos.x, currentPos.y);
    ctx.stroke();
    console.log('Drew line from', lastPos, 'to', currentPos, 'strokeStyle:', ctx.strokeStyle, 'lineWidth:', ctx.lineWidth);

    setLastPos(currentPos);

    // Throttle drawing updates to every 50ms
    const now = Date.now();
    if (now - lastUpdateRef.current > 50) {
      lastUpdateRef.current = now;
      const drawingData = canvas.toDataURL();
      console.log('Sending drawing update');
      onDrawingUpdate(drawingData);
    }
  };

  const stopDrawing = (e?: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    // Only prevent default for touch events
    if (e && 'touches' in e) {
      e.preventDefault();
    }
    if (isDrawing) {
      console.log('Drawing stopped');
      setIsDrawing(false);
      // Send final drawing update
      const canvas = canvasRef.current;
      if (canvas) {
        const drawingData = canvas.toDataURL();
        console.log('Sending final drawing update');
        onDrawingUpdate(drawingData);
      }
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);
    const drawingData = canvas.toDataURL();
    onDrawingUpdate(drawingData);
  };

  return (
    <div className="flex flex-col items-center">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="border border-white/30 rounded-lg cursor-crosshair bg-black"
        style={{ touchAction: 'none' }}
        onMouseDown={(e) => { console.log('Mouse down event'); startDrawing(e); }}
        onMouseMove={(e) => { console.log('Mouse move event'); draw(e); }}
        onMouseUp={(e) => { console.log('Mouse up event'); stopDrawing(e); }}
        onMouseLeave={(e) => { console.log('Mouse leave event'); stopDrawing(e); }}
        onTouchStart={(e) => { console.log('Touch start event'); startDrawing(e); }}
        onTouchMove={(e) => { console.log('Touch move event'); draw(e); }}
        onTouchEnd={(e) => { console.log('Touch end event'); stopDrawing(e); }}
        onClick={(e) => { console.log('Canvas clicked at:', e.clientX, e.clientY); }}
      />
      <button
        onClick={clearCanvas}
        className="mt-2 bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
      >
        Clear
      </button>
    </div>
  );
};

interface DrawingDisplayProps {
  drawingData: string | null;
  width: number;
  height: number;
}

export const DrawingDisplay: React.FC<DrawingDisplayProps> = ({ drawingData, width, height }) => {
  console.log('DrawingDisplay received data:', drawingData ? 'data present' : 'no data');
  
  if (!drawingData) {
    return (
      <div
        className="border border-white/30 rounded-lg bg-black flex items-center justify-center"
        style={{ width, height }}
      >
        <span className="text-white/60">Waiting for drawing...</span>
      </div>
    );
  }

  return (
    <img
      src={drawingData}
      alt="Pictionary drawing"
      className="border border-white/30 rounded-lg"
      style={{ width, height }}
      onLoad={() => console.log('Drawing image loaded')}
      onError={() => console.log('Drawing image failed to load')}
    />
  );
};
