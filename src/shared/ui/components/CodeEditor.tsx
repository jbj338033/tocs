"use client"

import { Editor } from "@monaco-editor/react"
import { Variable } from "@/entities/variable"

interface CodeEditorProps {
  value: string
  onChange: (value: string) => void
  language: 'json' | 'graphql' | 'javascript' | 'typescript' | 'xml' | 'yaml' | 'html'
  height?: string
  readOnly?: boolean
  variables?: Variable[]
}

export function CodeEditor({
  value,
  onChange,
  language,
  height = "400px",
  readOnly = false,
  variables = [],
}: CodeEditorProps) {

  return (
    <div className="w-full h-full min-h-[200px] border border-gray-100 rounded-lg overflow-hidden bg-white">
      <Editor
        height={height}
        language={language}
        value={value}
        onChange={(v) => onChange(v || '')}
        theme="vs"
        options={{
          minimap: { enabled: false },
          fontSize: 13,
          lineHeight: 20,
          padding: { top: 12, bottom: 12 },
          scrollBeyondLastLine: false,
          readOnly,
          wordWrap: 'on',
          automaticLayout: true,
          renderLineHighlight: 'none',
          lineNumbers: 'on',
          lineNumbersMinChars: 3,
          folding: false,
          glyphMargin: false,
          lineDecorationsWidth: 16,
          scrollbar: {
            vertical: 'auto',
            horizontal: 'auto',
            verticalScrollbarSize: 10,
            horizontalScrollbarSize: 10,
          },
        }}
        beforeMount={(monaco) => {
          monaco.editor.defineTheme('tocs-theme', {
            base: 'vs',
            inherit: true,
            rules: [
              { token: 'string', foreground: '0064FF' },
              { token: 'number', foreground: '0064FF' },
              { token: 'comment', foreground: '6B7280' },
              { token: 'keyword', foreground: '111827' },
            ],
            colors: {
              'editor.background': '#FFFFFF',
              'editor.foreground': '#111827',
              'editor.lineHighlightBackground': '#00000000',
              'editor.selectionBackground': '#0064FF20',
              'editorLineNumber.foreground': '#E5E7EB',
              'editorLineNumber.activeForeground': '#6B7280',
              'editorCursor.foreground': '#0064FF',
              'editorBracketMatch.background': '#0064FF10',
              'editorBracketMatch.border': '#0064FF30',
            }
          })
        }}
        onMount={(editor, monaco) => {
          monaco.editor.setTheme('tocs-theme')
          
          // Format JSON on mount if it's JSON
          if (language === 'json' && value) {
            try {
              const formatted = JSON.stringify(JSON.parse(value), null, 2)
              editor.setValue(formatted)
            } catch {}
          }
        }}
      />
    </div>
  )
}