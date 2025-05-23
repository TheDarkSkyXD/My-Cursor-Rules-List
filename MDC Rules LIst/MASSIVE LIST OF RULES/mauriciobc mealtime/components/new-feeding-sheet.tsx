import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  setIsLoading(true);

  try {
    const response = await fetch("/api/feedings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        catId,
        date,
        time,
        food,
        amount,
        notes,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to create feeding sheet");
    }

    toast.success("Alimentação registrada com sucesso");
    router.push(`/cats/${catId}`);
  } catch (error) {
    console.error(error);
    toast.error("Erro ao registrar alimentação");
  } finally {
    setIsLoading(false);
  }
}; 