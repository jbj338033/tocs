"use client"

import { useState, useEffect, useRef, ReactNode } from "react"

interface ContextMenuItem {
  label: string
  icon?: ReactNode
  onClick: () => void
  divider?: boolean
  className?: string
}

interface ContextMenuProps {
  children: ReactNode
  items: ContextMenuItem[]
}

export function ContextMenu({ children, items }: ContextMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClick)
      return () => document.removeEventListener("mousedown", handleClick)
    }
  }, [isOpen])

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    const x = e.clientX
    const y = e.clientY
    
    setPosition({ x, y })
    setIsOpen(true)
  }

  return (
    <>
      <div onContextMenu={handleContextMenu}>
        {children}
      </div>
      
      {isOpen && (
        <div
          ref={menuRef}
          className="fixed bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50 min-w-[160px]"
          style={{
            left: `${Math.min(position.x, window.innerWidth - 200)}px`,
            top: `${Math.min(position.y, window.innerHeight - 200)}px`
          }}
        >
          {items.map((item, index) => (
            item.divider ? (
              <div key={index} className="h-px bg-gray-200 my-1" />
            ) : (
              <button
                key={index}
                onClick={() => {
                  item.onClick()
                  setIsOpen(false)
                }}
                className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-gray-50 transition-colors text-left ${
                  item.className || 'text-gray-700'
                }`}
              >
                {item.icon && <span className="text-gray-500">{item.icon}</span>}
                {item.label}
              </button>
            )
          ))}
        </div>
      )}
    </>
  )
}