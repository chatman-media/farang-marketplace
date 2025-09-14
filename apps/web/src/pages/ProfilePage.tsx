import React from "react"

import { ProfileForm } from "../components/auth"

export const ProfilePage: React.FC = () => {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-gray-900">Profile Settings</h1>
        <p className="mt-2 text-gray-600">Manage your account settings and personal information.</p>
      </div>

      <ProfileForm />
    </div>
  )
}
