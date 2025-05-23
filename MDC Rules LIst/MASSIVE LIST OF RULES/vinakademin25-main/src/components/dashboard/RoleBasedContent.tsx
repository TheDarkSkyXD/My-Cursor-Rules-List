import React from 'react'
import Link from 'next/link'
import { User } from '@/payload-types'

interface RoleBasedContentProps {
  user: User
}

const RoleBasedContent: React.FC<RoleBasedContentProps> = ({ user }) => {
  const role = user.role

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-semibold mb-4">Dina aktiviteter</h2>
      {role === 'admin' && (
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-xl font-medium text-blue-800">Admin Dashboard</h3>
          <p className="text-blue-600 mt-2">Här kan du hantera användare, kurser och mer.</p>
          <div className="mt-4">
            <Link
              href="/admin"
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            >
              Gå till adminpanelen
            </Link>
          </div>
        </div>
      )}

      {role === 'user' && (
        <div className="space-y-4">
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="text-xl font-medium text-purple-800">Dina kurser</h3>
            <p className="text-purple-600 mt-2">Du har inga pågående kurser.</p>
            <div className="mt-4">
              <Link
                href="/kurser"
                className="inline-block px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition"
              >
                Utforska kurser
              </Link>
            </div>
          </div>
        </div>
      )}

      {role === 'subscriber' && (
        <div className="space-y-4">
          <div className="bg-teal-50 p-4 rounded-lg">
            <h3 className="text-xl font-medium text-teal-800">Dina kurser (Prenumerant)</h3>
            <p className="text-teal-600 mt-2">Lista dina prenumerantkurser här.</p>
            <div className="mt-4">
              <Link
                href="/mina-sidor/kurser"
                className="inline-block px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700 transition"
              >
                Mina Kursregistreringar
              </Link>
            </div>
          </div>
        </div>
      )}

      {role === 'instructor' && (
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="text-xl font-medium text-green-800">Instruktörsverktyg</h3>
          <p className="text-green-600 mt-2">Hantera dina kurser och studenter här.</p>
          <div className="mt-4">
            <Link
              href="/admin/kurser"
              className="inline-block px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
            >
              Hantera kurser
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

export default RoleBasedContent
