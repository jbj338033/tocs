import { useEffect, useCallback } from 'react'

type KeyboardShortcut = {
  key: string
  ctrl?: boolean
  meta?: boolean
  shift?: boolean
  alt?: boolean
  callback: () => void
  description?: string
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    shortcuts.forEach(shortcut => {
      const { key, ctrl = false, meta = false, shift = false, alt = false, callback } = shortcut
      
      const ctrlMatch = ctrl === (event.ctrlKey || event.metaKey)
      const metaMatch = meta === event.metaKey
      const shiftMatch = shift === event.shiftKey
      const altMatch = alt === event.altKey
      
      const keyMatch = event.key.toLowerCase() === key.toLowerCase()
      
      if (ctrlMatch && metaMatch && shiftMatch && altMatch && keyMatch) {
        event.preventDefault()
        callback()
      }
    })
  }, [shortcuts])
  
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}

export const SHORTCUTS = {
  NEW_REQUEST: { key: 'n', ctrl: true, description: 'New request' },
  NEW_FOLDER: { key: 'f', ctrl: true, shift: true, description: 'New folder' },
  SAVE: { key: 's', ctrl: true, description: 'Save' },
  SEND_REQUEST: { key: 'Enter', ctrl: true, description: 'Send request' },
  TOGGLE_SIDEBAR: { key: 'b', ctrl: true, description: 'Toggle sidebar' },
  SEARCH: { key: 'k', ctrl: true, description: 'Search' },
  IMPORT: { key: 'i', ctrl: true, description: 'Import' },
  EXPORT: { key: 'e', ctrl: true, description: 'Export' },
  SETTINGS: { key: ',', ctrl: true, description: 'Settings' },
  CLOSE_TAB: { key: 'w', ctrl: true, description: 'Close tab' },
  SWITCH_TAB: { key: 'Tab', ctrl: true, description: 'Switch tab' },
  DUPLICATE: { key: 'd', ctrl: true, description: 'Duplicate' },
  DELETE: { key: 'Delete', description: 'Delete' },
  RENAME: { key: 'r', ctrl: true, description: 'Rename' },
  COPY_URL: { key: 'c', ctrl: true, shift: true, description: 'Copy URL' },
}