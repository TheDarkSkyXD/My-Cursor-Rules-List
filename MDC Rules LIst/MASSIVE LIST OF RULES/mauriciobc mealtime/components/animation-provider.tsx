"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { AnimatePresence } from "framer-motion"
import { usePathname } from "next/navigation"

type AnimationContextType = {
  prefersReducedMotion: boolean
  shouldAnimate: boolean
}

const AnimationContext = createContext<AnimationContextType>({
  prefersReducedMotion: false,
  shouldAnimate: true,
})

export const useAnimation = () => useContext(AnimationContext)

export function AnimationProvider({ children }: { children: React.ReactNode }) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    // Check if user prefers reduced motion
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    setPrefersReducedMotion(mediaQuery.matches)

    const handleChange = () => setPrefersReducedMotion(mediaQuery.matches)
    mediaQuery.addEventListener("change", handleChange)

    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [])

  return (
    <AnimationContext.Provider
      value={{
        prefersReducedMotion,
        shouldAnimate: !prefersReducedMotion,
      }}
    >
      <AnimatePresence mode="wait">
        <div key={pathname}>{children}</div>
      </AnimatePresence>
    </AnimationContext.Provider>
  )
}

