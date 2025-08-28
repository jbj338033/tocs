'use client'

import { ReactNode } from 'react'
import { EndpointDetailLayout } from './EndpointDetailLayout'
import { EndpointDetailHeader } from './EndpointDetailHeader'
import { EndpointDetailSplitView } from './EndpointDetailSplitView'
import { EndpointDetailTabs } from './EndpointDetailTabs'
import { EndpointDetailResponse } from './EndpointDetailResponse'

export interface UnifiedProtocolDetailProps {
  protocol: ReactNode
  url: ReactNode
  headerActions: ReactNode
  
  // Request side
  requestTabs: Array<{
    id: string
    label: string
    content: ReactNode
  }>
  activeRequestTab: string
  onRequestTabChange: (id: string) => void
  
  // Response side
  responseStatus?: ReactNode
  responseTime?: number
  responseContent: ReactNode
  responseActions?: ReactNode
  
  // Optional footer
  footer?: ReactNode
}

export function UnifiedProtocolDetail({
  protocol,
  url,
  headerActions,
  requestTabs,
  activeRequestTab,
  onRequestTabChange,
  responseStatus,
  responseTime,
  responseContent,
  responseActions,
  footer
}: UnifiedProtocolDetailProps) {
  return (
    <EndpointDetailLayout
      header={
        <EndpointDetailHeader
          protocol={protocol}
          url={url}
          actions={headerActions}
        />
      }
      main={
        <EndpointDetailSplitView
          left={
            <EndpointDetailTabs
              tabs={requestTabs}
              activeTab={activeRequestTab}
              onTabChange={onRequestTabChange}
            />
          }
          right={
            <EndpointDetailResponse
              status={responseStatus}
              time={responseTime}
              content={responseContent}
              actions={responseActions}
            />
          }
        />
      }
      footer={footer}
    />
  )
}

// Common request/response section components
export function RequestSection({ 
  title, 
  children,
  actions
}: { 
  title?: string
  children: ReactNode
  actions?: ReactNode
}) {
  return (
    <div className="h-full flex flex-col">
      {title && (
        <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between">
          <h4 className="text-[13px] font-medium text-gray-900">{title}</h4>
          {actions}
        </div>
      )}
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  )
}

export function ResponseSection({ 
  children 
}: { 
  children: ReactNode 
}) {
  return (
    <div className="h-full p-4 overflow-auto">
      {children}
    </div>
  )
}

// Common UI patterns
export function KeyValueEditor({
  items,
  onAdd,
  onUpdate,
  onRemove,
  addLabel = '+ Add Item',
  keyPlaceholder = 'Key',
  valuePlaceholder = 'Value',
  showCheckbox = true,
  showDescription = false,
  isReadOnly = false
}: {
  items: Array<{ key: string; value: string; enabled: boolean; description?: string }>
  onAdd: () => void
  onUpdate: (index: number, field: 'key' | 'value' | 'enabled' | 'description', value: string | boolean) => void
  onRemove: (index: number) => void
  addLabel?: string
  keyPlaceholder?: string
  valuePlaceholder?: string
  showCheckbox?: boolean
  showDescription?: boolean
  isReadOnly?: boolean
}) {
  return (
    <div className="w-full">
      {/* Table Header */}
      <div className="border-b border-gray-100">
        <div className="flex items-center px-4 py-2 text-[11px] font-medium text-gray-500">
          {showCheckbox && <div className="w-8" />}
          <div className="flex-1 px-2">Key</div>
          <div className="flex-1 px-2">Value</div>
          {showDescription && <div className="flex-1 px-2">Description</div>}
          <div className="w-8" />
        </div>
      </div>
      
      {/* Table Body */}
      <div className="divide-y divide-gray-50">
        {items.map((item, index) => (
          <div key={index} className="flex items-center px-4 py-1.5 hover:bg-gray-50 group">
            {showCheckbox && (
              <div className="w-8 flex items-center">
                <input
                  type="checkbox"
                  checked={item.enabled}
                  onChange={(e) => onUpdate(index, 'enabled', e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-gray-200 text-[#0064FF] focus:ring-0 focus:ring-offset-0"
                />
              </div>
            )}
            <div className="flex-1 px-2">
              <input
                type="text"
                value={item.key}
                onChange={(e) => onUpdate(index, 'key', e.target.value)}
                placeholder={keyPlaceholder}
                className="w-full px-2 py-1 text-[12px] bg-transparent hover:bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0064FF] border border-transparent hover:border-gray-100 focus:border-[#0064FF] rounded transition-all"
              />
            </div>
            <div className="flex-1 px-2">
              <input
                type="text"
                value={item.value}
                onChange={(e) => onUpdate(index, 'value', e.target.value)}
                placeholder={valuePlaceholder}
                className="w-full px-2 py-1 text-[12px] bg-transparent hover:bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0064FF] border border-transparent hover:border-gray-100 focus:border-[#0064FF] rounded transition-all"
              />
            </div>
            {showDescription && (
              <div className="flex-1 px-2">
                <input
                  type="text"
                  value={item.description || ''}
                  onChange={(e) => onUpdate(index, 'description', e.target.value)}
                  placeholder="Description"
                  className="w-full px-2 py-1 text-[12px] bg-transparent hover:bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0064FF] border border-transparent hover:border-gray-100 focus:border-[#0064FF] rounded transition-all"
                />
              </div>
            )}
            {!isReadOnly && (
              <div className="w-8 flex items-center justify-center">
                <button
                  onClick={() => onRemove(index)}
                  className="opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-all"
                >
                  ×
                </button>
              </div>
            )}
            {isReadOnly && <div className="w-8" />}
          </div>
        ))}
      </div>
      
      {/* Add Button */}
      {!isReadOnly && (
        <div className="px-4 py-2">
          <button
            onClick={onAdd}
            className="text-[12px] text-[#0064FF] hover:text-[#0050C8] font-medium"
          >
            {addLabel}
          </button>
        </div>
      )}
    </div>
  )
}

export function MessageList({
  messages,
  className = ''
}: {
  messages: Array<{
    id: string
    type: 'sent' | 'received' | 'system' | 'emit' | 'on'
    content?: string
    event?: string
    data?: unknown
    timestamp: Date
  }>
  className?: string
}) {
  return (
    <div className={`p-4 space-y-2.5 ${className}`}>
      {messages.length === 0 ? (
        <div className="text-center py-12 text-[12px] text-gray-400">
          No messages yet
        </div>
      ) : (
        messages.map(message => (
          <MessageItem key={message.id} message={message} />
        ))
      )}
    </div>
  )
}

export function MessageItem({
  message
}: {
  message: {
    type: 'sent' | 'received' | 'system' | 'emit' | 'on'
    content?: string
    event?: string
    data?: unknown
    timestamp: Date
  }
}) {
  const getMessageStyle = () => {
    switch (message.type) {
      case 'sent':
      case 'emit':
        return 'bg-blue-50 border-blue-100 ml-auto max-w-[70%]'
      case 'received':
      case 'on':
        return 'bg-green-50 border-green-100 mr-auto max-w-[70%]'
      default:
        return 'bg-amber-50 border-amber-100 mx-auto max-w-[85%]'
    }
  }

  const getTypeLabel = () => {
    switch (message.type) {
      case 'emit':
        return 'EMIT'
      case 'on':
        return 'ON'
      default:
        return message.type.toUpperCase()
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
          {getTypeLabel()}
        </span>
        {message.event && (
          <span className="font-mono font-medium text-gray-700">{message.event}</span>
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