"use client"

import { useState } from "react"
import { Fish, Pill, StickyNote, X } from "lucide-react"
import { motion, AnimatePresence, useMotionValue, useTransform, type PanInfo } from "framer-motion"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { TimelineEventData, EventType } from "@/components/cat-timeline"
import { cn } from "@/lib/utils"
import Image from "next/image"

interface TimelineEventProps {
  event: TimelineEventData
  onDelete: () => void
  className?: string
  index: number
}

export function TimelineEvent({ event, onDelete, className, index }: TimelineEventProps) {
  const [expanded, setExpanded] = useState(false)

  // Motion values for swipe animation
  const x = useMotionValue(0)
  const opacity = useTransform(x, [-150, 0], [0, 1])
  const scale = useTransform(x, [-150, 0], [0.8, 1])
  const deleteIconOpacity = useTransform(x, [-150, -20], [1, 0])
  const pawScale = useTransform(x, [-150, -100, -50, 0], [1.5, 1.2, 0.8, 0])

  // Handle drag end
  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.x < -100) {
      onDelete()
    }
  }

  // Get color and icon based on event type
  const getEventTypeDetails = (type: EventType) => {
    switch (type) {
      case "meal":
        return {
          color: "bg-[#FA8072] dark:bg-[#FA8072]/80",
          textColor: "text-[#FA8072] dark:text-[#FA8072]/80",
          icon: <Fish className="h-4 w-4" />,
          label: "Meal",
          borderColor: "#FA8072",
        }
      case "medication":
        return {
          color: "bg-indigo-500 dark:bg-indigo-400",
          textColor: "text-indigo-500 dark:text-indigo-400",
          icon: <Pill className="h-4 w-4" />,
          label: "Medication",
          borderColor: "#6366f1",
        }
      case "note":
        return {
          color: "bg-emerald-500 dark:bg-emerald-400",
          textColor: "text-emerald-500 dark:text-emerald-400",
          icon: <StickyNote className="h-4 w-4" />,
          label: "Note",
          borderColor: "#10b981",
        }
    }
  }

  const typeDetails = getEventTypeDetails(event.type)

  return (
    <motion.div
      className={cn("pl-8 relative", className)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{
        duration: 0.4,
        delay: index * 0.1,
        type: "spring",
        stiffness: 100,
      }}
    >
      {/* Paw dot on timeline */}
      <motion.div
        className="absolute left-4 top-6 w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600 transform -translate-x-1/2 -translate-y-1/2 before:content-[''] before:absolute before:top-[-2px] before:left-[-1px] before:w-1 before:h-1 before:rounded-full before:bg-slate-200 dark:before:bg-slate-500 after:content-[''] after:absolute after:top-[-2px] after:right-[-1px] after:w-1 after:h-1 after:rounded-full after:bg-slate-200 dark:after:bg-slate-500"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{
          delay: index * 0.1 + 0.2,
          type: "spring",
          stiffness: 300,
          damping: 15,
        }}
      />

      {/* Event card */}
      <motion.div
        style={{ x, opacity, scale }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
      >
        <motion.div
          whileHover={{
            y: -2,
            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
          }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          <Card
            className={cn("border-l-4 transition-all cursor-pointer", expanded ? "shadow-md" : "shadow-sm")}
            onClick={() => setExpanded(!expanded)}
            style={{ borderLeftColor: typeDetails.borderColor }}
          >
            <CardHeader className="p-4 pb-2 flex flex-row items-center space-x-4">
              <motion.div
                className="relative"
                whileHover={{ rotate: [0, -5, 5, -5, 0] }}
                transition={{ duration: 0.5 }}
              >
                <Image
                  src={event.catAvatar || "/placeholder.svg"}
                  alt="Cat"
                  width={40}
                  height={40}
                  className="rounded-full border-2 border-slate-200 dark:border-slate-700"
                />
              </motion.div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold">{event.timestamp}</span>
                    <motion.span
                      className="text-slate-400 dark:text-slate-500"
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 + 0.3, type: "spring" }}
                    >
                      🐾
                    </motion.span>
                  </div>
                  <Badge variant="outline" className={cn("flex items-center gap-1", typeDetails.textColor)}>
                    <motion.div
                      initial={{ rotate: 0 }}
                      whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                      transition={{ duration: 0.5 }}
                    >
                      {typeDetails.icon}
                    </motion.div>
                    {typeDetails.label}
                  </Badge>
                </div>
                <h3 className="font-medium">{event.title}</h3>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-2">
              <p className="text-sm text-slate-600 dark:text-slate-400">{event.description}</p>

              {/* Expanded content */}
              <AnimatePresence>
                {expanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t pt-3 mt-3 text-sm">
                      <h4 className="font-medium mb-1">Notes:</h4>
                      <p className="text-slate-600 dark:text-slate-400">{event.notes}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>

        {/* Delete indicator (visible when swiping) */}
        <motion.div
          className="absolute top-0 right-4 bottom-0 flex items-center justify-center text-red-500"
          style={{ opacity: deleteIconOpacity }}
        >
          <div className="relative">
            <X className="h-6 w-6" />
            <motion.div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-0.5 bg-red-500 rotate-45 transform -translate-x-2"
              style={{ scale: pawScale }}
            />
            <motion.div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-0.5 bg-red-500 rotate-45 transform translate-x-0"
              style={{ scale: pawScale }}
            />
            <motion.div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-0.5 bg-red-500 rotate-45 transform translate-x-2"
              style={{ scale: pawScale }}
            />
          </div>
          <span className="sr-only">Delete</span>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}

