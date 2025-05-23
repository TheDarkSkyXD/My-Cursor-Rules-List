'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getAgeString } from '@/lib/utils/dateUtils'

interface Cat {
  id: string
  name: string
  birthdate?: Date | null
  weight?: number | null
  householdId: string
  household: {
    id: string
    name: string
  }
  schedules: Array<{
    id: string
    type: string
    interval?: number
    times?: string[]
    enabled: boolean
  }>
  photoUrl?: string
}

interface CatDetailsProps {
  cat: Cat
}

export default function CatDetails({ cat }: CatDetailsProps) {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate a small delay to prevent flash of loading state
    const timer = setTimeout(() => setIsLoading(false), 300)
    return () => clearTimeout(timer)
  }, [])

  if (isLoading) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="flex flex-row items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <Skeleton className="h-8 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-40" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="flex flex-row items-center gap-4">
        <Avatar className="h-12 w-12">
          {cat.photoUrl ? (
            <AvatarImage src={cat.photoUrl} alt={cat.name} />
          ) : null}
          <AvatarFallback>{cat.name[0].toUpperCase()}</AvatarFallback>
        </Avatar>
        <CardTitle className="text-2xl font-bold">{cat.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="info">Informações</TabsTrigger>
            <TabsTrigger value="schedule">Agenda</TabsTrigger>
          </TabsList>
          
          <TabsContent value="info" className="space-y-4 mt-4">
            {cat.birthdate && (
              <div>
                <p className="font-semibold">Idade</p>
                <p className="text-gray-600">
                  {getAgeString(new Date(cat.birthdate))}
                </p>
              </div>
            )}
            {cat.weight && (
              <div>
                <p className="font-semibold">Peso</p>
                <p className="text-gray-600">{cat.weight} kg</p>
              </div>
            )}
            <div>
              <p className="font-semibold">Domicílio</p>
              <p className="text-gray-600">{cat.household.name}</p>
            </div>
          </TabsContent>

          <TabsContent value="schedule" className="mt-4">
            {cat.schedules.length > 0 ? (
              <div className="space-y-4">
                <p className="font-semibold">Agenda de Alimentação</p>
                <ul className="space-y-2">
                  {cat.schedules.map(schedule => (
                    <li key={schedule.id} className="text-gray-600 flex items-center justify-between">
                      <span>
                        {schedule.type === 'interval' 
                          ? `A cada ${schedule.interval} horas`
                          : schedule.times?.join(', ')}
                      </span>
                      {!schedule.enabled && (
                        <span className="text-sm text-gray-400">(desativado)</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-gray-600">Nenhuma agenda de alimentação definida</p>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
} 