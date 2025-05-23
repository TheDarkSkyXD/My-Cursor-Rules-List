"use client"

import { Timeline, TimelineItem } from "@/components/ui/timeline"
import { CheckCircle, AlertCircle, Ban, AlertTriangle, HelpCircle } from "lucide-react"

interface FeedingEvent {
  id: string
  date: Date
  title: string
  description: string
  status: "Normal" | "Comeu Pouco" | "Recusou" | "Vomitou" | "Outro"
}

interface FeedingTimelineProps {
  events: FeedingEvent[]
}

export function FeedingTimeline({ events }: FeedingTimelineProps) {
  const getStatusIcon = (status: FeedingEvent["status"]) => {
    switch (status) {
      case "Normal":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "Comeu Pouco":
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
      case "Recusou":
        return <Ban className="h-5 w-5 text-red-500" />
      case "Vomitou":
        return <AlertTriangle className="h-5 w-5 text-red-500" />
      case "Outro":
        return <HelpCircle className="h-5 w-5 text-blue-500" />
      default:
        return null
    }
  }

  return (
    <Timeline className="mt-8">
      {events.map((event) => (
        <TimelineItem
          key={event.id}
          date={event.date}
          title={event.title}
          description={event.description}
          icon={getStatusIcon(event.status)}
          status={event.status}
        />
      ))}
    </Timeline>
  )
} 