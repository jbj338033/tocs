export const GraphQLIcon = ({ size = 16, className = "" }: { size?: number; className?: string }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor"
    strokeWidth="1.5"
    className={className}
  >
    <path d="M12 2l8.955 5.166v10.268L12 22l-8.955-4.566V7.166L12 2z" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 22V12m0 0L3.045 7.166M12 12l8.955-4.834" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)