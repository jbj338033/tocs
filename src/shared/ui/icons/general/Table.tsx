interface IconProps {
  size?: number
  className?: string
}

export function Table({ size = 16, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M3 9h18M9 21V3" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  )
}