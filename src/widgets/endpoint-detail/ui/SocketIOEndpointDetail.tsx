"use client"

import { useState, useEffect, useRef } from "react"
import { Endpoint } from "@/entities/folder"
import { VariableInput } from "@/shared/ui/components/VariableInput"
import { CodeEditor } from "@/shared/ui/components/CodeEditor"
import { Play, Square, Send, Trash2, Zap, Circle, Plus, X } from "@/shared/ui/icons"
import { DetailButton, ProtocolBadge, ConnectionStatus, IconButton } from "@/shared/ui/components"
import { Variable } from "@/entities/variable"
import { Project } from "@/entities/project"
import { interpolateVariables } from "@/shared/lib/variables"
import { UnifiedProtocolDetail, RequestSection, ResponseSection, MessageList } from "./UnifiedProtocolDetail"
import { useProjectStore } from "@/shared/stores"

interface SocketIOEndpointDetailProps {
  projectId: string
  endpoint: Endpoint
  variables: Variable[]
  project: Project
}

interface SocketIOMessage {
  id: string
  type: 'emit' | 'on' | 'system'
  event: string
  data?: unknown
  timestamp: Date
}

export function SocketIOEndpointDetail({ projectId, endpoint, variables, project }: SocketIOEndpointDetailProps) {
  const { getSelectedServerUrl } = useProjectStore()
  const [socketUrl, setSocketUrl] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const [messages, setMessages] = useState<SocketIOMessage[]>([])
  const [eventName, setEventName] = useState('')
  const [eventData, setEventData] = useState('')
  const [listenEvents, setListenEvents] = useState<string[]>(['connect', 'disconnect', 'error'])
  const [newListenEvent, setNewListenEvent] = useState('')
  const [activeTab, setActiveTab] = useState<'emit' | 'listeners'>('emit')
  const socketRef = useRef<any>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const url = endpoint.wsUrl || endpoint.path || 'http://localhost:3000'
    setSocketUrl(url)
  }, [endpoint])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const getServerUrl = () => {
    const selectedUrl = getSelectedServerUrl()
    if (selectedUrl) {
      return selectedUrl
    }
    if (project?.servers && project.servers.length > 0) {
      return project.servers[0].url
    }
    return 'http://localhost:3000'
  }

  const replaceVariables = (text: string): string => {
    return interpolateVariables(text, variables)
  }

  const handleConnect = async () => {
    if (isConnected) {
      handleDisconnect()
      return
    }

    try {
      let fullUrl = replaceVariables(socketUrl)
      
      if (!fullUrl.startsWith('http://') && !fullUrl.startsWith('https://') && !fullUrl.startsWith('ws://') && !fullUrl.startsWith('wss://')) {
        const serverUrl = getServerUrl()
        fullUrl = new URL(fullUrl, serverUrl).toString()
      }
      
      const io = (await import('socket.io-client')).default
      const socket = io(fullUrl, {
        transports: ['websocket', 'polling'],
        reconnection: true,
      })
      
      socket.on('connect', () => {
        setIsConnected(true)
        addMessage('system', 'connect', 'Connected to Socket.IO server')
      })
      
      listenEvents.forEach(event => {
        socket.on(event, (data: unknown) => {
          addMessage('on', event, data)
        })
      })
      
      socket.on('disconnect', () => {
        setIsConnected(false)
        addMessage('system', 'disconnect', 'Disconnected from Socket.IO server')
      })
      
      socket.on('error', (error: unknown) => {
        addMessage('system', 'error', `Socket.IO error: ${error instanceof Error ? error.message : String(error)}`)
      })
      
      socketRef.current = socket
    } catch (error) {
      addMessage('system', 'error', `Failed to connect: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleDisconnect = () => {
    if (socketRef.current) {
      socketRef.current.disconnect()
      socketRef.current = null
    }
  }

  const handleEmit = () => {
    if (!socketRef.current || !socketRef.current.connected || !eventName.trim()) {
      return
    }
    
    try {
      const data = eventData.trim() ? JSON.parse(replaceVariables(eventData)) : undefined
      socketRef.current.emit(eventName, data)
      addMessage('emit', eventName, data)
      setEventData('')
    } catch (error) {
      addMessage('system', 'error', `Failed to emit: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const addMessage = (type: SocketIOMessage['type'], event: string, data?: unknown) => {
    const newMessage: SocketIOMessage = {
      id: Date.now().toString(),
      type,
      event,
      data,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, newMessage])
  }

  const addListenEvent = () => {
    if (newListenEvent.trim() && !listenEvents.includes(newListenEvent)) {
      setListenEvents([...listenEvents, newListenEvent.trim()])
      
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.on(newListenEvent, (data: unknown) => {
          addMessage('on', newListenEvent, data)
        })
      }
      
      setNewListenEvent('')
    }
  }

  const removeListenEvent = (event: string) => {
    setListenEvents(listenEvents.filter(e => e !== event))
    
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.off(event)
    }
  }

  const clearMessages = () => {
    setMessages([])
  }

  const EmitContent = (
    <RequestSection>
      <div className="p-4 space-y-4">
        <div className="space-y-2">
          <label className="text-[12px] font-medium text-gray-700">Event Name</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              placeholder="Event name (e.g., message, chat)"
              className="flex-1 px-3 py-1.5 text-[12px] border border-gray-100 rounded focus:outline-none focus:ring-1 focus:ring-[#0064FF] focus:border-[#0064FF]"
            />
            <DetailButton
              onClick={handleEmit}
              disabled={!isConnected || !eventName.trim()}
              size="sm"
            >
              <Zap size={12} />
              Emit
            </DetailButton>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[12px] font-medium text-gray-700">Event Data (JSON)</label>
          <textarea
            value={eventData}
            onChange={(e) => setEventData(e.target.value)}
            placeholder='{"message": "Hello, world!", "user": "John Doe"}'
            className="w-full h-[150px] p-3 text-[12px] font-mono border border-gray-100 rounded resize-none focus:outline-none focus:ring-1 focus:ring-[#0064FF] focus:border-[#0064FF] bg-gray-50 focus:bg-white"
          />
        </div>

        <div className="pt-2">
          <h5 className="text-[12px] font-medium text-gray-700 mb-2">Quick Templates</h5>
          <div className="flex flex-wrap gap-2">
            <DetailButton
              onClick={() => setEventData('{"message": "Hello!"}')}
              disabled={!isConnected}
              variant="secondary"
              size="sm"
            >
              Simple Message
            </DetailButton>
            <DetailButton
              onClick={() => setEventData(`{"type": "ping", "timestamp": ${Date.now()}}`)}
              disabled={!isConnected}
              variant="secondary"
              size="sm"
            >
              Ping
            </DetailButton>
            <DetailButton
              onClick={() => setEventData('{"action": "subscribe", "channel": "updates"}')}
              disabled={!isConnected}
              variant="secondary"
              size="sm"
            >
              Subscribe
            </DetailButton>
          </div>
        </div>
      </div>
    </RequestSection>
  )

  const ListenersContent = (
    <RequestSection>
      <div className="p-4">
        <div className="space-y-4">
          <div>
            <h4 className="text-[12px] font-medium text-gray-700 mb-3">Event Listeners</h4>
            <p className="text-[11px] text-gray-500 mb-3">
              Configure which events to listen for. Default events (connect, disconnect, error) are always included.
            </p>
            <div className="space-y-2 mb-3">
              {listenEvents.map(event => (
                <div key={event} className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded border border-gray-100">
                  <Circle size={8} className={`fill-current ${isConnected ? 'text-green-500' : 'text-gray-300'}`} />
                  <span className="flex-1 text-[12px] font-mono">{event}</span>
                  {!['connect', 'disconnect', 'error'].includes(event) && (
                    <button
                      onClick={() => removeListenEvent(event)}
                      className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-200 rounded"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            
            <div className="flex gap-2">
              <input
                type="text"
                value={newListenEvent}
                onChange={(e) => setNewListenEvent(e.target.value)}
                  placeholder="Add event to listen (e.g., message, notification)"
                className="flex-1 px-3 py-1.5 text-[12px] border border-gray-100 rounded focus:outline-none focus:ring-1 focus:ring-[#0064FF] focus:border-[#0064FF]"
              />
              <DetailButton
                onClick={addListenEvent}
                disabled={!newListenEvent.trim()}
                size="sm"
              >
                <Plus size={12} />
                Add
              </DetailButton>
            </div>
          </div>
        </div>
      </div>
    </RequestSection>
  )

  const requestTabs = [
    {
      id: 'emit',
      label: 'Emit Events',
      content: EmitContent
    },
    {
      id: 'listeners',
      label: 'Event Listeners',
      content: ListenersContent
    }
  ]

  return (
    <UnifiedProtocolDetail
      protocol={<ProtocolBadge protocol="Socket.IO" />}
      url={
        <VariableInput
          value={socketUrl}
          onChange={isConnected ? () => {} : setSocketUrl}
          variables={variables}
          placeholder="http://localhost:3000"
          className={`w-full px-3 py-1.5 text-[13px] border border-gray-100 rounded bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0064FF] focus:border-[#0064FF] ${isConnected ? 'opacity-50 cursor-not-allowed' : ''}`}
        />
      }
      headerActions={
        <>
          <ConnectionStatus isConnected={isConnected} />
          <DetailButton
            onClick={handleConnect}
            variant={isConnected ? 'danger' : 'primary'}
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
          <span className="text-[12px] font-medium text-green-600">Connected</span>
        ) : (
          <span className="text-[12px] font-medium text-gray-400">Disconnected</span>
        )
      }
      responseContent={
        <ResponseSection>
          <MessageList messages={messages} className="bg-gray-50 -m-4" />
          <div ref={messagesEndRef} />
        </ResponseSection>
      }
      responseActions={
        <IconButton
          onClick={clearMessages}
          title="Clear events"
          size="sm"
        >
          <Trash2 size={12} />
        </IconButton>
      }
    />
  )
}