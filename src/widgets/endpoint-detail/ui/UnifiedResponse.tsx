"use client"

import { ResponseViewer } from "@/shared/ui/components/ResponseViewer"
import { styles } from "./styles"

interface UnifiedResponseProps {
  type: 'request-response' | 'streaming'
  
  // For request-response
  response?: any
  isLoading?: boolean
  
  // For streaming (WebSocket, SSE, etc)
  messages?: Array<{
    id: string
    type: 'sent' | 'received' | 'system' | 'emit' | 'on'
    content?: string
    event?: string
    data?: unknown
    timestamp: Date
    topic?: string
    destination?: string
  }>
  
  // Statistics
  showStats?: boolean
  stats?: {
    total: number
    sent: number
    received: number
  }
  
  // Actions
  onClear?: () => void
}

export function UnifiedResponse({ 
  type, 
  response, 
  isLoading, 
  messages = [], 
  showStats,
  stats,
  onClear 
}: UnifiedResponseProps) {
  if (type === 'request-response') {
    return (
      <div className={styles.responseContainer}>
        <ResponseViewer response={response} isLoading={isLoading} />
      </div>
    )
  }

  // Streaming type
  return (
    <div className="h-full flex flex-col">
      {showStats && stats && (
        <div className={`${styles.headerPadding} border-b border-gray-100`}>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-[11px]">
              <span className="text-gray-500">Total:</span>
              <span className="font-medium text-gray-700">{stats.total}</span>
            </div>
            <div className="flex items-center gap-2 text-[11px]">
              <span className="text-blue-600">Sent:</span>
              <span className="font-medium text-blue-700">{stats.sent}</span>
            </div>
            <div className="flex items-center gap-2 text-[11px]">
              <span className="text-green-600">Received:</span>
              <span className="font-medium text-green-700">{stats.received}</span>
            </div>
            {onClear && (
              <button
                onClick={onClear}
                className="ml-auto text-[11px] text-gray-500 hover:text-gray-700"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}
      
      <div className={`flex-1 overflow-auto ${styles.contentPadding} bg-gray-50`}>
        {messages.length === 0 ? (
          <div className="text-center py-12 text-[12px] text-gray-400">
            No messages yet
          </div>
        ) : (
          <div className="space-y-2">
            {messages.map(message => (
              <MessageItem key={message.id} message={message} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function MessageItem({ message }: { message: any }) {
  const getMessageStyle = () => {
    switch (message.type) {
      case 'sent':
      case 'emit':
        return styles.messageSent
      case 'received':
      case 'on':
        return styles.messageReceived
      default:
        return styles.messageSystem
    }
  }

  return (
    <div className={`p-3 rounded-lg border text-[12px] ${getMessageStyle()}`}>
      <div className="flex items-center gap-2 mb-1">
        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
          message.type === 'sent' || message.type === 'emit'
            ? 'bg-blue-100 text-blue-700'
            : message.type === 'received' || message.type === 'on'
            ? 'bg-green-100 text-green-700'
            : 'bg-amber-100 text-amber-700'
        }`}>
          {message.type.toUpperCase()}
        </span>
        {message.event && (
          <span className="font-mono font-medium text-gray-700">{message.event}</span>
        )}
        {message.topic && (
          <span className="font-mono text-[11px] text-gray-600">{message.topic}</span>
        )}
        <span className="text-[11px] text-gray-500 ml-auto">
          {message.timestamp.toLocaleTimeString()}
        </span>
      </div>
      {(message.content || message.data !== undefined) && (
        <div className="mt-2">
          {message.content ? (
            <div className="break-all">{message.content}</div>
          ) : (
            <pre className="p-2 bg-white/60 rounded border border-gray-100 font-mono text-[11px] text-gray-700 whitespace-pre-wrap overflow-x-auto">
              {typeof message.data === 'string' ? message.data : JSON.stringify(message.data, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  )
}