# Checklist de Melhorias - Página de Configurações

## Backend e Dados
- [x] Implementar persistência de dados no backend
  - [x] Criar rota de API para configurações
  - [x] Implementar GET para buscar configurações
  - [x] Implementar PUT para atualizar configurações
  - [x] Integrar com o frontend
  - [x] Adicionar tratamento de erros básico
- [x] Adicionar validação robusta de dados
  - [x] Criar schema de validação com Zod
  - [x] Implementar validações específicas para cada campo
  - [x] Adicionar validação de timezone e idioma
  - [x] Integrar validações no backend
  - [x] Atualizar frontend para lidar com erros de validação
- [ ] Implementar tratamento de erros
- [ ] Implementar cache de configurações

## UX/UI
- [ ] Adicionar confirmações para ações críticas
- [ ] Melhorar feedback visual durante operações
- [ ] Adicionar suporte a temas personalizados

## Qualidade
- [ ] Adicionar testes unitários
- [ ] Adicionar testes de integração
- [ ] Implementar monitoramento de erros

## Documentação
- [ ] Atualizar documentação da API
- [ ] Adicionar comentários no código
- [ ] Criar guia de contribuição

## Segurança
- [ ] Implementar rate limiting
- [ ] Adicionar validação de permissões
- [ ] Implementar auditoria de mudanças

## Gerenciamento de Imagens
- [x] Implementar sistema de otimização de imagens
  - [x] Configurar Sharp para processamento de imagens
    - [x] Instalar dependência: `npm install sharp`
    - [x] Criar utilitário em `src/lib/image-processing.ts`
    - [x] Implementar funções de redimensionamento e otimização
  - [x] Definir padrões de tamanho
    - [x] Perfil de usuário: 400x400px
    - [x] Perfil de gato: 300x300px
    - [x] Thumbnails: 150x150px
  - [x] Configurar limites de upload
    - [x] Tamanho máximo: 5MB
    - [x] Formatos permitidos: JPG, PNG, WebP
  - [x] Implementar validação de imagens
    - [x] Verificar dimensões mínimas
    - [x] Validar tipos MIME
    - [x] Detectar imagens corrompidas
- [x] Configurar armazenamento
  - [x] Criar estrutura de pastas organizada
    - [x] `/public/profiles/humans/`
    - [x] `/public/profiles/cats/`
    - [x] `/public/profiles/thumbnails/`
  - [x] Implementar sistema de nomes de arquivo únicos
  - [x] Configurar limpeza automática de arquivos temporários
- [x] Atualizar componentes existentes
  - [x] Modificar `src/components/ProfileImage.tsx`
  - [x] Atualizar `src/components/CatProfile.tsx`
  - [x] Implementar lazy loading de imagens
  - [x] Adicionar placeholders durante carregamento
- [x] Implementar cache de imagens
  - [x] Configurar cache no servidor
  - [x] Implementar cache no cliente
  - [x] Definir políticas de expiração
- [x] Adicionar tratamento de erros
  - [x] Implementar fallback para imagens quebradas
  - [x] Adicionar mensagens de erro amigáveis
  - [x] Implementar retry mechanism para uploads falhos
- [x] Documentação
  - [x] Criar guia de uso do sistema de imagens
  - [x] Documentar limites e restrições
  - [x] Adicionar exemplos de implementação
  - [ ] Adicionar diagramas de fluxo
  - [ ] Criar guia de contribuição específico para o sistema de imagens
  - [ ] Documentar procedimentos de backup e recuperação
  - [ ] Adicionar exemplos de casos de uso específicos

## PWA (Progressive Web App)
- [ ] Configurar manifest.json
  - [ ] Criar arquivo em `/public/manifest.json`
  - [ ] Definir metadados básicos
    - [ ] Nome e nome curto do app
    - [ ] Descrição
    - [ ] Cores de tema e fundo
    - [ ] URL inicial
  - [ ] Configurar ícones
    - [ ] Gerar ícones em múltiplos tamanhos (192x192, 512x512)
    - [ ] Adicionar ícones no manifest
    - [ ] Configurar máscaras de ícone para iOS
  - [ ] Adicionar link no `app/layout.tsx`
    ```tsx
    <link rel="manifest" href="/manifest.json" />
    ```

- [ ] Implementar Service Worker
  - [ ] Criar arquivo em `/public/sw.js`
  - [ ] Configurar cache de assets
    - [ ] Definir estratégia de cache (Cache First para assets estáticos)
    - [ ] Listar recursos para cache
    - [ ] Implementar atualização de cache
  - [ ] Adicionar registro no `app/layout.tsx`
    ```tsx
    useEffect(() => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
          .then(registration => console.log('SW registered:', registration))
          .catch(error => console.log('SW registration failed:', error));
      }
    }, []);
    ```

- [ ] Otimizar para PWA
  - [ ] Configurar meta tags no `app/layout.tsx`
    ```tsx
    <meta name="theme-color" content="#000000" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    <meta name="apple-mobile-web-app-title" content="MealTime" />
    ```
  - [ ] Implementar fallback offline
    - [ ] Criar página offline em `/app/offline/page.tsx`
    - [ ] Configurar service worker para servir página offline
  - [ ] Otimizar performance
    - [ ] Implementar lazy loading de componentes
    - [ ] Configurar cache de rotas
    - [ ] Otimizar carregamento de imagens

- [ ] Testar e Validar
  - [ ] Verificar Lighthouse score
  - [ ] Testar instalação em diferentes dispositivos
  - [ ] Validar funcionamento offline
  - [ ] Testar atualizações de cache
  - [ ] Verificar compatibilidade cross-browser

- [ ] Documentação
  - [ ] Criar guia de desenvolvimento PWA
  - [ ] Documentar processo de atualização
  - [ ] Adicionar instruções de debug
  - [ ] Criar checklist de validação 

# User profile

## Objetivo
Desenvolver uma página de perfil de usuário com uma seção fixa no topo (Avatar e Nome Completo) e três abas:
1. Informações adicionais (Username, e-mail, data de cadastro)
2. Lares (lista de lares, quantidade de gatos e membros)
3. Meus Gatos (lista de gatos do usuário, peso atual e último horário de alimentação)
A página deve ter botão de editar e uma rota/página separada para edição dos dados do usuário.

---

## Passo a Passo para Desenvolvimento

### 1. Planejamento e Estrutura
- [x] Ler o schema do Prisma para entender os campos do usuário, lares e gatos.
- [x] Definir a estrutura dos dados necessários para cada aba.
- [x] Esboçar o layout da página (wireframe simples).

### 2. Backend/API
- [x] Criar endpoint GET `/api/profile/[id|username]` para buscar dados completos do usuário (incluindo lares e gatos).
- [x] Criar endpoint PUT `/api/profile/[id|username]` para editar dados do usuário.
- [x] Garantir autenticação/autorização nas rotas. (IMPORTANTE: Não alterar a implementação atual de autenticação!!)
- [x] Incluir dados relacionados: lares (com membros e gatos), gatos (com peso e último feeding).

### 3. Frontend - Página de Perfil
- [x] Criar página `/profile/[id|username]`.
- [x] Implementar seção fixa no topo com Avatar e Nome Completo.
- [x] Adicionar botão "Editar perfil" (leva para `/profile/edit`).
- [ ] Implementar tabs usando componentes do shadcn/ui:
    - [x] Aba 1: Informações adicionais (Username, e-mail, data de cadastro)
    - [x] Aba 2: Lares (listar lares, mostrar quantidade de gatos e membros de cada lar)
    - [x] Aba 3: Meus Gatos (listar gatos, mostrar peso atual e último horário de alimentação)
- [x] Garantir responsividade e acessibilidade.

### 4. Frontend - Página de Edição
- [x] Criar página `/profile/edit`.
- [x] Implementar formulário para editar Avatar, Nome Completo, Username, e-mail e fuso horário. (usar o mesmo componente de upload de imagens da página '/cats/new')
- [x] Validar dados no frontend (usar Zod se possível).
- [x] Enviar dados para o endpoint PUT.
- [x] Exibir feedback de sucesso/erro.

### 5. Integração e Testes
- [x] Integrar frontend com endpoints do backend.
- [ ] Testar fluxo de exibição e edição do perfil.
- [ ] Adicionar testes unitários e de integração (quando possível).

### 6. UX/UI
- [x] Usar componentes do shadcn/ui e Tailwind para layout e tabs.
- [x] Adicionar feedback visual (loading, sucesso, erro).
- [x] Aplicar animações do Framer para criar impacto visual.
- [x] Garantir que a seção fixa do topo permaneça visível ao trocar de abas.
- [x] Permitir upload e alteração do avatar do usuário na edição de perfil.

### 7. Documentação
- [ ] Documentar endpoints criados/alterados.
- [ ] Adicionar comentários no código para facilitar manutenção.
- [ ] Atualizar README ou documentação interna sobre o fluxo de perfil de usuário.

---

## Dicas para Desenvolvedor Júnior
- Sempre comece pelo backend: garanta que os dados necessários estão disponíveis.
- Use mocks/fake data no frontend enquanto a API não estiver pronta.
- Teste cada parte separadamente antes de integrar tudo.
- Peça revisão de código e feedbacks frequentes.
- Documente dúvidas e decisões tomadas durante o desenvolvimento.

# Backend Listener for Scheduled Notifications (pg_notify)

## Objetivo
Implementar um serviço backend que escuta eventos pg_notify no canal 'send-scheduled-notifications' do Postgres, permitindo entrega instantânea de notificações agendadas.

## Checklist
- [ ] Planejamento
  - [x] Definir objetivo e arquitetura do listener
  - [x] Escolher tecnologia (Node.js + pg)
  - [x] Definir método de entrega (chamar Edge Function ou inserir direto na tabela notifications)
- [ ] Implementação
  - [ ] Adicionar script Node.js ao projeto existente (ex: `scripts/pg_notify_listener.js`)
  - [ ] Instalar dependências necessárias (`pg`, `dotenv`) se ainda não estiverem presentes
  - [ ] Utilizar variáveis de ambiente já existentes (.env compartilhado)
  - [ ] Implementar conexão segura com o banco (usar service role key)
  - [ ] Implementar lógica de LISTEN no canal 'send-scheduled-notifications'
  - [ ] Parsear payload JSON recebido
  - [ ] Chamar função de entrega (Edge Function via HTTP OU inserir na tabela notifications)
  - [ ] Adicionar tratamento de erros e reconexão automática
  - [ ] Adicionar logs para monitoramento
  - [ ] Adicionar instruções para rodar o script como processo separado (ex: `node scripts/pg_notify_listener.js`)
- [ ] Deploy
  - [ ] Escolher ambiente de execução (VM, container, serverless, etc.)
  - [ ] Configurar variáveis de ambiente seguras
  - [ ] Garantir execução contínua e reinício automático em caso de falha
- [ ] Documentação
  - [ ] Documentar arquitetura e fluxo do listener
  - [ ] Adicionar instruções de deploy e variáveis de ambiente
  - [ ] Atualizar diagramas de arquitetura (se aplicável)
  - [ ] Incluir exemplos de logs e troubleshooting
