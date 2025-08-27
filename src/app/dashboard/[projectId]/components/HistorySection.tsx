"use client"

import { useState, useEffect } from "react"
import { Clock, User, Globe } from "@/shared/ui/icons"
import { HistoryApi, History } from "@/entities/test"
import { Endpoint } from "@/entities/folder"

export function HistorySection({ projectId, endpoint }: { projectId: string; endpoint: Endpoint }) {
  const [histories, setHistories] = useState<History[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedHistory, setSelectedHistory] = useState<History | null>(null)

  useEffect(() => {
    loadHistories()

    const handleHistoryUpdate = () => {
      loadHistories()
    }

    window.addEventListener('historyUpdated', handleHistoryUpdate)
    
    return () => {
      window.removeEventListener('historyUpdated', handleHistoryUpdate)
    }
  }, [endpoint.id])

  const loadHistories = async () => {
    try {
      setIsLoading(true)
      const data = await HistoryApi.getHistories(projectId, endpoint.id)
      setHistories(data)
    } catch (error) {
      console.error('Failed to load test histories:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (date: Date | string) => {
    const d = new Date(date)
    return d.toLocaleDateString('ko-KR') + ' ' + d.toLocaleTimeString('ko-KR')
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex">
      <div className="w-80 border-r border-gray-200 overflow-y-auto">
        <div className="p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-4">테스트 히스토리</h3>
          {histories.length === 0 ? (
            <p className="text-sm text-gray-500">아직 테스트 기록이 없습니다</p>
          ) : (
            <div className="space-y-2">
              {histories.map((history) => (
                <button
                  key={history.id}
                  onClick={() => setSelectedHistory(history)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selectedHistory?.id === history.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
                      history.status >= 200 && history.status < 300
                        ? 'bg-green-100 text-green-700'
                        : history.status >= 400 && history.status < 500
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {history.status} {history.statusText}
                    </span>
                    <span className="text-xs text-gray-500">{history.responseTime}ms</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600 mt-2">
                    <Clock size={12} />
                    <span>{formatDate(history.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600 mt-1">
                    <User size={12} />
                    <span>{history.user?.name || history.user?.email}</span>
                  </div>
                  {history.variable && (
                    <div className="flex items-center gap-2 text-xs text-gray-600 mt-1">
                      <Globe size={12} />
                      <span className={`px-1.5 py-0.5 rounded bg-${history.variable.color}-100 text-${history.variable.color}-700`}>
                        {history.variable.name}
                      </span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {selectedHistory ? (
          <div className="p-6">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">테스트 상세 정보</h3>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>
                  <Clock size={14} className="inline mr-1" />
                  {formatDate(selectedHistory.createdAt)}
                </span>
                <span>
                  <User size={14} className="inline mr-1" />
                  {selectedHistory.user?.name || selectedHistory.user?.email}
                </span>
              </div>
            </div>

            <div className="mb-8">
              <h4 className="text-sm font-medium text-gray-900 mb-3">요청</h4>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div>
                  <span className="text-xs font-medium text-gray-500">Method</span>
                  <p className="text-sm font-mono mt-1">{selectedHistory.method}</p>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500">URL</span>
                  <p className="text-sm font-mono mt-1 break-all">{selectedHistory.url}</p>
                </div>
                {Object.keys(selectedHistory.headers || {}).length > 0 && (
                  <div>
                    <span className="text-xs font-medium text-gray-500">Headers</span>
                    <pre className="text-sm font-mono mt-1 whitespace-pre-wrap">
                      {JSON.stringify(selectedHistory.headers, null, 2)}
                    </pre>
                  </div>
                )}
                {selectedHistory.body && (
                  <div>
                    <span className="text-xs font-medium text-gray-500">Body</span>
                    <pre className="text-sm font-mono mt-1 whitespace-pre-wrap">
                      {selectedHistory.body}
                    </pre>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">응답</h4>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-4">
                  <div>
                    <span className="text-xs font-medium text-gray-500">Status</span>
                    <p className={`text-sm font-semibold mt-1 ${
                      selectedHistory.status >= 200 && selectedHistory.status < 300
                        ? 'text-green-600'
                        : selectedHistory.status >= 400 && selectedHistory.status < 500
                        ? 'text-yellow-600'
                        : 'text-red-600'
                    }`}>
                      {selectedHistory.status} {selectedHistory.statusText}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-gray-500">Time</span>
                    <p className="text-sm font-semibold mt-1">{selectedHistory.responseTime}ms</p>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-gray-500">Size</span>
                    <p className="text-sm font-semibold mt-1">{selectedHistory.responseSize} bytes</p>
                  </div>
                </div>
                {Object.keys(selectedHistory.responseHeaders || {}).length > 0 && (
                  <div>
                    <span className="text-xs font-medium text-gray-500">Response Headers</span>
                    <pre className="text-sm font-mono mt-1 whitespace-pre-wrap">
                      {JSON.stringify(selectedHistory.responseHeaders, null, 2)}
                    </pre>
                  </div>
                )}
                {selectedHistory.responseBody && (
                  <div>
                    <span className="text-xs font-medium text-gray-500">Response Body</span>
                    <pre className="text-sm font-mono mt-1 whitespace-pre-wrap bg-white p-3 rounded border border-gray-200 max-h-96 overflow-auto">
                      {selectedHistory.responseBody}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <p>히스토리를 선택하여 상세 정보를 확인하세요</p>
          </div>
        )}
      </div>
    </div>
  )
}