import React, { useEffect, useState } from 'react';

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  shape: 'circle' | 'star' | 'spark';
}

interface ParticleEffectProps {
  trigger: boolean;
  type: 'celebration' | 'explosion' | 'sparkle' | 'hearts' | 'skull';
  duration?: number;
  particleCount?: number;
  onComplete?: () => void;
}

const ParticleEffect: React.FC<ParticleEffectProps> = ({
  trigger,
  type,
  duration = 2000,
  particleCount = 30,
  onComplete
}) => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (!trigger) return;

    setIsActive(true);

    // Create particles based on type
    const newParticles: Particle[] = [];
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.5;
      const speed = 2 + Math.random() * 3;
      const life = duration * (0.5 + Math.random() * 0.5);

      let color = '#ffffff';
      let shape: 'circle' | 'star' | 'spark' = 'circle';

      switch (type) {
        case 'celebration':
          color = ['#ffd700', '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4'][Math.floor(Math.random() * 5)];
          shape = Math.random() > 0.5 ? 'star' : 'circle';
          break;
        case 'explosion':
          color = ['#ff4444', '#ff8844', '#ffaa44', '#ffffff'][Math.floor(Math.random() * 4)];
          shape = 'spark';
          break;
        case 'sparkle':
          color = '#ffd700';
          shape = 'star';
          break;
        case 'hearts':
          color = '#ff6b9d';
          shape = 'circle'; // We'll render as hearts
          break;
        case 'skull':
          color = '#666666';
          shape = 'circle'; // We'll render as skulls
          break;
      }

      newParticles.push({
        id: i,
        x: 50, // Center X (%)
        y: 50, // Center Y (%)
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life,
        maxLife: life,
        size: 4 + Math.random() * 8,
        color,
        shape
      });
    }

    setParticles(newParticles);

    // Animation loop
    const interval = setInterval(() => {
      setParticles(prev => prev.map(particle => ({
        ...particle,
        x: particle.x + particle.vx * 0.1,
        y: particle.y + particle.vy * 0.1,
        vx: particle.vx * 0.98, // Friction
        vy: particle.vy * 0.98 + 0.1, // Gravity
        life: particle.life - 16
      })).filter(particle => particle.life > 0));
    }, 16);

    // Cleanup
    const timeout = setTimeout(() => {
      setIsActive(false);
      setParticles([]);
      if (onComplete) onComplete();
      clearInterval(interval);
    }, duration);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [trigger, type, duration, particleCount, onComplete]);

  if (!isActive || particles.length === 0) return null;

  const renderShape = (particle: Particle) => {
    const opacity = particle.life / particle.maxLife;

    switch (particle.shape) {
      case 'star':
        return (
          <div
            key={particle.id}
            className="absolute pointer-events-none"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              transform: 'translate(-50%, -50%)',
              opacity,
              fontSize: `${particle.size}px`,
              color: particle.color
            }}
          >
            ⭐
          </div>
        );
      case 'spark':
        return (
          <div
            key={particle.id}
            className="absolute pointer-events-none"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              transform: 'translate(-50%, -50%)',
              opacity,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              backgroundColor: particle.color,
              borderRadius: '50%',
              boxShadow: `0 0 ${particle.size}px ${particle.color}`
            }}
          />
        );
      default: // circle or special shapes
        if (type === 'hearts') {
          return (
            <div
              key={particle.id}
              className="absolute pointer-events-none"
              style={{
                left: `${particle.x}%`,
                top: `${particle.y}%`,
                transform: 'translate(-50%, -50%)',
                opacity,
                fontSize: `${particle.size}px`,
                color: particle.color
              }}
            >
              ❤️
            </div>
          );
        } else if (type === 'skull') {
          return (
            <div
              key={particle.id}
              className="absolute pointer-events-none"
              style={{
                left: `${particle.x}%`,
                top: `${particle.y}%`,
                transform: 'translate(-50%, -50%)',
                opacity,
                fontSize: `${particle.size}px`,
                color: particle.color
              }}
            >
              💀
            </div>
          );
        } else {
          return (
            <div
              key={particle.id}
              className="absolute pointer-events-none"
              style={{
                left: `${particle.x}%`,
                top: `${particle.y}%`,
                transform: 'translate(-50%, -50%)',
                opacity,
                width: `${particle.size}px`,
                height: `${particle.size}px`,
                backgroundColor: particle.color,
                borderRadius: '50%'
              }}
            />
          );
        }
    }
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-40">
      {particles.map(renderShape)}
    </div>
  );
};

export default ParticleEffect;