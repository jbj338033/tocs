"use client"

import { useState, useEffect } from "react"
import { Save, Copy, Trash2 } from "@/shared/ui/icons"
import { JsonEditor } from "@/shared/ui/components/JsonEditor"
import { EditorErrorBoundary } from "@/shared/ui/components/EditorErrorBoundary"
import { Tab } from "@/shared/stores"
import { SchemaApi } from "@/entities/schema"
import { useAutoSave } from "@/shared/hooks/useAutoSave"

interface SchemaTabContentProps {
  tab: Tab
  onUpdate: (tabId: string, updates: Partial<Tab>) => void
  project: any
}

export function SchemaTabContent({ tab, onUpdate, project }: SchemaTabContentProps) {
  const [schemaData, setSchemaData] = useState({
    name: tab.schema?.name || "",
    description: tab.schema?.description || "",
    type: tab.schema?.type || "object",
    schema: tab.schema?.properties ? JSON.stringify(tab.schema.properties, null, 2) : "{}"
  })
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  useEffect(() => {
    if (tab.schema) {
      setSchemaData({
        name: tab.schema.name,
        description: tab.schema.description || "",
        type: tab.schema.type,
        schema: tab.schema.schema
      })
    }
  }, [tab.schema])

  const saveSchema = async () => {
    if (!tab.schema?.id) return
    
    try {
      setIsSaving(true)
      await SchemaApi.updateSchema(project.id, tab.schema.id, {
        name: schemaData.name,
        description: schemaData.description,
        type: schemaData.type as any,
        properties: schemaData.schema ? JSON.parse(schemaData.schema) : undefined
      })
      setLastSaved(new Date())
      onUpdate(tab.id, { isModified: false })
    } catch (error) {
      console.error("Failed to save schema:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const { isSaving: isAutoSaving } = useAutoSave(schemaData, {
    onSave: saveSchema,
    delay: 2000
  })

  const handleSchemaChange = (value: string | undefined) => {
    setSchemaData({ ...schemaData, schema: value || "{}" })
    onUpdate(tab.id, { isModified: true })
  }

  const handleFieldChange = (field: string, value: string) => {
    setSchemaData({ ...schemaData, [field]: value })
    onUpdate(tab.id, { isModified: true })
  }

  const duplicateSchema = async () => {
    if (!tab.schema) return
    
    try {
      const newSchema = await SchemaApi.createSchema(project.id, {
        name: `${schemaData.name} (Copy)`,
        description: schemaData.description,
        type: schemaData.type as any,
        properties: schemaData.schema ? JSON.parse(schemaData.schema) : undefined
      })
      
      // Open the duplicated schema in a new tab
      // This would be handled by the parent component
    } catch (error) {
      console.error("Failed to duplicate schema:", error)
    }
  }

  const deleteSchema = async () => {
    if (!tab.schema?.id || !confirm("Are you sure you want to delete this schema?")) return
    
    try {
      await SchemaApi.deleteSchema(project.id, tab.schema.id)
      // Close the tab - this would be handled by the parent component
    } catch (error) {
      console.error("Failed to delete schema:", error)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <div className="flex-1 mr-4">
          <input
            type="text"
            value={schemaData.name}
            onChange={(e) => handleFieldChange("name", e.target.value)}
            className="text-lg font-medium text-gray-900 bg-transparent border-none outline-none focus:ring-0 w-full"
            placeholder="Schema name"
          />
          <input
            type="text"
            value={schemaData.description}
            onChange={(e) => handleFieldChange("description", e.target.value)}
            className="text-sm text-gray-500 bg-transparent border-none outline-none focus:ring-0 w-full mt-1"
            placeholder="Add a description..."
          />
        </div>
        
        <div className="flex items-center gap-2">
          <select
            value={schemaData.type}
            onChange={(e) => handleFieldChange("type", e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0064FF]"
          >
            <option value="object">Object</option>
            <option value="array">Array</option>
            <option value="string">String</option>
            <option value="number">Number</option>
            <option value="boolean">Boolean</option>
            <option value="enum">Enum</option>
          </select>
          
          <button
            onClick={saveSchema}
            disabled={isSaving || isAutoSaving || !tab.isModified}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-[#0064FF] text-white rounded-lg hover:bg-[#0050C8] disabled:bg-gray-300 transition-colors"
          >
            <Save size={14} />
            Save
          </button>
          
          <button
            onClick={duplicateSchema}
            className="p-1.5 text-gray-600 hover:text-gray-800 transition-colors"
            title="Duplicate schema"
          >
            <Copy size={16} />
          </button>
          
          <button
            onClick={deleteSchema}
            className="p-1.5 text-gray-600 hover:text-red-600 transition-colors"
            title="Delete schema"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Schema Editor */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full p-4">
          <div className="h-full border border-gray-200 rounded-lg overflow-hidden">
            <EditorErrorBoundary>
              <JsonEditor
                value={schemaData.schema}
                onChange={handleSchemaChange}
              />
            </EditorErrorBoundary>
          </div>
        </div>
      </div>

      {/* Status Bar */}
      {(isSaving || isAutoSaving || lastSaved) && (
        <div className="px-6 py-2 border-t border-gray-200 text-xs text-gray-500">
          {isSaving || isAutoSaving ? (
            "Saving..."
          ) : lastSaved ? (
            `Last saved at ${lastSaved.toLocaleTimeString()}`
          ) : null}
        </div>
      )}
    </div>
  )
}