import { useState } from "react"
import { useRouter } from "next/navigation"
import { Household, Pet } from "@/lib/types"
import { useHousehold } from "@/lib/context/HouseholdContext"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { EmptyState } from "@/components/ui/empty-state"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Cat, MoreVertical, Pencil, Trash } from "lucide-react"
import { toast } from "sonner"

interface HouseholdPetsProps {
  household: Household
}

export function HouseholdPets({ household }: HouseholdPetsProps) {
  const router = useRouter()
  const { updateHousehold } = useHousehold()
  const [isLoading, setIsLoading] = useState(false)

  const handleAddPet = () => {
    router.push(`/households/${household.id}/pets/new`)
  }

  const handleEditPet = (petId: string) => {
    router.push(`/households/${household.id}/pets/${petId}/edit`)
  }

  const handleDeletePet = async (petId: string) => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/households/${household.id}/pets/${petId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete pet")
      }

      const updatedHousehold = await response.json()
      updateHousehold(updatedHousehold)
      toast.success("Pet deleted successfully")
    } catch (error) {
      toast.error("Failed to delete pet")
    } finally {
      setIsLoading(false)
    }
  }

  if (!household.pets?.length) {
    return (
      <EmptyState
        icon={<Cat className="w-12 h-12" />}
        title="No pets yet"
        description="Add your pets to keep track of their schedules and needs"
        action={
          <Button onClick={handleAddPet}>
            <Cat className="w-4 h-4 mr-2" />
            Add Pet
          </Button>
        }
      />
    )
  }

  return (
    <div className="space-y-4">
      <Button onClick={handleAddPet}>
        <Cat className="w-4 h-4 mr-2" />
        Add Pet
      </Button>
      
      {household.pets.map((pet) => (
        <Card key={pet.id}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Avatar>
                  <AvatarImage src={pet.image} />
                  <AvatarFallback>{pet.name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-base">{pet.name}</CardTitle>
                  <CardDescription>{pet.breed}</CardDescription>
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleEditPet(pet.id)}>
                    <Pencil className="w-4 h-4 mr-2" />
                    Edit Pet
                  </DropdownMenuItem>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                        <Trash className="w-4 h-4 mr-2" />
                        Delete Pet
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete pet</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this pet? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeletePet(pet.id)}
                          disabled={isLoading}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
} 