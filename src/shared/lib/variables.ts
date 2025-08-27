export interface Variable {
  id: string
  key: string
  value: string
}

export function interpolateVariables(text: string, variables: Variable[]): string {
  if (!text || !variables || variables.length === 0) {
    return text
  }

  let result = text
  
  for (const variable of variables) {
    const pattern = new RegExp(`\\{\\{\\s*${variable.key}\\s*\\}\\}`, 'g')
    result = result.replace(pattern, variable.value)
  }
  
  return result
}

export function extractVariables(text: string): string[] {
  if (!text) return []
  
  const matches = text.match(/\{\{\s*([^}]+)\s*\}\}/g)
  if (!matches) return []
  
  return matches.map(match => {
    const variable = match.replace(/\{\{\s*|\s*\}\}/g, '')
    return variable.trim()
  })
}

export function hasVariables(text: string): boolean {
  return /\{\{\s*[^}]+\s*\}\}/.test(text)
}