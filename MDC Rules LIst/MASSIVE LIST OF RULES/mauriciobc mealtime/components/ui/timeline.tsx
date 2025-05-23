"use client"

import * as React from "react"
import type { ReactNode, ReactElement } from "react"
import { cn } from "@/lib/utils"
import { motion, HTMLMotionProps } from "framer-motion"

const Timeline = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    size?: "sm" | "md" | "lg"
    iconSize?: "sm" | "md" | "lg"
  }
>(({ className, size = "md", iconSize = "md", ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "relative space-y-4 before:absolute before:inset-0 before:ml-5 before:h-full before:w-0.5 before:-translate-x-px before:bg-gray-200 before:dark:bg-gray-800",
        className
      )}
      {...props}
    />
  )
})
Timeline.displayName = "Timeline"

const TimelineItem = React.forwardRef<
  HTMLDivElement,
  Omit<HTMLMotionProps<"div">, "ref"> & {
    date?: Date | string | number
    title?: ReactElement | string
    description?: string
    icon?: React.ReactNode
    iconColor?: "primary" | "secondary" | "muted" | "accent"
    status?: "completed" | "in-progress" | "pending"
    loading?: boolean
    error?: string
  }
>(
  (
    {
      className,
      date,
      title,
      description,
      icon,
      iconColor = "primary",
      status = "completed",
      loading = false,
      error,
      ...props
    },
    ref
  ) => {
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={cn(
          "relative pl-12",
          className
        )}
        {...props}
      >
        <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md dark:bg-gray-900">
          {icon}
        </div>
        <div className="space-y-1 pl-14">
          {date && (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {typeof date === "string" || typeof date === "number"
                ? new Date(date).toLocaleDateString()
                : date.toLocaleDateString()}
            </div>
          )}
          {title && (
            <div className="font-medium text-gray-900 dark:text-gray-100">
              {title}
            </div>
          )}
          {description && (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {description}
            </div>
          )}
          {loading && (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Carregando...
            </div>
          )}
          {error && (
            <div className="text-sm text-red-500 dark:text-red-400">
              {error}
            </div>
          )}
        </div>
      </motion.div>
    )
  }
)
TimelineItem.displayName = "TimelineItem"

const TimelineTime = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    date: Date | string | number
    format?: Intl.DateTimeFormatOptions
  }
>(({ className, date, format, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "text-sm text-gray-500 dark:text-gray-400",
        className
      )}
      {...props}
    >
      {typeof date === "string" || typeof date === "number"
        ? new Date(date).toLocaleDateString(undefined, format)
        : date.toLocaleDateString(undefined, format)}
    </div>
  )
})
TimelineTime.displayName = "TimelineTime"

export { Timeline, TimelineItem, TimelineTime } 