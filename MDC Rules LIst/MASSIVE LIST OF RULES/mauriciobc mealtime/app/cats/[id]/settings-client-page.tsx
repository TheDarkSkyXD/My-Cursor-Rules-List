"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CatType } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GlobalLoading } from "@/components/ui/global-loading";
import { ImageUpload } from "@/components/ui/image-upload";
import { useUserContext } from "@/lib/context/UserContext";

interface SettingsClientPageProps {
  cat: CatType;
}

export default function SettingsClientPage({ cat }: SettingsClientPageProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const { state: userState } = useUserContext();
  const { currentUser, isLoading: isLoadingUser, error: errorUser } = userState;
  const [formData, setFormData] = useState({
    name: cat.name,
    breed: cat.breed || "",
    weight: cat.weight || "",
    feedingInterval: cat.feeding_interval || "",
    restrictions: cat.restrictions || "",
    photoUrl: cat.photo_url || "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePhotoChange = (url: string) => {
    setFormData(prev => ({
      ...prev,
      photoUrl: url
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`/api/cats/${cat.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          breed: formData.breed || null,
          weight: formData.weight ? parseFloat(formData.weight.toString()) : null,
          feeding_interval: formData.feedingInterval ? parseInt(formData.feedingInterval.toString()) : null,
          restrictions: formData.restrictions || null,
          photo_url: formData.photoUrl || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update cat settings");
      }

      toast.success("Configurações atualizadas com sucesso!");
      router.refresh();
    } catch (error: any) {
      console.error("Error updating cat settings:", error);
      toast.error(error.message || "Erro ao atualizar configurações");
    } finally {
      setIsLoading(false);
    }
  };

  if (!currentUser) {
    return <GlobalLoading mode="spinner" text="Carregando usuário..." />;
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader className="flex flex-row items-center gap-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={formData.photoUrl} alt={formData.name} />
            <AvatarFallback>{formData.name[0]}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle>{formData.name}</CardTitle>
            <p className="text-sm text-muted-foreground">Configurações</p>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="photo">Foto</Label>
              <ImageUpload
                type="cat"
                userId={currentUser.id}
                value={formData.photoUrl}
                onChange={handlePhotoChange}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                disabled={isLoading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="breed">Raça</Label>
              <Input
                id="breed"
                name="breed"
                value={formData.breed}
                onChange={handleInputChange}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="weight">Peso (kg)</Label>
              <Input
                id="weight"
                name="weight"
                type="number"
                step="0.1"
                value={formData.weight}
                onChange={handleInputChange}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="feedingInterval">Intervalo de Alimentação (horas)</Label>
              <Input
                id="feedingInterval"
                name="feedingInterval"
                type="number"
                min="1"
                max="24"
                value={formData.feedingInterval}
                onChange={handleInputChange}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="restrictions">Restrições Alimentares</Label>
              <Input
                id="restrictions"
                name="restrictions"
                value={formData.restrictions}
                onChange={handleInputChange}
                disabled={isLoading}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <GlobalLoading mode="spinner" size="sm" />
                  Salvando...
                </>
              ) : (
                "Salvar Alterações"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 