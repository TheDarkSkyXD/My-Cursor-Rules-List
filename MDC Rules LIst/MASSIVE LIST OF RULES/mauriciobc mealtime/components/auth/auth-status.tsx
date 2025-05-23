"use client";

import { useRouter } from 'next/navigation';
import { useUserContext } from "@/lib/context/UserContext";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User as UserIcon, LogOut, Settings } from "lucide-react";
import Link from "next/link";

export function AuthStatus() {
  const router = useRouter();
  const { state: { currentUser, isLoading }, signOut } = useUserContext();

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/');
      router.refresh();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  if (isLoading) {
    return <div className="animate-pulse h-8 w-8 rounded-full bg-muted"></div>;
  }

  if (!currentUser) {
    return (
      <Button variant="outline" size="sm" asChild>
        <Link href="/login">Entrar</Link>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={currentUser.avatar || undefined} alt={currentUser.name} />
            <AvatarFallback>
              <UserIcon className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <div className="flex items-center justify-start gap-2 p-2">
          <div className="flex flex-col space-y-1 leading-none">
            {currentUser.name && (
              <p className="font-medium">{currentUser.name}</p>
            )}
            {currentUser.email && (
              <p className="w-[200px] truncate text-sm text-muted-foreground">
                {currentUser.email}
              </p>
            )}
          </div>
        </div>
        <DropdownMenuItem asChild>
          <Link href="/settings">
            <Settings className="mr-2 h-4 w-4" />
            <span>Configurações</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sair</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 