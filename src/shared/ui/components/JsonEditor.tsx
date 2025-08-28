"use client"

import React from 'react'
import { CodeEditor } from './CodeEditor'

interface JsonEditorProps {
  value: string
  onChange: (value: string) => void
  height?: string
  readOnly?: boolean
}

export function JsonEditor({
  value,
  onChange,
  height = "300px",
  readOnly = false,
}: JsonEditorProps) {
  return (
    <CodeEditor
      value={value}
      onChange={onChange}
      language="json"
      height={height}
      readOnly={readOnly}
    />
  )
}