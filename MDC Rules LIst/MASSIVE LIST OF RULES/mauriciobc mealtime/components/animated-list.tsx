"use client"

import React from "react"

import { motion } from "framer-motion"
import { useAnimation } from "@/components/animation-provider"

interface AnimatedListProps {
  children: React.ReactNode
  delay?: number
  staggerDelay?: number
}

export default function AnimatedList({ children, delay = 0, staggerDelay = 0.05 }: AnimatedListProps) {
  const { shouldAnimate } = useAnimation()

  if (!shouldAnimate) {
    return <>{children}</>
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: delay,
      },
    },
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: [0.25, 0.1, 0.25, 1.0],
      },
    },
  }

  // Clone children and wrap each in a motion.div
  const childrenArray = React.Children.toArray(children)
  const animatedChildren = childrenArray.map((child, index) => (
    <motion.div key={index} variants={item}>
      {child}
    </motion.div>
  ))

  return (
    <motion.div variants={container} initial="hidden" animate="show">
      {animatedChildren}
    </motion.div>
  )
}

