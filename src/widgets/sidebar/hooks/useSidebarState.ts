import { useState, useCallback } from "react"
import { CategoryType } from "../types"

export function useSidebarState() {
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>("apis")
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const [showProjectMenu, setShowProjectMenu] = useState(false)

  const toggleItem = useCallback((itemId: string) => {
    setExpandedItems(prev => {
      const newExpanded = new Set(prev)
      if (newExpanded.has(itemId)) {
        newExpanded.delete(itemId)
      } else {
        newExpanded.add(itemId)
      }
      return newExpanded
    })
  }, [])

  const expandItem = useCallback((itemId: string) => {
    setExpandedItems(prev => new Set(prev).add(itemId))
  }, [])

  const collapseItem = useCallback((itemId: string) => {
    setExpandedItems(prev => {
      const newExpanded = new Set(prev)
      newExpanded.delete(itemId)
      return newExpanded
    })
  }, [])

  const isExpanded = useCallback((itemId: string) => {
    return expandedItems.has(itemId)
  }, [expandedItems])

  return {
    selectedCategory,
    setSelectedCategory,
    expandedItems,
    toggleItem,
    expandItem,
    collapseItem,
    isExpanded,
    showProjectMenu,
    setShowProjectMenu
  }
}