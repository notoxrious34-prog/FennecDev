import { useState, useEffect, useRef } from 'react';

interface UseCountUpOptions {
  duration?: number;
  startDelay?: number;
  decimals?: number;
  easing?: (t: number) => number;
}

export const useCountUp = (end: number, options: UseCountUpOptions = {}) => {
  const {
    duration = 1500,
    startDelay = 0,
    decimals = 0,
    easing = (t: number) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
  } = options;

  const [count, setCount] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const requestRef = useRef<number>();
  const startTimeRef = useRef<number>();

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAnimating(true);
      startTimeRef.current = performance.now();

      const animate = (currentTime: number) => {
        const startTime = startTimeRef.current!;
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = easing(progress);
        const currentCount = easedProgress * end;

        setCount(currentCount);

        if (progress < 1) {
          requestRef.current = requestAnimationFrame(animate);
        } else {
          setIsAnimating(false);
        }
      };

      requestRef.current = requestAnimationFrame(animate);
    }, startDelay);

    return () => {
      clearTimeout(timer);
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [end, duration, startDelay, easing]);

  return {
    count: count.toFixed(decimals),
    isAnimating,
  };
};
