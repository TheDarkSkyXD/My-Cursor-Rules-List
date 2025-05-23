# Project Overview & Refactor Status (Supabase Auth Migration)

## Server Component Pattern (Protected Routes)

### Overview
This pattern defines the standard approach for Server Components that require authentication and data fetching, particularly for dynamic routes that need parameter validation and authorization checks.

### Key Principles

1. **Direct Supabase Usage**
   - Use `createServerClient()` for auth and data access
   - Avoid middleware-based headers
   - Keep database queries on the server

2. **Structured Flow**
```typescript
// 1. Parameter Validation
validateRouteParams(params)

// 2. Authentication
const { user } = await authenticateUser()

// 3. Data Fetching with Authorization
const data = await fetchDataWithAuth(params, user)

// 4. Render with Error Boundaries
try {
  return <ProtectedComponent data={data} />
} catch (error) {
  handleError(error)
}
```

3. **Error Handling Hierarchy**
   - Invalid Parameters → `notFound()`
   - No Authentication → `redirect('/login')`
   - No Authorization → `redirect()` to appropriate page
   - Data Fetch Error → `notFound()` or error boundary
   - Render Error → error boundary

### Implementation Template

```typescript
import { createServerClient } from "@/utils/supabase/server";
import { notFound, redirect } from "next/navigation";

// Separate data fetching logic
async function getProtectedData(params: RouteParams, userId: string) {
  const supabase = createServerClient();
  
  // Fetch primary data
  const { data, error } = await supabase
    .from('table')
    .select(`
      *,
      related_table (fields)
    `)
    .eq('id', params.id)
    .single();
    
  if (error || !data) {
    return null;
  }
  
  // Authorization check (e.g., household membership)
  const { data: authData } = await supabase
    .from('permissions_table')
    .select('access_field')
    .eq('user_id', userId)
    .eq('resource_id', data.resource_id)
    .single();
    
  if (!authData?.access_field) {
    return null;
  }
  
  return data;
}

// Server Component
export default async function ProtectedPage({ params }: PageProps) {
  // 1. Validate params
  if (!isValidParams(params)) {
    notFound();
  }

  // 2. Get authenticated user
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login');
  }

  // 3. Fetch data with authorization
  try {
    const data = await getProtectedData(params, user.id);
    if (!data) {
      notFound();
    }

    // 4. Render with error boundary
    return (
      <ErrorBoundary fallback={<ErrorComponent />}>
        <Suspense fallback={<LoadingComponent />}>
          <ProtectedComponent data={data} />
        </Suspense>
      </ErrorBoundary>
    );
  } catch (error) {
    // Log error appropriately
    notFound();
  }
}
```

### Benefits

1. **Security**
   - Server-side authentication
   - Explicit authorization checks
   - No client-side token exposure

2. **Performance**
   - Reduced API calls
   - Server-side data fetching
   - Efficient database queries

3. **Developer Experience**
   - Clear separation of concerns
   - Consistent error handling
   - Type-safe data access

4. **User Experience**
   - Fast page loads
   - Appropriate error states
   - Clear authorization boundaries

### Usage Notes

1. **Data Fetching**
   - Keep queries focused and efficient
   - Use appropriate Supabase joins
   - Consider implementing caching where appropriate

2. **Error Handling**
   - Log errors with context
   - Provide user-friendly error states
   - Use appropriate HTTP status codes

3. **Authorization**
   - Check at the most specific level needed
   - Consider implementing role-based access
   - Cache authorization results when appropriate

4. **Client Components**
   - Pass only necessary data
   - Handle loading states appropriately
   - Implement proper error boundaries

// ... rest of existing content ... 