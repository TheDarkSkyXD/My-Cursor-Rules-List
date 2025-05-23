'use client'

import {
  BellIcon,
  CreditCardIcon,
  LogOutIcon,
  MoreVerticalIcon,
  UserCircleIcon,
} from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { useAuth } from '@/context/AuthContext'
import type { User as PayloadUser } from '@/payload-types'

interface NavUserProps {
  user: PayloadUser | null | undefined
}

export function NavUser({ user }: NavUserProps) {
  const { isMobile } = useSidebar()
  const { logoutUser } = useAuth()

  const handleLogout = async () => {
    await logoutUser()
  }

  if (!user) {
    return null
  }

  const userName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email
  const avatarUrl =
    typeof user.avatar === 'object' && user.avatar?.url ? user.avatar.url : undefined
  const fallbackInitial = userName ? userName.charAt(0).toUpperCase() : 'U'

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="hover:bg-sidebar-accent data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground [&:hover_svg.icon-more]:text-secondary"
            >
              <Avatar className="h-8 w-8 rounded-lg grayscale">
                <AvatarImage src={avatarUrl} alt={userName} />
                <AvatarFallback className="rounded-lg">{fallbackInitial}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{userName}</span>
                <span className="truncate text-xs text-muted-foreground">{user.email}</span>
              </div>
              <MoreVerticalIcon className="ml-auto size-4 icon-more" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? 'bottom' : 'right'}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={avatarUrl} alt={userName} />
                  <AvatarFallback className="rounded-lg">{fallbackInitial}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{userName}</span>
                  <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem className="[&:hover_svg]:text-secondary">
                <UserCircleIcon />
                Konto
              </DropdownMenuItem>
              <DropdownMenuItem className="[&:hover_svg]:text-secondary">
                <CreditCardIcon />
                Hantera betalning
              </DropdownMenuItem>
              <DropdownMenuItem className="hover:bg-accent/15 [&:hover_svg]:text-secondary">
                <BellIcon />
                Notifications
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="cursor-pointer [&:hover_svg]:text-secondary"
            >
              <LogOutIcon />
              Logga ut
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
