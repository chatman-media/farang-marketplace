import type { AuthProvider, User, VerificationStatus } from "@marketplace/shared-types"
import React, { useEffect, useState } from "react"
import { useProfile, useUpdateProfile } from "../../lib/query"
import { Button, Card, Input } from "../ui"

interface ProfileFormProps {
  onSuccess?: () => void
}

export const ProfileForm: React.FC<ProfileFormProps> = ({ onSuccess }) => {
  const { data: profile, isLoading } = useProfile()
  const updateProfileMutation = useUpdateProfile()

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Update form data when profile loads
  useEffect(() => {
    if (profile) {
      setFormData({
        firstName: profile.profile.firstName || "",
        lastName: profile.profile.lastName || "",
        email: profile.email || "",
        phone: profile.phone || "",
      })
    }
  }, [profile])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.firstName) {
      newErrors.firstName = "First name is required"
    }

    if (!formData.lastName) {
      newErrors.lastName = "Last name is required"
    }

    if (!formData.email) {
      newErrors.email = "Email is required"
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid"
    }

    if (formData.phone && !/^\+?[\d\s\-\(\)]+$/.test(formData.phone)) {
      newErrors.phone = "Phone number is invalid"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    try {
      const updateData: Partial<User> = {
        email: formData.email,
        phone: formData.phone,
        profile: {
          rating: 0,
          reviewsCount: 0,
          verificationStatus: "unverified" as VerificationStatus,
          socialProfiles: [],
          primaryAuthProvider: "email" as AuthProvider,
          ...profile?.profile,
          firstName: formData.firstName,
          lastName: formData.lastName,
        },
      }

      await updateProfileMutation.mutateAsync(updateData)
      onSuccess?.()
    } catch (error) {
      console.error("Profile update failed:", error)
    }
  }

  const handleInputChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [field]: e.target.value,
    }))

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <Card>
      <Card.Header>
        <h3 className="text-lg font-medium text-gray-900">Profile Information</h3>
        <p className="mt-1 text-sm text-gray-500">Update your personal information and contact details.</p>
      </Card.Header>

      <Card.Body>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <Input
              id="firstName"
              name="firstName"
              type="text"
              required
              label="First name"
              value={formData.firstName}
              onChange={handleInputChange("firstName")}
              error={errors.firstName}
            />

            <Input
              id="lastName"
              name="lastName"
              type="text"
              required
              label="Last name"
              value={formData.lastName}
              onChange={handleInputChange("lastName")}
              error={errors.lastName}
            />
          </div>

          <Input
            id="email"
            name="email"
            type="email"
            required
            label="Email address"
            value={formData.email}
            onChange={handleInputChange("email")}
            error={errors.email}
            leftIcon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                />
              </svg>
            }
          />

          <Input
            id="phone"
            name="phone"
            type="tel"
            label="Phone number"
            value={formData.phone}
            onChange={handleInputChange("phone")}
            error={errors.phone}
            leftIcon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                />
              </svg>
            }
          />

          {updateProfileMutation.error && (
            <div className="rounded-md bg-error-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-error-400" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-error-800">Update failed</h3>
                  <div className="mt-2 text-sm text-error-700">
                    {(updateProfileMutation.error as any)?.message || "Please check your information and try again"}
                  </div>
                </div>
              </div>
            </div>
          )}

          {updateProfileMutation.isSuccess && (
            <div className="rounded-md bg-success-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-success-400" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-success-800">Profile updated successfully!</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <Button type="submit" loading={updateProfileMutation.isPending} disabled={updateProfileMutation.isPending}>
              Save changes
            </Button>
          </div>
        </form>
      </Card.Body>
    </Card>
  )
}
