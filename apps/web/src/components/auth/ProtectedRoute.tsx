import React from 'react'

interface ProtectedRouteProps {
  children: React.ReactNode
}

/**
 * ProtectedRoute:
 * Login system temporarily disabled for Google AdSense compliance review.
 * Allows Google crawlers, reviewers, and visitors immediate unrestricted access to the dashboard and editor.
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  return <>{children}</>
}
