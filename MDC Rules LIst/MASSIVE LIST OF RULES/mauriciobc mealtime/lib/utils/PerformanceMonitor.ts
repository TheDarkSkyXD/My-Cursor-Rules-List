// Utility for monitoring performance of functions
export function monitorPerformance<T extends (...args: any[]) => any>(fn: T, label: string): T {
  return function (...args: Parameters<T>): ReturnType<T> {
    const start = performance.now();
    const result = fn(...args);
    const end = performance.now();
    console.log(`[PerformanceMonitor] ${label} took ${(end - start).toFixed(2)}ms`);
    return result;
  } as T;
}

// Example usage:
// const monitoredFunction = monitorPerformance((num: number) => num * 2, 'Multiply Function');