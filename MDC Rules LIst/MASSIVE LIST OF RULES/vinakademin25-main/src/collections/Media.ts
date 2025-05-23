import type { CollectionConfig } from 'payload'
import { adminOnly, adminOrInstructorOnly, anyLoggedIn } from '../lib/access'

export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    // Anyone can read media files
    read: () => true,
    // Only authenticated users can create media
    create: anyLoggedIn,
    // Only admins and instructors can update media
    update: adminOrInstructorOnly,
    // Only admins can delete media
    delete: adminOnly,
  },
  admin: {
    description: 'Media files such as images, videos, and documents',
  },
  upload: {
    adminThumbnail: 'thumbnail',
    imageSizes: [
      {
        name: 'thumbnail',
        width: 400,
        height: 300,
        position: 'centre',
      },
      {
        name: 'profile',
        width: 200,
        height: 200,
        position: 'centre',
      },
      {
        name: 'card',
        width: 640,
        height: 480,
        position: 'centre',
      },
      {
        name: 'feature',
        width: 1280,
        height: 720,
        position: 'centre',
      },
    ],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
      label: 'Alt Text',
      admin: {
        description: 'Descriptive text for screen readers and SEO',
      },
    },
    {
      name: 'caption',
      type: 'text',
      label: 'Caption',
      admin: {
        description: 'Optional caption text to display with the media',
      },
    },
    {
      name: 'uploadedBy',
      type: 'relationship',
      relationTo: 'users',
      hasMany: false,
      admin: {
        position: 'sidebar',
        description: 'User who uploaded this media',
        readOnly: true,
      },
      hooks: {
        beforeChange: [
          ({ req, data }) => {
            if (req.user) {
              return req.user.id
            }
            return data
          },
        ],
      },
    },
  ],
  hooks: {
    beforeRead: [
      ({ doc }) => {
        // Ensure file URLs are properly formatted
        return doc
      },
    ],
  },
}
