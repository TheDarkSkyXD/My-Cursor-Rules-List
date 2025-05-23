'use client'

import * as React from 'react'
import {
  CameraIcon,
  ClipboardListIcon,
  DatabaseIcon,
  FileCodeIcon,
  FileIcon,
  FileTextIcon,
  HelpCircleIcon,
  MonitorPlay,
  SearchIcon,
  SettingsIcon,
  LogInIcon,
  Sparkles,
  CalendarIcon,
  Bot,
  Mail,
  Wine,
  Newspaper,
  SunIcon,
  MoonIcon,
} from 'lucide-react'
import Link from 'next/link'
import { useTheme } from 'next-themes'
import { Switch } from '@/components/ui/switch'

import { NavDocuments } from '@/components/nav-documents'
import { NavMain } from '@/components/nav-main'
import { NavSecondary } from '@/components/nav-secondary'
import { NavUser } from '@/components/nav-user'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'

const data = {
  user: {
    name: 'shadcn',
    email: 'm@example.com',
    avatar: '/avatars/shadcn.jpg',
  },
  navMain: [
    {
      title: 'Kurser',
      url: '#',
      icon: MonitorPlay,
    },
    {
      title: 'Artiklar',
      url: '#',
      icon: Newspaper,
    },
    {
      title: 'Vinlistan',
      url: '#',
      icon: Wine,
    },
    {
      title: 'Nyhetsbrev',
      url: '#',
      icon: Mail,
    },
    {
      title: 'AI Sommelier',
      url: '#',
      icon: Bot,
    },
    {
      title: 'Kalender',
      url: '#',
      icon: CalendarIcon,
    },
  ],
  navClouds: [
    {
      title: 'Capture',
      icon: CameraIcon,
      isActive: true,
      url: '#',
      items: [
        {
          title: 'Active Proposals',
          url: '#',
        },
        {
          title: 'Archived',
          url: '#',
        },
      ],
    },
    {
      title: 'Proposal',
      icon: FileTextIcon,
      url: '#',
      items: [
        {
          title: 'Active Proposals',
          url: '#',
        },
        {
          title: 'Archived',
          url: '#',
        },
      ],
    },
    {
      title: 'Prompts',
      icon: FileCodeIcon,
      url: '#',
      items: [
        {
          title: 'Active Proposals',
          url: '#',
        },
        {
          title: 'Archived',
          url: '#',
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: 'Inställningar',
      url: '#',
      icon: SettingsIcon,
    },
    {
      title: 'Hjälp',
      url: '#',
      icon: HelpCircleIcon,
    },
    {
      title: 'Sök',
      url: '#',
      icon: SearchIcon,
    },
  ],
  documents: [
    {
      name: 'Data Library',
      url: '#',
      icon: DatabaseIcon,
    },
    {
      name: 'Reports',
      url: '#',
      icon: ClipboardListIcon,
    },
    {
      name: 'Word Assistant',
      url: '#',
      icon: FileIcon,
    },
  ],
}

// Define an interface for the props, including the user object
// Use a more specific type if available, like the one from payload-types
interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  // Allow user to be null or undefined
  user: any | null | undefined
}

// Accept user prop
export function AppSidebar({ user, ...props }: AppSidebarProps) {
  const { setTheme, theme } = useTheme()

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:!p-1.5">
              <a href="#">
                <Sparkles className="h-5 w-5 text-orange-300 dark:text-secondary" />
                <span className="text-2xl font-heading">Vinakademin</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavDocuments items={data.documents} />

        <SidebarMenu className="mt-auto">
          <SidebarMenuItem className="px-3 py-2">
            <div className="flex w-full items-center justify-start space-x-2">
              <Switch
                id="theme-switch"
                checked={theme === 'dark'}
                onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                aria-label="Toggle theme"
              />
              {theme === 'light' ? (
                <SunIcon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              ) : (
                <MoonIcon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              )}
            </div>
          </SidebarMenuItem>
        </SidebarMenu>

        <NavSecondary items={data.navSecondary} className="pt-2" />
      </SidebarContent>
      <SidebarFooter>
        {/* Conditionally render NavUser or Login button */}
        {user ? (
          <NavUser user={user} />
        ) : (
          <SidebarMenu>
            <SidebarMenuItem>
              <Link href="/logga-in" className="w-full">
                <SidebarMenuButton
                  variant={'outline'}
                  className="w-full justify-center text-white bg-neutral-900 hover:bg-neutral-800/90 hover:text-white dark:bg-white dark:text-black dark:hover:bg-neutral-200/95"
                >
                  <LogInIcon className="h-4 w-4" />
                  <span>Logga in</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          </SidebarMenu>
        )}
      </SidebarFooter>
    </Sidebar>
  )
}
