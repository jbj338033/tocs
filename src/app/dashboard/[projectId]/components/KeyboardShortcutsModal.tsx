"use client"

import { X } from "@/shared/ui/icons"
import { SHORTCUTS } from "@/shared/hooks/useKeyboardShortcuts"

interface KeyboardShortcutsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function KeyboardShortcutsModal({ isOpen, onClose }: KeyboardShortcutsModalProps) {
  if (!isOpen) return null

  const formatKey = (shortcut: any) => {
    const keys = []
    if (shortcut.ctrl) keys.push('Ctrl')
    if (shortcut.meta) keys.push('⌘')
    if (shortcut.shift) keys.push('Shift')
    if (shortcut.alt) keys.push('Alt')
    keys.push(shortcut.key.toUpperCase())
    return keys.join(' + ')
  }

  const shortcuts = [
    { ...SHORTCUTS.NEW_REQUEST, category: 'File' },
    { ...SHORTCUTS.NEW_FOLDER, category: 'File' },
    { ...SHORTCUTS.SAVE, category: 'File' },
    { ...SHORTCUTS.IMPORT, category: 'File' },
    { ...SHORTCUTS.EXPORT, category: 'File' },
    { ...SHORTCUTS.SEND_REQUEST, category: 'Request' },
    { ...SHORTCUTS.COPY_URL, category: 'Request' },
    { ...SHORTCUTS.TOGGLE_SIDEBAR, category: 'View' },
    { ...SHORTCUTS.CLOSE_TAB, category: 'View' },
    { ...SHORTCUTS.SWITCH_TAB, category: 'View' },
    { ...SHORTCUTS.SEARCH, category: 'Navigation' },
    { ...SHORTCUTS.SETTINGS, category: 'Navigation' },
    { ...SHORTCUTS.DUPLICATE, category: 'Edit' },
    { ...SHORTCUTS.DELETE, category: 'Edit' },
    { ...SHORTCUTS.RENAME, category: 'Edit' },
  ]

  const categories = Array.from(new Set(shortcuts.map(s => s.category)))

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Keyboard Shortcuts</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>
        
        <div className="p-4 overflow-y-auto max-h-[calc(80vh-120px)]">
          {categories.map(category => (
            <div key={category} className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">{category}</h3>
              <div className="space-y-2">
                {shortcuts
                  .filter(s => s.category === category)
                  .map((shortcut, index) => (
                    <div key={index} className="flex items-center justify-between py-2 px-3 hover:bg-gray-50 rounded">
                      <span className="text-sm text-gray-600">{shortcut.description}</span>
                      <kbd className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded border border-gray-200 font-mono">
                        {formatKey(shortcut)}
                      </kbd>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
        
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <p className="text-xs text-gray-500 text-center">
            Press <kbd className="px-1.5 py-0.5 text-xs bg-white rounded border border-gray-200 font-mono">?</kbd> to show keyboard shortcuts
          </p>
        </div>
      </div>
    </div>
  )
}