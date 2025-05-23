# [CollabX](https://collabx.app) - Real-time Collaborative Text Editor

CollabX is a real-time collaborative text editor that allows multiple users to edit text and code together in real-time. This project is ***vibe coded*** with [Cursor](https://www.cursor.com/) AI Code Editor, exploring how modern AI tools can accelerate & transform development building production-ready apps. 

## ⭐️ Demo

Visit [CollabX](https://collabx.app) for a quick demo.

## 🎯 App Background

This app began as an exploration with [Replit](https://replit.com/), initial output of which was fed to Cursor as I personally liked Cursor better. A detailed write-up of my experience with Replit, Cursor & Lovable while building this app is documented [here](https://medium.com/@jiteshy/real-app-the-same-prompt-3-ai-coding-assistants-1-winner-71e58234da99). 

After the initial lift from Replit, the app is entirely built with Cursor in my spare time over the course of 10 days. The coding assistant helped

- Create rapid feature prototypes
- Tackle the complexities of real-time data synchronization
- Setup websocket communication
- Add security guardrails e.g. rate limiting
- Deliver a robust application ready for production environments

## ✨ Key Features

- **Seamless Real-time Collaboration**: Edit text and code with multiple participants simultaneously
- **Frictionless Entry**: Quick access through automatic random username generation
- **Sessions & Users**: Track who's in the session with clear indicators
- **Intuitive Session Sharing**: Join sessions via unique URL links
- **Activity Visualization**: See other users typing status in real time
- **Synchronized Language Settings**: Language changes reflect instantly across all connected users
- **Flexible Capacity Management**: User limits in a session (currently 5) with read-only fallback option
- **Guardrails**: Rate limiting safeguards against excessive requests
- **Resilient Connections**: Automatic recovery from network interruptions
- **Dark Theme**: Toggle between dark and light themes (dark mode as default)

## 🛠️ Tech Stack

- **Frontend**: Next.js, TypeScript, Tailwind CSS, Monaco Editor, Zustand
- **Backend**: NestJS, TypeScript, Socket.IO
- **Shared**: TypeScript
- **State Management**: Zustand
- **UI Framework/Libraries**: Tailwind CSS, shadcn/ui
- **Data Storage**: Redis for session storage and rate limiting
- **Development Accelerator**: Cursor AI, Replit

## 📁 Project Structure

```
collabx/
├── packages/
│   ├── frontend/     # Next.js frontend application
│   ├── backend/      # NestJS backend server
│   └── shared/       # Shared types and utilities
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- pnpm
- Redis (for session management and rate limiting)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/jiteshy/collabx.git
cd collabx
```

2. Install dependencies:
```bash
pnpm install
```

3. Configure environment variables:
```bash
# Copy the example env files
cp packages/backend/.env.example packages/backend/.env
cp packages/frontend/.env.example packages/frontend/.env
```

4. Launch development servers:
```bash
# Start both frontend and backend
pnpm dev
```

Access the application at:
- Frontend: http://localhost:3000
- Backend: http://localhost:3001

## 🧪 Development Workflow

### Running Tests

```bash
# Run all tests
pnpm test

# Run frontend tests
pnpm --filter @collabx/frontend test

# Run backend tests
pnpm --filter @collabx/backend test

# Run shared tests
pnpm --filter @collabx/shared test
```

### Building for Production

```bash
# Build all packages
pnpm build

# Build specific packages
pnpm --filter @collabx/frontend build
pnpm --filter @collabx/backend build:ncc
```

## 🔒 Security Best Practices

When deploying to production:

1. Configure strict CORS origin values via environment variables
2. Adjust rate limiting parameters based on expected usage patterns
3. Set appropriate MAX_USERS_PER_SESSION limits
4. Optimize Redis TTL & cleanup configuration for production environments

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- [Cursor](https://cursor.com/) & [Replit](https://replit.com/) for AI-assisted development
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) for the code editor
- [Socket.IO](https://socket.io/) for real-time communication
- [Tailwind CSS](https://tailwindcss.com/) & [shadcn](https://ui.shadcn.com/) for styling
