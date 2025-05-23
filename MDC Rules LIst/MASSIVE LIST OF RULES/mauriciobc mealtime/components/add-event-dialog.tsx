"use client"

import type React from "react"

import { useState } from "react"
import { Fish, Pill, StickyNote } from "lucide-react"
import { motion } from "framer-motion"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import type { TimelineEventData, EventType } from "@/components/cat-timeline"

interface AddEventDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddEvent: (event: Omit<TimelineEventData, "id">) => void
}

export function AddEventDialog({ open, onOpenChange, onAddEvent }: AddEventDialogProps) {
  const [eventType, setEventType] = useState<EventType>("meal")
  const [title, setTitle] = useState("")
  const [timestamp, setTimestamp] = useState("")
  const [description, setDescription] = useState("")
  const [notes, setNotes] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    onAddEvent({
      type: eventType,
      title,
      timestamp,
      description,
      notes,
      catAvatar: "/placeholder.svg?height=40&width=40",
    })

    // Reset form
    setEventType("meal")
    setTitle("")
    setTimestamp("")
    setDescription("")
    setNotes("")

    onOpenChange(false)
  }

  const formVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 300, damping: 24 },
    },
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md overflow-hidden">
        <DialogHeader>
          <DialogTitle>Add New Event</DialogTitle>
        </DialogHeader>
        <motion.form
          onSubmit={handleSubmit}
          className="space-y-4"
          variants={formVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div className="space-y-2" variants={itemVariants}>
            <Label>Event Type</Label>
            <RadioGroup
              value={eventType}
              onValueChange={(value) => setEventType(value as EventType)}
              className="flex space-x-2"
            >
              <motion.div
                className="flex items-center space-x-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <RadioGroupItem value="meal" id="meal" />
                <Label
                  htmlFor="meal"
                  className="flex items-center space-x-1 cursor-pointer text-[#FA8072] dark:text-[#FA8072]/80"
                >
                  <motion.div whileHover={{ rotate: [0, -10, 10, -10, 0] }} transition={{ duration: 0.5 }}>
                    <Fish className="h-4 w-4" />
                  </motion.div>
                  <span>Meal</span>
                </Label>
              </motion.div>

              <motion.div
                className="flex items-center space-x-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <RadioGroupItem value="medication" id="medication" />
                <Label
                  htmlFor="medication"
                  className="flex items-center space-x-1 cursor-pointer text-indigo-500 dark:text-indigo-400"
                >
                  <motion.div whileHover={{ rotate: [0, -10, 10, -10, 0] }} transition={{ duration: 0.5 }}>
                    <Pill className="h-4 w-4" />
                  </motion.div>
                  <span>Medication</span>
                </Label>
              </motion.div>

              <motion.div
                className="flex items-center space-x-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <RadioGroupItem value="note" id="note" />
                <Label
                  htmlFor="note"
                  className="flex items-center space-x-1 cursor-pointer text-emerald-500 dark:text-emerald-400"
                >
                  <motion.div whileHover={{ rotate: [0, -10, 10, -10, 0] }} transition={{ duration: 0.5 }}>
                    <StickyNote className="h-4 w-4" />
                  </motion.div>
                  <span>Note</span>
                </Label>
              </motion.div>
            </RadioGroup>
          </motion.div>

          <motion.div className="grid grid-cols-2 gap-4" variants={itemVariants}>
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
              </motion.div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timestamp">Time</Label>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Input
                  id="timestamp"
                  value={timestamp}
                  onChange={(e) => setTimestamp(e.target.value)}
                  placeholder="e.g. 7:00 AM"
                  required
                />
              </motion.div>
            </div>
          </motion.div>

          <motion.div className="space-y-2" variants={itemVariants}>
            <Label htmlFor="description">Description</Label>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} required />
            </motion.div>
          </motion.div>

          <motion.div className="space-y-2" variants={itemVariants}>
            <Label htmlFor="notes">Notes</Label>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
            </motion.div>
          </motion.div>

          <motion.div
            className="flex justify-end space-x-2"
            variants={itemVariants}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button type="submit" className="group relative overflow-hidden">
                <span className="relative z-10">Add Event</span>
                <motion.span
                  className="absolute right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  initial={{ x: -10 }}
                  whileHover={{ x: 0, rotate: [0, -10, 10, -10, 0] }}
                  transition={{ duration: 0.5 }}
                >
                  🐾
                </motion.span>
              </Button>
            </motion.div>
          </motion.div>
        </motion.form>
      </DialogContent>
    </Dialog>
  )
}

