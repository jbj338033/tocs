"use client"

interface Variable {
  name: string
  value: string
}

interface VariableDisplayProps {
  text: string
  variables?: Variable[]
  className?: string
}

export function VariableDisplay({ text, variables = [], className = "" }: VariableDisplayProps) {
  const renderText = () => {
    const parts = text.split(/({{[^}]*}})/g)
    return parts.map((part, index) => {
      if (part.match(/^{{.*}}$/)) {
        const varName = part.slice(2, -2)
        const variable = variables.find(v => v.name === varName)
        return (
          <span
            key={index}
            className="inline-flex items-center px-2 py-0.5 mx-0.5 rounded-md text-xs font-medium text-white shadow-sm"
            style={{ backgroundColor: '#5865F2' }}
            title={variable ? `${varName}: ${variable.value}` : varName}
          >
            {part}
          </span>
        )
      }
      return <span key={index}>{part}</span>
    })
  }

  return (
    <div className={className}>
      {renderText()}
    </div>
  )
}