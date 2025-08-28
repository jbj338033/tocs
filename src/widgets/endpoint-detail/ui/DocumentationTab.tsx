"use client"

import { Endpoint } from "@/entities/folder"
import { RequestSection } from "./UnifiedProtocolDetail"

interface DocumentationTabProps {
  endpoint: Endpoint
  documentation: string
  setDocumentation: (doc: string) => void
}

export function DocumentationTab({ endpoint, documentation, setDocumentation }: DocumentationTabProps) {
  return (
    <RequestSection>
      <div className="p-4">
        <div className="mb-4">
          <label className="text-[12px] font-medium text-gray-700 mb-2 block">Description</label>
          <textarea
            value={documentation}
            onChange={(e) => setDocumentation(e.target.value)}
            placeholder="Describe what this endpoint does..."
            className="w-full h-32 px-3 py-2 text-[12px] border border-gray-100 rounded bg-gray-50 hover:bg-white focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0064FF] focus:border-[#0064FF] resize-none"
          />
        </div>
        
        <div className="space-y-3 text-[11px] text-gray-600">
          <div>
            <span className="font-medium">Type:</span> {endpoint.type || 'HTTP'}
          </div>
          {endpoint.method && (
            <div>
              <span className="font-medium">Method:</span> {endpoint.method}
            </div>
          )}
          <div>
            <span className="font-medium">Path:</span> {endpoint.path || endpoint.wsUrl || '/'}
          </div>
        </div>
      </div>
    </RequestSection>
  )
}