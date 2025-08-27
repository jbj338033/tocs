"use client"

import { useState, useRef, useEffect } from "react"

interface Variable {
  id: string
  key: string
  value: string
}

interface VariableUrlInputProps {
  value: string
  onChange: (value: string) => void
  variables: Variable[]
  placeholder?: string
  className?: string
}

export function VariableUrlInput({
  value,
  onChange,
  variables,
  placeholder = "Enter URL",
  className = ""
}: VariableUrlInputProps) {
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [cursorPosition, setCursorPosition] = useState(0)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  const filteredVariables = variables.filter(v => 
    searchTerm && v.key.toLowerCase().includes(searchTerm.toLowerCase())
  )

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node) &&
          inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    const newCursorPos = e.target.selectionStart || 0
    setCursorPosition(newCursorPos)

    const beforeCursor = newValue.substring(0, newCursorPos)
    const match = beforeCursor.match(/\{\{([^}]*)$/)
    
    if (match) {
      setSearchTerm(match[1])
      setShowSuggestions(true)
      setSelectedIndex(0)
    } else {
      setShowSuggestions(false)
    }

    onChange(newValue)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || filteredVariables.length === 0) return

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < filteredVariables.length - 1 ? prev + 1 : 0
        )
        break
      case "ArrowUp":
        e.preventDefault()
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : filteredVariables.length - 1
        )
        break
      case "Enter":
      case "Tab":
        e.preventDefault()
        if (filteredVariables[selectedIndex]) {
          insertVariable(filteredVariables[selectedIndex])
        }
        break
      case "Escape":
        setShowSuggestions(false)
        break
    }
  }

  const insertVariable = (variable: Variable) => {
    const beforeCursor = value.substring(0, cursorPosition)
    const afterCursor = value.substring(cursorPosition)
    
    const match = beforeCursor.match(/\{\{([^}]*)$/)
    if (match) {
      const startPos = beforeCursor.length - match[0].length
      const newValue = value.substring(0, startPos) + `{{${variable.key}}}` + afterCursor
      onChange(newValue)
      
      setTimeout(() => {
        if (inputRef.current) {
          const newPos = startPos + `{{${variable.key}}}`.length
          inputRef.current.setSelectionRange(newPos, newPos)
          inputRef.current.focus()
        }
      }, 0)
    }
    
    setShowSuggestions(false)
  }

  const renderHighlightedUrl = () => {
    if (!value) return null

    const parts = value.split(/(\{\{[^}]+\}\})/g)
    
    return (
      <div className="absolute inset-0 flex items-center px-3 pointer-events-none">
        <div className="whitespace-pre overflow-hidden text-ellipsis">
          {parts.map((part, i) => {
            if (part.match(/^\{\{[^}]+\}\}$/)) {
              const varKey = part.slice(2, -2)
              const variable = variables.find(v => v.key === varKey)
              return (
                <span
                  key={i}
                  className="inline-flex items-center px-1.5 py-0.5 rounded bg-[#0064FF] text-white text-xs font-medium mx-0.5"
                  title={variable ? variable.value : "Variable not found"}
                >
                  {varKey}
                </span>
              )
            }
            return <span key={i} className="text-transparent">{part}</span>
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="relative flex-1">
      <div className="relative">
        {renderHighlightedUrl()}
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`w-full px-3 py-2 bg-transparent relative z-10 ${className}`}
        />
      </div>
      
      {showSuggestions && filteredVariables.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-64 overflow-y-auto"
        >
          {filteredVariables.map((variable, index) => (
            <button
              key={variable.id}
              onClick={() => insertVariable(variable)}
              className={`w-full px-3 py-2 text-left hover:bg-gray-50 transition-colors ${
                index === selectedIndex ? 'bg-gray-100' : ''
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-[#0064FF] text-white text-xs font-medium">
                  {variable.key}
                </span>
                <span className="text-xs text-gray-500">{`{{${variable.key}}}`}</span>
              </div>
              <div className="text-xs text-gray-600 truncate mt-0.5">
                {variable.value}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}