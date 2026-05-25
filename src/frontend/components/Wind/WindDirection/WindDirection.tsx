import { memo, useRef, useEffect, useLayoutEffect, useState } from 'react';

export interface WindDirectionProps {
  speedMs?: number;
  direction?: number;
  metric?: boolean;
}

const getWindIntensityClass = (speed?: number) => {
  if (speed === undefined) return 'text-white';
  if (speed < 5) return 'text-white';
  if (speed < 15) return 'text-sky-300';
  if (speed < 30) return 'text-emerald-300';
  if (speed < 40) return 'text-orange-300';

  return 'text-red-400';
};

export const WindDirection = memo(
  ({ speedMs, direction, metric = true }: WindDirectionProps) => {
    const speed =
      speedMs !== undefined
        ? speedMs * (metric ? 3.6 : 2.23694) // km/h or mph
        : undefined;

    const [normalizedAngle, setNormalizedAngle] = useState<number>(0);
    const prevAngleRef = useRef<number>(0);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [size, setSize] = useState<number | null>(null);

    useEffect(() => {
      if (direction === undefined) return;

      const currentAngle = direction;
      const prevAngle = prevAngleRef.current;

      let diff = currentAngle - prevAngle;

      while (diff > Math.PI) diff -= 2 * Math.PI;
      while (diff < -Math.PI) diff += 2 * Math.PI;

      setNormalizedAngle((prev) => prev + diff);
      prevAngleRef.current = currentAngle;
    }, [direction]);

    useLayoutEffect(() => {
      const node = containerRef.current;
      if (!node) return;

      const updateSize = () => {
        const { clientWidth, clientHeight } = node;
        if (!clientWidth || !clientHeight) return;

        setSize(Math.round(Math.min(clientWidth, clientHeight)));
      };

      updateSize();
      const observer = new ResizeObserver(updateSize);
      observer.observe(node);

      return () => observer.disconnect();
    }, []);

    const visualSize = size ? `${size}px` : '100%';
    const fontSize = size ? Math.max(10, Math.round(size * 0.27)) : 32;
    const windIntensityClass = getWindIntensityClass(speed);

    return (
      <div
        ref={containerRef}
        className="flex h-full w-full min-h-0 min-w-0 items-center justify-center"
      >
        <div
          id="wind"
          className={`relative flex aspect-square items-center justify-center transition-colors duration-300 ${windIntensityClass}`}
          style={{ width: visualSize, height: visualSize }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 60 60"
            className="absolute stroke-current stroke-[3] w-full h-full box-border fill-none origin-center transform-gpu transition-transform duration-1000 ease-out"
            style={{
              rotate: `calc(${normalizedAngle} * 1rad + 0.5turn)`,
            }}
          >
            <path d="M48 8A28 28 90 0158 30c0 15.464-12.536 28-28 28S2 45.464 2 30A28 28 90 0112 8M22 9 30 1l8 8" />
          </svg>

          <div
            className="absolute flex h-full w-full items-center justify-center leading-none"
            style={{ fontSize }}
          >
            {speed !== undefined ? Math.round(speed) : '-'}
          </div>
        </div>
      </div>
    );
  }
);
WindDirection.displayName = 'WindDirection';
