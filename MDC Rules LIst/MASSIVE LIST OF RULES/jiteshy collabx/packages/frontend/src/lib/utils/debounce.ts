/**
 * A utility function that creates a debounced function that delays execution
 * until after the specified delay, and uses refs to track the latest value and timeout.
 * 
 * @param callback The function to debounce
 * @param delay The delay in milliseconds
 * @returns An object with methods to trigger, cancel, and check if the callback is scheduled
 */
export function createDebouncedHandler<T>(
  callback: (value: T) => void,
  delay: number
) {
  // Create refs to store state
  let timeoutRef: NodeJS.Timeout | null = null;
  let lastValueRef: T | null = null;
  let isScheduled = false;
  
  // Return an object with methods to control the debounced function
  return {
    /**
     * Trigger the debounced function with a new value
     * @param value The value to pass to the callback
     */
    trigger: (value: T) => {
      // Store the latest value
      lastValueRef = value;
      isScheduled = true;
      
      // Clear any existing timeout
      if (timeoutRef) {
        clearTimeout(timeoutRef);
      }
      
      // Set a new timeout
      timeoutRef = setTimeout(() => {
        if (lastValueRef !== null) {
          callback(lastValueRef);
        }
        isScheduled = false;
        timeoutRef = null;
      }, delay);
    },
    
    /**
     * Cancel any pending debounced execution
     */
    cancel: () => {
      if (timeoutRef) {
        clearTimeout(timeoutRef);
        timeoutRef = null;
      }
      isScheduled = false;
    },
    
    /**
     * Check if a debounced execution is scheduled
     */
    isScheduled: () => isScheduled,
    
    /**
     * Get the last value that was passed to trigger
     */
    getLastValue: () => lastValueRef,
    
    /**
     * Immediately execute the callback with the last value
     */
    flush: () => {
      if (lastValueRef !== null && isScheduled) {
        callback(lastValueRef);
        
        if (timeoutRef) {
          clearTimeout(timeoutRef);
          timeoutRef = null;
        }
        
        isScheduled = false;
      }
    }
  };
}

/**
 * A utility function for throttling function calls
 * Will execute at most once per specified period
 * 
 * @param callback The function to throttle
 * @param limit The minimum time between executions in milliseconds
 * @returns A throttled version of the callback
 */
export function throttle<T>(
  callback: (value: T) => void,
  limit: number
) {
  let lastRun = 0;
  let timeoutRef: NodeJS.Timeout | null = null;
  let lastValueRef: T | null = null;
  
  return {
    /**
     * Trigger the throttled function with a new value
     * @param value The value to pass to the callback
     */
    trigger: (value: T) => {
      const now = Date.now();
      lastValueRef = value;
      
      // If we haven't run recently, run immediately
      if (now - lastRun >= limit) {
        lastRun = now;
        callback(value);
      } 
      // Otherwise, schedule to run at the end of the throttle period
      else if (!timeoutRef) {
        const remaining = limit - (now - lastRun);
        timeoutRef = setTimeout(() => {
          lastRun = Date.now();
          if (lastValueRef !== null) {
            callback(lastValueRef);
          }
          timeoutRef = null;
        }, remaining);
      }
    },
    
    /**
     * Cancel any pending throttled execution
     */
    cancel: () => {
      if (timeoutRef) {
        clearTimeout(timeoutRef);
        timeoutRef = null;
      }
    }
  };
} 