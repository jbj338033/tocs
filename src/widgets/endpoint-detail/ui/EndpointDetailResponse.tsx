'use client'

import { ReactNode } from 'react'

interface EndpointDetailResponseProps {
  status?: ReactNode
  time?: number
  size?: string
  content: ReactNode
  actions?: ReactNode
}

export function EndpointDetailResponse({
  status,
  time,
  size,
  content,
  actions
}: EndpointDetailResponseProps) {
  return (
    <div className="h-full flex flex-col bg-gray-50">
      {(status || time !== undefined || size || actions) && (
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 bg-white">
          <div className="flex items-center gap-3 text-[12px]">
            {status}
            {time !== undefined && (
              <span className="text-gray-500">{time}ms</span>
            )}
            {size && (
              <span className="text-gray-500">{size}</span>
            )}
          </div>
          {actions && (
            <div className="flex items-center gap-2">
              {actions}
            </div>
          )}
        </div>
      )}
      
      <div className="flex-1 overflow-auto p-4">
        {content}
      </div>
    </div>
  )
}