interface IconProps {
  size?: number
  className?: string
}

export function Circle({ size = 16, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  )
}