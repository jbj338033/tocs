"use client"

import { Variable } from "@/entities/variable"
import { RequestSection } from "./UnifiedProtocolDetail"
import { interpolateVariables } from "@/shared/lib/variables"

interface Authorization {
  type: 'none' | 'bearer' | 'basic' | 'apikey'
  token?: string
  username?: string
  password?: string
  key?: string
  value?: string
  addTo?: 'header' | 'query'
}

interface AuthorizationTabProps {
  authorization: Authorization
  setAuthorization: (auth: Authorization) => void
  variables?: Variable[]
}

export function AuthorizationTab({ authorization, setAuthorization, variables = [] }: AuthorizationTabProps) {
  return (
    <RequestSection>
      <div className="p-4">
        <div className="mb-4">
          <label className="text-[12px] font-medium text-gray-700 mb-2 block">Type</label>
          <select
            value={authorization.type}
            onChange={(e) => setAuthorization({ ...authorization, type: e.target.value as any })}
            className="w-full px-3 py-1.5 text-[12px] border border-gray-100 rounded bg-white focus:outline-none focus:ring-1 focus:ring-[#0064FF] focus:border-[#0064FF]"
          >
            <option value="none">No Auth</option>
            <option value="bearer">Bearer Token</option>
            <option value="basic">Basic Auth</option>
            <option value="apikey">API Key</option>
          </select>
        </div>
        
        {authorization.type === 'bearer' && (
          <div>
            <label className="text-[12px] font-medium text-gray-700 mb-2 block">Token</label>
            <input
              type="text"
              value={authorization.token || ''}
              onChange={(e) => setAuthorization({ ...authorization, token: e.target.value })}
              placeholder="Enter your bearer token"
              className="w-full px-3 py-1.5 text-[12px] border border-gray-100 rounded bg-gray-50 hover:bg-white focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0064FF] focus:border-[#0064FF]"
            />
          </div>
        )}
        
        {authorization.type === 'basic' && (
          <div className="space-y-3">
            <div>
              <label className="text-[12px] font-medium text-gray-700 mb-2 block">Username</label>
              <input
                type="text"
                value={authorization.username || ''}
                onChange={(e) => setAuthorization({ ...authorization, username: e.target.value })}
                placeholder="Enter username"
                className="w-full px-3 py-1.5 text-[12px] border border-gray-100 rounded bg-gray-50 hover:bg-white focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0064FF] focus:border-[#0064FF]"
              />
            </div>
            <div>
              <label className="text-[12px] font-medium text-gray-700 mb-2 block">Password</label>
              <input
                type="password"
                value={authorization.password || ''}
                onChange={(e) => setAuthorization({ ...authorization, password: e.target.value })}
                placeholder="Enter password"
                className="w-full px-3 py-1.5 text-[12px] border border-gray-100 rounded bg-gray-50 hover:bg-white focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0064FF] focus:border-[#0064FF]"
              />
            </div>
          </div>
        )}
        
        {authorization.type === 'apikey' && (
          <div className="space-y-3">
            <div>
              <label className="text-[12px] font-medium text-gray-700 mb-2 block">Key</label>
              <input
                type="text"
                value={authorization.key || ''}
                onChange={(e) => setAuthorization({ ...authorization, key: e.target.value })}
                placeholder="X-API-Key"
                className="w-full px-3 py-1.5 text-[12px] border border-gray-100 rounded bg-gray-50 hover:bg-white focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0064FF] focus:border-[#0064FF]"
              />
            </div>
            <div>
              <label className="text-[12px] font-medium text-gray-700 mb-2 block">Value</label>
              <input
                type="text"
                value={authorization.value || ''}
                onChange={(e) => setAuthorization({ ...authorization, value: e.target.value })}
                placeholder="Enter API key value"
                className="w-full px-3 py-1.5 text-[12px] border border-gray-100 rounded bg-gray-50 hover:bg-white focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0064FF] focus:border-[#0064FF]"
              />
            </div>
            <div>
              <label className="text-[12px] font-medium text-gray-700 mb-2 block">Add to</label>
              <select
                value={authorization.addTo || 'header'}
                onChange={(e) => setAuthorization({ ...authorization, addTo: e.target.value as any })}
                className="w-full px-3 py-1.5 text-[12px] border border-gray-100 rounded bg-white focus:outline-none focus:ring-1 focus:ring-[#0064FF] focus:border-[#0064FF]"
              >
                <option value="header">Header</option>
                <option value="query">Query Params</option>
              </select>
            </div>
          </div>
        )}
      </div>
    </RequestSection>
  )
}

export function applyAuthorization(
  authorization: Authorization,
  headers: Record<string, string>,
  variables: Variable[] = []
): void {
  if (authorization.type === 'none') return

  switch (authorization.type) {
    case 'bearer':
      if (authorization.token) {
        headers['Authorization'] = `Bearer ${interpolateVariables(authorization.token, variables)}`
      }
      break
    case 'basic':
      if (authorization.username && authorization.password) {
        const credentials = btoa(`${authorization.username}:${authorization.password}`)
        headers['Authorization'] = `Basic ${credentials}`
      }
      break
    case 'apikey':
      if (authorization.key && authorization.value && authorization.addTo === 'header') {
        headers[authorization.key] = interpolateVariables(authorization.value, variables)
      }
      break
  }
}

export type { Authorization }