"use client"

import { useState, useEffect, useRef } from "react"
import mqtt, { MqttClient } from "mqtt"
import { Endpoint } from "@/entities/folder"
import { VariableInput } from "@/shared/ui/components/VariableInput"
import { Play, Square, Send, Trash2, Plus, X, Circle, Lock } from "@/shared/ui/icons"
import { DetailButton, ProtocolBadge, ConnectionStatus, IconButton } from "@/shared/ui/components"
import { Variable } from "@/entities/variable"
import { Project } from "@/entities/project"
import { interpolateVariables } from "@/shared/lib/variables"
import { UnifiedProtocolDetail, RequestSection, ResponseSection } from "./UnifiedProtocolDetail"
import { useProjectStore } from "@/shared/stores"

interface MQTTEndpointDetailProps {
  projectId: string
  endpoint: Endpoint
  variables: Variable[]
  project: Project
}

interface MQTTMessage {
  id: string
  type: 'published' | 'received' | 'system'
  topic: string
  payload?: string
  qos?: number
  retained?: boolean
  timestamp: Date
}

export function MQTTEndpointDetail({ projectId, endpoint, variables, project }: MQTTEndpointDetailProps) {
  const { getSelectedServerUrl } = useProjectStore()
  const [mqttUrl, setMqttUrl] = useState('')
  const [clientId, setClientId] = useState(`tocs-${Date.now()}`)
  const [isConnected, setIsConnected] = useState(false)
  const [messages, setMessages] = useState<MQTTMessage[]>([])
  const [activeTab, setActiveTab] = useState<'publish' | 'subscribe' | 'settings'>('publish')
  
  const [publishTopic, setPublishTopic] = useState('')
  const [publishPayload, setPublishPayload] = useState('')
  const [publishQos, setPublishQos] = useState<0 | 1 | 2>(0)
  const [publishRetain, setPublishRetain] = useState(false)
  
  const [subscriptions, setSubscriptions] = useState<Array<{ id: string; topic: string; qos: 0 | 1 | 2; enabled: boolean }>>([])
  
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [keepAlive, setKeepAlive] = useState('60')
  const [cleanSession, setCleanSession] = useState(true)
  const [useTls, setUseTls] = useState(false)
  
  const mqttRef = useRef<MqttClient | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const url = endpoint.wsUrl || endpoint.path || 'mqtt://localhost:1883'
    setMqttUrl(url)
  }, [endpoint])

  const getServerUrl = () => {
    const selectedUrl = getSelectedServerUrl()
    if (selectedUrl) {
      const isTls = selectedUrl.startsWith('https:')
      return selectedUrl.replace(/^https?:/, isTls ? 'mqtts:' : 'mqtt:')
    }
    if (project?.servers && project.servers.length > 0) {
      const url = project.servers[0].url
      const isTls = url.startsWith('https:')
      return url.replace(/^https?:/, isTls ? 'mqtts:' : 'mqtt:')
    }
    return ''
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    return () => {
      if (mqttRef.current && mqttRef.current.connected) {
        mqttRef.current.end(true)
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
      let fullUrl = replaceVariables(mqttUrl)
      
      if (!fullUrl.startsWith('mqtt://') && !fullUrl.startsWith('mqtts://') && !fullUrl.startsWith('ws://') && !fullUrl.startsWith('wss://')) {
        const serverUrl = getServerUrl()
        fullUrl = new URL(fullUrl, serverUrl).toString()
      }
      
      addMessage('system', 'Connecting', `Connecting to MQTT broker with client ID: ${clientId}`)
      
      const options: mqtt.IClientOptions = {
        clientId: replaceVariables(clientId),
        username: username ? replaceVariables(username) : undefined,
        password: password ? replaceVariables(password) : undefined,
        keepalive: parseInt(keepAlive),
        clean: cleanSession,
        reconnectPeriod: 5000,
        connectTimeout: 30000,
        protocol: useTls ? 'mqtts' : 'mqtt'
      }
      
      const client = mqtt.connect(fullUrl, options)
      
      client.on('connect', () => {
        setIsConnected(true)
        addMessage('system', 'Connected', 'Successfully connected to MQTT broker')
        
        subscriptions.filter(s => s.enabled).forEach(sub => {
          if (sub.topic) {
            client.subscribe(sub.topic, { qos: sub.qos }, (err) => {
              if (err) {
                addMessage('system', 'Error', `Failed to subscribe to ${sub.topic}: ${err.message}`)
              } else {
                addMessage('system', sub.topic, `Subscribed to topic (QoS ${sub.qos})`)
              }
            })
          }
        })
      })
      
      client.on('error', (error) => {
        addMessage('system', 'Error', `MQTT error: ${error.message}`)
        setIsConnected(false)
      })
      
      client.on('close', () => {
        addMessage('system', 'Disconnected', 'Connection closed')
        setIsConnected(false)
      })
      
      client.on('offline', () => {
        addMessage('system', 'Offline', 'Client is offline')
      })
      
      client.on('message', (topic, message, packet) => {
        addMessage('received', topic, message.toString(), packet.qos, packet.retain)
      })
      
      mqttRef.current = client
    } catch (error) {
      addMessage('system', 'Error', `Failed to connect: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleDisconnect = () => {
    if (mqttRef.current) {
      mqttRef.current.end(true, () => {
        setIsConnected(false)
        addMessage('system', 'Disconnected', 'Disconnected from MQTT broker')
      })
      mqttRef.current = null
    }
  }

  const handlePublish = () => {
    if (!mqttRef.current || !mqttRef.current.connected || !publishTopic || !publishPayload) return

    const topic = replaceVariables(publishTopic)
    const payload = replaceVariables(publishPayload)
    
    mqttRef.current.publish(topic, payload, {
      qos: publishQos,
      retain: publishRetain
    }, (error) => {
      if (error) {
        addMessage('system', 'Error', `Failed to publish: ${error.message}`)
      } else {
        addMessage('published', publishTopic, payload, publishQos, publishRetain)
        setPublishPayload('')
      }
    })
  }

  const matchTopic = (pattern: string, topic: string): boolean => {
    return pattern === topic || pattern === '#' || 
           (pattern.endsWith('/#') && topic.startsWith(pattern.slice(0, -2)))
  }

  const handleSubscribe = (topic: string, qos: 0 | 1 | 2) => {
    if (!mqttRef.current || !mqttRef.current.connected || !topic) return
    
    mqttRef.current.subscribe(replaceVariables(topic), { qos }, (err) => {
      if (err) {
        addMessage('system', 'Error', `Failed to subscribe to ${topic}: ${err.message}`)
      } else {
        addMessage('system', topic, `Subscribed to topic (QoS ${qos})`)
      }
    })
  }

  const handleUnsubscribe = (topic: string) => {
    if (!mqttRef.current || !mqttRef.current.connected || !topic) return
    
    mqttRef.current.unsubscribe(replaceVariables(topic), (err) => {
      if (err) {
        addMessage('system', 'Error', `Failed to unsubscribe from ${topic}: ${err.message}`)
      } else {
        addMessage('system', topic, 'Unsubscribed from topic')
      }
    })
  }

  const addMessage = (
    type: MQTTMessage['type'], 
    topic: string, 
    payload?: string,
    qos?: number,
    retained?: boolean
  ) => {
    const newMessage: MQTTMessage = {
      id: Date.now().toString(),
      type,
      topic,
      payload,
      qos,
      retained,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, newMessage])
  }

  const addSubscription = () => {
    setSubscriptions([...subscriptions, { 
      id: Date.now().toString(),
      topic: '', 
      qos: 0,
      enabled: true 
    }])
  }

  const updateSubscription = (index: number, field: 'topic' | 'qos' | 'enabled', value: string | number | boolean) => {
    const newSubs = [...subscriptions]
    newSubs[index] = { ...newSubs[index], [field]: value }
    setSubscriptions(newSubs)
    
    if (field === 'enabled' && isConnected) {
      if (value) {
        handleSubscribe(newSubs[index].topic, newSubs[index].qos)
      } else {
        handleUnsubscribe(newSubs[index].topic)
      }
    }
  }

  const removeSubscription = (index: number) => {
    const sub = subscriptions[index]
    if (isConnected && sub.enabled) {
      handleUnsubscribe(sub.topic)
    }
    setSubscriptions(subscriptions.filter((_, i) => i !== index))
  }

  const clearMessages = () => {
    setMessages([])
  }

  const PublishContent = (
    <RequestSection>
      <div className="p-4 space-y-4">
        <div>
          <label className="text-[11px] font-medium text-gray-500 uppercase mb-1 block">Topic</label>
          <input
            type="text"
            value={publishTopic}
            onChange={(e) => setPublishTopic(e.target.value)}
            placeholder="sensors/temperature or home/+/status"
            className="w-full px-3 py-1.5 text-[12px] border border-gray-100 rounded focus:outline-none focus:ring-1 focus:ring-[#0064FF] focus:border-[#0064FF]"
          />
        </div>
        
        <div>
          <label className="text-[11px] font-medium text-gray-500 uppercase mb-1 block">Payload</label>
          <VariableInput
            value={publishPayload}
            onChange={setPublishPayload}
            placeholder='{"temperature": 23.5, "humidity": 45}'
            variables={variables}
            multiline
            className="w-full h-[150px] p-3 font-mono text-[12px] resize-none border border-gray-100 rounded focus:outline-none focus:ring-1 focus:ring-[#0064FF] focus:border-[#0064FF] bg-gray-50 focus:bg-white"
          />
        </div>
        
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="text-[11px] font-medium text-gray-500 uppercase mb-1 block">QoS</label>
            <select
              value={publishQos}
              onChange={(e) => setPublishQos(Number(e.target.value) as 0 | 1 | 2)}
              className="w-full px-3 py-1.5 text-[12px] border border-gray-100 rounded focus:outline-none focus:ring-1 focus:ring-[#0064FF] focus:border-[#0064FF]"
            >
              <option value="0">0 - At most once</option>
              <option value="1">1 - At least once</option>
              <option value="2">2 - Exactly once</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <label className="flex items-center gap-2 text-[12px] text-gray-700">
              <input
                type="checkbox"
                checked={publishRetain}
                onChange={(e) => setPublishRetain(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-gray-200 text-[#0064FF] focus:ring-0"
              />
              Retain
            </label>
          </div>
        </div>
        
        <DetailButton
          onClick={handlePublish}
          disabled={!isConnected || !publishTopic || !publishPayload}
          className="w-full"
        >
          <Send size={12} />
          Publish Message
        </DetailButton>
      </div>
    </RequestSection>
  )

  const SubscribeContent = (
    <RequestSection>
      <div className="p-4">
        <h4 className="text-[12px] font-medium text-gray-700 mb-3">Subscriptions</h4>
        <p className="text-[11px] text-gray-500 mb-4">
          Subscribe to topics using wildcards: + (single level) and # (multi level)
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
                value={sub.topic}
                onChange={(e) => updateSubscription(index, 'topic', e.target.value)}
                placeholder="sensors/+/temperature or home/#"
                className="flex-1 px-2.5 py-1.5 text-[12px] bg-gray-50 hover:bg-white focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0064FF] border border-transparent hover:border-gray-100 focus:border-[#0064FF] rounded transition-all"
              />
              <select
                value={sub.qos}
                onChange={(e) => updateSubscription(index, 'qos', Number(e.target.value))}
                className="px-2 py-1.5 text-[11px] border border-gray-100 rounded focus:outline-none focus:ring-1 focus:ring-[#0064FF] focus:border-[#0064FF]"
              >
                <option value="0">QoS 0</option>
                <option value="1">QoS 1</option>
                <option value="2">QoS 2</option>
              </select>
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
      </div>
    </RequestSection>
  )

  const SettingsContent = (
    <RequestSection>
      <div className="p-4 space-y-4">
        <div>
          <h4 className="text-[12px] font-medium text-gray-700 mb-3">Connection Settings</h4>
          
          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-medium text-gray-500 mb-1 block">Client ID</label>
              <input
                type="text"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full px-3 py-1.5 text-[12px] border border-gray-100 rounded focus:outline-none focus:ring-1 focus:ring-[#0064FF] focus:border-[#0064FF]"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-medium text-gray-500 mb-1 block">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Optional"
                  className="w-full px-3 py-1.5 text-[12px] border border-gray-100 rounded focus:outline-none focus:ring-1 focus:ring-[#0064FF] focus:border-[#0064FF]"
                />
              </div>
              
              <div>
                <label className="text-[11px] font-medium text-gray-500 mb-1 block">Password</label>
                <VariableInput
                  value={password}
                  onChange={setPassword}
                  placeholder="{{mqtt_password}}"
                  variables={variables}
                  className="w-full px-3 py-1.5 text-[12px] border border-gray-100 rounded focus:outline-none focus:ring-1 focus:ring-[#0064FF] focus:border-[#0064FF]"
                />
              </div>
            </div>
            
            <div>
              <label className="text-[11px] font-medium text-gray-500 mb-1 block">Keep Alive (seconds)</label>
              <input
                type="text"
                value={keepAlive}
                onChange={(e) => setKeepAlive(e.target.value)}
                className="w-full px-3 py-1.5 text-[12px] border border-gray-100 rounded focus:outline-none focus:ring-1 focus:ring-[#0064FF] focus:border-[#0064FF]"
              />
            </div>
            
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[12px] text-gray-700">
                <input
                  type="checkbox"
                  checked={cleanSession}
                  onChange={(e) => setCleanSession(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-gray-200 text-[#0064FF] focus:ring-0"
                />
                Clean Session
              </label>
              
              <label className="flex items-center gap-2 text-[12px] text-gray-700">
                <input
                  type="checkbox"
                  checked={useTls}
                  onChange={(e) => setUseTls(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-gray-200 text-[#0064FF] focus:ring-0"
                />
                <Lock size={12} />
                Use TLS/SSL
              </label>
            </div>
          </div>
        </div>
      </div>
    </RequestSection>
  )

  const requestTabs = [
    {
      id: 'publish',
      label: 'Publish',
      content: PublishContent
    },
    {
      id: 'subscribe',
      label: 'Subscribe',
      content: SubscribeContent
    },
    {
      id: 'settings',
      label: 'Settings',
      content: SettingsContent
    }
  ]

  const MQTTMessageItem = ({ message }: { message: MQTTMessage }) => {
    return (
      <div className={`p-3 rounded-lg border text-[12px] ${
        message.type === 'published' ? 'bg-blue-50 border-blue-100' :
        message.type === 'received' ? 'bg-green-50 border-green-100' :
        'bg-amber-50 border-amber-100'
      }`}>
        <div className="flex items-center gap-2 mb-1">
          <Circle size={10} className={
            message.type === 'published' ? 'text-blue-600' :
            message.type === 'received' ? 'text-green-600' :
            'text-amber-600'
          } />
          <span className="font-mono font-medium text-gray-700">
            {message.topic}
          </span>
          {message.qos !== undefined && (
            <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 rounded">
              QoS {message.qos}
            </span>
          )}
          {message.retained && (
            <span className="text-[10px] px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded">
              Retained
            </span>
          )}
          <span className="text-[11px] text-gray-500 ml-auto">
            {message.timestamp.toLocaleTimeString()}
          </span>
        </div>
        {message.payload && (
          <pre className="mt-2 p-2 bg-white/60 rounded border border-gray-100 font-mono text-[11px] text-gray-700 whitespace-pre-wrap overflow-x-auto">
            {message.payload}
          </pre>
        )}
      </div>
    )
  }

  return (
    <UnifiedProtocolDetail
      protocol={<ProtocolBadge protocol="MQTT" />}
      url={
        <VariableInput
          value={mqttUrl}
          onChange={isConnected ? () => {} : setMqttUrl}
          variables={variables}
          placeholder={useTls ? "mqtts://broker.mqtt.com:8883" : "mqtt://localhost:1883"}
          className={`w-full px-3 py-1.5 text-[13px] border border-gray-100 rounded bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0064FF] focus:border-[#0064FF] ${isConnected ? 'opacity-50 cursor-not-allowed' : ''}`}
        />
      }
      headerActions={
        <>
          {useTls && <Lock size={14} className="text-green-600" />}
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
                No messages yet. Connect and publish or subscribe to topics.
              </div>
            ) : (
              messages.map(message => (
                <MQTTMessageItem key={message.id} message={message} />
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