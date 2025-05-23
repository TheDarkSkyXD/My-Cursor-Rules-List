"use client"

import { motion } from "framer-motion"
import { useAnimation } from "@/components/animation-provider"
import type { LucideIcon } from "lucide-react"

interface AnimatedIconProps {
  icon: LucideIcon
  size?: number
  color?: string
  className?: string
  animate?: "pulse" | "bounce" | "spin" | "wiggle" | "none"
}

export default function AnimatedIcon({
  icon: Icon,
  size = 24,
  color,
  className = "",
  animate = "none",
}: AnimatedIconProps) {
  const { shouldAnimate } = useAnimation()

  if (!shouldAnimate || animate === "none") {
    return <Icon size={size} className={className} color={color} />
  }

  const animations = {
    pulse: {
      scale: [1, 1.1, 1],
      transition: {
        repeat: Number.POSITIVE_INFINITY,
        repeatType: "loop" as const,
        duration: 2,
        ease: "easeInOut",
      },
    },
    bounce: {
      y: [0, -5, 0],
      transition: {
        repeat: Number.POSITIVE_INFINITY,
        repeatType: "loop" as const,
        duration: 1,
        ease: "easeInOut",
      },
    },
    spin: {
      rotate: 360,
      transition: {
        repeat: Number.POSITIVE_INFINITY,
        repeatType: "loop" as const,
        duration: 2,
        ease: "linear",
      },
    },
    wiggle: {
      rotate: [-3, 3, -3],
      transition: {
        repeat: Number.POSITIVE_INFINITY,
        repeatType: "loop" as const,
        duration: 0.5,
        ease: "easeInOut",
      },
    },
  }

  return (
    <motion.div animate={animations[animate]} className="inline-flex">
      <Icon size={size} className={className} color={color} />
    </motion.div>
  )
}

