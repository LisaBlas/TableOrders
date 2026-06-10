import { useState, useEffect } from "react";

export type Breakpoint = "mobile" | "tablet" | "tabletLandscape" | "laptop" | "desktop";

interface BreakpointState {
  current: Breakpoint;
  isMobile: boolean;
  isTablet: boolean;
  isTabletLandscape: boolean;
  isLaptop: boolean;
  isDesktop: boolean;
  width: number;
}

// Breakpoint thresholds
const BREAKPOINTS = {
  mobile: 0,
  tablet: 768,        // iPad portrait, Android tablets portrait
  tabletLandscape: 1024, // iPad landscape
  laptop: 1200,       // small laptops and desktop browser windows
  desktop: 1440,
} as const;

function getBreakpoint(width: number): Breakpoint {
  if (width >= BREAKPOINTS.desktop) return "desktop";
  if (width >= BREAKPOINTS.laptop) return "laptop";
  if (width >= BREAKPOINTS.tabletLandscape) return "tabletLandscape";
  if (width >= BREAKPOINTS.tablet) return "tablet";
  return "mobile";
}

/**
 * Hook to track current viewport breakpoint
 *
 * Breakpoints:
 * - mobile: 0-767px (phones)
 * - tablet: 768-1023px (iPad portrait, small tablets)
 * - tabletLandscape: 1024-1199px (iPad landscape, large tablets)
 * - laptop: 1200-1439px (small laptops and desktop browser windows)
 * - desktop: 1440px+
 *
 * Usage:
 * ```tsx
 * const { isMobile, isTablet, current } = useBreakpoint();
 * return <div style={isMobile ? S.mobileGrid : S.tabletGrid}>
 * ```
 */
export function useBreakpoint(): BreakpointState {
  const [width, setWidth] = useState(window.innerWidth);
  const current = getBreakpoint(width);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const handleResize = () => {
      // Debounce resize events (throttle to 150ms)
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setWidth(window.innerWidth);
      }, 150);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return {
    current,
    isMobile: current === "mobile",
    isTablet: current === "tablet",
    isTabletLandscape: current === "tabletLandscape",
    isLaptop: current === "laptop",
    isDesktop: current === "desktop",
    width,
  };
}
