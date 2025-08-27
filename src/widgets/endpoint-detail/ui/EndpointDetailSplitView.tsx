'use client'

import { ReactNode, useState } from 'react'

interface EndpointDetailSplitViewProps {
  left: ReactNode
  right: ReactNode
  leftWidth?: string
  rightWidth?: string
  resizable?: boolean
  minLeftWidth?: number
  minRightWidth?: number
}

export function EndpointDetailSplitView({
  left,
  right,
  leftWidth = '50%',
  rightWidth = '50%',
  resizable = false,
  minLeftWidth = 300,
  minRightWidth = 300
}: EndpointDetailSplitViewProps) {
  const [isResizing, setIsResizing] = useState(false)
  const [splitPosition, setSplitPosition] = useState(50)

  const handleMouseDown = () => {
    if (resizable) {
      setIsResizing(true)
    }
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isResizing && resizable) {
      const container = e.currentTarget
      const containerRect = container.getBoundingClientRect()
      const newPosition = ((e.clientX - containerRect.left) / containerRect.width) * 100
      
      if (newPosition >= 20 && newPosition <= 80) {
        setSplitPosition(newPosition)
      }
    }
  }

  const handleMouseUp = () => {
    setIsResizing(false)
  }

  const leftPanelWidth = resizable ? `${splitPosition}%` : leftWidth
  const rightPanelWidth = resizable ? `${100 - splitPosition}%` : rightWidth

  return (
    <div 
      className="flex h-full w-full relative"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div 
        className="flex-shrink-0 overflow-hidden"
        style={{ width: leftPanelWidth, minWidth: minLeftWidth }}
      >
        {left}
      </div>
      
      {resizable && (
        <div
          className={`w-px bg-gray-100 hover:bg-gray-200 cursor-col-resize transition-colors relative ${
            isResizing ? 'bg-blue-400!' : ''
          }`}
          onMouseDown={handleMouseDown}
        >
          <div className="absolute inset-y-0 -left-1 -right-1" />
        </div>
      )}
      
      <div 
        className={`flex-1 overflow-hidden ${!resizable ? 'border-l border-gray-100' : ''}`}
        style={{ width: rightPanelWidth, minWidth: minRightWidth }}
      >
        {right}
      </div>
    </div>
  )
}