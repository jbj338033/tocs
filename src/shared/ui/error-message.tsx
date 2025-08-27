import { Button } from "./components"

interface ErrorMessageProps {
  title?: string
  message?: string
  onRetry?: () => void
  className?: string
}

export function ErrorMessage({ 
  title = "Something went wrong", 
  message = "An error occurred while loading data.", 
  onRetry,
  className = ""
}: ErrorMessageProps) {
  return (
    <div className={`text-center py-8 px-4 ${className}`}>
      <div className="text-4xl mb-4">⚠️</div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600 mb-4">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} size="sm">
          Try Again
        </Button>
      )}
    </div>
  )
}