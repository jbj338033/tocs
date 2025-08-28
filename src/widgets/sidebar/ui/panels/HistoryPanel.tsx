"use client";

import { useState, useEffect } from "react";
import { Clock, CheckCircle, XCircle, AlertCircle } from "@/shared/ui/icons";
import { useHistoryStore, useTabStore } from "@/shared/stores";
import { HistoryApi } from "@/entities/test";
import { LoadingState, ErrorMessage } from "@/shared/ui";

interface HistoryPanelProps {
  projectId: string;
  isReadOnly?: boolean;
}

export function HistoryPanel({ projectId, isReadOnly = false }: HistoryPanelProps) {
  const { histories, selectedHistoryId, setHistories, setSelectedHistory } = useHistoryStore();
  const { openEndpoint } = useTabStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadHistories();
    
    const interval = setInterval(() => {
      loadHistories();
    }, 5000);
    
    return () => clearInterval(interval);
  }, [projectId]);

  const loadHistories = async () => {
    try {
      setLoading(histories.length === 0);
      setError(null);
      const data = await HistoryApi.getProjectHistories(projectId);
      setHistories(data);
    } catch (error) {
      console.error("Failed to load histories:", error);
      setError(error instanceof Error ? error.message : "Failed to load test history");
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: number) => {
    if (status < 300) return <CheckCircle size={14} className="text-green-500" />;
    if (status < 400) return <AlertCircle size={14} className="text-yellow-500" />;
    return <XCircle size={14} className="text-red-500" />;
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case "GET":
        return "text-[#0064FF]";
      case "POST":
        return "text-green-600";
      case "PUT":
        return "text-orange-600";
      case "DELETE":
        return "text-red-600";
      case "PATCH":
        return "text-purple-600";
      default:
        return "text-gray-600";
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return "just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  const groupedHistories = histories.reduce((groups: { [key: string]: typeof histories }, history) => {
    const date = formatDate(history.createdAt);
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(history);
    return groups;
  }, {});

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900">History</h3>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <LoadingState message="Loading history..." />
        ) : error ? (
          <ErrorMessage
            title="Failed to load history"
            message={error}
            onRetry={loadHistories}
          />
        ) : histories.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-gray-500">No history yet</p>
            <p className="text-xs text-gray-400 mt-1">Run requests to see them here</p>
          </div>
        ) : (
          <div>
            {Object.entries(groupedHistories).map(([date, dateHistories]) => (
              <div key={date}>
                <div className="px-3 py-2 bg-gray-50 border-b border-gray-100">
                  <span className="text-xs font-medium text-gray-600">{date}</span>
                </div>
                <div className="divide-y divide-gray-100">
                  {dateHistories.map((history) => (
                    <div
                      key={history.id}
                      onClick={() => {
                        setSelectedHistory(history);
                      }}
                      className={`px-3 py-3 hover:bg-gray-50 cursor-pointer transition-colors ${
                        selectedHistoryId === history.id ? "bg-gray-50" : ""
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {getStatusIcon(history.status)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className={`text-xs font-medium ${getMethodColor(history.method)}`}>
                              {history.method}
                            </span>
                            <span className="text-xs text-gray-500">{history.status}</span>
                            <span className="text-xs text-gray-400">{history.responseTime}ms</span>
                          </div>
                          <p className="text-xs text-gray-700 truncate">{history.url}</p>
                          <span className="text-[10px] text-gray-500">{formatTime(history.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}