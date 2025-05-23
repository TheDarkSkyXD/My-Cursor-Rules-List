'use client'

import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
  useCallback,
} from 'react'
import { User as PayloadUser } from '@/payload-types' // Import User type from generated types
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'
// We don't need the full form values type here anymore
// import { RegistrationFormValues } from '@/components/auth/RegistrationForm'

// Define the type for the actual registration API call data
export type RegisterUserData = Omit<
  PayloadUser,
  | 'id'
  | 'updatedAt'
  | 'createdAt'
  | 'salt'
  | 'hash'
  | 'loginAttempts'
  | 'lockUntil'
  | 'resetPasswordToken'
  | 'resetPasswordExpiration'
  | '_verified'
  | '_verificationToken'
  | 'role'
> & {
  password?: string // Make password explicitly optional or required based on Payload config
  // Add any other fields required for user creation that are not in PayloadUser base type
}

// Define a frontend-friendly User type (can be same as PayloadUser or a subset)
// Using PayloadUser directly for consistency for now
type User = PayloadUser

// Define a simple Permissions interface
interface Permissions {
  canAccessAdmin: boolean
  canManageUsers: boolean
  canManageCourses: boolean
}

interface AuthContextType {
  user: User | null
  setUser: React.Dispatch<React.SetStateAction<User | null>> // Allow manual setting if needed
  permissions: Permissions | null // Add permissions state
  setPermissions: React.Dispatch<React.SetStateAction<Permissions | null>> // Add setter
  isLoading: boolean
  error: string | null
  loginUser: (credentials: { email: string; password: string }) => Promise<boolean>
  logoutUser: () => Promise<void>
  // Use the specific API data type
  registerUser: (userData: RegisterUserData) => Promise<boolean>
  checkAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [permissions, setPermissions] = useState<Permissions | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  const router = useRouter()

  const checkAuth = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    console.log('AuthContext: Starting checkAuth...')
    try {
      const response = await fetch('/api/users/me', {
        method: 'GET', // Ensure method is GET
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Crucial for sending cookies
      })

      console.log(`AuthContext: /api/users/me response status: ${response.status}`)

      if (response.ok) {
        const data = await response.json()
        console.log('AuthContext: /api/users/me response data:', data)

        // IMPORTANT: Check the actual structure returned by Payload's /me endpoint
        // It might be directly the user object, or nested like { user: {...} }
        const fetchedUser = data.user || data // Adapt this line based on logged `data`

        if (fetchedUser && fetchedUser.id) {
          // Check for an identifier
          console.log('AuthContext: User data found:', fetchedUser)
          setUser(fetchedUser)
        } else {
          console.log(
            'AuthContext: /me returned OK, but no valid user data found in response.',
            data,
          )
          setUser(null)
        }
      } else {
        console.log(`AuthContext: /me request failed with status ${response.status}`)
        // Attempt to read error message from response if possible
        try {
          const errorData = await response.json()
          console.error('AuthContext: /me error response body:', errorData)
          setError(errorData.message || `Authentication check failed (${response.status})`)
        } catch (jsonError) {
          console.error('AuthContext: Failed to parse error response from /me')
          setError(`Authentication check failed (${response.status})`)
        }
        setUser(null)
      }
    } catch (err) {
      console.error('AuthContext: Network or other error during checkAuth:', err)
      setError('Failed to check authentication status due to a network error.')
      setUser(null)
    } finally {
      setIsLoading(false)
      console.log('AuthContext: checkAuth finished.')
    }
  }, [])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  // Login function
  const loginUser = async (credentials: { email: string; password: string }): Promise<boolean> => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
        credentials: 'include', // Important for cookie handling
      })

      const data = await response.json()

      if (response.ok && data.user) {
        setUser(data.user)
        toast({ title: 'Inloggning lyckades', description: 'Välkommen tillbaka!' })

        // Refresh and redirect (KEY CHANGE)
        router.refresh() // Refresh all server components
        router.push('/mina-sidor') // Redirect to dashboard

        setIsLoading(false)
        return true
      } else {
        const message = data.message || 'Ogiltig e-post eller lösenord.'
        setError(message)
        toast({ title: 'Inloggning misslyckades', description: message, variant: 'destructive' })
        setIsLoading(false)
        return false
      }
    } catch (err) {
      console.error('Login error:', err)
      const message = 'Ett oväntat fel inträffade vid inloggning.'
      setError(message)
      toast({ title: 'Inloggningsfel', description: message, variant: 'destructive' })
      setIsLoading(false)
      return false
    }
  }

  // Logout function
  const logoutUser = async (): Promise<void> => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/users/logout', {
        method: 'POST',
        credentials: 'include', // Important for cookie handling
      })

      if (response.ok) {
        setUser(null)
        toast({ title: 'Utloggad', description: 'Du har loggats ut.' })

        // Refresh and redirect (KEY CHANGE)
        router.refresh() // Refresh all server components
        router.push('/logga-in') // Redirect to login
      } else {
        throw new Error('Logout failed')
      }
    } catch (err) {
      console.error('Logout error:', err)
      setUser(null) // Still clear user locally even if API call fails
      toast({
        title: 'Utloggningsfel',
        description: 'Kunde inte logga ut korrekt, sessionen rensad lokalt.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Registration function
  const registerUser = async (userData: RegisterUserData): Promise<boolean> => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Important for cookie handling
        body: JSON.stringify({
          ...userData,
          role: 'user', // Assign 'user' as the default role
        }),
      })

      const data = await response.json()

      if (response.ok && data.doc) {
        toast({
          title: 'Registrering lyckades',
          description:
            data.message || 'Kontot skapat. Vänligen kontrollera din e-post för att verifiera.',
        })

        // Refresh server components (KEY CHANGE)
        router.refresh()

        setIsLoading(false)
        return true
      } else {
        let errorMessage = 'Registreringen misslyckades.'
        if (data.errors && Array.isArray(data.errors)) {
          errorMessage = data.errors.map((e: any) => `${e.field}: ${e.message}`).join(', ')
        }
        setError(data.message || errorMessage)
        toast({
          title: 'Registrering misslyckades',
          description: data.message || errorMessage,
          variant: 'destructive',
        })
        setIsLoading(false)
        return false
      }
    } catch (err) {
      console.error('Registration error:', err)
      setError('Ett oväntat fel inträffade vid registrering.')
      toast({
        title: 'Registreringsfel',
        description: 'Ett oväntat fel inträffade.',
        variant: 'destructive',
      })
      setIsLoading(false)
      return false
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        permissions,
        setPermissions,
        isLoading,
        error,
        loginUser,
        logoutUser,
        registerUser,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// Custom hook to use the AuthContext
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
