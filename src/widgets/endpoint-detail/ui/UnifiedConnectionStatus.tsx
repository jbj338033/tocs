"use client"

import { styles } from "./styles"

interface UnifiedConnectionStatusProps {
  type: 'http' | 'websocket' | 'graphql'
  isConnected?: boolean
  status?: number | null
  statusText?: string
}

export function UnifiedConnectionStatus({ 
  type, 
  isConnected, 
  status,
  statusText
}: UnifiedConnectionStatusProps) {
  if (type === 'http' || type === 'graphql') {
    if (status === null || status === undefined) return null
    
    const isSuccess = status > 0 && status < 400
    const statusClass = isSuccess ? styles.statusSuccess : styles.statusError
    
    return (
      <span className={`text-[12px] font-medium ${statusClass}`}>
        {status} {statusText && <span className="text-[11px] font-normal">({statusText})</span>}
      </span>
    )
  }

  // WebSocket-style protocols
  return (
    <span className={`text-[12px] font-medium ${
      isConnected ? styles.statusSuccess : 'text-gray-400'
    }`}>
      {isConnected ? 'Connected' : 'Disconnected'}
    </span>
  )
}