"use client"

import { CatTimeline } from "@/components/cat-timeline"
import { motion } from "framer-motion"

export default function Home() {
  return (
    <main className="container max-w-md mx-auto p-4">
      <motion.h1
        className="text-2xl font-bold mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.5,
          type: "spring",
          stiffness: 200,
        }}
      >
        Cat Care Timeline
      </motion.h1>
      <CatTimeline />
    </main>
  )
}

