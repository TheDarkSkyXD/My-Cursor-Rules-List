// "use client"

// import { useState, useEffect } from "react"
// import { useParams, useRouter, notFound } from "next/navigation"
// import { AnimatedButton } from "@/components/ui/animated-button"
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
// import { ArrowLeft } from "lucide-react"
// import Link from "next/link"
// import { catProfiles, getCatById } from "@/lib/data"
import { getCatByIdServer } from "@/lib/data/server"
import BottomNav from "@/components/bottom-nav"
// import PageTransition from "@/components/page-transition"
// import { motion } from "framer-motion"
// import AnimatedList from "@/components/animated-list"
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
// import { Badge } from "@/components/ui/badge"
// import { ScrollArea } from "@/components/ui/scroll-area"
// import { formatDistanceToNow } from "date-fns"
import { createClient } from "@/utils/supabase/server";
// import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { notFound } from 'next/navigation';
import { GlobalLoading } from '@/components/ui/global-loading';

// TODO: Define the CatHistoryClient component later
// import CatHistoryClient from './CatHistoryClient'; 

export default async function CatHistoryPage({ params }: { params: { id: string } }) {
  // const cookieStore = cookies();
  // const supabase = createClient(cookieStore);
  const supabase = await createClient();
  const { data: { user: supabaseUser }, error: authError } = await supabase.auth.getUser();

  if (authError || !supabaseUser) {
    console.error("CatHistoryPage: Unauthorized access attempt.");
    notFound();
  }

  const cat = await getCatByIdServer(parseInt(params.id))

  if (!cat) {
    notFound()
  }

  const prismaUser = await prisma.profiles.findUnique({
    where: { id: supabaseUser.id },
    select: { household_members: { select: { household_id: true } } }
  });

  const householdId = prismaUser?.household_members[0]?.household_id;

  if (!prismaUser || !householdId || householdId !== cat.householdId) {
    console.error(`CatHistoryPage: User ${supabaseUser.id} (household ${householdId}) unauthorized attempt to access history for cat ${cat.id} (household ${cat.householdId}).`);
    notFound();
  }

  return (
    <div>
       <h1>Cat History Server Component (ID: {params.id})</h1>
       <p>User: {supabaseUser.email}</p>
       <p>Cat: {cat?.name}</p>
       {/* <CatHistoryClient cat={cat} /> */}
       <p>TODO: Implement CatHistoryClient component</p>
       <BottomNav />
    </div>
  )
}

