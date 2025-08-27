interface IconProps {
  size?: number
  className?: string
}

export function Settings({ size = 16, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M12 1v6m0 6v6m6-12h6M6 12H1m16.66-5.66l-2.13 2.13m-7.06 7.06l-2.13 2.13m0-11.32l2.13 2.13m7.06 7.06l2.13 2.13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}