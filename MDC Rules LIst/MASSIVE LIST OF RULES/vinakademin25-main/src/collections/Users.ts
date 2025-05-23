import type { CollectionConfig } from 'payload'
import { adminFieldLevel, adminOnly, adminOrInstructorFieldLevel, adminOrSelf } from '../lib/access'

type User = {
  id: string
  email: string
  firstName?: string
  role?: string
}

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'firstName', 'lastName', 'role', 'subscriptionStatus'],
  },
  auth: {
    cookies: {
      secure: process.env.NODE_ENV === 'production', // false in dev (HTTP), true in prod (HTTPS)
      sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax', // 'Lax' for dev (HTTP), 'None' for prod (if needed for cross-domain)
      domain: process.env.NODE_ENV === 'production' ? '.vinakademin.se' : 'localhost',
    },
    forgotPassword: {
      generateEmailHTML: (args) => {
        // Basic HTML email for password reset, to be enhanced later
        const { token, user } = args || {}
        return `
          <h1>Reset Your Password</h1>
          <p>Hello ${(user as any)?.firstName || 'there'},</p>
          <p>Click the link below to reset your password:</p>
          <p><a href="${process.env.NEXT_PUBLIC_SITE_URL}/reset-password?token=${token}">Reset Password</a></p>
          <p>If you didn't request this, please ignore this email.</p>
        `
      },
    },
    verify: {
      generateEmailHTML: (args) => {
        const { token, user } = args || {}
        // Use Swedish path and link text
        return `
          <h1>Verifiera din e-post</h1>
          <p>Hej ${(user as any)?.firstName || 'där'},</p>
          <p>Klicka på länken nedan för att verifiera din e-postadress:</p>
          <p><a href="${process.env.NEXT_PUBLIC_SITE_URL}/verifiera-epost?token=${token}">Verifiera E-post</a></p>
          <p>Om du inte skapade detta konto, vänligen ignorera detta e-postmeddelande.</p>
        `
      },
    },
  },
  access: {
    // Enhanced access control for users collection
    read: ({ req }) => {
      const user = req.user as User | null

      // Admin can read all users
      if (user?.role === 'admin') return true

      // Instructors can read basic info about all users
      if (user?.role === 'instructor') {
        return true // Instructors can see all users, fields will be filtered in afterRead hook
      }

      // Users can read their own document
      return user
        ? {
            id: {
              equals: user.id,
            },
          }
        : false
    },
    // Anyone can create a user (register)
    create: () => true,
    // Admin can update any user, users can update themselves
    update: adminOrSelf,
    // Only admins can delete users
    delete: adminOnly,
  },
  fields: [
    // Profile Information
    {
      name: 'firstName',
      type: 'text',
      label: 'First Name',
      admin: {
        description: "User's first name",
      },
    },
    {
      name: 'lastName',
      type: 'text',
      label: 'Last Name',
      admin: {
        description: "User's last name",
      },
    },
    {
      name: 'avatar',
      type: 'upload',
      label: 'Profile Picture',
      relationTo: 'media',
      admin: {
        description: "User's profile picture",
      },
    },
    {
      name: 'bio',
      type: 'textarea',
      label: 'Bio',
      admin: {
        description: 'Short user biography',
      },
    },
    // Role and Permissions
    {
      name: 'role',
      type: 'select',
      label: 'Role',
      defaultValue: 'user',
      required: true,
      access: {
        // Only admins can change user roles
        update: adminFieldLevel,
      },
      options: [
        {
          label: 'Admin',
          value: 'admin',
        },
        {
          label: 'Instructor',
          value: 'instructor',
        },
        {
          label: 'Subscriber',
          value: 'subscriber',
        },
        {
          label: 'User',
          value: 'user',
        },
      ],
      admin: {
        description: 'User role determines permissions',
        position: 'sidebar',
      },
    },
    // Account Status
    {
      name: 'isVerified',
      type: 'checkbox',
      label: 'Email Verified',
      defaultValue: false,
      access: {
        // Only admins and instructors can manually verify users
        update: adminOrInstructorFieldLevel,
      },
      admin: {
        description: 'Has the user verified their email address?',
        position: 'sidebar',
      },
    },
    {
      name: 'accountStatus',
      type: 'select',
      label: 'Account Status',
      defaultValue: 'active',
      access: {
        // Only admins can change account status
        update: adminFieldLevel,
      },
      options: [
        {
          label: 'Active',
          value: 'active',
        },
        {
          label: 'Suspended',
          value: 'suspended',
        },
        {
          label: 'Deactivated',
          value: 'deactivated',
        },
      ],
      admin: {
        description: 'Current status of the user account',
        position: 'sidebar',
      },
    },
    // Subscription Information
    {
      name: 'subscriptionStatus',
      type: 'select',
      label: 'Subscription Status',
      defaultValue: 'none',
      access: {
        // Only admins can change subscription status
        update: adminFieldLevel,
      },
      options: [
        {
          label: 'None',
          value: 'none',
        },
        {
          label: 'Free Trial',
          value: 'free_trial',
        },
        {
          label: 'Active',
          value: 'active',
        },
        {
          label: 'Past Due',
          value: 'past_due',
        },
        {
          label: 'Canceled',
          value: 'canceled',
        },
      ],
      admin: {
        description: 'Current subscription status',
        position: 'sidebar',
      },
    },
    {
      name: 'subscriptionPlan',
      type: 'select',
      label: 'Subscription Plan',
      defaultValue: 'none',
      access: {
        // Only admins can change subscription plan
        update: adminFieldLevel,
      },
      options: [
        {
          label: 'None',
          value: 'none',
        },
        {
          label: 'Monthly',
          value: 'monthly',
        },
        {
          label: 'Annual',
          value: 'annual',
        },
      ],
      admin: {
        description: 'Type of subscription plan',
        position: 'sidebar',
      },
    },
    {
      name: 'subscriptionExpiry',
      type: 'date',
      label: 'Subscription Expiry',
      access: {
        // Only admins can change subscription expiry
        update: adminFieldLevel,
      },
      admin: {
        description: 'Date when the subscription expires',
        position: 'sidebar',
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
    // Wine Preferences
    {
      name: 'winePreferences',
      type: 'group',
      label: 'Wine Preferences',
      admin: {
        description: "User's wine preferences",
      },
      fields: [
        {
          name: 'favoriteTypes',
          type: 'select',
          label: 'Favorite Wine Types',
          hasMany: true,
          options: [
            { label: 'Red', value: 'red' },
            { label: 'White', value: 'white' },
            { label: 'Rosé', value: 'rose' },
            { label: 'Sparkling', value: 'sparkling' },
            { label: 'Dessert', value: 'dessert' },
          ],
        },
        {
          name: 'preferredRegions',
          type: 'select',
          label: 'Preferred Regions',
          hasMany: true,
          options: [
            { label: 'France', value: 'france' },
            { label: 'Italy', value: 'italy' },
            { label: 'Spain', value: 'spain' },
            { label: 'United States', value: 'usa' },
            { label: 'Australia', value: 'australia' },
            { label: 'South America', value: 'south_america' },
            { label: 'Other', value: 'other' },
          ],
        },
        {
          name: 'tasteProfile',
          type: 'select',
          label: 'Taste Profile',
          hasMany: true,
          options: [
            { label: 'Dry', value: 'dry' },
            { label: 'Sweet', value: 'sweet' },
            { label: 'Fruity', value: 'fruity' },
            { label: 'Bold', value: 'bold' },
            { label: 'Light', value: 'light' },
            { label: 'Acidic', value: 'acidic' },
            { label: 'Tannic', value: 'tannic' },
          ],
        },
        {
          name: 'priceRange',
          type: 'select',
          label: 'Preferred Price Range',
          options: [
            { label: 'Budget', value: 'budget' },
            { label: 'Mid-range', value: 'mid' },
            { label: 'Premium', value: 'premium' },
            { label: 'Luxury', value: 'luxury' },
          ],
        },
      ],
    },
    // Progress Tracking
    {
      name: 'courseProgress',
      type: 'array',
      label: 'Course Progress',
      admin: {
        description: "User's progress in enrolled courses",
      },
      fields: [
        {
          name: 'courseId',
          type: 'text',
          label: 'Course ID',
          required: true,
        },
        {
          name: 'progress',
          type: 'number',
          label: 'Progress Percentage',
          min: 0,
          max: 100,
          defaultValue: 0,
        },
        {
          name: 'lastAccessed',
          type: 'date',
          label: 'Last Accessed',
        },
        {
          name: 'completed',
          type: 'checkbox',
          label: 'Completed',
          defaultValue: false,
        },
      ],
    },
    // Privacy & Communication Preferences
    {
      name: 'communicationPreferences',
      type: 'group',
      label: 'Communication Preferences',
      admin: {
        description: "User's communication preferences",
      },
      fields: [
        {
          name: 'marketingEmails',
          type: 'checkbox',
          label: 'Marketing Emails',
          defaultValue: true,
        },
        {
          name: 'newsletterSubscription',
          type: 'checkbox',
          label: 'Newsletter Subscription',
          defaultValue: true,
        },
        {
          name: 'courseNotifications',
          type: 'checkbox',
          label: 'Course Notifications',
          defaultValue: true,
        },
      ],
    },
  ],
  timestamps: true,
}
