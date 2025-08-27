import { useEffect, useRef, useCallback } from 'react'

interface UseAutoSaveOptions {
  delay?: number
  enabled?: boolean
  onSave: () => void | Promise<void>
}

export function useAutoSave(data: any, options: UseAutoSaveOptions) {
  const { delay = 1000, enabled = true, onSave } = options
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const previousDataRef = useRef<any>(null)
  const isSavingRef = useRef(false)

  const debouncedSave = useCallback(async () => {
    if (!enabled || isSavingRef.current) return

    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(async () => {
      try {
        isSavingRef.current = true
        await onSave()
        previousDataRef.current = JSON.stringify(data)
      } catch (error) {
        console.error('Auto-save failed:', error)
      } finally {
        isSavingRef.current = false
      }
    }, delay)
  }, [data, delay, enabled, onSave])

  useEffect(() => {
    
    if (previousDataRef.current === undefined) {
      previousDataRef.current = JSON.stringify(data)
      return
    }

    
    const currentData = JSON.stringify(data)
    if (currentData !== previousDataRef.current) {
      debouncedSave()
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [data, debouncedSave])

  
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const saveNow = useCallback(async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    if (!isSavingRef.current) {
      try {
        isSavingRef.current = true
        await onSave()
        previousDataRef.current = JSON.stringify(data)
      } catch (error) {
        console.error('Immediate save failed:', error)
      } finally {
        isSavingRef.current = false
      }
    }
  }, [data, onSave])

  return {
    saveNow,
    isSaving: isSavingRef.current
  }
}