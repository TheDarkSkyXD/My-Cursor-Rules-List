# API do MealTime

## Endpoints

### Autenticação
- `POST /api/auth/signin` - Login de usuário
- `POST /api/auth/signout` - Logout de usuário
- `POST /api/auth/signup` - Registro de novo usuário

### Gatos
- `GET /api/cats` - Lista todos os gatos
- `POST /api/cats` - Cria novo gato
- `GET /api/cats/:id` - Obtém detalhes de um gato
- `PUT /api/cats/:id` - Atualiza um gato
- `DELETE /api/cats/:id` - Remove um gato

### Alimentações
- `GET /api/feedings` - Lista alimentações
- `POST /api/feedings` - Registra nova alimentação
- `GET /api/feedings/:id` - Obtém detalhes de alimentação
- `PUT /api/feedings/:id` - Atualiza alimentação
- `DELETE /api/feedings/:id` - Remove alimentação

### Agendamentos
- `GET /api/schedules` - Lista agendamentos
- `POST /api/schedules` - Cria novo agendamento
- `GET /api/schedules/:id` - Obtém detalhes de agendamento
- `PUT /api/schedules/:id` - Atualiza agendamento
- `DELETE /api/schedules/:id` - Remove agendamento

### Residências
- `GET /api/households` - Lista residências
- `POST /api/households` - Cria nova residência
- `GET /api/households/:id` - Obtém detalhes de residência
- `PUT /api/households/:id` - Atualiza residência
- `DELETE /api/households/:id` - Remove residência

### Notificações
- `POST /api/notifications/subscribe` - Inscreve para notificações
- `POST /api/notifications/unsubscribe` - Cancela inscrição de notificações
- `GET /api/notifications` - Lista notificações do usuário 