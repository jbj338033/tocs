"use client"

import { useState, useEffect, useRef } from "react"
import { Endpoint } from "@/entities/folder"
import { VariableInput } from "@/shared/ui/components/VariableInput"
import { CodeEditor } from "@/shared/ui/components/CodeEditor"
import { Play, Square, Send, Trash2, Plus, X } from "@/shared/ui/icons"
import { DetailButton, ProtocolBadge, ConnectionStatus, IconButton } from "@/shared/ui/components"
import { Variable } from "@/entities/variable"
import { Project } from "@/entities/project"
import { interpolateVariables } from "@/shared/lib/variables"
import { UnifiedProtocolDetail, RequestSection, ResponseSection, MessageList } from "./UnifiedProtocolDetail"
import { useProjectStore } from "@/shared/stores"

interface WebSocketEndpointDetailProps {
  projectId: string
  endpoint: Endpoint
  variables: Variable[]
  project: Project
}

interface Message {
  id: string
  type: 'sent' | 'received' | 'system'
  content: string
  timestamp: Date
}

export function WebSocketEndpointDetail({ projectId, endpoint, variables, project }: WebSocketEndpointDetailProps) {
  const { getSelectedServerUrl } = useProjectStore()
  const [wsUrl, setWsUrl] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [messageInput, setMessageInput] = useState('')
  const [protocols, setProtocols] = useState<string[]>([])
  const [protocolInput, setProtocolInput] = useState('')
  const [activeTab, setActiveTab] = useState<'messages' | 'settings'>('messages')
  const wsRef = useRef<WebSocket | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messageIdCounter = useRef(0)

  useEffect(() => {
    const url = endpoint.wsUrl || endpoint.path || 'ws://localhost:3000'
    setWsUrl(url)
    
    if (endpoint.wsProtocol) {
      setProtocols(endpoint.wsProtocol.split(',').map(p => p.trim()))
    }
  }, [endpoint])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const getServerUrl = () => {
    const selectedUrl = getSelectedServerUrl()
    if (selectedUrl) {
      return selectedUrl.replace(/^https?:/, 'wss:')
    }
    if (project?.servers && project.servers.length > 0) {
      const url = project.servers[0].url
      return url.replace(/^https?:/, 'wss:')
    }
    return 'ws://localhost:3000'
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
      let fullUrl = replaceVariables(wsUrl)
      
      if (!fullUrl.startsWith('ws://') && !fullUrl.startsWith('wss://')) {
        const serverUrl = getServerUrl()
        fullUrl = new URL(fullUrl, serverUrl).toString()
      }
      
      const ws = protocols.length > 0 
        ? new WebSocket(fullUrl, protocols)
        : new WebSocket(fullUrl)
      
      ws.onopen = () => {
        setIsConnected(true)
        addMessage('system', 'Connected to WebSocket server')
      }
      
      ws.onmessage = (event) => {
        addMessage('received', event.data)
      }
      
      ws.onerror = (error) => {
        addMessage('system', 'WebSocket error occurred')
      }
      
      ws.onclose = () => {
        setIsConnected(false)
        addMessage('system', 'Disconnected from WebSocket server')
      }
      
      wsRef.current = ws
    } catch (error) {
      addMessage('system', `Failed to connect: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleDisconnect = () => {
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
  }

  const handleSendMessage = () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN || !messageInput.trim()) {
      return
    }
    
    const message = replaceVariables(messageInput)
    wsRef.current.send(message)
    addMessage('sent', message)
    setMessageInput('')
  }

  const addMessage = (type: Message['type'], content: string) => {
    const newMessage: Message = {
      id: `msg-${messageIdCounter.current++}`,
      type,
      content,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, newMessage])
  }

  const addProtocol = () => {
    if (protocolInput.trim() && !protocols.includes(protocolInput)) {
      setProtocols([...protocols, protocolInput.trim()])
      setProtocolInput('')
    }
  }

  const removeProtocol = (protocol: string) => {
    setProtocols(protocols.filter(p => p !== protocol))
  }

  const clearMessages = () => {
    setMessages([])
  }

  const MessagesContent = (
    <RequestSection>
      <div className="h-full flex flex-col">
        <div className="p-4 space-y-4 flex-1">
          <div className="space-y-2">
            <label className="text-[12px] font-medium text-gray-700">Send Message</label>
            <div className="h-[120px]">
              <CodeEditor
                value={messageInput}
                onChange={setMessageInput}
                language="json"
                variables={variables}
                height="120px"
              />
            </div>
            <DetailButton
              onClick={handleSendMessage}
              disabled={!isConnected || !messageInput.trim()}
              className="w-full"
            >
              <Send size={12} />
              Send Message
            </DetailButton>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <h4 className="text-[12px] font-medium text-gray-700 mb-3">Statistics</h4>
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-gray-50 rounded border border-gray-100">
                <div className="text-[11px] text-gray-500 uppercase">Total</div>
                <div className="text-[16px] font-semibold text-gray-900 mt-1">{messages.length}</div>
              </div>
              <div className="p-3 bg-blue-50 rounded border border-blue-100">
                <div className="text-[11px] text-blue-600 uppercase">Sent</div>
                <div className="text-[16px] font-semibold text-blue-700 mt-1">
                  {messages.filter(m => m.type === 'sent').length}
                </div>
              </div>
              <div className="p-3 bg-green-50 rounded border border-green-100">
                <div className="text-[11px] text-green-600 uppercase">Received</div>
                <div className="text-[16px] font-semibold text-green-700 mt-1">
                  {messages.filter(m => m.type === 'received').length}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </RequestSection>
  )

  const SettingsContent = (
    <RequestSection>
      <div className="p-4">
        <div className="space-y-4">
          <div>
            <h4 className="text-[12px] font-medium text-gray-700 mb-3">WebSocket Subprotocols</h4>
            <div className="space-y-2 mb-3">
              {protocols.length === 0 ? (
                <p className="text-[12px] text-gray-400 py-2">No subprotocols configured</p>
              ) : (
                protocols.map(protocol => (
                  <div key={protocol} className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded border border-gray-100">
                    <span className="flex-1 text-[12px] font-mono">{protocol}</span>
                    <button
                      onClick={() => removeProtocol(protocol)}
                      disabled={isConnected}
                      className="text-gray-400 hover:text-gray-600 disabled:opacity-50 transition-colors p-1 hover:bg-gray-200 rounded"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={protocolInput}
                onChange={(e) => setProtocolInput(e.target.value)}
                placeholder="Add subprotocol (e.g., chat, json)"
                className="flex-1 px-3 py-1.5 text-[12px] border border-gray-100 rounded focus:outline-none focus:ring-1 focus:ring-[#0064FF] focus:border-[#0064FF]"
              />
              <DetailButton
                onClick={addProtocol}
                disabled={isConnected || !protocolInput.trim()}
                size="sm"
              >
                <Plus size={12} />
                Add
              </DetailButton>
            </div>
            {isConnected && (
              <p className="text-[11px] text-amber-600 mt-3 p-2.5 bg-amber-50 rounded border border-amber-100">
                ⚠️ Disconnect to modify subprotocols
              </p>
            )}
          </div>
        </div>
      </div>
    </RequestSection>
  )

  const requestTabs = [
    {
      id: 'messages',
      label: 'Messages',
      content: MessagesContent
    },
    {
      id: 'settings',
      label: 'Settings',
      content: SettingsContent
    }
  ]

  return (
    <UnifiedProtocolDetail
      protocol={<ProtocolBadge protocol="WebSocket" />}
      url={
        <VariableInput
          value={wsUrl}
          onChange={isConnected ? () => {} : setWsUrl}
          variables={variables}
          placeholder="ws://localhost:3000"
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
          title="Clear messages"
          size="sm"
        >
          <Trash2 size={12} />
        </IconButton>
      }
    />
  )
}