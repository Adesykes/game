/* eslint-disable */
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
    <mesh ref={ref as any} position={[0, -1, 0]}>
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

function pipGridPositions(value: number): [number, number][] {
  const g = [-0.22, 0, 0.22]; // Reduced spacing between pips
  switch (value) {
    case 1: return [[0, 0]];
    case 2: return [[g[0], g[0]], [g[2], g[2]]];
    case 3: return [[g[0], g[0]], [0, 0], [g[2], g[2]]];
    case 4: return [[g[0], g[0]], [g[0], g[2]], [g[2], g[0]], [g[2], g[2]]];
    case 5: return [[g[0], g[0]], [g[0], g[2]], [0, 0], [g[2], g[0]], [g[2], g[2]]];
    case 6: return [[g[0], g[0]], [g[0], g[1]], [g[0], g[2]], [g[2], g[0]], [g[2], g[1]], [g[2], g[2]]];
    default: return [[0, 0]];
  }
}
