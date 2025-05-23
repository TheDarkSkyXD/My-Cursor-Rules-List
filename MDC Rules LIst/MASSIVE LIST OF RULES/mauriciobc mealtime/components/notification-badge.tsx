"use client"

import { motion } from "framer-motion"
import { useAnimation } from "@/components/animation-provider"
import { cn } from "@/lib/utils"

interface NotificationBadgeProps {
  count: number
  className?: string
}

export default function NotificationBadge({ count, className }: NotificationBadgeProps) {
  const { shouldAnimate } = useAnimation()

  if (count === 0) return null

  if (!shouldAnimate) {
    return (
      <span
        className={cn(
          "absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white",
          className,
        )}
      >
        {count}
      </span>
    )
  }

  return (
    <motion.span
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{
        type: "spring",
        stiffness: 500,
        damping: 15,
      }}
      className={cn(
        "absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white",
        className,
      )}
    >
      {count}
    </motion.span>
  )
}

