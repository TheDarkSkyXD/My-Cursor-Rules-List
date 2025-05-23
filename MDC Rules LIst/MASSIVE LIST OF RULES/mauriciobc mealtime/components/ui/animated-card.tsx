"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { useAnimation } from "@/components/animation-provider" // Assuming this path is correct
import { cn } from "@/lib/utils"

interface AnimatedCardProps extends React.ComponentPropsWithoutRef<typeof Card> {
  delay?: number
  hover?: boolean
}

const AnimatedCard = React.forwardRef<React.ElementRef<typeof Card>, AnimatedCardProps>(
  ({ className, delay = 0, hover = true, children, ...props }, ref) => {
    const { shouldAnimate } = useAnimation() // Assuming useAnimation() is available and works

    if (!shouldAnimate) {
      return (
        <Card className={className} ref={ref} {...props}>
          {children}
        </Card>
      )
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.4,
          delay: delay * 0.1,
          ease: [0.25, 0.1, 0.25, 1.0],
        }}
        whileHover={hover ? { y: -4, transition: { duration: 0.2 } } : undefined}
      >
        <Card className={cn("transition-shadow duration-300", className)} ref={ref} {...props}>
          {children}
        </Card>
      </motion.div>
    )
  },
)
AnimatedCard.displayName = "AnimatedCard"

export { AnimatedCard } 