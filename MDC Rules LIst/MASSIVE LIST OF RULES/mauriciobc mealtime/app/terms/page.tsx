import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Termos de Uso | MealTime",
  description: "Termos de uso do MealTime",
};

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-3xl font-bold mb-6">Termos de Uso</h1>
      
      <div className="prose prose-slate dark:prose-invert max-w-none">
        <p className="text-lg mb-4">
          Última atualização: {new Date().toLocaleDateString('pt-BR')}
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">1. Aceitação dos Termos</h2>
          <p>
            Ao acessar e usar o MealTime, você concorda em cumprir e estar vinculado a estes Termos de Uso.
            Se você não concordar com qualquer parte destes termos, não poderá acessar o serviço.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">2. Uso do Serviço</h2>
          <p>
            O MealTime é uma plataforma para gerenciamento de refeições e planejamento alimentar.
            Você concorda em usar o serviço apenas para fins legais e de acordo com estes termos.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">3. Contas de Usuário</h2>
          <p>
            Para usar certas funcionalidades do serviço, você precisará criar uma conta.
            Você é responsável por manter a confidencialidade de sua conta e senha.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">4. Privacidade</h2>
          <p>
            Seu uso do MealTime também é regido por nossa Política de Privacidade.
            Para mais informações, consulte nossa <a href="/privacy" className="text-primary hover:underline">Política de Privacidade</a>.
          </p>
        </section>
      </div>
    </div>
  );
} 