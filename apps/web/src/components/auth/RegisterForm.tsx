import React, { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Button, Input, Card } from "../ui"
import { useRegister } from "../../lib/query"
import type { RegisterRequest } from "@marketplace/shared-types"

interface RegisterFormProps {
  onSuccess?: () => void
  redirectTo?: string
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess, redirectTo = "/" }) => {
  const navigate = useNavigate()
  const registerMutation = useRegister()

  const [formData, setFormData] = useState<RegisterRequest>({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    phone: "",
  })

  const [confirmPassword, setConfirmPassword] = useState("")
  const [errors, setErrors] = useState<Partial<RegisterRequest & { confirmPassword: string }>>({})
  const [acceptTerms, setAcceptTerms] = useState(false)

  const validateForm = (): boolean => {
    const newErrors: Partial<RegisterRequest & { confirmPassword: string }> = {}

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

    if (!formData.password) {
      newErrors.password = "Password is required"
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters"
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password"
    } else if (formData.password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match"
    }

    if (formData.phone && !/^\+?[\d\s\-\(\)]+$/.test(formData.phone)) {
      newErrors.phone = "Phone number is invalid"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!acceptTerms) {
      alert("Please accept the terms and conditions")
      return
    }

    if (!validateForm()) {
      return
    }

    try {
      await registerMutation.mutateAsync(formData)
      onSuccess?.()
      navigate(redirectTo)
    } catch (error) {
      console.error("Registration failed:", error)
    }
  }

  const handleInputChange = (field: keyof RegisterRequest) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [field]: e.target.value,
    }))

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }))
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 bg-primary-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">TM</span>
          </div>
          <h2 className="mt-6 text-center text-3xl font-display font-bold text-gray-900">Create your account</h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{" "}
            <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
              sign in to your existing account
            </Link>
          </p>
        </div>

        <Card>
          <Card.Body>
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  id="firstName"
                  name="firstName"
                  type="text"
                  autoComplete="given-name"
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
                  autoComplete="family-name"
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
                autoComplete="email"
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
                autoComplete="tel"
                label="Phone number (optional)"
                value={formData.phone || ""}
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

              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                label="Password"
                value={formData.password}
                onChange={handleInputChange("password")}
                error={errors.password}
                helperText="Must be at least 8 characters with uppercase, lowercase, and number"
                leftIcon={
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                }
              />

              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                label="Confirm password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value)
                  if (errors.confirmPassword) {
                    setErrors((prev) => ({
                      ...prev,
                      confirmPassword: undefined,
                    }))
                  }
                }}
                error={errors.confirmPassword}
                leftIcon={
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                }
              />

              <div className="flex items-center">
                <input
                  id="accept-terms"
                  name="accept-terms"
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                />
                <label htmlFor="accept-terms" className="ml-2 block text-sm text-gray-900">
                  I agree to the{" "}
                  <Link to="/terms" className="text-primary-600 hover:text-primary-500">
                    Terms and Conditions
                  </Link>{" "}
                  and{" "}
                  <Link to="/privacy" className="text-primary-600 hover:text-primary-500">
                    Privacy Policy
                  </Link>
                </label>
              </div>

              {registerMutation.error && (
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
                      <h3 className="text-sm font-medium text-error-800">Registration failed</h3>
                      <div className="mt-2 text-sm text-error-700">
                        {(registerMutation.error as any)?.message || "Please check your information and try again"}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <Button
                  type="submit"
                  className="w-full"
                  loading={registerMutation.isPending}
                  disabled={registerMutation.isPending || !acceptTerms}
                >
                  Create account
                </Button>
              </div>
            </form>
          </Card.Body>
        </Card>
      </div>
    </div>
  )
}
