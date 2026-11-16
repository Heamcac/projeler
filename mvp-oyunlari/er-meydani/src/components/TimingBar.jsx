import React, { useEffect, useRef, useState } from 'react';

export default function TimingBar({ windowSize, paused, onResolve }) {
  const [position, setPosition] = useState(0);
  const [direction, setDirection] = useState(1);
  const resolved = useRef(false);
  const successStart = 50 - windowSize / 2;
  const successEnd = 50 + windowSize / 2;

  useEffect(() => {
    if (paused) return undefined;
    const timer = setInterval(() => {
      setPosition((value) => {
        const next = value + direction * 4.5;
        if (next >= 100) {
          setDirection(-1);
          return 100;
        }
        if (next <= 0) {
          setDirection(1);
          return 0;
        }
        return next;
      });
    }, 24);

    return () => clearInterval(timer);
  }, [direction, paused]);

  function resolve() {
    if (paused || resolved.current) return;
    resolved.current = true;
    onResolve(position >= successStart && position <= successEnd);
  }

  return (
    <div className="timing-layer" onPointerDown={resolve} role="button" tabIndex={0}>
      <div className="timing-card">
        <span className="timing-title">Dogru ani yakala</span>
        <div className="timing-track">
          <div className="success-zone" style={{ left: `${successStart}%`, width: `${windowSize}%` }} />
          <div className="timing-marker" style={{ left: `${position}%` }} />
        </div>
      </div>
    </div>
  );
}
