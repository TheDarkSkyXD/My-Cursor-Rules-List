# MealTime App Development Plan

## Project Overview
**App Name:** MealTime  
**Category:** Pet Care, Home Management  
**Tech Stack:** Next.js, TypeScript, Shadcn UI, Radix UI, Framer Motion, Prisma, SQLite  
**Objetivo:** Build a web application to streamline cat feeding routines with collaborative features, configurable schedules, and analytics.

---

## Development Phases

### Phase 1: Project Setup & Architecture
**Duration:** 1 Week  
**Goals:** Establish project structure, tools, and initial configurations.

#### Tasks
1. **Environment Setup**
   - Initialize Next.js project with TypeScript: `npx create-next-app@latest mealtime --typescript`
   - Set up a Git repository for version control: `git init && git add . && git commit -m "Initial commit"`
   - Configure ESLint and Prettier for code quality
   - Setup Tailwind CSS (included with Next.js setup)
2. **Project Structure**
   - **Next.js Project:**
     - `/app` (App router structure)
       - `/api` (API routes)
       - `/components` (reusable UI components)
         - `/ui` (shadcn components)
       - `/lib` (utility functions)
       - `/hooks` (custom React hooks)
       - `/providers` (context providers)
       - `/styles` (global styles)
       - `/public` (static assets)
3. **Database Setup**
   - Initialize Prisma: `npx prisma init`
   - Configure SQLite in `.env`: `DATABASE_URL="file:./dev.db"`
   - Define Prisma schema and run migrations: `npx prisma migrate dev`
4. **Dependencies**
   - Install Shadcn UI: `npx shadcn-ui@latest init`
   - UI dependencies:
     ```bash
     npm install framer-motion
     npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-slider
     ```
   - Auth: `npm install next-auth`
   - Database: `npm install prisma @prisma/client`
   - Data Fetching: `npm install @tanstack/react-query`
   - Forms: `npm install react-hook-form zod @hookform/resolvers`
   - Charts: `npm install chart.js react-chartjs-2`
   - Real-time: `npm install socket.io-client`

#### Deliverables
- Initialized Next.js project with TypeScript and proper folder structure
- SQLite database with Prisma schema and initial migrations
- Shadcn UI components configuration

---

### Phase 2: Core Features Development
**Duration:** 4 Weeks  
**Goals:** Implement key features with responsive UI and API routes.

#### 2.1 Household & User Management
**Duration:** 1 Week
- **Backend:**
  - API routes:
    - `POST /api/households` (create household)
    - `GET /api/households/invite/:id` (generate invite link)
    - `POST /api/households/join` (join via invite)
    - `PATCH /api/households/:id/users/:userId/role` (assign roles)
  - Prisma models: `User` (id, name, email, role, householdId), `Household` (id, name, inviteCode).
  - Real-time updates with Socket.io
- **Frontend:**
  - Pages: 
    - `/household/create` (household creation form)
    - `/household/join` (household join form)
    - `/household/manage` (user management)
  - Components: 
    - RoleSelector (Radix UI Dropdown)
    - InviteLinkDisplay with copy functionality
  - Animations with Framer Motion for transitions and feedback
  - State Management: React Context with SWR for data fetching/caching

#### 2.2 Cat Profile Management
**Duration:** 1 Week
- **Backend:**
  - API routes:
    - `POST /api/cats` (create cat profile)
    - `GET /api/cats?householdId=:id` (list cats)
    - `PATCH /api/cats/:id` (update profile)
    - `DELETE /api/cats/:id` (remove cat)
    - `POST /api/cats/groups` (create group)
  - Prisma models: `Cat` (id, name, photoUrl, birthdate, weight, restrictions, notes, householdId), `CatGroup` (id, name, cats).
- **Frontend:**
  - Pages: 
    - `/cats/new` (cat profile creation)
    - `/cats/:id` (cat profile view)
    - `/cats/groups` (cat group manager)
  - Components: 
    - CatCard with Framer Motion animations
    - PhotoUploader with preview
  - Image uploads using Next.js API routes with local storage

#### 2.3 Feeding Interval Configuration
**Duration:** 1 Week
- **Backend:**
  - API routes:
    - `POST /api/schedules` (create schedule)
    - `PATCH /api/schedules/:id` (update/override schedule)
    - `GET /api/schedules?catId=:id` (fetch schedules)
  - Prisma model: `Schedule` (id, catId, type, interval, times, overrideUntil).
- **Frontend:**
  - Pages: 
    - `/schedules/new` (schedule setup)
    - `/schedules/:id` (schedule override)
  - Components: 
    - TimePicker using Shadcn components
    - IntervalSelector with Radix UI Slider
    - Animated transitions for schedule changes

#### 2.4 Feeding Tracking & Notifications
**Duration:** 1 Week
- **Backend:**
  - API routes:
    - `POST /api/feedings` (log feeding)
    - `GET /api/feedings?catId=:id` (fetch feeding logs)
    - `GET /api/notifications` (get pending notifications)
  - Prisma model: `FeedingLog` (id, catId, userId, timestamp, portionSize, notes).
  - Browser-based web push notifications
  - Escalation logic for missed feedings
- **Frontend:**
  - Pages: 
    - `/feedings/new` (feeding log entry)
    - `/notifications` (notification settings)
  - Components: 
    - FeedingButton with loading and success animations
    - NotificationBanner with Framer Motion transitions
  - Browser Notification API implementation

---

### Phase 3: Advanced Features & Analytics
**Duration:** 3 Weeks  
**Goals:** Add logs, analytics, and app settings.

#### 3.1 Feeding Log & Analytics
**Duration:** 2 Weeks
- **Backend:**
  - API routes:
    - `GET /api/feedings/:catId` (fetch feeding logs with pagination)
    - `GET /api/analytics?catId=:id` (fetch trends data)
    - `GET /api/export?catId=:id` (export logs as CSV)
  - Aggregate data for charts (daily/weekly frequency, weight vs. intake)
- **Frontend:**
  - Pages: 
    - `/feedings` (feeding log view with filters)
    - `/analytics/:catId` (analytics dashboard)
  - Components: 
    - Chart views using Chart.js with react-chartjs-2
    - ExportButton with download animation
    - Interactive data visualizations with Framer Motion
  - CSV export functionality

#### 3.2 App Settings
**Duration:** 1 Week
- **Backend:**
  - API routes:
    - `PATCH /api/users/:id/settings` (update timezone/language)
  - Prisma model `User` with fields: `timezone`, `language`
- **Frontend:**
  - Pages: `/settings` (settings screen)
  - Components: 
    - TimezonePicker with search functionality
    - LanguageSelector with flag icons
    - Theme switcher (light/dark mode)
  - Internationalization with `next-intl` (en-US, pt-BR, es-ES)
  - Animated transitions for settings changes

---

### Phase 4: Testing & Refinement
**Duration:** 2 Weeks  
**Goals:** Ensure quality, performance, and usability.

#### Tasks
1. **Unit Testing**
   - API: Use `jest` and `supertest` for API routes
   - Frontend: Use `@testing-library/react` for component tests
   - Test coverage target: 80% minimum
2. **Integration Testing**
   - Test household sync, feeding logs, and notifications end-to-end with Cypress
   - Create key user flows test scripts
3. **UI/UX Refinement**
   - Accessibility audit using Radix UI's built-in features
   - Gather feedback on UI flow and adjust components
   - Ensure responsive design for all device sizes (mobile, tablet, desktop)
   - Polish animations and transitions with Framer Motion
4. **Performance Optimization**
   - Implement Next.js optimization features (Image component, SSG/ISR where appropriate)
   - Optimize SQLite queries with Prisma
   - Implement proper loading states and skeleton screens

#### Deliverables
- Test coverage report
- Accessibility compliance report
- Polished responsive UI with smooth animations

---

### Phase 5: Deployment & Launch
**Duration:** 1 Week  
**Goals:** Prepare for production and launch.

#### Tasks
1. **Deployment Setup**
   - Deploy Next.js app to Vercel
   - Configure SQLite for production or switch to PlanetScale/Supabase if needed
   - Set up environment variables in Vercel:
     - `DATABASE_URL`
     - `NEXTAUTH_SECRET`
     - `NEXTAUTH_URL`
2. **CI/CD Pipeline**
   - Configure GitHub Actions for automated testing and deployment
   - Set up preview deployments for PRs
3. **Documentation**
   - Write user guide with screenshots
   - Document API routes for developers
   - Create onboarding walkthrough for new users

#### Deliverables
- Live web application with production URL
- CI/CD pipeline with automated tests
- Documentation for users and developers

---

## Milestones
1. **Week 1:** Project setup completed with Next.js, TypeScript, Shadcn UI, and Prisma/SQLite
2. **Week 5:** Core features (household, cat profiles, schedules, tracking) functional with animations
3. **Week 8:** Analytics and settings implemented with interactive visualizations
4. **Week 10:** Testing completed, app refined for accessibility and performance
5. **Week 11:** App deployed and launched with documentation

---

## Database Schema (Prisma)
```prisma
// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model Household {
  id         Int      @id @default(autoincrement())
  name       String
  inviteCode String   @unique
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  users      User[]
  cats       Cat[]
}

model User {
  id          Int           @id @default(autoincrement())
  name        String
  email       String        @unique
  role        String
  timezone    String?       @default("UTC")
  language    String?       @default("en-US")
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
  householdId Int?
  household   Household?    @relation(fields: [householdId], references: [id])
  feedingLogs FeedingLog[]
}

model Cat {
  id           Int           @id @default(autoincrement())
  name         String
  photoUrl     String?
  birthdate    DateTime?
  weight       Float?
  restrictions String?
  notes        String?
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
  householdId  Int
  household    Household     @relation(fields: [householdId], references: [id])
  schedules    Schedule[]
  feedingLogs  FeedingLog[]
  groups       CatGroup[]    @relation("CatToGroup")
}

model CatGroup {
  id        Int      @id @default(autoincrement())
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  cats      Cat[]    @relation("CatToGroup")
}

model Schedule {
  id            Int       @id @default(autoincrement())
  catId         Int
  cat           Cat       @relation(fields: [catId], references: [id])
  type          String
  interval      Int
  times         String
  overrideUntil DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

model FeedingLog {
  id          Int      @id @default(autoincrement())
  catId       Int
  cat         Cat      @relation(fields: [catId], references: [id])
  userId      Int
  user        User     @relation(fields: [userId], references: [id])
  timestamp   DateTime
  portionSize Float?
  notes       String?
  createdAt   DateTime @default(now())
}