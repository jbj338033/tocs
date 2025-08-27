interface IconProps {
  size?: number
  className?: string
}

export function GripVertical({ size = 16, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none">
      <circle cx="9" cy="5" r="1" fill="currentColor"/>
      <circle cx="9" cy="12" r="1" fill="currentColor"/>
      <circle cx="9" cy="19" r="1" fill="currentColor"/>
      <circle cx="15" cy="5" r="1" fill="currentColor"/>
      <circle cx="15" cy="12" r="1" fill="currentColor"/>
      <circle cx="15" cy="19" r="1" fill="currentColor"/>
    </svg>
  )
}