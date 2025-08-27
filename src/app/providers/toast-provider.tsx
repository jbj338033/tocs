"use client"

import { Toaster } from "sonner"

export function ToastProvider() {
  return (
    <Toaster
      position="bottom-right"
      toastOptions={{
        style: {
          background: 'white',
          border: '1px solid #e5e7eb',
          padding: '16px',
          color: '#111827',
        },
        className: 'font-sans',
      }}
    />
  )
}