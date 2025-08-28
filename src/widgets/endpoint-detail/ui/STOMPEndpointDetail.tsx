"use client"

import { useState, useEffect, useRef } from "react"
import { Client, IFrame } from '@stomp/stompjs'
import { Endpoint } from "@/entities/folder"
import { VariableInput } from "@/shared/ui/components/VariableInput"
import { CodeEditor } from "@/shared/ui/components/CodeEditor"
import { Play, Square, Send, Trash2, Plus, X, Circle } from "@/shared/ui/icons"
import { DetailButton, ProtocolBadge, ConnectionStatus, IconButton } from "@/shared/ui/components"
import { Variable } from "@/entities/variable"
import { Project } from "@/entities/project"
import { interpolateVariables } from "@/shared/lib/variables"
import { UnifiedProtocolDetail, RequestSection, ResponseSection, MessageList, KeyValueEditor } from "./UnifiedProtocolDetail"
import { useProjectStore } from "@/shared/stores"

interface STOMPEndpointDetailProps {
  projectId: string
  endpoint: Endpoint
  variables: Variable[]
  project: Project
}

interface STOMPMessage {
  id: string
  type: 'sent' | 'received' | 'system'
  command?: string
  destination?: string
  headers?: Record<string, string>
  body?: string
  timestamp: Date
}

export function STOMPEndpointDetail({ projectId, endpoint, variables, project }: STOMPEndpointDetailProps) {
  const { getSelectedServerUrl } = useProjectStore()
  const [stompUrl, setStompUrl] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const [messages, setMessages] = useState<STOMPMessage[]>([])
  const [activeTab, setActiveTab] = useState<'send' | 'subscribe' | 'headers'>('send')
  const [destination, setDestination] = useState('')
  const [messageBody, setMessageBody] = useState('')
  const [subscriptions, setSubscriptions] = useState<Array<{ id: string; destination: string; enabled: boolean; subscription?: any }>>([])
  const [headers, setHeaders] = useState<Array<{ key: string; value: string; enabled: boolean }>>([
    { key: 'content-type', value: 'application/json', enabled: true }
  ])
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const stompRef = useRef<Client | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messageIdCounter = useRef(0)
  const subscriptionIdCounter = useRef(0)

  useEffect(() => {
    const url = endpoint.wsUrl || endpoint.path || 'ws://localhost:61614/stomp'
    setStompUrl(url)
  }, [endpoint])

  const getServerUrl = () => {
    const selectedUrl = getSelectedServerUrl()
    if (selectedUrl) {
      return selectedUrl.replace(/^https?:/, 'ws:')
    }
    if (project?.servers && project.servers.length > 0) {
      const url = project.servers[0].url
      return url.replace(/^https?:/, 'ws:')
    }
    return ''
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    return () => {
      if (stompRef.current && stompRef.current.connected) {
        stompRef.current.deactivate()
      }
    }
  }, [])

  const replaceVariables = (text: string): string => {
    return interpolateVariables(text, variables)
  }

  const handleConnect = async () => {
    if (isConnected) {
      handleDisconnect()
      return
    }

    try {
      let fullUrl = replaceVariables(stompUrl)
      
      if (!fullUrl.startsWith('ws://') && !fullUrl.startsWith('wss://')) {
        const serverUrl = getServerUrl()
        fullUrl = new URL(fullUrl, serverUrl).toString()
      }
      
      addMessage('system', 'CONNECT', undefined, 'Connecting to STOMP broker...')
      
      const client = new Client({
        brokerURL: fullUrl,
        connectHeaders: {
          login: username,
          passcode: password
        },
        debug: (str) => {
          console.log('[STOMP Debug]', str)
        },
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000
      })
      
      client.onConnect = (frame: IFrame) => {
        setIsConnected(true)
        addMessage('system', 'CONNECTED', undefined, 'Connected to STOMP broker')
        
        subscriptions.filter(s => s.enabled).forEach(sub => {
          if (sub.destination && client.connected) {
            client.subscribe(sub.destination, (message) => {
              addMessage('received', 'MESSAGE', sub.destination, message.body, message.headers as any)
            })
            addMessage('system', 'SUBSCRIBE', sub.destination, `Subscribed to ${sub.destination}`)
          }
        })
      }
      
      client.onStompError = (frame: IFrame) => {
        addMessage('system', 'ERROR', undefined, `STOMP error: ${frame.headers['message'] || frame.body}`)
      }
      
      client.onWebSocketError = (event) => {
        addMessage('system', 'ERROR', undefined, 'WebSocket connection error')
        setIsConnected(false)
      }
      
      client.onDisconnect = () => {
        addMessage('system', 'DISCONNECT', undefined, 'Disconnected from STOMP broker')
        setIsConnected(false)
      }
      
      client.activate()
      stompRef.current = client
    } catch (error) {
      addMessage('system', 'ERROR', undefined, `Failed to connect: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleDisconnect = () => {
    if (stompRef.current) {
      stompRef.current.deactivate()
      stompRef.current = null
    }
    setIsConnected(false)
    addMessage('system', 'DISCONNECT', undefined, 'Disconnected from STOMP broker')
  }

  const handleSend = () => {
    if (!stompRef.current || !stompRef.current.connected || !destination || !messageBody) return

    const enabledHeaders: Record<string, string> = {}
    headers.forEach(header => {
      if (header.enabled && header.key) {
        enabledHeaders[header.key] = replaceVariables(header.value)
      }
    })

    try {
      stompRef.current.publish({
        destination: replaceVariables(destination),
        body: replaceVariables(messageBody),
        headers: enabledHeaders
      })
      addMessage('sent', 'SEND', destination, messageBody, enabledHeaders)
      setMessageBody('')
    } catch (error) {
      addMessage('system', 'ERROR', undefined, `Failed to send message: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleSubscribe = (dest: string) => {
    if (!stompRef.current || !stompRef.current.connected || !dest) return
    
    try {
      const subscription = stompRef.current.subscribe(replaceVariables(dest), (message) => {
        addMessage('received', 'MESSAGE', dest, message.body, message.headers as any)
      })
      
      setSubscriptions(prev => prev.map(sub => 
        sub.destination === dest ? { ...sub, subscription } : sub
      ))
      
      addMessage('system', 'SUBSCRIBE', dest, 'Subscribed to destination')
    } catch (error) {
      addMessage('system', 'ERROR', undefined, `Failed to subscribe: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleUnsubscribe = (dest: string) => {
    if (!stompRef.current || !stompRef.current.connected || !dest) return
    
    const sub = subscriptions.find(s => s.destination === dest)
    if (sub && sub.subscription) {
      try {
        sub.subscription.unsubscribe()
        addMessage('system', 'UNSUBSCRIBE', dest, 'Unsubscribed from destination')
      } catch (error) {
        addMessage('system', 'ERROR', undefined, `Failed to unsubscribe: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }
  }

  const addMessage = (
    type: STOMPMessage['type'], 
    command?: string, 
    destination?: string,
    body?: string,
    headers?: Record<string, string>
  ) => {
    const newMessage: STOMPMessage = {
      id: `msg-${messageIdCounter.current++}`,
      type,
      command,
      destination,
      body,
      headers,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, newMessage])
  }

  const addSubscription = () => {
    setSubscriptions([...subscriptions, { 
      id: `sub-${subscriptionIdCounter.current++}`,
      destination: '', 
      enabled: true 
    }])
  }

  const updateSubscription = (index: number, field: 'destination' | 'enabled', value: string | boolean) => {
    const newSubs = [...subscriptions]
    newSubs[index] = { ...newSubs[index], [field]: value }
    setSubscriptions(newSubs)
    
    if (field === 'enabled' && isConnected) {
      if (value) {
        handleSubscribe(newSubs[index].destination)
      } else {
        handleUnsubscribe(newSubs[index].destination)
      }
    }
  }

  const removeSubscription = (index: number) => {
    const sub = subscriptions[index]
    if (isConnected && sub.enabled) {
      handleUnsubscribe(sub.destination)
    }
    setSubscriptions(subscriptions.filter((_, i) => i !== index))
  }

  const clearMessages = () => {
    setMessages([])
  }

  const SendContent = (
    <RequestSection>
      <div className="h-full flex flex-col">
        <div className="p-4 space-y-4">
          <div>
            <label className="text-[11px] font-medium text-gray-500 uppercase mb-1 block">Destination</label>
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="/queue/test or /topic/updates"
              className="w-full px-3 py-1.5 text-[12px] border border-gray-100 rounded focus:outline-none focus:ring-1 focus:ring-[#0064FF] focus:border-[#0064FF]"
            />
          </div>
          
          <div className="flex-1">
            <label className="text-[11px] font-medium text-gray-500 uppercase mb-1 block">Message Body</label>
            <div style={{ height: '200px' }}>
              <CodeEditor
                value={messageBody}
                onChange={setMessageBody}
                language="json"
                variables={variables}
              />
            </div>
          </div>
          
          <DetailButton
            onClick={handleSend}
            disabled={!isConnected || !destination || !messageBody}
            className="w-full"
          >
            <Send size={12} />
            Send Message
          </DetailButton>
        </div>
      </div>
    </RequestSection>
  )

  const SubscribeContent = (
    <RequestSection>
      <div className="p-4">
        <h4 className="text-[12px] font-medium text-gray-700 mb-3">Subscriptions</h4>
        <p className="text-[11px] text-gray-500 mb-4">
          Subscribe to queues and topics to receive messages
        </p>
        
        <div className="space-y-2 mb-4">
          {subscriptions.map((sub, index) => (
            <div key={sub.id} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={sub.enabled}
                onChange={(e) => updateSubscription(index, 'enabled', e.target.checked)}
                className="w-3.5 h-3.5 rounded border-gray-200 text-[#0064FF] focus:ring-0"
              />
              <input
                type="text"
                value={sub.destination}
                onChange={(e) => updateSubscription(index, 'destination', e.target.value)}
                placeholder="/queue/orders or /topic/notifications"
                className="flex-1 px-2.5 py-1.5 text-[12px] bg-gray-50 hover:bg-white focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0064FF] border border-transparent hover:border-gray-100 focus:border-[#0064FF] rounded transition-all"
              />
              <button
                onClick={() => removeSubscription(index)}
                className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-all"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        
        <button
          onClick={addSubscription}
          className="text-[12px] text-[#0064FF] hover:text-[#0050C8] font-medium"
        >
          + Add Subscription
        </button>
        
        <div className="mt-6 pt-4 border-t border-gray-100">
          <h5 className="text-[11px] font-medium text-gray-500 uppercase mb-3">Authentication</h5>
          <div className="space-y-3">
            <div>
              <label className="text-[11px] text-gray-500 mb-1 block">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                className="w-full px-3 py-1.5 text-[12px] border border-gray-100 rounded focus:outline-none focus:ring-1 focus:ring-[#0064FF] focus:border-[#0064FF]"
              />
            </div>
            <div>
              <label className="text-[11px] text-gray-500 mb-1 block">Password</label>
              <VariableInput
                value={password}
                onChange={setPassword}
                placeholder="{{stomp_password}}"
                variables={variables}
                className="w-full px-3 py-1.5 text-[12px] border border-gray-100 rounded focus:outline-none focus:ring-1 focus:ring-[#0064FF] focus:border-[#0064FF]"
              />
            </div>
          </div>
        </div>
      </div>
    </RequestSection>
  )

  const HeadersContent = (
    <RequestSection>
      <KeyValueEditor
        items={headers}
        onAdd={() => setHeaders([...headers, { key: '', value: '', enabled: true }])}
        onUpdate={(index, field, value) => {
          const newHeaders = [...headers]
          newHeaders[index] = { ...newHeaders[index], [field]: value }
          setHeaders(newHeaders)
        }}
        onRemove={(index) => setHeaders(headers.filter((_, i) => i !== index))}
        addLabel="+ Add Header"
        keyPlaceholder="Header name"
        valuePlaceholder="Value"
      />
    </RequestSection>
  )

  const requestTabs = [
    {
      id: 'send',
      label: 'Send',
      content: SendContent
    },
    {
      id: 'subscribe',
      label: 'Subscribe',
      content: SubscribeContent
    },
    {
      id: 'headers',
      label: 'Headers',
      content: HeadersContent
    }
  ]

  const STOMPMessageItem = ({ message }: { message: STOMPMessage }) => {
    const getIcon = () => {
      if (message.command === 'SEND' || message.type === 'sent') {
        return <Send size={10} className="text-blue-600" />
      } else if (message.command === 'MESSAGE' || message.type === 'received') {
        return <Circle size={8} className="fill-green-600 text-green-600" />
      }
      return null
    }

    return (
      <div className={`p-3 rounded-lg border text-[12px] ${
        message.type === 'sent' ? 'bg-blue-50 border-blue-100' :
        message.type === 'received' ? 'bg-green-50 border-green-100' :
        'bg-amber-50 border-amber-100'
      }`}>
        <div className="flex items-center gap-2 mb-1">
          {getIcon()}
          <span className="font-mono font-medium text-gray-700">
            {message.command}
          </span>
          {message.destination && (
            <span className="text-[11px] text-gray-500">
              → {message.destination}
            </span>
          )}
          <span className="text-[11px] text-gray-500 ml-auto">
            {message.timestamp.toLocaleTimeString()}
          </span>
        </div>
        {message.headers && Object.keys(message.headers).length > 0 && (
          <div className="mt-2 p-2 bg-white/50 rounded">
            <div className="text-[10px] font-medium text-gray-500 uppercase mb-1">Headers</div>
            {Object.entries(message.headers).map(([key, value]) => (
              <div key={key} className="text-[11px] font-mono">
                <span className="text-gray-500">{key}:</span> {value}
              </div>
            ))}
          </div>
        )}
        {message.body && (
          <pre className="mt-2 p-2 bg-white/60 rounded border border-gray-100 font-mono text-[11px] text-gray-700 whitespace-pre-wrap overflow-x-auto">
            {message.body}
          </pre>
        )}
      </div>
    )
  }

  return (
    <UnifiedProtocolDetail
      protocol={<ProtocolBadge protocol="STOMP" />}
      url={
        <VariableInput
          value={stompUrl}
          onChange={isConnected ? () => {} : setStompUrl}
          variables={variables}
          placeholder="ws://localhost:61614/stomp"
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
          <div className="space-y-2.5 p-4 bg-gray-50 -m-4">
            {messages.length === 0 ? (
              <div className="text-center py-12 text-[12px] text-gray-400">
                No messages yet. Connect and start sending messages.
              </div>
            ) : (
              messages.map(message => (
                <STOMPMessageItem key={message.id} message={message} />
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
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