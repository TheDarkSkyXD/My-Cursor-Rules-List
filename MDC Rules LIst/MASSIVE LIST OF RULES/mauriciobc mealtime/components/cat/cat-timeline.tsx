"use client"

import { useState } from "react"
import { PlusCircle } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { TimelineEvent } from "@/components/timeline-event"
import { AddEventDialog } from "@/components/add-event-dialog"
import { cn } from "@/lib/utils"

// Sample data for the timeline
const initialEvents = [
  {
    id: "1",
    type: "meal",
    title: "Breakfast",
    timestamp: "7:00 AM",
    description: "Wet food - Salmon flavor",
    catAvatar: "/placeholder.svg?height=40&width=40",
    notes: "She ate everything! Very enthusiastic today.",
  },
  {
    id: "2",
    type: "medication",
    title: "Morning Medication",
    timestamp: "8:30 AM",
    description: "Flea treatment",
    catAvatar: "/placeholder.svg?height=40&width=40",
    notes: "Administered without any issues.",
  },
  {
    id: "3",
    type: "note",
    title: "Playtime",
    timestamp: "10:15 AM",
    description: "Interactive toy session",
    catAvatar: "/placeholder.svg?height=40&width=40",
    notes: "Very energetic! Played for 20 minutes with the feather wand.",
  },
  {
    id: "4",
    type: "meal",
    title: "Lunch",
    timestamp: "1:00 PM",
    description: "Dry food - Regular portion",
    catAvatar: "/placeholder.svg?height=40&width=40",
    notes: "Ate about half the portion, will check back later.",
  },
]

export type EventType = "meal" | "medication" | "note"

export interface TimelineEventData {
  id: string
  type: EventType
  title: string
  timestamp: string
  description: string
  catAvatar: string
  notes: string
}

export function CatTimeline() {
  const [events, setEvents] = useState<TimelineEventData[]>(initialEvents)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const addEvent = (event: Omit<TimelineEventData, "id">) => {
    const newEvent = {
      ...event,
      id: Math.random().toString(36).substring(2, 9),
    }
    setEvents([newEvent, ...events])
  }

  const deleteEvent = (id: string) => {
    setEvents(events.filter((event) => event.id !== id))
  }

  return (
    <div className="relative">
      {/* Timeline line with animated gradient */}
      <motion.div
        className="absolute left-4 top-6 bottom-0 w-0.5 bg-gradient-to-b from-slate-200 to-slate-100 dark:from-slate-700 dark:to-slate-800"
        initial={{ height: 0 }}
        animate={{ height: "100%" }}
        transition={{ duration: 1, ease: "easeOut" }}
      />

      {/* Timeline events */}
      <div className="space-y-6 relative">
        <AnimatePresence>
          {events.map((event, index) => (
            <TimelineEvent
              key={event.id}
              event={event}
              onDelete={() => deleteEvent(event.id)}
              className={cn(index === 0 && "first-event", index === events.length - 1 && "last-event")}
              index={index}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Add event button with animation */}
      <motion.button
        onClick={() => setIsDialogOpen(true)}
        className="fixed bottom-6 right-6 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground p-3 shadow-md group z-10"
        aria-label="Add new event"
        whileHover={{
          scale: 1.1,
          rotate: [0, -5, 5, -5, 0],
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        }}
        whileTap={{ scale: 0.95 }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          type: "spring",
          stiffness: 400,
          damping: 17,
          delay: 0.5,
        }}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{
            duration: 20,
            ease: "linear",
            repeat: Number.POSITIVE_INFINITY,
          }}
          className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-20 bg-gradient-to-r from-primary/50 via-primary/20 to-primary/50"
        />
        <PlusCircle className="h-6 w-6 group-hover:scale-110 transition-transform" />
        <span className="sr-only">Add new event</span>
      </motion.button>

      {/* Add event dialog */}
      <AddEventDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} onAddEvent={addEvent} />
    </div>
  )
}

