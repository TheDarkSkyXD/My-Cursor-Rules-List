import { useState } from "react";

export function useAnimation() {
  const [shouldAnimate] = useState(true);
  
  return {
    shouldAnimate,
    disableAnimations: () => {},
    enableAnimations: () => {},
    toggleAnimations: () => {},
  };
} 