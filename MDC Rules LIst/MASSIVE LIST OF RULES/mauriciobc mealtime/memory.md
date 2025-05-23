# MealTime Project Long-Term Memory

## Quick Reference
- **App Purpose**: Cat feeding schedule management
- **Stack**: Next.js 14, TypeScript, Supabase (Auth), Prisma (DB), TailwindCSS, Shadcn UI
- **Key Files**: 
  - Auth: `lib/context/UserContext.tsx`, `middleware.ts`
  - DB: `lib/prisma.ts`, `prisma/schema.prisma`
  - Layout: `components/layout/root-client-layout.tsx`

## Architecture Overview

### Context System
```typescript
// Core Contexts
- UserContext: Auth/Profile management
- LoadingContext: Loading states
- ErrorContext: Error handling (TODO)

// Domain Contexts
- HouseholdContext
- CatsContext
- FeedingContext
- ScheduleContext
- NotificationContext
```

### Authentication Flow
1. Middleware handles session refresh
2. UserContext listens to `onAuthStateChange`
3. Server Actions verify auth via `supabase.auth.getUser()`
4. API routes use `X-User-ID` header from middleware

## Database & API Patterns

### Prisma Query Best Practices
1. **Relation Loading**:
   ```typescript
   // ✅ Correct
   include: { relation: true }
   // ❌ Avoid
   select: { relation: { select: {...} } }
   ```

2. **Field Selection**:
   - Use `include` for relations
   - Match schema field names exactly
   - Can't combine top-level `select` and `include`

### API Route Authentication
```typescript
import { headers } from 'next/headers';

// Get auth user ID from middleware header
const headersList = headers();
const authUserId = headersList.get('X-User-ID');
```

## Cookie Management

### Components
1. **Server Store** (`utils/supabase/server.ts`):
   - Async wrapper for Next.js cookie API
   - Handles server-side operations

2. **Middleware Handler** (`utils/supabase/middleware.ts`):
   - Manages request/response cycle
   - Refreshes sessions automatically

### Security Considerations
- HTTP-only cookies where possible
- Secure flag in production
- SameSite configuration
- CSP headers for Supabase domains

## Known Issues & TODOs

### High Priority
1. API Route Database Connectivity
   - Some routes failing/returning unexpected results
   - Check environment variables and query context

### Pending Tasks
1. Server-Side Auth Verification
2. ErrorContext Implementation
3. Testing Updates (remove NextAuth)
4. Long-term Prisma vs Supabase strategy
5. Documentation Updates

## Migration Status (NextAuth → Supabase)

### Completed
- UserContext refactor
- Middleware implementation
- Client-side auth state management
- Server Actions for profile data

### Pending
- Test suite updates
- NextAuth cleanup
- Documentation refresh

## Database Schema

### Public Schema (Main Application Tables)

#### Core Tables
1. **households**
   - Core entity representing a household
   - Has an owner and a name/description
   - Can have multiple cats and household members

2. **cats**
   - Represents pets in the system
   - Belongs to a household
   - Has an owner (from profiles)
   - Tracks name, birth date, weight
   - Has associated feeding schedules

3. **meals**
   - Records feeding events
   - Tracks what was fed, how much, and by whom
   - Includes meal type, amount, unit, and notes
   - Records who fed the pet and when

4. **schedules**
   - Defines feeding schedules for cats
   - Can be enabled/disabled
   - Includes type, interval, and specific times
   - Linked to a specific cat

#### User Management
1. **profiles**
   - User profiles in the system
   - Contains username, full name, avatar
   - Can own cats and be part of households
   - Tracks meals they've fed to pets

2. **household_members**
   - Junction table linking users to households
   - Includes role information
   - Ensures users can be part of multiple households

#### Notifications
1. **notifications**
   - System notifications for users
   - Includes title, message, type
   - Tracks read status
   - Can include additional metadata

### Auth Schema (Supabase Auth)
The auth schema contains tables managed by Supabase Auth:
- users
- identities
- sessions
- refresh_tokens
- Various other authentication-related tables 