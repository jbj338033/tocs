"use client"

import Editor from "@monaco-editor/react"

interface JsonEditorProps {
  value: string
  onChange: (value: string | undefined) => void
  height?: string
  readOnly?: boolean
  theme?: 'light' | 'vs-dark'
}

export function JsonEditor({ 
  value, 
  onChange, 
  height = "300px",
  readOnly = false,
  theme = 'light'
}: JsonEditorProps) {
  return (
    <Editor
      height={height}
      defaultLanguage="json"
      value={value}
      onChange={onChange}
      theme={theme === 'light' ? 'light' : 'vs-dark'}
      options={{
        minimap: { enabled: false },
        formatOnType: true,
        formatOnPaste: true,
        automaticLayout: true,
        scrollBeyondLastLine: false,
        readOnly,
        tabSize: 2,
        wordWrap: 'on',
        lineNumbers: 'on',
        folding: true,
        renderLineHighlight: 'all',
        scrollbar: {
          vertical: 'auto',
          horizontal: 'auto'
        }
      }}
    />
  )
}