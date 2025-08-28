"use client";

import { FoldersContent } from "../FoldersContent";
import { useTabStore } from "@/shared/stores";
import { EndpointApi } from "@/entities/folder";

interface EndpointsPanelProps {
  projectId: string;
  isReadOnly?: boolean;
}

export function EndpointsPanel({ projectId, isReadOnly = false }: EndpointsPanelProps) {
  const { activeTabId, tabs, openEndpoint } = useTabStore();
  
  // Get active endpoint ID from tabs
  const activeEndpointId = tabs.find(tab => tab.id === activeTabId && tab.type === 'endpoint')?.endpoint?.id;

  const handleEndpointSelect = async (endpointId: string) => {
    try {
      // Fetch full endpoint data
      const endpoint = await EndpointApi.getEndpoint(projectId, endpointId);
      openEndpoint(endpoint);
    } catch (error) {
      console.error("Failed to load endpoint:", error);
    }
  };

  return (
    <FoldersContent
      projectId={projectId}
      onEndpointSelect={handleEndpointSelect}
      activeEndpointId={activeEndpointId}
      hideActions={true}
      isReadOnly={isReadOnly}
    />
  );
}