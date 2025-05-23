// "use client"

// import { useState, useEffect, use } from "react"
// import { useRouter, notFound } from "next/navigation"
// import { AnimatedButton } from "@/components/ui/animated-button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
// import { Switch } from "@/components/ui/switch"
import { ArrowLeft, Bell, Trash2 } from "lucide-react"
import Link from "next/link"
// import { useToast } from "@/components/ui/use-toast"
// import { catProfiles, getCatById } from "@/lib/data"
import { getCatByIdServer } from "@/lib/data/server"
import BottomNav from "@/components/bottom-nav"
// import PageTransition from "@/components/page-transition"
// import { motion } from "framer-motion"
// import AnimatedIcon from "@/components/animated-icon"
import { GlobalLoading } from "@/components/ui/global-loading"
import { BaseCat, ID } from "@/lib/types/common"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
// import { Badge } from "@/components/ui/badge"
// import { ScrollArea } from "@/components/ui/scroll-area"
// import { formatDistanceToNow } from "date-fns"
import { Button } from "@/components/ui/button"
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/utils/supabase/server"
// import { cookies } from "next/headers"
import prisma from "@/lib/prisma"
import { notFound } from 'next/navigation';

// TODO: Define SettingsClientPage component later
// import SettingsClientPage from './settings-client-page'; 

// Remove old interfaces if BaseCat/CatType cover needs
/*
interface PageProps {
  params: Promise<{ id: string }>;
}

interface Cat extends BaseCat {
  avatar: string;
  regularAmount: string;
  foodUnit: string;
  feedingInterval: number;
  lastFed: string;
  feedingHistory: {
    time: string;
    amount: string;
  }[];
}
*/

export default async function CatSettingsPage({ params }: { params: { id: string } }) {
  // const cookieStore = cookies()
  // const supabase = createClient(cookieStore)
  const supabase = await createClient()
  const { data: { user: supabaseUser }, error: authError } = await supabase.auth.getUser()

  if (authError || !supabaseUser) {
    console.error("CatSettingsPage: Unauthorized access attempt.")
    notFound()
  }

  // const cat = await getCatById(parseInt(params.id))
  const cat = await getCatByIdServer(parseInt(params.id))

  if (!cat) {
    notFound()
  }

  // Fix: Use the correct Prisma model (profiles) and field (id)
  const prismaProfile = await prisma.profiles.findUnique({
    where: { id: supabaseUser.id },
    select: { household_members: { select: { household_id: true } } }
  })

  // Extract householdId from the first household_members entry (if any)
  const householdId = prismaProfile?.household_members?.[0]?.household_id

  if (!prismaProfile || !householdId || householdId !== cat.householdId) {
    console.error(`CatSettingsPage: User ${supabaseUser.id} (household ${householdId}) unauthorized attempt to access cat ${cat.id} (household ${cat.householdId}).`)
    notFound()
  }

  // --- UI Rendering will be moved to SettingsClientPage ---
  // For now, return basic structure or placeholder
  return (
    <div>
       <h1>Cat Settings Server Component (ID: {params.id})</h1>
       <p>User: {supabaseUser.email}</p>
       <p>Cat: {cat?.name}</p>
       {/* <SettingsClientPage cat={cat} /> */}
       <p>TODO: Implement SettingsClientPage component</p>
       <BottomNav />
    </div>
  )
  // --- Original rendering below (commented out for now) ---
  /*
  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader className="flex flex-row items-center gap-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={cat.photoUrl} alt={cat.name} />
            <AvatarFallback>{cat.name[0]}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle>{cat.name}</CardTitle>
            <p className="text-sm text-muted-foreground">Settings</p>
          </div>
        </CardHeader>
        <CardContent>
          <form className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" defaultValue={cat.name} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="breed">Breed</Label>
              <Input id="breed" defaultValue={cat.breed} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="weight">Weight (kg)</Label>
              <Input id="weight" type="number" step="0.1" defaultValue={cat.weight} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="feedingInterval">Feeding Interval (hours)</Label>
              <Input id="feedingInterval" type="number" defaultValue={cat.feedingInterval} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="restrictions">Dietary Restrictions</Label>
              <Input id="restrictions" defaultValue={cat.restrictions} />
            </div>
            <Button type="submit" className="w-full">Save Changes</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
  */
}

