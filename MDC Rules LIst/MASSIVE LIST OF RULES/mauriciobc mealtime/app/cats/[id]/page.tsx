import { Suspense } from 'react'
import CatDetails from '@/components/cat/details'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import prisma from '@/lib/prisma'
import { Button } from '@/components/ui/button'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { GlobalLoading } from '@/components/ui/global-loading'
import { validate as validateUUID } from 'uuid'

interface PageProps {
  params: Promise<{ id: string }> | { id: string }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params
  const cat = await getCat(resolvedParams.id)
  if (!cat) return { title: 'Gato não encontrado' }
  return { title: cat.name }
}

export default async function CatPage({ params }: PageProps) {
  const resolvedParams = await params
  const cat = await getCat(resolvedParams.id)
  if (!cat) notFound()

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between px-4 py-4 border-b">
        <div className="flex items-center gap-4">
          <Link href="/cats">
            <Button variant="ghost" size="icon">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-semibold">Detalhes do gato</h1>
        </div>
      </div>
      <Suspense fallback={<GlobalLoading mode="spinner" text="Carregando detalhes do gato..." />}>
        <CatDetails cat={cat} />
      </Suspense>
    </div>
  )
}

async function getCat(id: string) {
  if (!validateUUID(id)) {
    return null;
  }
  const cat = await prisma.cats.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      birth_date: true,
      weight: true,
      household_id: true,
      owner_id: true,
      created_at: true,
      updated_at: true,
      photo_url: true,
      household: {
        select: {
          id: true,
          name: true
        }
      },
      schedules: {
        select: {
          id: true,
          type: true,
          interval: true,
          times: true,
          enabled: true
        }
      }
    }
  })

  if (!cat) return null

  // Transform the data to match the expected format
  return {
    ...cat,
    birthdate: cat.birth_date,
    householdId: cat.household_id,
    createdAt: cat.created_at,
    updatedAt: cat.updated_at,
    weight: Number(cat.weight), // Convert Decimal to number
    photoUrl: cat.photo_url || null
  }
}
