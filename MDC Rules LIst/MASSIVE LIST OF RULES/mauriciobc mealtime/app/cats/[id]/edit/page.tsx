"use client"

import { useState, useEffect, useCallback, use } from "react"
import { ArrowLeft, Calendar, Save, Trash2, Clock, AlertTriangle, Ban, Users, Cat, Loader2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
import PageTransition from "@/components/page-transition"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useRouter } from "next/navigation"
import { useCats } from "@/lib/context/CatsContext"
import { useUserContext } from "@/lib/context/UserContext"
import { useLoading } from "@/lib/context/LoadingContext"
import { toast } from "sonner"
import { format, isValid } from "date-fns"
import { parseISO } from "date-fns/parseISO"
import { CatType, Schedule } from "@/lib/types"
import { ImageUpload } from "@/components/ui/image-upload"
import { Loading } from "@/components/ui/loading"
import { v4 as uuidv4 } from 'uuid'
import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/page-header"
import { EmptyState } from "@/components/ui/empty-state"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar as CalendarIcon } from "@/components/ui/calendar"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { DateTimePicker } from "@/components/ui/datetime-picker"
import { resolveDateFnsLocale } from "@/lib/utils/dateFnsLocale"

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function EditCatPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const router = useRouter()
  const { state: catsState, dispatch: catsDispatch } = useCats()
  const { state: userState } = useUserContext()
  const { addLoadingOperation, removeLoadingOperation } = useLoading()
  const { cats, error: errorCats } = catsState
  const { currentUser, isLoading: isLoadingUser, error: errorUser } = userState
  const [cat, setCat] = useState<CatType | null>(null)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    name: "",
    birthdate: "",
    weight: "",
    restrictions: "",
    photoUrl: "",
    feedingInterval: "8",
    portion_size: "",
    notes: "",
  })

  const userLanguage = userState.currentUser?.preferences?.language;
  const userLocale = resolveDateFnsLocale(userLanguage);

  // Authentication effect
  useEffect(() => {
    if (!currentUser) {
      console.log("[EditCatPage] No currentUser found. Redirecting to login.");
      toast.error("Autenticação necessária para editar.");
      router.replace(`/login?callbackUrl=/cats/${resolvedParams.id}/edit`);
      return;
    }
  }, [currentUser, router, resolvedParams.id]);

  // Data loading effect
  useEffect(() => {
    if (!resolvedParams.id || !currentUser) {
      console.log("EditCatPage useEffect: params.id or currentUser not available yet, waiting.");
      return; 
    }

    if (catsState.isLoading) {
        console.log("EditCatPage useEffect: CatsContext still loading, waiting...");
        setIsLoadingData(true);
        return;
    }

    const catId = resolvedParams.id;
    const opId = `load-cat-edit-${catId}`;
    addLoadingOperation({ id: opId, priority: 1, description: "Loading cat data..." });
    setIsLoadingData(true);
    setError(null);

    console.log(`EditCatPage useEffect: Attempting to find cat ${catId} for user ${currentUser.id} (household: ${currentUser.householdId})`);
    console.log(`EditCatPage useEffect: Cats available in context: ${cats.length}`);
    const foundCat = cats.find(c => String(c.id) === catId);
    console.log(`EditCatPage useEffect: Found cat?`, foundCat ? foundCat.id : 'No');
      
    if (foundCat) {
      console.log(`EditCatPage useEffect: Checking household match: Cat=${foundCat.householdId}, User=${currentUser.householdId}`);
      if (String(foundCat.householdId) !== String(currentUser.householdId)) {
        console.warn(`EditCatPage useEffect: Household mismatch!`);
        setError("Você não tem permissão para editar este gato.");
        setCat(null);
      } else {
        console.log(`EditCatPage useEffect: Cat found and authorized. Setting data.`);
        setCat(foundCat);
        let formattedBirthdate = ""
        if (foundCat.birthdate) {
          try {
            const dateObj = typeof foundCat.birthdate === 'string' ? parseISO(foundCat.birthdate) : new Date(foundCat.birthdate)
            if (isValid(dateObj)) {
              formattedBirthdate = format(dateObj, "yyyy-MM-dd")
            } else {
              console.warn("Invalid birthdate format received:", foundCat.birthdate)
            }
          } catch (e) {
            console.error("Error parsing birthdate:", foundCat.birthdate, e)
          }
        }
        
        setFormData({
          name: foundCat.name,
          birthdate: formattedBirthdate,
          weight: foundCat.weight?.toString() || "",
          restrictions: foundCat.restrictions || "",
          photoUrl: foundCat.photo_url || "",
          feedingInterval: foundCat.feeding_interval !== undefined && foundCat.feeding_interval !== null ? String(foundCat.feeding_interval) : "8",
          portion_size: foundCat.portion_size?.toString() || "",
          notes: foundCat.notes || "",
        })
      }
    } else {
      console.warn(`EditCatPage useEffect: Cat ${catId} not found in CatsContext.`);
      setError("Gato não encontrado.");
      setCat(null);
    }
    setIsLoadingData(false);
    removeLoadingOperation(opId);
  }, [resolvedParams.id, currentUser, cats, catsState.isLoading, addLoadingOperation, removeLoadingOperation, userLocale]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }, [])
  
  const handlePhotoChange = useCallback((url: string) => {
    setFormData(prev => ({ ...prev, photoUrl: url }))
  }, [])
  
  const handleDelete = async () => {
    if (!cat || !currentUser?.householdId || String(cat.householdId) !== String(currentUser.householdId)) {
      toast.error("Não é possível excluir: Gato inválido ou permissão negada.")
      return
    }
    
    const opId = `delete-cat-${cat.id}`
    addLoadingOperation({ id: opId, priority: 1, description: `Deleting ${cat.name}...` })
    setIsDeleting(true)
    const previousCats = cats
    
    catsDispatch({ type: "REMOVE_CAT", payload: cat.id })
    
    try {
      const headers: HeadersInit = {};
      if (currentUser?.id) {
          headers['X-User-ID'] = currentUser.id;
      } else {
          toast.error("Erro de autenticação ao excluir.");
          throw new Error("User ID missing for delete request");
      }
      
      const response = await fetch(`/api/cats/${cat.id}`, { 
          method: 'DELETE',
          headers: headers
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to delete cat on server')
      }
      toast.success(`${cat.name} foi excluído com sucesso`)
      router.push("/cats")
    } catch (error: any) {
      console.error("Erro ao excluir gato:", error)
      toast.error(`Falha ao excluir gato: ${error.message}`)
      catsDispatch({ type: "FETCH_SUCCESS", payload: previousCats })
    } finally {
      setIsDeleting(false)
      removeLoadingOperation(opId)
    }
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (isLoadingData || isSubmitting || !cat || !currentUser?.householdId || String(cat.householdId) !== String(currentUser.householdId)) {
      toast.error("Não é possível salvar: Dados inválidos, carregando ou permissão negada.")
      return
    }
    
    const opId = `update-cat-${cat.id}`
    addLoadingOperation({ id: opId, priority: 1, description: `Saving ${formData.name}...` })
    setIsSubmitting(true)
    
    try {
      const updatedData: Partial<CatType> = {
        name: formData.name.trim(),
        photo_url: formData.photoUrl || null,
        birthdate: formData.birthdate ? new Date(formData.birthdate) : null,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        restrictions: formData.restrictions?.trim() || null,
        feeding_interval: formData.feedingInterval ? parseInt(formData.feedingInterval) : null,
        portion_size: formData.portion_size ? String(formData.portion_size) : null,
        notes: formData.notes?.trim() || null,
      }
      
      if (updatedData.feeding_interval !== null && (isNaN(updatedData.feeding_interval) || updatedData.feeding_interval < 1 || updatedData.feeding_interval > 24)) {
        toast.error("Intervalo de alimentação deve ser entre 1 e 24 horas.")
        setIsSubmitting(false)
        removeLoadingOperation(opId)
        return
      }

      console.log('Sending update request with data:', updatedData)
      
      // Add X-User-ID header
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };
      if (currentUser?.id) {
          headers['X-User-ID'] = currentUser.id;
      } else {
          toast.error("Erro de autenticação ao salvar.");
          throw new Error("User ID missing for update request");
      }
      
      const response = await fetch(`/api/cats/${cat.id}`, {
        method: 'PUT',
        headers: headers, // Use updated headers
        body: JSON.stringify(updatedData),
      })
      
      const responseData = await response.json()
      
      if (!response.ok) {
        console.error('Server response:', responseData)
        throw new Error(responseData.error || 'Failed to update cat on server')
      }
      
      console.log('Server response:', responseData)
      
      catsDispatch({
        type: "UPDATE_CAT",
        payload: responseData
      })
      
      toast.success(`${responseData.name} foi atualizado com sucesso`)
      router.push(`/cats/${cat.id}`)
    } catch (error: any) {
      console.error("Erro ao atualizar gato:", error)
      console.error("Stack trace:", error.stack)
      toast.error(error.message || "Algo deu errado. Por favor, tente novamente.")
    } finally {
      setIsSubmitting(false)
      removeLoadingOperation(opId)
    }
  }

  // All hooks are now declared, we can do conditional returns
  if (isLoadingUser) {
    return <Loading text="Verificando usuário..." />;
  }

  if (errorUser) {
    return (
      <PageTransition>
        <div className="p-4 text-center">
          <p className="text-destructive">Erro ao carregar dados do usuário: {errorUser}. Tente recarregar a página.</p>
          <Button onClick={() => router.back()} className="mt-4">Voltar</Button>
        </div>
      </PageTransition>
    );
  }

  if (!currentUser) {
    return <Loading text="Redirecionando para login..." />;
  }

  if (errorCats) {
    return (
      <PageTransition>
        <div className="p-4 text-center">
          <p className="text-destructive">Erro ao carregar lista de gatos: {errorCats}. Tente recarregar a página.</p>
          <Button onClick={() => router.back()} className="mt-4">Voltar</Button>
        </div>
      </PageTransition>
    );
  }
  
  if (isLoadingData && !error) {
    return <Loading text="Carregando dados do gato..." />;
  }

  if (error) {
    return (
      <PageTransition>
        <div className="p-4 text-center">
          <p className="text-destructive">{error}</p>
          <Button onClick={() => router.push('/cats')} className="mt-4">Voltar para Meus Gatos</Button>
        </div>
      </PageTransition>
    );
  }

  if (!cat) {
      return (
        <PageTransition>
          <div className="p-4 text-center">
            <p className="text-muted-foreground">Não foi possível carregar os dados do gato.</p>
            <Button onClick={() => router.push('/cats')} className="mt-4">Voltar para Meus Gatos</Button>
          </div>
        </PageTransition>
      );
  }
  
  return (
    <PageTransition>
      <div className="container max-w-md py-6 pb-28">
        <PageHeader title={`Editar ${cat.name || "Gato"}`} />
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="photoUrl">Foto</Label>
              <div className="w-64 aspect-square flex items-center justify-center">
                <ImageUpload
                  type="cat"
                  userId={currentUser.id}
                  value={formData.photoUrl || ''}
                  onChange={(url) => setFormData(prev => ({ ...prev, photoUrl: url }))}
                  maxSizeMB={50}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="birthdate">Data de Nascimento</Label>
              <DateTimePicker
                value={formData.birthdate ? new Date(formData.birthdate) : undefined}
                onChange={date => setFormData(prev => ({ ...prev, birthdate: date ? date.toISOString().split('T')[0] : "" }))}
                disabled={isSubmitting}
                locale={ptBR}
                yearRange={35}
                granularity="day"
                placeholder="Selecione uma data"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="weight">Peso (kg)</Label>
              <Input
                id="weight"
                type="number"
                step="0.01"
                value={formData.weight || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, weight: e.target.value }))}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="restrictions">Restrições Alimentares</Label>
              <Textarea
                id="restrictions"
                value={formData.restrictions || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, restrictions: e.target.value }))}
                placeholder="Alergias, intolerâncias..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="feedingInterval">Intervalo de Alimentação (horas)</Label>
              <Input
                id="feedingInterval"
                type="number"
                min="1"
                max="24"
                value={formData.feedingInterval || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, feedingInterval: e.target.value }))}
                placeholder="6"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="portion_size">Tamanho da Porção (gramas)</Label>
              <Input
                id="portion_size"
                type="number"
                step="0.1"
                value={formData.portion_size || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, portion_size: e.target.value }))}
                placeholder="0.0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={formData.notes || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Outras informações importantes..."
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Button
              type="submit"
              disabled={isSubmitting || isLoadingData}
              className="w-full"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar Alterações'
              )}
            </Button>

            <Button
              type="button"
              variant="destructive"
              disabled={isDeleting || isLoadingData}
              onClick={handleDelete}
              className="w-full"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Excluindo...
                </>
              ) : (
                'Excluir Gato'
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="w-full"
            >
              Cancelar
            </Button>
          </div>
        </form>
      </div>
    </PageTransition>
  );
}
