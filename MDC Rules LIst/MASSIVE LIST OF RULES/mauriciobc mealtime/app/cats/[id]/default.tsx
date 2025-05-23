import { Suspense } from "react"
import { notFound, redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import CatDetails from "@/app/components/cat-details"
import { redirectionLogger } from "@/lib/monitoring/redirection-logger"
import PageTransition from "@/components/page-transition"
import { cookies } from "next/headers"
import { GlobalLoading } from "@/components/ui/global-loading"

interface PageProps {
  params: { id: string }
}

interface CatData {
  id: string
  name: string
  household_id: string
  photo_url?: string
  breed?: string
  birth_date?: string
  weight?: number
  portion_size?: number
  restrictions?: string
  notes?: string
  created_at?: string
  updated_at?: string
}

async function getCatData(id: string, userId: string): Promise<CatData | null> {
  try {
    const supabase = await createClient()
    
    console.log("[getCatData] Starting data fetch", { 
      id,
      userId,
      timestamp: new Date().toISOString()
    })
    
    // Fetch cat data with household info
    const { data: cat, error: catError } = await supabase
      .from('cats')
      .select(`
        id,
        name,
        household_id,
        photo_url,
        breed,
        birth_date,
        weight,
        portion_size,
        restrictions,
        notes,
        created_at,
        updated_at
      `)
      .eq('id', id)
      .single()

    if (catError) {
      console.error("[getCatData] Failed to fetch cat", { 
        id, 
        error: catError,
        timestamp: new Date().toISOString()
      })
      return null
    }

    if (!cat) {
      console.error("[getCatData] Cat not found", { 
        id,
        timestamp: new Date().toISOString()
      })
      return null
    }

    console.log("[getCatData] Cat found, checking membership", { 
      catId: cat.id,
      householdId: cat.household_id,
      timestamp: new Date().toISOString()
    })

    // Verify user has access to this cat's household
    const { data: membership, error: membershipError } = await supabase
      .from('household_members')
      .select('household_id')
      .eq('user_id', userId)
      .eq('household_id', cat.household_id)
      .maybeSingle()

    if (membershipError) {
      console.error("[getCatData] Error checking membership", { 
        userId,
        householdId: cat.household_id,
        error: membershipError,
        timestamp: new Date().toISOString()
      })
      return null
    }

    if (!membership) {
      console.error("[getCatData] User not authorized", { 
        userId,
        householdId: cat.household_id,
        timestamp: new Date().toISOString()
      })
      return null
    }

    console.log("[getCatData] Access verified, returning cat data", { 
      catId: cat.id,
      userId,
      timestamp: new Date().toISOString()
    })

    return cat
  } catch (error) {
    console.error("[getCatData] Unexpected error", { 
      id,
      userId,
      error,
      timestamp: new Date().toISOString()
    })
    return null
  }
}

export default async function DefaultCatPage({ params }: PageProps) {
  try {
    // Validate params first
    if (typeof params.id !== 'string' || !params.id) {
      console.error("[CatPage] Invalid params", { 
        params,
        timestamp: new Date().toISOString()
      })
      redirectionLogger.logNotFoundRedirection(`/cats/${params.id}`, undefined)
      notFound()
    }

    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      console.error("[CatPage] Auth error", { 
        error: authError,
        timestamp: new Date().toISOString()
      })
      redirect('/login')
    }

    if (!user) {
      console.error("[CatPage] No user found", { 
        timestamp: new Date().toISOString()
      })
      redirect('/login')
    }

    // Fetch data with authorization
    const cat = await getCatData(params.id, user.id)
    
    if (!cat) {
      console.error("[CatPage] Cat not found or not authorized", { 
        id: params.id,
        userId: user.id,
        timestamp: new Date().toISOString()
      })
      redirectionLogger.logNotFoundRedirection(`/cats/${params.id}`, user.id)
      notFound()
    }

    console.log("[CatPage] Successfully fetched cat data", {
      catId: cat.id,
      timestamp: new Date().toISOString()
    })

    // Render with suspense
    return (
      <PageTransition>
        <div className="flex-1 p-4">
          <Suspense fallback={
            <div className="flex items-center justify-center h-full">
              <GlobalLoading mode="spinner" text="Carregando..." />
            </div>
          }>
            <CatDetails params={{ id: cat.id }} />
          </Suspense>
        </div>
      </PageTransition>
    )
  } catch (error) {
    console.error("[CatPage] Unexpected error", { 
      error,
      timestamp: new Date().toISOString()
    })
    throw error // Let the error boundary handle it
  }
} 