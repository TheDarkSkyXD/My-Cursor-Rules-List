# Guia de Desenvolvimento

## Configuração do Ambiente

### Pré-requisitos
- Node.js 18+
- npm ou yarn
- PostgreSQL 14+

### Instalação
1. Clone o repositório
2. Instale as dependências: `npm install`
3. Configure as variáveis de ambiente: copie `.env.example` para `.env`
4. Execute as migrações: `npx prisma migrate dev`
5. Inicie o servidor: `npm run dev`

## Estrutura do Projeto
```
mealtime-app/
├── app/              # Rotas e páginas
├── components/       # Componentes React
│   ├── cats/        # Componentes relacionados a gatos
│   ├── feedings/    # Componentes de alimentação
│   ├── schedules/   # Componentes de agendamento
│   ├── households/  # Componentes de residências
│   └── ui/          # Componentes de UI reutilizáveis
├── lib/             # Utilitários e lógica
├── types/           # Tipos TypeScript
└── __tests__/       # Testes
```

## Padrões de Código
- Use TypeScript para todo código novo
- Siga as convenções do ESLint/Prettier
- Mantenha componentes pequenos e focados
- Use hooks personalizados para lógica reutilizável
- Documente funções e tipos complexos

## Testes
- Execute `npm test` para rodar os testes
- Mantenha cobertura de testes acima de 80%
- Use `jest` e `@testing-library/react`

## Commits
- Use commits semânticos
- Mantenha commits pequenos e focados
- Inclua testes relevantes

## Deploy
- Staging: push para `develop`
- Produção: merge para `main`
- CI/CD via GitHub Actions 