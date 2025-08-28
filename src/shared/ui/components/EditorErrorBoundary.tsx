"use client"

import React from 'react'

interface Props {
  children: React.ReactNode
  fallback?: React.ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class EditorErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Editor Error:', error, errorInfo)
    
    // Check if it's a jQuery-related error
    if (error.message && error.message.includes('$.create')) {
      console.warn('jQuery conflict detected. This may be caused by a browser extension.')
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="p-4 border border-red-200 rounded-lg bg-red-50">
            <h3 className="text-sm font-medium text-red-800 mb-2">Editor Error</h3>
            <p className="text-xs text-red-600">
              {this.state.error?.message || 'An error occurred while loading the editor.'}
            </p>
            {this.state.error?.message?.includes('$.create') && (
              <p className="text-xs text-red-600 mt-2">
                This may be caused by a browser extension interfering with the editor.
                Try disabling browser extensions or using incognito mode.
              </p>
            )}
          </div>
        )
      )
    }

    return this.props.children
  }
}