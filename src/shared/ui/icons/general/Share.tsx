interface IconProps {
  size?: number
  className?: string
}

export function Share({ size = 16, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none">
      <circle cx="18" cy="5" r="3" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="6" cy="12" r="3" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="18" cy="19" r="3" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M8.59 13.51l6.83 3.98m-.01-10.98l-6.82 3.98" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  )
}