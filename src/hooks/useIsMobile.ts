import { useState, useEffect } from 'react';

/**
 * Hook to detect whether the user is on a mobile device, tablet or viewport below desktop size.
 * Switches to mobile/tablet-optimized layout whenever the screen width is <= 1024px
 * (preventing awkward stacked desktop layouts that require scrolling).
 */
export function useIsMobile(breakpoint = 1024): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    return window.innerWidth <= breakpoint || (isTouch && window.innerWidth <= 1024);
  });

  useEffect(() => {
    const handleResize = () => {
      const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const mobile = window.innerWidth <= breakpoint || (isTouch && window.innerWidth <= 1024);
      setIsMobile(mobile);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [breakpoint]);

  return isMobile;
}
