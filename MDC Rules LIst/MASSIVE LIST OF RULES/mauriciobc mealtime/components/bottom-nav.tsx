"use client"

import Link from "next/link"
import { Home, Calendar, List, Settings, Users, BarChart2, Scale } from "lucide-react"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import { useAnimation } from "@/components/animation-provider"
import { Cat, Menu } from "lucide-react"

interface BottomNavProps {
  currentPath?: string;
}

export default function BottomNav({ currentPath }: BottomNavProps) {
  const pathname = usePathname()
  const { shouldAnimate } = useAnimation()

  const isActive = (path: string) => {
    // Se currentPath for fornecido, use-o em vez de pathname
    const activePath = currentPath || pathname
    if (path === "/" && activePath === "/") return true
    if (path !== "/" && activePath === path) return true
    if (path !== "/" && activePath?.startsWith(path)) return true
    return false
  }

  const navItems = [
    { path: "/", icon: <Home className="h-6 w-6" />, label: "Início" },
    { path: "/cats", icon: <Cat className="h-6 w-6" />, label: "Gatos" },
    { path: "/households", icon: <Users className="h-6 w-6" />, label: "Domicílios" },
    { path: "/schedules", icon: <Calendar className="h-6 w-6" />, label: "Agenda" },
    { path: "/weight", icon: <Scale className="h-6 w-6" />, label: "Peso" },
    { path: "/statistics", icon: <BarChart2 className="h-6 w-6" />, label: "Estatísticas" },
  ]

  if (!shouldAnimate) {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t py-2 px-6 z-10">
        <div className="max-w-md mx-auto flex items-center justify-between">
          {navItems.map((item) => (
            <Link key={item.path} href={item.path} className="flex flex-col items-center">
              <div className={`${isActive(item.path) ? "bg-primary text-primary-foreground" : "text-muted-foreground"} p-2 rounded-full`}>
                {item.icon}
              </div>
              <span className="text-xs mt-1 text-muted-foreground">{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
    )
  }

  return (
    <motion.div
      className="fixed bottom-0 left-0 right-0 bg-background border-t py-2 px-6 z-10"
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30,
        delay: 0.2,
      }}
    >
      <div className="max-w-md mx-auto flex items-center justify-between">
        {navItems.map((item, index) => (
          <Link key={item.path} href={item.path} className="flex flex-col items-center">
            <motion.div
              className={`${isActive(item.path) ? "bg-primary text-primary-foreground" : "text-muted-foreground"} p-2 rounded-full`}
              whileHover={{ y: -5 }}
              whileTap={{ scale: 0.9 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.3 + index * 0.1,
                duration: 0.3,
              }}
            >
              {item.icon}
            </motion.div>
            <span className="text-xs mt-1 text-muted-foreground">{item.label}</span>
          </Link>
        ))}
      </div>
    </motion.div>
  )
}
