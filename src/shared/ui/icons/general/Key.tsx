interface IconProps {
  size?: number
  className?: string
}

export function Key({ size = 16, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none">
      <path d="M21 2l-2 2m-7.61 7.61A5.5 5.5 0 117.639 7.66a5.5 5.5 0 013.971 3.95zM11 11l5.5 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}