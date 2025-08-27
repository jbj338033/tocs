"use client"

import { useState, useRef, useEffect } from "react"
import { ChevronDown } from "../icons"
import { Server } from "@/entities/project"

interface ServerSelectorProps {
  servers: Server[]
  selectedServer?: Server
  onSelect: (server: Server | null) => void
}

export function ServerSelector({ servers, selectedServer, onSelect }: ServerSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  if (!servers || servers.length === 0) {
    return null
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 rounded-l-md border border-r-0 border-gray-200 transition-colors"
      >
        <span className="font-medium text-gray-700">
          {selectedServer ? selectedServer.name : "No server"}
        </span>
        <ChevronDown size={14} className="text-gray-400" />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-20 min-w-[200px]">
          <button
            onClick={() => {
              onSelect(null)
              setIsOpen(false)
            }}
            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 transition-colors"
          >
            <div className="font-medium text-gray-700">No server</div>
            <div className="text-xs text-gray-500">Use full URL</div>
          </button>
          <div className="border-t border-gray-100" />
          {servers.map((server) => (
            <button
              key={server.name}
              onClick={() => {
                onSelect(server)
                setIsOpen(false)
              }}
              className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 transition-colors ${
                selectedServer?.name === server.name ? 'bg-gray-50' : ''
              }`}
            >
              <div className="font-medium text-gray-700">
                {server.name}
              </div>
              <div className="text-xs text-gray-500 truncate">{server.url}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}