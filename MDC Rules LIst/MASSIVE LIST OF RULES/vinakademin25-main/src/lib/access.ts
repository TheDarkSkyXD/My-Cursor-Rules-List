import type { User } from '../payload-types'

// Define a simple local type for the access arguments we use
type SimpleAccessArgs = {
  req: {
    user?: User | null // Define the user property we need
  }
  id?: string | number // Add id for field-level access
}

// Define common role-based predicates using the local type
export const isAdmin = ({ req }: SimpleAccessArgs): boolean => {
  const user = req.user // No need for `as User | null` anymore
  return Boolean(user?.role === 'admin')
}

export const isInstructor = ({ req }: SimpleAccessArgs): boolean => {
  const user = req.user
  return Boolean(user?.role === 'instructor')
}

export const isSubscriber = ({ req }: SimpleAccessArgs): boolean => {
  const user = req.user
  return Boolean(user?.role === 'subscriber')
}

export const isActiveUser = ({ req }: SimpleAccessArgs): boolean => {
  const user = req.user
  return Boolean(user && user.accountStatus === 'active')
}

export const hasActiveSubscription = ({ req }: SimpleAccessArgs): boolean => {
  const user = req.user
  return Boolean(
    user &&
      user.subscriptionStatus === 'active' &&
      user.subscriptionPlan &&
      user.subscriptionPlan !== 'none',
  )
}

export const isAdminOrInstructor = ({ req }: SimpleAccessArgs): boolean => {
  const user = req.user
  return Boolean(user && (user.role === 'admin' || user.role === 'instructor'))
}

// Common access patterns using the local type
export const adminOnly = ({ req }: SimpleAccessArgs) => {
  return isAdmin({ req })
}

export const adminOrInstructorOnly = ({ req }: SimpleAccessArgs) => {
  return isAdminOrInstructor({ req })
}

export const adminOrSelf = ({ req }: SimpleAccessArgs) => {
  const user = req.user

  if (isAdmin({ req })) return true

  // Return query constraint or boolean
  return user
    ? {
        id: {
          equals: user.id,
        },
      }
    : false
}

export const subscribersAndAbove = ({ req }: SimpleAccessArgs) => {
  const user = req.user

  if (user?.role === 'admin' || user?.role === 'instructor' || user?.role === 'subscriber') {
    return true
  }

  return false
}

export const anyLoggedIn = ({ req }: SimpleAccessArgs) => {
  const user = req.user
  return Boolean(user)
}

export const activeSubscribersAndAbove = ({ req }: SimpleAccessArgs) => {
  const user = req.user

  if (user?.role === 'admin' || user?.role === 'instructor') {
    return true
  }

  if (user?.role === 'subscriber') {
    return Boolean(
      user.subscriptionStatus === 'active' &&
        user.subscriptionPlan &&
        user.subscriptionPlan !== 'none',
    )
  }

  return false
}

// Field-level access control using the local type
export const adminOrInstructorFieldLevel = ({ req }: SimpleAccessArgs) => {
  return isAdminOrInstructor({ req })
}

export const adminFieldLevel = ({ req }: SimpleAccessArgs) => {
  return isAdmin({ req })
}

export const selfFieldLevel = ({ req, id }: SimpleAccessArgs) => {
  const user = req.user
  // Ensure id is treated as a string/number compatible with user.id
  return Boolean(user && id && String(user.id) === String(id))
}

export const adminOrSelfFieldLevel = ({ req, id }: SimpleAccessArgs) => {
  return isAdmin({ req }) || selfFieldLevel({ req, id })
}
