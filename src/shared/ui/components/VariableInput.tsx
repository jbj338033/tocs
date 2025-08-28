"use client"

import { useState, useRef, useEffect } from "react"

interface Variable {
  id: string
  key: string
  value: string
}

interface VariableInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  variables?: Variable[]
  className?: string
  multiline?: boolean
  isReadOnly?: boolean
}

export function VariableInput({ 
  value, 
  onChange, 
  placeholder = "", 
  variables = [], 
  className = "",
  multiline = false,
  isReadOnly = false
}: VariableInputProps) {
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [cursorPosition, setCursorPosition] = useState(0)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  const filteredVariables = variables.filter(v => {
    if (!searchTerm && showSuggestions) return true
    return v.key.toLowerCase().includes(searchTerm.toLowerCase())
  })

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newValue = e.target.value
    const newCursorPos = e.target.selectionStart || 0
    setCursorPosition(newCursorPos)

    const beforeCursor = newValue.substring(0, newCursorPos)
    
    const doubleMatch = beforeCursor.match(/\{\{([^}]*)$/)
    const atMatch = beforeCursor.match(/@(\w*)$/)
    
    if (doubleMatch) {
      setSearchTerm(doubleMatch[1])
      setShowSuggestions(true)
      setSelectedIndex(0)
    } else if (atMatch) {
      setSearchTerm(atMatch[1])
      setShowSuggestions(true)
      setSelectedIndex(0)
    } else {
      setShowSuggestions(false)
    }

    onChange(newValue)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
        if (!multiline || showSuggestions) {
          e.preventDefault()
          if (filteredVariables[selectedIndex]) {
            insertVariable(filteredVariables[selectedIndex])
          }
        }
        break
      case "Tab":
        if (showSuggestions) {
          e.preventDefault()
          if (filteredVariables[selectedIndex]) {
            insertVariable(filteredVariables[selectedIndex])
          }
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
    
    const doubleMatch = beforeCursor.match(/\{\{([^}]*)$/)
    const atMatch = beforeCursor.match(/@(\w*)$/)
    
    if (doubleMatch) {
      const startPos = beforeCursor.length - doubleMatch[0].length
      const newValue = value.substring(0, startPos) + `{{${variable.key}}}` + afterCursor
      onChange(newValue)
      
      setTimeout(() => {
        if (inputRef.current) {
          const newPos = startPos + `{{${variable.key}}}`.length
          inputRef.current.setSelectionRange(newPos, newPos)
          inputRef.current.focus()
        }
      }, 0)
    } else if (atMatch) {
      const startPos = beforeCursor.length - atMatch[0].length
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

  const renderHighlightedText = () => {
    if (!value) return null

    const parts = value.split(/(\{\{[^}]+\}\})/g)
    
    return (
      <div className={`absolute inset-0 flex ${multiline ? 'items-start' : 'items-center'} px-3 py-2 pointer-events-none`}>
        <div className={`${multiline ? 'whitespace-pre-wrap' : 'whitespace-pre overflow-hidden text-ellipsis'}`}>
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

  const inputProps = {
    ref: inputRef as any,
    value,
    onChange: isReadOnly ? undefined : handleInputChange,
    onKeyDown: isReadOnly ? undefined : handleKeyDown,
    placeholder,
    readOnly: isReadOnly,
    className: `w-full px-3 py-2 bg-transparent relative z-10 ${className} ${isReadOnly ? 'cursor-default' : ''}`
  }

  return (
    <div className="relative">
      <div className="relative">
        {renderHighlightedText()}
        {multiline ? (
          <textarea {...inputProps} />
        ) : (
          <input type="text" {...inputProps} />
        )}
      </div>
      
      {!isReadOnly && showSuggestions && filteredVariables.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-64 overflow-y-auto"
        >
          <div className="px-3 py-2 text-xs text-gray-600 font-medium border-b border-gray-100">
            변수 — {filteredVariables.length}개
          </div>
          {filteredVariables.map((variable, index) => (
            <button
              key={variable.id}
              onClick={() => insertVariable(variable)}
              className={`w-full px-3 py-2 text-left hover:bg-gray-50 transition-colors ${
                index === selectedIndex ? 'bg-gray-50' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#0064FF] rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">
                    {variable.key.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-900 font-medium text-sm">
                      {variable.key}
                    </span>
                    <span className="text-[#0064FF] text-xs font-mono">
                      {`{{${variable.key}}}`}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {variable.value}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}