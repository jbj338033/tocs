"use client"

import { forwardRef, ButtonHTMLAttributes, ReactNode } from "react"

import { ChevronDown, Circle } from "./icons"

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost"
  size?: "sm" | "md" | "lg"
  children: ReactNode
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className = "", ...props }, ref) => {
    const baseClasses = "inline-flex items-center justify-center rounded-xl font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
    
    const variants = {
      primary: "bg-blue-600 text-white hover:bg-blue-700",
      secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200",
      ghost: "hover:bg-gray-100 text-gray-700"
    }
    
    const sizes = {
      sm: "px-3 py-2 text-sm h-8",
      md: "px-4 py-2.5 text-sm h-10",
      lg: "px-6 py-3 text-base h-12"
    }
    
    return (
      <button
        ref={ref}
        className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      />
    )
  }
)

Button.displayName = "Button"

interface CardProps {
  children: ReactNode
  className?: string
}

export function Card({ children, className = "" }: CardProps) {
  return (
    <div className={`bg-white rounded-2xl ${className}`}>
      {children}
    </div>
  )
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = "", ...props }, ref) => {
    return (
      <div className="space-y-1">
        {label && (
          <label className="block text-sm font-medium text-gray-700">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`w-full px-4 py-2.5 border-0 bg-gray-50 rounded-xl text-sm placeholder:text-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all ${error ? "bg-red-50" : ""} ${className}`}
          {...props}
        />
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
      </div>
    )
  }
)

Input.displayName = "Input"

interface SelectProps {
  value: string
  onValueChange: (value: string) => void
  options: { value: string; label: string }[]
  placeholder?: string
  className?: string
}

export function Select({ value, onValueChange, options, placeholder, className = "" }: SelectProps) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        className={`w-full px-4 py-2.5 pr-10 border-0 bg-gray-50 rounded-xl text-sm appearance-none focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all ${className}`}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
    </div>
  )
}

interface BadgeProps {
  children: ReactNode
  variant?: "default" | "success" | "warning" | "error"
  className?: string
}

export function Badge({ children, variant = "default", className = "" }: BadgeProps) {
  const variants = {
    default: "bg-gray-100 text-gray-800",
    success: "bg-green-100 text-green-800",
    warning: "bg-yellow-100 text-yellow-800",
    error: "bg-red-100 text-red-800"
  }
  
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${variants[variant]} ${className}`}>
      {children}
    </span>
  )
}

// Detail page specific components for consistency

interface DetailButtonProps {
  onClick?: () => void
  disabled?: boolean
  variant?: 'primary' | 'danger' | 'ghost' | 'secondary'
  size?: 'sm' | 'md'
  children: ReactNode
  className?: string
  title?: string
}

export function DetailButton({
  onClick,
  disabled = false,
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  title
}: DetailButtonProps) {
  const baseClasses = 'font-medium rounded transition-colors flex items-center justify-center'
  
  const sizeClasses = {
    sm: 'px-2.5 py-1 text-[11px] gap-1',
    md: 'px-3 py-1.5 text-[12px] gap-1.5'
  }
  
  const variantClasses = {
    primary: 'bg-[#0064FF] hover:bg-[#0050C8] text-white disabled:bg-gray-200 disabled:text-gray-400',
    danger: 'bg-red-50 hover:bg-red-100 text-red-600 border border-red-100',
    ghost: 'text-gray-400 hover:text-gray-600 hover:bg-gray-100',
    secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-700'
  }
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      title={title}
    >
      {children}
    </button>
  )
}

interface ProtocolBadgeProps {
  protocol: 'HTTP' | 'GraphQL' | 'WebSocket' | 'Socket.IO' | 'gRPC' | 'STOMP' | 'MQTT' | 'SSE'
  method?: string
}

const protocolStyles = {
  HTTP: 'bg-blue-50 text-blue-600 border-blue-100',
  GraphQL: 'bg-pink-50 text-pink-600 border-pink-100',
  WebSocket: 'bg-purple-50 text-purple-600 border-purple-100',
  'Socket.IO': 'bg-orange-50 text-orange-600 border-orange-100',
  gRPC: 'bg-indigo-50 text-indigo-600 border-indigo-100',
  STOMP: 'bg-amber-50 text-amber-600 border-amber-100',
  MQTT: 'bg-teal-50 text-teal-600 border-teal-100',
  SSE: 'bg-cyan-50 text-cyan-600 border-cyan-100'
}

const methodStyles = {
  GET: 'bg-blue-50 text-blue-600 border-blue-100',
  POST: 'bg-green-50 text-green-600 border-green-100',
  PUT: 'bg-orange-50 text-orange-600 border-orange-100',
  DELETE: 'bg-red-50 text-red-600 border-red-100',
  PATCH: 'bg-purple-50 text-purple-600 border-purple-100',
  HEAD: 'bg-gray-50 text-gray-600 border-gray-100',
  OPTIONS: 'bg-gray-50 text-gray-600 border-gray-100'
}

export function ProtocolBadge({ protocol, method }: ProtocolBadgeProps) {
  const isHttp = protocol === 'HTTP' && method
  const style = isHttp ? methodStyles[method as keyof typeof methodStyles] || protocolStyles.HTTP : protocolStyles[protocol]
  const label = isHttp ? method : protocol
  
  return (
    <span className={`px-2 py-1 text-[11px] font-medium rounded border ${style}`}>
      {label}
    </span>
  )
}

interface ConnectionStatusProps {
  isConnected: boolean
}

export function ConnectionStatus({ isConnected }: ConnectionStatusProps) {
  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium rounded border ${
      isConnected 
        ? 'bg-green-50 text-green-600 border-green-100' 
        : 'bg-gray-50 text-gray-400 border-gray-100'
    }`}>
      <Circle size={8} className={isConnected ? 'fill-current' : ''} />
      {isConnected ? 'Connected' : 'Disconnected'}
    </div>
  )
}

interface IconButtonProps {
  onClick?: () => void
  disabled?: boolean
  size?: 'sm' | 'md'
  children: ReactNode
  title?: string
  className?: string
}

export function IconButton({
  onClick,
  disabled = false,
  size = 'md',
  children,
  title,
  className = ''
}: IconButtonProps) {
  const sizeClasses = {
    sm: 'p-1 rounded',
    md: 'p-1.5 rounded'
  }
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${sizeClasses[size]} text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      title={title}
    >
      {children}
    </button>
  )
}