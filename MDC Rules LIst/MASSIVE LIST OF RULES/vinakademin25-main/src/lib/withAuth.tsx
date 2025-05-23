import React, { ComponentType } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

// Loading component for when authentication state is being determined
const LoadingAuth: React.FC = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
      <p className="mt-4 text-gray-700">Loading authentication...</p>
    </div>
  </div>
)

// Error component for when authentication fails
const AuthError: React.FC<{ error: string }> = ({ error }) => (
  <div className="flex items-center justify-center h-screen">
    <div className="text-center max-w-md mx-auto p-6 bg-red-50 rounded-lg">
      <h2 className="text-xl font-semibold text-red-700 mb-2">Authentication Error</h2>
      <p className="text-red-600 mb-4">{error}</p>
      <a
        href="/login"
        className="inline-block px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
      >
        Back to Login
      </a>
    </div>
  </div>
)

// Unauthorized component for when user doesn't have required role
const Unauthorized: React.FC = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="text-center max-w-md mx-auto p-6 bg-yellow-50 rounded-lg">
      <h2 className="text-xl font-semibold text-yellow-700 mb-2">Access Denied</h2>
      <p className="text-yellow-600 mb-4">You don&apos;t have permission to access this page.</p>
      <Link
        href="/"
        className="inline-block px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition"
      >
        Back to Home
      </Link>
    </div>
  </div>
)

/**
 * Higher-order component that protects routes based on user authentication and roles
 * @param Component The component to protect
 * @param allowedRoles Array of roles that can access this component
 * @param loginRedirect Whether to redirect to login if not authenticated
 * @returns Protected component
 */
export const withAuth = <P extends object>(
  Component: ComponentType<P>,
  allowedRoles: string[] = [],
  loginRedirect: boolean = true,
) => {
  const ProtectedComponent = (props: P) => {
    // Destructure the correct properties from the context
    const { user, isLoading, error } = useAuth()
    const isLoggedIn = Boolean(user) // Derive isLoggedIn from user object

    const router = useRouter()

    // Show loading component while checking auth
    if (isLoading) {
      // Use isLoading from context
      return <LoadingAuth />
    }

    // Show error component if there's an auth error
    if (error) {
      return <AuthError error={error} />
    }

    // If not logged in and loginRedirect is true, redirect to login
    if (!isLoggedIn && loginRedirect) {
      // Use derived isLoggedIn
      // Use router for client-side navigation
      router.push('/login')
      return <LoadingAuth /> // Return loading while redirecting
    }

    // If roles are specified and user doesn't have one of them, show unauthorized
    // Ensure user exists before accessing user.role
    if (allowedRoles.length > 0 && (!user || !allowedRoles.includes(user.role))) {
      return <Unauthorized />
    }

    // All checks passed, render the component
    return <Component {...props} />
  }

  // Set display name for debugging
  const componentName = Component.displayName || Component.name || 'Component'
  ProtectedComponent.displayName = `withAuth(${componentName})`

  return ProtectedComponent
}
