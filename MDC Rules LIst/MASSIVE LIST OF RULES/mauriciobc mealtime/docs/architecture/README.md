# Arquitetura do MealTime

## Visão Geral
O MealTime é uma aplicação Next.js que utiliza uma arquitetura baseada em domínios para gerenciar alimentação de gatos.

## Estrutura de Diretórios
```
mealtime-app/
├── app/              # Rotas e páginas Next.js
├── components/       # Componentes React organizados por domínio
├── lib/             # Utilitários e lógica de negócio
├── types/           # Definições de tipos TypeScript
└── __tests__/       # Testes automatizados
```

## Domínios Principais
- Gatos (Cats)
- Alimentações (Feedings)
- Agendamentos (Schedules)
- Residências (Households)
- Notificações (Notifications)

## Tecnologias Principais
- Next.js 14
- React
- TypeScript
- Prisma
- TailwindCSS
- Shadcn UI

## Padrões de Projeto
- Context API para gerenciamento de estado
- Hooks personalizados para lógica reutilizável
- Componentes baseados em domínio
- API Routes para endpoints serverless 