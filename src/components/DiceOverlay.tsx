import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useBox, usePlane } from '@react-three/cannon';
import * as THREE from 'three';
import { Physics } from '@react-three/cannon';

// Ground plane for the dice to roll on
const Ground = () => {
  const [ref] = usePlane(() => ({
    rotation: [-Math.PI / 2, 0, 0],
    position: [0, 0, 0],
    material: { restitution: 0.5 }
  }));
  
  return (
  <mesh ref={ref as React.MutableRefObject<THREE.Mesh>} position={[0, -1, 0]}>
      <planeGeometry args={[20, 20]} />
      <meshBasicMaterial color="#f0f0f0" transparent opacity={0.1} />
    </mesh>
  );
};

interface DiceOverlayProps {
  show: boolean;
  rollValue?: number | null; // 1-6 shown at the end
}

// A simpler dice animation that runs smoother

// Create a texture-based pip approach instead of 3D objects
const DiceFace: React.FC<{ value: number; position: [number, number, number]; rotation: [number, number, number] }> = 
  ({ value, position, rotation }) => {
  // Create a canvas texture for the dice face
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    
    // Draw white background with slight border gradient
    const gradient = ctx.createRadialGradient(128, 128, 80, 128, 128, 128);
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(1, '#e0e0e0');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 256);
    
    // Add subtle border
    ctx.strokeStyle = '#d0d0d0';
    ctx.lineWidth = 8;
    ctx.strokeRect(8, 8, 240, 240);
    
    // Draw pips in black with a slight shadow effect
    const dotSize = 36;
    const positions = {
      center: { x: 128, y: 128 },
      topLeft: { x: 64, y: 64 },
      topRight: { x: 192, y: 64 },
      bottomLeft: { x: 64, y: 192 },
      bottomRight: { x: 192, y: 192 },
      middleLeft: { x: 64, y: 128 },
      middleRight: { x: 192, y: 128 }
    };
    
    // Draw dots based on dice value
    const drawDot = (pos: { x: number, y: number }) => {
      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.beginPath();
      ctx.arc(pos.x + 2, pos.y + 2, dotSize, 0, Math.PI * 2);
      ctx.fill();
      
      // Dot with gradient
      const dotGradient = ctx.createRadialGradient(
        pos.x - dotSize/4, pos.y - dotSize/4, 0, 
        pos.x, pos.y, dotSize
      );
      dotGradient.addColorStop(0, '#333333');
      dotGradient.addColorStop(1, '#000000');
      ctx.fillStyle = dotGradient;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, dotSize, 0, Math.PI * 2);
      ctx.fill();
    };
    
    switch(value) {
      case 1:
        drawDot(positions.center);
        break;
      case 2:
        drawDot(positions.topLeft);
        drawDot(positions.bottomRight);
        break;
      case 3:
        drawDot(positions.topLeft);
        drawDot(positions.center);
        drawDot(positions.bottomRight);
        break;
      case 4:
        drawDot(positions.topLeft);
        drawDot(positions.topRight);
        drawDot(positions.bottomLeft);
        drawDot(positions.bottomRight);
        break;
      case 5:
        drawDot(positions.topLeft);
        drawDot(positions.topRight);
        drawDot(positions.center);
        drawDot(positions.bottomLeft);
        drawDot(positions.bottomRight);
        break;
      case 6:
        drawDot(positions.topLeft);
        drawDot(positions.middleLeft);
        drawDot(positions.bottomLeft);
        drawDot(positions.topRight);
        drawDot(positions.middleRight);
        drawDot(positions.bottomRight);
        break;
    }
    
    return new THREE.CanvasTexture(canvas);
  }, [value]);
  
  return (
    <mesh position={position} rotation={rotation}>
      <planeGeometry args={[0.62, 0.62]} />
      <meshStandardMaterial map={texture} />
    </mesh>
  );
};

const DiceMesh: React.FC = () => {
  return (
    <group>
      {/* Slightly transparent white cube as the base */}
      <mesh>
        <boxGeometry args={[0.64, 0.64, 0.64]} />
        <meshStandardMaterial color="#ffffff" roughness={0.1} metalness={0.05} transparent opacity={0.8} />
      </mesh>
      
      {/* Add dice faces with clear 2D dots */}
      <DiceFace value={1} position={[0, 0.33, 0]} rotation={[-Math.PI/2, 0, 0]} />
      <DiceFace value={6} position={[0, -0.33, 0]} rotation={[Math.PI/2, 0, 0]} />
      <DiceFace value={2} position={[0, 0, 0.33]} rotation={[0, 0, 0]} />
      <DiceFace value={5} position={[0, 0, -0.33]} rotation={[0, Math.PI, 0]} />
      <DiceFace value={3} position={[0.33, 0, 0]} rotation={[0, Math.PI/2, 0]} />
      <DiceFace value={4} position={[-0.33, 0, 0]} rotation={[0, -Math.PI/2, 0]} />
    </group>
  );
};

// We don't need the pipsForFace function anymore since we're using textured faces

function quaternionForTopFace(value: number): THREE.Quaternion {
  // Map: top(+Y)=1, bottom(-Y)=6, front(+Z)=2, back(-Z)=5, right(+X)=3, left(-X)=4
  const q = new THREE.Quaternion();
  switch (value) {
    case 1: // identity
      return q;
    case 6:
      return q.setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI);
    case 2:
      return q.setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2);
    case 5:
      return q.setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2);
    case 3:
      return q.setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI / 2);
    case 4:
      return q.setFromAxisAngle(new THREE.Vector3(0, 0, 1), -Math.PI / 2);
    default:
      return q;
  }
}

const Die: React.FC<{ target?: number | null; trigger: number }> = ({ target, trigger }) => {
  const [ref, api] = useBox<THREE.Group>(() => ({
    args: [0.64, 0.64, 0.64], // 20% smaller dice size
    mass: 0.8, // Reduced mass
    position: [0, 2.5, 0], // Higher starting position for better visibility
    rotation: [Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI],
    material: { restitution: 0.3, friction: 0.7 }, // Better bouncing properties
    linearDamping: 0.2, // Increased damping for smoother movement
    angularDamping: 0.15,
  }));

  const vel = useRef<[number, number, number]>([0, 0, 0]);
  const angVel = useRef<[number, number, number]>([0, 0, 0]);
  const settledFrames = useRef(0);
  const snapped = useRef(false);

  useEffect(() => {
    const unsubV = api.velocity.subscribe((v) => (vel.current = v as [number, number, number]));
    const unsubAV = api.angularVelocity.subscribe((v) => (angVel.current = v as [number, number, number]));
    return () => {
      unsubV?.();
      unsubAV?.();
    };
  }, [api.velocity, api.angularVelocity]);

  // On trigger change, randomize initial toss
  const { position, velocity, angularVelocity, quaternion } = api;
  // Intentionally depend on stable cannon API setters only; trigger controls re-toss
  useEffect(() => {
    snapped.current = false;
    settledFrames.current = 0;
    position.set((Math.random() - 0.5) * 0.4, 2.5 + Math.random() * 0.3, (Math.random() - 0.5) * 0.4); // Less horizontal movement
    velocity.set((Math.random() - 0.5) * 1.5, 0.5 + Math.random() * 1.0, (Math.random() - 0.5) * 1.5); // Gentler toss
    angularVelocity.set((Math.random() - 0.5) * 12, (Math.random() - 0.5) * 12, (Math.random() - 0.5) * 12); // Less violent spinning
    quaternion.set(Math.random(), Math.random(), Math.random(), Math.random());
  }, [trigger, position, velocity, angularVelocity, quaternion]);

  useFrame(() => {
    const v = vel.current;
    const av = angVel.current;
    const speed = Math.hypot(v[0], v[1], v[2]);
    const spin = Math.hypot(av[0], av[1], av[2]);

    if (speed < 0.04 && spin < 0.15) { // More sensitive detection for settling
      settledFrames.current += 1;
    } else {
      settledFrames.current = 0;
    }

    if (!snapped.current && target && settledFrames.current > 15) { // Quicker detection
      const q = quaternionForTopFace(target);
      // Snap to target orientation and rest in center of screen
      api.quaternion.set(q.x, q.y, q.z, q.w);
      api.position.set(0, 0.8, 0); // Position in middle of screen
      api.velocity.set(0, 0, 0);
      api.angularVelocity.set(0, 0, 0);
      snapped.current = true;
    }
  });

  return (
  <group ref={ref} scale={0.8}>
      <DiceMesh />
    </group>
  );
};

const DiceOverlay: React.FC<DiceOverlayProps> = ({ show, rollValue }) => {
  // Change a key to retrigger toss on each show
  const trigger = useMemo(() => Math.random(), []);
  const [isSettled, setIsSettled] = useState(false);
  
  // Reset settled state when dice is shown again
  useEffect(() => {
    if (show) {
      setIsSettled(false);
      // Set settled to true after dice animation (1.5 seconds)
      const timer = setTimeout(() => setIsSettled(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [show]);

  if (!show) return null;
  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" /> {/* Lighter overlay */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-[400px] h-[300px] max-w-[80vw] max-h-[50vh] relative"> {/* Added relative positioning */}
          <Canvas camera={{ position: [0, 1.8, 3.2], fov: 40 }}> {/* Removed shadows */}
            <ambientLight intensity={0.7} /> {/* Increased brightness to compensate for no shadows */}
            <directionalLight 
              position={[3, 5, 2]} 
              intensity={0.8} 
            />
            <Physics gravity={[0, -9.81, 0]}>
              <Ground />
              <Die target={rollValue ?? undefined} trigger={trigger} />
            </Physics>
          </Canvas>
          
          {/* Roll result message */}
          {isSettled && rollValue && (
            <div className="absolute bottom-4 left-0 right-0 text-center">
              <div className="inline-block bg-white/90 text-black font-bold px-6 py-2 rounded-full shadow-lg text-xl">
                You rolled a {rollValue}!
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DiceOverlay;
