"use client"

import { useState, useEffect, useRef } from "react"
import { Endpoint } from "@/entities/folder"
import { VariableInput } from "@/shared/ui/components/VariableInput"
import { Play, Square, Trash2, Circle, Filter, Download, Square as PauseIcon } from "@/shared/ui/icons"
import { DetailButton, ProtocolBadge, ConnectionStatus, IconButton } from "@/shared/ui/components"
import { Variable } from "@/entities/variable"
import { Project } from "@/entities/project"
import { interpolateVariables } from "@/shared/lib/variables"
import { UnifiedProtocolDetail, RequestSection, ResponseSection, KeyValueEditor } from "./UnifiedProtocolDetail"
import { useProjectStore } from "@/shared/stores"

interface SSEEndpointDetailProps {
  projectId: string
  endpoint: Endpoint
  variables?: Variable[]
  project?: Project
  isReadOnly?: boolean
}

interface SSEEvent {
  id: string
  eventType: string
  data: string
  eventId?: string
  retry?: number
  timestamp: Date
}

export function SSEEndpointDetail({ projectId, endpoint, variables = [], project, isReadOnly = false }: SSEEndpointDetailProps) {
  const { getSelectedServerUrl } = useProjectStore()
  const [sseUrl, setSseUrl] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [events, setEvents] = useState<SSEEvent[]>([])
  const [activeTab, setActiveTab] = useState<'events' | 'headers' | 'filters'>('events')
  const [headers, setHeaders] = useState<Array<{ key: string; value: string; enabled: boolean }>>([
    { key: 'Accept', value: 'text/event-stream', enabled: true }
  ])
  const [eventFilters, setEventFilters] = useState<Array<{ id: string; eventType: string; enabled: boolean }>>([])
  const [showAllEvents, setShowAllEvents] = useState(true)
  const [autoScroll, setAutoScroll] = useState(true)
  const eventSourceRef = useRef<EventSource | null>(null)
  const eventsEndRef = useRef<HTMLDivElement>(null)
  const eventIdCounter = useRef(0)
  const filterIdCounter = useRef(0)

  useEffect(() => {
    const url = endpoint.path || '/events'
    setSseUrl(url)
  }, [endpoint])

  useEffect(() => {
    if (autoScroll) {
      eventsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [events, autoScroll])

  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }
    }
  }, [])

  const getServerUrl = () => {
    const selectedUrl = getSelectedServerUrl()
    if (selectedUrl) {
      return selectedUrl
    }
    if (project?.servers && project.servers.length > 0) {
      return project.servers[0].url
    }
    return ''
  }

  const buildEventSourceUrl = () => {
    const serverUrl = interpolateVariables(getServerUrl(), variables)
    const path = interpolateVariables(sseUrl, variables)
    return new URL(path, serverUrl).toString()
  }

  const replaceVariables = (text: string): string => {
    return interpolateVariables(text, variables)
  }

  const handleConnect = () => {
    if (isConnected) {
      handleDisconnect()
      return
    }

    try {
      const url = buildEventSourceUrl()
      addEvent('system', 'Connecting to SSE endpoint...', 'connecting')
      
      // Build headers
      const enabledHeaders: Record<string, string> = {}
      headers.forEach(header => {
        if (header.enabled && header.key) {
          enabledHeaders[header.key] = replaceVariables(header.value)
        }
      })
      
      // EventSource doesn't support custom headers directly
      // If custom headers are needed, consider using fetch with ReadableStream
      const hasCustomHeaders = Object.keys(enabledHeaders).length > 1 || !enabledHeaders['Accept']
      
      if (hasCustomHeaders) {
        addEvent('system', 'Warning: EventSource API does not support custom headers. Consider using a proxy or server-side solution.', 'warning')
      }
      
      const eventSource = new EventSource(url)
      
      eventSource.onopen = () => {
        setIsConnected(true)
        addEvent('system', 'Connected to SSE endpoint', 'connected')
      }
      
      eventSource.onmessage = (event) => {
        if (!isPaused) {
          addEvent('message', event.data)
        }
      }
      
      eventSource.onerror = (error) => {
        addEvent('system', 'SSE connection error', 'error')
        if (eventSource.readyState === EventSource.CLOSED) {
          setIsConnected(false)
        }
      }
      
      eventFilters.filter(f => f.enabled).forEach(filter => {
        eventSource.addEventListener(filter.eventType, (event: any) => {
          if (!isPaused) {
            addEvent(filter.eventType, event.data, event.lastEventId)
          }
        })
      })
      
      eventSourceRef.current = eventSource
      
    } catch (error) {
      addEvent('system', `Failed to connect: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error')
    }
  }

  const handleDisconnect = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
    setIsConnected(false)
    setIsPaused(false)
    addEvent('system', 'Disconnected from SSE endpoint', 'disconnected')
  }


  const addEvent = (eventType: string, data: string, eventId?: string, retry?: number) => {
    const newEvent: SSEEvent = {
      id: `event-${eventIdCounter.current++}`,
      eventType,
      data,
      eventId,
      retry,
      timestamp: new Date()
    }
    setEvents(prev => [...prev, newEvent])
  }

  const clearEvents = () => {
    setEvents([])
  }

  const togglePause = () => {
    setIsPaused(!isPaused)
  }

  const exportEvents = () => {
    const data = JSON.stringify(events, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sse-events-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const addEventFilter = () => {
    setEventFilters([...eventFilters, { 
      id: `filter-${filterIdCounter.current++}`,
      eventType: '', 
      enabled: true 
    }])
  }

  const updateEventFilter = (index: number, field: 'eventType' | 'enabled', value: string | boolean) => {
    const newFilters = [...eventFilters]
    newFilters[index] = { ...newFilters[index], [field]: value }
    setEventFilters(newFilters)
  }

  const removeEventFilter = (index: number) => {
    setEventFilters(eventFilters.filter((_, i) => i !== index))
  }

  const addHeader = () => {
    setHeaders([...headers, { key: '', value: '', enabled: true }])
  }

  const updateHeader = (index: number, field: 'key' | 'value' | 'enabled' | 'description', value: string | boolean) => {
    const newHeaders = [...headers]
    newHeaders[index] = { ...newHeaders[index], [field]: value }
    setHeaders(newHeaders)
  }

  const removeHeader = (index: number) => {
    setHeaders(headers.filter((_, i) => i !== index))
  }

  const filteredEvents = showAllEvents 
    ? events 
    : events.filter(event => {
        const enabledFilters = eventFilters.filter(f => f.enabled && f.eventType)
        if (enabledFilters.length === 0) return true
        return enabledFilters.some(f => event.eventType === f.eventType) || event.eventType === 'system'
      })

  const EventsContent = (
    <RequestSection>
      <div className="h-full flex flex-col">
        <div className="p-3 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[12px] text-gray-600">
              {filteredEvents.length} events
            </span>
            <label className="flex items-center gap-1.5 text-[11px] text-gray-600">
              <input
                type="checkbox"
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
                className="w-3 h-3 rounded border-gray-200 text-[#0064FF] focus:ring-0"
              />
              Auto-scroll
            </label>
          </div>
          
          <div className="flex items-center gap-1">
            {isConnected && (
              <IconButton
                onClick={togglePause}
                title={isPaused ? "Resume" : "Pause"}
                size="sm"
              >
                {isPaused ? <Play size={12} /> : <PauseIcon size={12} />}
              </IconButton>
            )}
            <IconButton
              onClick={exportEvents}
              title="Export events"
              size="sm"
            >
              <Download size={12} />
            </IconButton>
            <IconButton
              onClick={clearEvents}
              title="Clear events"
              size="sm"
            >
              <Trash2 size={12} />
            </IconButton>
          </div>
        </div>
        
        <div className="flex-1 overflow-auto p-4 bg-gray-50">
          {filteredEvents.length === 0 ? (
            <div className="text-center py-12 text-[12px] text-gray-400">
              No events yet. Connect to start receiving events.
            </div>
          ) : (
            <div className="space-y-2">
              {filteredEvents.map(event => (
                <SSEEventItem key={event.id} event={event} />
              ))}
              <div ref={eventsEndRef} />
            </div>
          )}
        </div>
      </div>
    </RequestSection>
  )

  const HeadersContent = (
    <RequestSection>
      <KeyValueEditor
        items={headers}
        onAdd={addHeader}
        onUpdate={updateHeader}
        onRemove={removeHeader}
        addLabel="+ Add Header"
        keyPlaceholder="Header name"
        valuePlaceholder="Value"
        isReadOnly={isReadOnly}
      />
    </RequestSection>
  )

  const FiltersContent = (
    <RequestSection>
      <div className="p-4">
        <h4 className="text-[12px] font-medium text-gray-700 mb-3">Event Type Filters</h4>
        <p className="text-[11px] text-gray-500 mb-4">
          Filter which event types to listen for. Leave empty to receive all events.
        </p>
        
        <div className="mb-4">
          <label className="flex items-center gap-2 text-[12px] text-gray-700">
            <input
              type="checkbox"
              checked={showAllEvents}
              onChange={(e) => setShowAllEvents(e.target.checked)}
              className="w-3.5 h-3.5 rounded border-gray-200 text-[#0064FF] focus:ring-0"
            />
            Show all event types
          </label>
        </div>
        
        <div className="space-y-2 mb-4">
          {eventFilters.map((filter, index) => (
            <div key={filter.id} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={filter.enabled}
                onChange={(e) => updateEventFilter(index, 'enabled', e.target.checked)}
                disabled={showAllEvents}
                className="w-3.5 h-3.5 rounded border-gray-200 text-[#0064FF] focus:ring-0 disabled:opacity-50"
              />
              <input
                type="text"
                value={filter.eventType}
                onChange={(e) => updateEventFilter(index, 'eventType', e.target.value)}
                placeholder="Event type (e.g., update, notification)"
                disabled={showAllEvents}
                className="flex-1 px-2.5 py-1.5 text-[12px] bg-gray-50 hover:bg-white focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0064FF] border border-transparent hover:border-gray-100 focus:border-[#0064FF] rounded transition-all disabled:opacity-50"
              />
              <button
                onClick={() => removeEventFilter(index)}
                className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-all"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        
        <button
          onClick={addEventFilter}
          disabled={showAllEvents}
          className="text-[12px] text-[#0064FF] hover:text-[#0050C8] font-medium disabled:opacity-50"
        >
          + Add Event Filter
        </button>
      </div>
    </RequestSection>
  )

  const requestTabs = [
    {
      id: 'events',
      label: 'Events',
      content: EventsContent
    },
    {
      id: 'headers',
      label: 'Headers',
      content: HeadersContent
    },
    {
      id: 'filters',
      label: 'Filters',
      content: FiltersContent
    }
  ]

  return (
    <UnifiedProtocolDetail
      protocol={<ProtocolBadge protocol="SSE" />}
      url={
        <VariableInput
          value={sseUrl}
          onChange={isConnected || isReadOnly ? () => {} : setSseUrl}
          variables={variables}
          placeholder="/events or /stream"
          className={`w-full px-3 py-1.5 text-[13px] border border-gray-100 rounded bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0064FF] focus:border-[#0064FF] ${isConnected || isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
          isReadOnly={isReadOnly}
        />
      }
      headerActions={
        <>
          <Circle size={14} className={isConnected ? 'text-green-500 animate-pulse' : 'text-gray-400'} />
          <ConnectionStatus isConnected={isConnected} />
          <DetailButton
            onClick={handleConnect}
            variant={isConnected ? 'danger' : 'primary'}
            disabled={isReadOnly}
          >
            {isConnected ? (
              <>
                <Square size={12} />
                Disconnect
              </>
            ) : (
              <>
                <Play size={12} />
                Connect
              </>
            )}
          </DetailButton>
        </>
      }
      requestTabs={requestTabs}
      activeRequestTab={activeTab}
      onRequestTabChange={(id) => setActiveTab(id as any)}
      responseStatus={
        isConnected ? (
          <span className="text-[12px] font-medium text-green-600 flex items-center gap-1">
            <Circle size={10} className="animate-pulse" />
            Streaming
          </span>
        ) : (
          <span className="text-[12px] font-medium text-gray-400">Disconnected</span>
        )
      }
      responseContent={null}
      responseActions={
        isPaused && (
          <span className="text-[11px] text-amber-600 px-2 py-0.5 bg-amber-50 rounded">
            Paused
          </span>
        )
      }
    />
  )
}

function SSEEventItem({ event }: { event: SSEEvent }) {
  const isSystem = event.eventType === 'system'
  
  return (
    <div className={`p-3 rounded-lg border text-[12px] ${
      isSystem ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-100'
    }`}>
      <div className="flex items-center gap-2 mb-1">
        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
          isSystem 
            ? 'bg-gray-200 text-gray-700' 
            : 'bg-blue-100 text-blue-700'
        }`}>
          {event.eventType}
        </span>
        {event.eventId && (
          <span className="text-[11px] text-gray-500 font-mono">
            ID: {event.eventId}
          </span>
        )}
        {event.retry && (
          <span className="text-[11px] text-gray-500">
            Retry: {event.retry}ms
          </span>
        )}
        <span className="text-[11px] text-gray-500 ml-auto">
          {event.timestamp.toLocaleTimeString()}
        </span>
      </div>
      <div className="mt-2">
        <pre className="p-2 bg-gray-50 rounded font-mono text-[11px] text-gray-700 whitespace-pre-wrap overflow-x-auto">
          {event.data}
        </pre>
      </div>
    </div>
  )
}