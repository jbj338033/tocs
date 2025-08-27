"use client"

import { Check, Clock, AlertCircle } from "@/shared/ui/icons"

interface AutoSaveIndicatorProps {
  status: 'saving' | 'saved' | 'error' | 'idle'
  className?: string
}

export function AutoSaveIndicator({ status, className = "" }: AutoSaveIndicatorProps) {
  if (status === 'idle') return null

  const configs = {
    saving: {
      icon: <Clock size={14} className="animate-spin" />,
      text: 'Saving...',
      textColor: 'text-gray-500'
    },
    saved: {
      icon: <Check size={14} />,
      text: 'Saved',
      textColor: 'text-green-600'
    },
    error: {
      icon: <AlertCircle size={14} />,
      text: 'Save failed',
      textColor: 'text-red-500'
    }
  }

  const config = configs[status]

  return (
    <div className={`flex items-center gap-1.5 text-xs ${config.textColor} ${className}`}>
      {config.icon}
      <span>{config.text}</span>
    </div>
  )
}