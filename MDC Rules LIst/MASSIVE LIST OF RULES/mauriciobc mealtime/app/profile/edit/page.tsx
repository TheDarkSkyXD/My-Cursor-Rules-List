"use client";
import { useEffect, useState } from "react";
import { useUserContext } from "@/lib/context/UserContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { ImageUpload } from "@/components/ui/image-upload";

const profileSchema = z.object({
  full_name: z.string().min(2, "Nome obrigatório").max(100),
  username: z.string().min(3, "Username obrigatório").max(30),
  email: z.string().email("E-mail inválido"),
  avatar_url: z.string().url().optional().or(z.literal("")).nullable(),
  timezone: z.string().max(50).optional(),
});

type ProfileForm = z.infer<typeof profileSchema>;

export default function EditProfilePage() {
  const { state: { currentUser }, authLoading, refreshUser } = useUserContext();
  const [form, setForm] = useState<ProfileForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!currentUser || !currentUser.id) return;
    setLoading(true);
    setError(null);
    fetch(`/api/profile/${currentUser.id}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Erro ao buscar perfil");
        return res.json();
      })
      .then((data) => {
        setForm({
          full_name: data.full_name || "",
          username: data.username || "",
          email: data.email || "",
          avatar_url: data.avatar_url || "",
          timezone: data.timezone || "",
        });
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Erro ao carregar perfil");
        setLoading(false);
      });
  }, [currentUser]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => prev ? { ...prev, [e.target.name]: e.target.value } : prev);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form || !currentUser) return;
    setSaving(true);
    setError(null);
    setSuccess(false);
    const parsed = profileSchema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.errors[0]?.message || "Dados inválidos");
      setSaving(false);
      return;
    }
    try {
      const res = await fetch(`/api/profile/${currentUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Erro ao salvar perfil");
      setSuccess(true);
      await refreshUser();
      setTimeout(() => router.push("/profile"), 1200);
    } catch (err: any) {
      setError(err.message || "Erro ao salvar perfil");
    } finally {
      setSaving(false);
    }
  }

  if (authLoading || loading) {
    return (
      <div className="max-w-xl mx-auto py-6 px-2 animate-pulse">
        <div className="h-8 w-40 bg-muted rounded mb-4" />
        <div className="h-12 w-full bg-muted rounded mb-2" />
        <div className="h-12 w-full bg-muted rounded mb-2" />
        <div className="h-12 w-full bg-muted rounded mb-2" />
      </div>
    );
  }

  if (error) {
    return <div className="max-w-xl mx-auto py-6 px-2 text-destructive">{error}</div>;
  }

  if (!form) return null;

  return (
    <div className="max-w-xl mx-auto py-6 px-2">
      <Card>
        <CardContent className="py-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col items-center gap-2 mb-4">
              <ImageUpload
                value={form.avatar_url || ""}
                onChange={(url) => setForm((prev) => prev ? { ...prev, avatar_url: url } : prev)}
                type="user"
                userId={currentUser.id}
                className="w-20 h-20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Nome completo</label>
              <Input name="full_name" value={form.full_name} onChange={handleChange} required minLength={2} maxLength={100} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Username</label>
              <Input name="username" value={form.username} onChange={handleChange} required minLength={3} maxLength={30} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">E-mail</label>
              <Input name="email" value={form.email} onChange={handleChange} required type="email" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Fuso horário</label>
              <Input name="timezone" value={form.timezone} onChange={handleChange} />
            </div>
            <Button type="submit" disabled={saving} className="w-full mt-4">
              {saving ? "Salvando..." : "Salvar alterações"}
            </Button>
            {success && <div className="text-green-600 text-sm mt-2">Perfil atualizado com sucesso!</div>}
            {error && <div className="text-destructive text-sm mt-2">{error}</div>}
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 