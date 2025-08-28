"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { DndContext, DragEndEvent, closestCenter } from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { OpenAPIImportModal } from "@/features/openapi-import/ui/OpenAPIImportModal";
import { OpenAPIImportService } from "@/features/openapi-import/api/importService";

import { FolderApi, EndpointApi, Folder, Endpoint } from "@/entities/folder";
import { ProjectApi, Project, Server } from "@/entities/project";
import { HistoryApi } from "@/entities/test";
import { VariableApi, Variable } from "@/entities/variable";

import { LoadingState, ErrorMessage, JsonEditor } from "@/shared/ui";
import { VariableUrlInput } from "@/shared/ui/components/VariableUrlInput";
import { ServerSelector } from "@/shared/ui/components/ServerSelector";
import { AutoSaveIndicator } from "@/shared/ui/AutoSaveIndicator";
import { useAutoSave } from "@/shared/hooks/useAutoSave";
import {
  useKeyboardShortcuts,
  SHORTCUTS,
} from "@/shared/hooks/useKeyboardShortcuts";
import {
  useUIStore,
  useTabStore,
  useFolderStore,
  useSchemaStore,
  useVariableStore,
  useProjectStore,
  Tab,
} from "@/shared/stores";
import {
  Plus,
  Folder as FolderIcon,
  Code,
  Save,
  Trash2,
  Send,
  FileCode,
  Settings,
} from "@/shared/ui/icons";
import { HTTPEndpointDetail } from "@/widgets/endpoint-detail/ui/HTTPEndpointDetail";
import { GraphQLEndpointDetail } from "@/widgets/endpoint-detail/ui/GraphQLEndpointDetail";
import { WebSocketEndpointDetail } from "@/widgets/endpoint-detail/ui/WebSocketEndpointDetail";
import { SocketIOEndpointDetail } from "@/widgets/endpoint-detail/ui/SocketIOEndpointDetail";
import { GRPCEndpointDetail } from "@/widgets/endpoint-detail/ui/GRPCEndpointDetail";
import { STOMPEndpointDetail } from "@/widgets/endpoint-detail/ui/STOMPEndpointDetail";
import { MQTTEndpointDetail } from "@/widgets/endpoint-detail/ui/MQTTEndpointDetail";
import { SSEEndpointDetail } from "@/widgets/endpoint-detail/ui/SSEEndpointDetail";
import { FolderModal } from "./components/FolderModal";
import { SettingsModal } from "./components/SettingsModal";
import { ShareModal } from "./components/ShareModal";
import { SchemaTabContent } from "./components/SchemaTabContent";
import { SchemaModal } from "./components/SchemaModal";
import { NewEndpointModal } from "./components/NewEndpointModal";
import { DocsSection } from "./components/DocsSection";
import { ResponseViewer } from "./components/ResponseViewer";
import { Sidebar } from "@/widgets/sidebar";
import { ExportModal } from "@/features/export";
import { KeyboardShortcutsModal } from "./components/KeyboardShortcutsModal";

const httpMethods = [
  { value: "GET", label: "GET" },
  { value: "POST", label: "POST" },
  { value: "PUT", label: "PUT" },
  { value: "DELETE", label: "DELETE" },
  { value: "PATCH", label: "PATCH" },
  { value: "HEAD", label: "HEAD" },
  { value: "OPTIONS", label: "OPTIONS" },
];

export default function Dashboard() {
  const params = useParams();
  const projectId = params?.projectId as string;
  const { data: session } = useSession();
  const { modal, closeModal, openModal, toggleSidebar } = useUIStore();
  const { setCurrentProject } = useProjectStore();
  const {
    tabs,
    activeTabId,
    addTab,
    removeTab,
    setActiveTab,
    updateTab,
    openEndpoint,
    openNewRequest,
    openOverview,
    reorderTabs,
  } = useTabStore();

  const {
    folders,
    endpoints,
    setFolders,
    setEndpoints,
    addFolder,
    addEndpoint,
    loading: foldersLoading,
    loadAll,
  } = useFolderStore();

  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>();

  const { variables, selectedVariableId, setVariables, setSelectedVariable } =
    useVariableStore();
  const selectedVariable =
    variables.find((v) => v.id === selectedVariableId) || null;
  const [projects, setProjects] = useState<Project[]>([]);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      ...SHORTCUTS.NEW_REQUEST,
      callback: () => openNewRequest(),
    },
    {
      ...SHORTCUTS.NEW_FOLDER,
      callback: () => openModal("newFolder"),
    },
    {
      ...SHORTCUTS.TOGGLE_SIDEBAR,
      callback: () => toggleSidebar(),
    },
    {
      ...SHORTCUTS.IMPORT,
      callback: () => openModal("import"),
    },
    {
      ...SHORTCUTS.EXPORT,
      callback: () => openModal("export"),
    },
    {
      ...SHORTCUTS.SETTINGS,
      callback: () => openModal("settings"),
    },
    {
      ...SHORTCUTS.CLOSE_TAB,
      callback: () => {
        if (activeTabId) {
          removeTab(activeTabId);
        }
      },
    },
    {
      ...SHORTCUTS.SEARCH,
      callback: () => {
        // Focus on search input if available
        const searchInput = document.querySelector(
          "[data-search-input]"
        ) as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
      },
    },
    {
      key: "?",
      shift: true,
      callback: () => setShowKeyboardShortcuts(true),
      description: "Show keyboard shortcuts",
    },
  ]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = tabs.findIndex((tab) => tab.id === active.id);
      const newIndex = tabs.findIndex((tab) => tab.id === over!.id);
      const reorderedTabs = arrayMove(tabs, oldIndex, newIndex);
      reorderTabs(reorderedTabs);
    }
  };

  useEffect(() => {
    if (projectId) {
      loadProjectData();
    }
  }, [projectId]);

  useEffect(() => {
    loadAllProjects();
  }, []);

  useEffect(() => {
    const handleOpenImportModal = () => {
      openModal("import");
    };

    const handleOpenProjectSettings = () => {
      openModal("settings");
    };

    const handleOpenShareModal = () => {
      openModal("share");
    };

    const handleOpenExportModal = () => {
      openModal("export");
    };

    window.addEventListener("openImportModal", handleOpenImportModal);
    window.addEventListener("openProjectSettings", handleOpenProjectSettings);
    window.addEventListener("openShareModal", handleOpenShareModal);
    window.addEventListener("openExportModal", handleOpenExportModal);

    return () => {
      window.removeEventListener("openImportModal", handleOpenImportModal);
      window.removeEventListener(
        "openProjectSettings",
        handleOpenProjectSettings
      );
      window.removeEventListener("openShareModal", handleOpenShareModal);
      window.removeEventListener("openExportModal", handleOpenExportModal);
    };
  }, []);

  // Handle UIStore modals
  useEffect(() => {
    // We'll handle newEndpoint modal differently now
  }, [modal]);

  const loadAllProjects = async () => {
    try {
      const projectsData = await ProjectApi.getProjects();
      setProjects(projectsData);
    } catch (err) {
      console.error("Failed to load projects:", err);
    }
  };

  const loadProjectData = async () => {
    try {
      setIsLoading(true);
      setError(undefined);

      const [projectData, variablesData] = await Promise.all([
        ProjectApi.getProject(projectId),
        VariableApi.getVariables(projectId),
        loadAll(projectId), // Load folders and endpoints using the store
      ]);

      setProject(projectData);
      setCurrentProject(projectData);
      setVariables(variablesData);

      if (!selectedVariableId && variablesData.length > 0) {
        setSelectedVariable(variablesData[0]);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load project data"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenAPIImport = async (openApiData: any) => {
    try {
      const { folders, uncategorizedEndpoints } =
        OpenAPIImportService.parseOpenAPI(openApiData);
      await OpenAPIImportService.importToProject(
        projectId,
        folders,
        uncategorizedEndpoints
      );

      await loadProjectData();

      alert(
        `Successfully imported ${folders.length} folders and ${uncategorizedEndpoints.length} uncategorized endpoints`
      );
    } catch (error) {
      console.error("Import failed:", error);
      alert(
        "Failed to import OpenAPI specification: " +
          (error instanceof Error ? error.message : "Unknown error")
      );
    }
  };

  const saveNewRequest = async (tabId: string, data: any) => {
    try {
      const created = await EndpointApi.createEndpoint(projectId, {
        ...data,
        method: data.method as any,
      });

      addEndpoint(created);

      updateTab(tabId, {
        type: "endpoint" as const,
        endpoint: created,
        title: created.name,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create endpoint"
      );
    }
  };

  const handleCreateFolder = async (data: {
    name: string;
    description: string;
  }) => {
    try {
      const created = await FolderApi.createFolder(projectId, data);
      addFolder(created);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create folder");
    }
  };

  const activeTab = tabs.find((tab) => tab.id === activeTabId);

  if (isLoading) {
    return <LoadingState message="Loading project..." />;
  }

  if (error && !project) {
    return (
      <div className="h-full flex items-center justify-center">
        <ErrorMessage
          title="Failed to load project"
          message={error}
          onRetry={loadProjectData}
        />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <div className="flex-1 flex bg-gray-50 overflow-hidden">
        <Sidebar
          projects={projects}
          currentProjectId={projectId}
          onProjectSelect={(id) => {
            window.location.href = "/dashboard/" + id;
          }}
          onCreateProject={() => {
            window.location.href = "/dashboard";
          }}
          user={session?.user}
          onOpenOverview={openOverview}
        />

        <div className="flex-1 flex flex-col bg-white overflow-hidden">
          {tabs.length > 0 && (
            <div className="bg-gray-50 border-b border-gray-100">
              <div className="flex items-center">
                <div className="flex-1 overflow-hidden">
                  <div className="flex items-center overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400">
                    <DndContext
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                    >
                      <SortableContext
                        items={tabs.map((tab) => tab.id)}
                        strategy={horizontalListSortingStrategy}
                      >
                        {tabs.map((tab) => (
                          <SortableTab
                            key={tab.id}
                            tab={tab}
                            isActive={activeTabId === tab.id}
                            onActivate={() => setActiveTab(tab.id)}
                            onClose={() => removeTab(tab.id)}
                          />
                        ))}
                      </SortableContext>
                    </DndContext>
                  </div>
                </div>
                <button
                  onClick={openNewRequest}
                  className="px-2 py-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors border-r border-gray-100 flex-shrink-0"
                >
                  <Plus size={12} />
                </button>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-hidden">
            {activeTab ? (
              <TabContent
                tab={activeTab}
                variable={selectedVariable}
                variables={variables}
                projectId={projectId}
                project={project}
                folders={folders}
                onSave={saveNewRequest}
                onCloseTab={removeTab}
                onUpdateTab={updateTab}
                onUpdateEndpoint={(id, updates) => {
                  const endpoint = endpoints.find((e) => e.id === id);
                  if (endpoint) {
                    useFolderStore.getState().updateEndpoint(id, updates);
                  }
                }}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center p-4">
                <div className="text-center max-w-sm">
                  <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <Code size={20} className="text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-1">
                    API 문서 작성을 시작하세요
                  </h3>
                  <p className="text-sm text-gray-500 mb-6">
                    새 엔드포인트를 만들거나 사이드바에서 기존 API를 선택하세요
                  </p>

                  <div className="flex flex-col gap-2">
                    <button
                      onClick={openNewRequest}
                      className="px-3 py-1.5 bg-[#0064FF] hover:opacity-90 text-white text-sm font-medium rounded transition-opacity flex items-center justify-center gap-1.5"
                    >
                      <Plus size={14} />새 요청 만들기
                    </button>
                    <button
                      onClick={() => openModal("newFolder")}
                      className="px-3 py-1.5 border border-gray-200 hover:border-gray-300 text-gray-600 text-sm rounded transition-colors flex items-center justify-center gap-1.5"
                    >
                      <FolderIcon size={14} />
                      폴더 만들기
                    </button>
                    <button
                      onClick={() => openModal("import")}
                      className="px-3 py-1.5 border border-gray-200 hover:border-gray-300 text-gray-600 text-sm rounded transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Code size={14} />
                      OpenAPI 가져오기
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <FolderModal
          isOpen={modal.type === "newFolder"}
          onClose={closeModal}
          onCreate={handleCreateFolder}
        />
        <SettingsModal
          isOpen={modal.type === "settings"}
          onClose={closeModal}
          project={project}
          onUpdate={async (data) => {
            if (data.delete) {
              await ProjectApi.deleteProject(projectId);
              window.location.href = "/dashboard";
            } else {
              const { name, description, isPublic } = data;
              await ProjectApi.updateProject(projectId, {
                name,
                description,
                isPublic,
              });
              await loadProjectData();
            }
          }}
        />

        <OpenAPIImportModal
          isOpen={modal.type === "import"}
          onClose={closeModal}
          onImport={handleOpenAPIImport}
          projectId={projectId}
        />
        <ExportModal
          isOpen={modal.type === "export"}
          onClose={closeModal}
          projectId={projectId}
        />

        <ShareModal
          isOpen={modal.type === "share"}
          onClose={closeModal}
          project={project}
        />

        <KeyboardShortcutsModal
          isOpen={showKeyboardShortcuts}
          onClose={() => setShowKeyboardShortcuts(false)}
        />

        <SchemaModal
          isOpen={modal.type === "newSchema"}
          onClose={closeModal}
          onCreate={async () => {
            closeModal();
            // Schemas will be reloaded in the SchemasPanel
          }}
          projectId={projectId}
        />

        <NewEndpointModal
          isOpen={modal.type === "newEndpoint"}
          onClose={closeModal}
          projectId={projectId}
        />
      </div>
    </div>
  );
}

function SortableTab({
  tab,
  isActive,
  onActivate,
  onClose,
}: {
  tab: Tab;
  isActive: boolean;
  onActivate: () => void;
  onClose: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: tab.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    minWidth: "120px",
    maxWidth: "200px",
    flexShrink: 0,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center gap-1 px-2 py-1 transition-all border-r border-gray-100 cursor-pointer ${
        isActive
          ? "bg-white text-gray-900"
          : "bg-gray-50 text-gray-500 hover:bg-gray-50 hover:text-gray-700"
      }`}
      onClick={onActivate}
    >
      <div
        {...attributes}
        {...listeners}
        className="flex items-center gap-1.5 flex-1 min-w-0"
      >
        {tab.type === "endpoint" && (
          <span className="text-[10px] font-medium text-gray-500">
            {tab.endpoint?.method || "GET"}
          </span>
        )}
        {tab.type === "new" && <Plus size={12} className="text-gray-500" />}
        {tab.type === "overview" && (
          <FileCode size={12} className="text-gray-500" />
        )}
        {tab.type === "schema" && <Code size={12} className="text-gray-500" />}
        <span className="text-[11px] truncate">{tab.title}</span>
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded p-0.5 transition-all flex-shrink-0 ml-0.5"
      >
        ×
      </button>
    </div>
  );
}

function TabContent({
  tab,
  variable,
  variables,
  projectId,
  project,
  folders,
  onSave,
  onCloseTab,
  onUpdateTab,
  onUpdateEndpoint,
}: {
  tab: Tab;
  variable: Variable | null;
  variables: Variable[];
  projectId: string;
  project?: Project | null;
  folders: Folder[];
  onSave: (tabId: string, data: any) => void;
  onCloseTab: (tabId: string) => void;
  onUpdateTab: (tabId: string, updates: Partial<Tab>) => void;
  onUpdateEndpoint?: (id: string, updates: Partial<Endpoint>) => void;
}) {
  if (tab.type === "new") {
    return (
      <div className="h-full overflow-hidden">
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-500">Please create a new endpoint from the sidebar</p>
        </div>
      </div>
    );
  }

  if (tab.type === "overview") {
    return (
      <div className="h-full overflow-hidden">
        <OverviewTabContent project={project} projectId={projectId} />
      </div>
    );
  }

  if (tab.type === "schema") {
    return (
      <div className="h-full overflow-hidden">
        <SchemaTabContent tab={tab} onUpdate={onUpdateTab} project={project} />
      </div>
    );
  }

  return (
    <div className="h-full overflow-hidden">
      <EndpointTabContent
        endpoint={tab.endpoint!}
        variable={variable}
        variables={variables}
        project={project}
        folders={folders}
        requestData={tab.requestData!}
        onCloseTab={() => onCloseTab(tab.id)}
        onUpdateTab={(updates) => onUpdateTab(tab.id, updates)}
        onUpdateRequestData={(requestData) =>
          onUpdateTab(tab.id, { requestData })
        }
        onUpdateEndpoint={onUpdateEndpoint}
      />
    </div>
  );
}

function EndpointTabContent({
  endpoint,
  variable,
  variables,
  project,
  folders,
  requestData,
  onCloseTab,
  onUpdateTab,
  onUpdateRequestData,
  onUpdateEndpoint,
}: {
  endpoint: Endpoint;
  variable: Variable | null;
  variables: Variable[];
  project?: Project | null;
  folders: Folder[];
  requestData: any;
  onCloseTab: () => void;
  onUpdateTab: (updates: Partial<Tab>) => void;
  onUpdateRequestData: (requestData: any) => void;
  onUpdateEndpoint?: (id: string, updates: Partial<Endpoint>) => void;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editingTitle, setEditingTitle] = useState(endpoint.name);

  const updateRequestData = (updates: any) => {
    const newRequestData = { ...requestData, ...updates };
    onUpdateRequestData(newRequestData);
  };

  const handleTest = async (selectedServer?: Server | null) => {
    setIsLoading(true);
    const startTime = Date.now();

    const replaceVariables = (text: string): string => {
      if (!text) return text;

      if (variables && Array.isArray(variables)) {
        let result = text;
        variables.forEach((v: Variable) => {
          const regex = new RegExp("{{\\s*" + v.key + "\\s*}}", "g");
          result = result.replace(regex, v.value);
        });
        return result;
      }

      return text;
    };

    try {
      const headers: Record<string, string> = {};
      requestData.headers.forEach(
        (h: { enabled: boolean; key: string; value: string }) => {
          if (h.enabled && h.key) {
            headers[h.key] = replaceVariables(h.value);
          }
        }
      );

      if (
        requestData.auth.type === "bearer" &&
        requestData.auth.credentials &&
        "bearerToken" in requestData.auth.credentials
      ) {
        const token = replaceVariables(
          (requestData.auth.credentials as { bearerToken: string }).bearerToken
        );
        headers["Authorization"] = `Bearer ${token}`;
      } else if (requestData.auth.type === "basic") {
        const credentials = requestData.auth.credentials as
          | { basicUsername?: string; basicPassword?: string }
          | undefined;
        const { basicUsername = "", basicPassword = "" } = credentials || {};
        if (basicUsername && basicPassword) {
          const processedUsername = replaceVariables(basicUsername);
          const processedPassword = replaceVariables(basicPassword);
          const encoded = btoa(`${processedUsername}:${processedPassword}`);
          headers["Authorization"] = `Basic ${encoded}`;
        }
      }

      let url = replaceVariables(requestData.url);

      if (selectedServer && url && !url.startsWith("http")) {
        url = selectedServer.url + (url.startsWith("/") ? url : "/" + url);
      }

      if (requestData.params?.length > 0) {
        const params = new URLSearchParams();
        requestData.params.forEach((p: any) => {
          if (p.enabled && p.key) {
            params.append(p.key, replaceVariables(p.value));
          }
        });
        const queryString = params.toString();
        if (queryString) url += `?${queryString}`;
      }

      const options: RequestInit = {
        method: requestData.method,
        headers,
      };

      if (
        ["POST", "PUT", "PATCH"].includes(requestData.method) &&
        requestData.body
      ) {
        options.body = replaceVariables(requestData.body);
      }

      const response = await fetch(url, options);
      const responseText = await response.text();
      const endTime = Date.now();

      let formattedBody = responseText;
      try {
        const jsonData = JSON.parse(responseText);
        formattedBody = JSON.stringify(jsonData, null, 2);
      } catch (e) {}

      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      const responseData = {
        status: response.status,
        statusText: response.statusText,
        time: `${endTime - startTime}ms`,
        size: `${new Blob([responseText]).size} bytes`,
        headers: responseHeaders,
        body: formattedBody,
        request: {
          url,
          method: requestData.method,
          headers,
          body: (options.body as string) || undefined,
        },
      };
      setResponse(responseData);

      try {
        await HistoryApi.createHistory(project!.id, endpoint.id, {
          method: requestData.method,
          url,
          headers,
          params: requestData.params?.reduce(
            (acc: Record<string, string>, p: any) => {
              if (p.enabled && p.key) acc[p.key] = p.value;
              return acc;
            },
            {}
          ),
          body: (options.body as string) || "",
          variables: variable ? { [variable.key]: variable.value } : undefined,
          status: response.status,
          statusText: response.statusText,
          responseTime: endTime - startTime,
          responseSize: new Blob([responseText]).size,
          responseHeaders,
          responseBody: formattedBody,
        });

        window.dispatchEvent(new CustomEvent("historyUpdated"));
      } catch (err) {
        console.error("Failed to save test history:", err);
      }
    } catch (error: any) {
      const endTime = Date.now();
      setResponse({
        status: 0,
        statusText: "Network Error",
        time: `${endTime - startTime}ms`,
        size: "0 bytes",
        body: error.message || "Failed to fetch",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="px-3 py-2 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              {endpoint.folderId && (
                <span className="text-sm text-gray-400">
                  ~/
                  {(() => {
                    const getFolderPath = (folderId: string): string => {
                      const folder = folders.find((f) => f.id === folderId);
                      if (!folder) return "";

                      if (folder.parentId) {
                        const parentPath = getFolderPath(folder.parentId);
                        return parentPath
                          ? `${parentPath}/${folder.name}`
                          : folder.name;
                      }

                      return folder.name;
                    };
                    return getFolderPath(endpoint.folderId);
                  })()}
                  /
                </span>
              )}
              {isEditingTitle ? (
                <input
                  type="text"
                  value={editingTitle}
                  onChange={(e) => setEditingTitle(e.target.value)}
                  onBlur={async () => {
                    if (editingTitle.trim() && editingTitle !== endpoint.name) {
                      try {
                        await EndpointApi.updateEndpoint(
                          project!.id,
                          endpoint.id,
                          { name: editingTitle.trim() }
                        );
                        onUpdateTab({
                          title: editingTitle.trim(),
                          endpoint: { ...endpoint, name: editingTitle.trim() },
                        });
                        onUpdateEndpoint?.(endpoint.id, {
                          name: editingTitle.trim(),
                        });
                      } catch (error) {
                        setEditingTitle(endpoint.name);
                      }
                    }
                    setIsEditingTitle(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.currentTarget.blur();
                    } else if (e.key === "Escape") {
                      setEditingTitle(endpoint.name);
                      setIsEditingTitle(false);
                    }
                  }}
                  className="text-sm font-medium text-gray-900 bg-transparent border-0 border-b border-[#0064FF] px-0 py-0 focus:outline-none"
                  autoFocus
                />
              ) : (
                <h2
                  className="text-sm font-medium text-gray-900 cursor-pointer hover:text-[#0064FF] transition-colors"
                  onClick={() => {
                    setEditingTitle(endpoint.name);
                    setIsEditingTitle(true);
                  }}
                >
                  {endpoint.name}
                </h2>
              )}
            </div>
            <span
              className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                endpoint.method === "GET"
                  ? "bg-[#E6F0FF] text-[#0064FF]"
                  : endpoint.method === "POST"
                  ? "bg-green-50 text-green-700"
                  : endpoint.method === "PUT"
                  ? "bg-orange-50 text-orange-700"
                  : endpoint.method === "DELETE"
                  ? "bg-red-50 text-red-700"
                  : endpoint.method === "PATCH"
                  ? "bg-purple-50 text-purple-700"
                  : "bg-gray-50 text-gray-700"
              }`}
            >
              {endpoint.method}
            </span>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={async () => {
                try {
                  const updateData: any = {
                    name: endpoint.name,
                    path: endpoint.path,
                    description: endpoint.description || undefined,
                  };
                  if (endpoint.method) {
                    updateData.method = endpoint.method;
                  }
                  await EndpointApi.updateEndpoint(
                    project!.id,
                    endpoint.id,
                    updateData
                  );
                  onUpdateTab({ isModified: false });
                  alert("Endpoint saved successfully!");
                } catch (error) {
                  alert("Failed to save endpoint");
                }
              }}
              className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded transition-colors"
            >
              <Save size={12} className="inline mr-1" />
              Save
            </button>
            <button
              onClick={async () => {
                if (confirm("Delete this endpoint?")) {
                  await EndpointApi.deleteEndpoint(project!.id, endpoint.id);
                  onCloseTab();
                  window.location.reload();
                }
              }}
              className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded transition-colors"
            >
              <Trash2 size={12} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {endpoint.type === "GRAPHQL" && project ? (
          <GraphQLEndpointDetail
            projectId={project.id}
            endpoint={endpoint}
            variables={variables}
            project={project}
          />
        ) : endpoint.type === "WEBSOCKET" && project ? (
          <WebSocketEndpointDetail
            projectId={project.id}
            endpoint={endpoint}
            variables={variables}
            project={project}
          />
        ) : endpoint.type === "SOCKETIO" && project ? (
          <SocketIOEndpointDetail
            projectId={project.id}
            endpoint={endpoint}
            variables={variables}
            project={project}
          />
        ) : endpoint.type === "GRPC" && project ? (
          <GRPCEndpointDetail
            projectId={project.id}
            endpoint={endpoint}
            variables={variables}
            project={project}
          />
        ) : endpoint.type === "STOMP" && project ? (
          <STOMPEndpointDetail
            projectId={project.id}
            endpoint={endpoint}
            variables={variables}
            project={project}
          />
        ) : endpoint.type === "MQTT" && project ? (
          <MQTTEndpointDetail
            projectId={project.id}
            endpoint={endpoint}
            variables={variables}
            project={project}
          />
        ) : endpoint.type === "SSE" && project ? (
          <SSEEndpointDetail
            projectId={project.id}
            endpoint={endpoint}
            variables={variables}
            project={project}
          />
        ) : project ? (
          <HTTPEndpointDetail 
            projectId={project.id} 
            endpoint={endpoint} 
            variables={variables} 
            project={project}
          />
        ) : null}
      </div>
    </div>
  );
}


function OverviewTabContent({
  project,
  projectId,
}: {
  project?: Project | null;
  projectId: string;
}) {
  const { openModal } = useUIStore();
  const [isEditingName, setIsEditingName] = useState(false);
  const [editingName, setEditingName] = useState(project?.name || "");
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editingDescription, setEditingDescription] = useState(
    project?.description || ""
  );

  if (!project) {
    return <LoadingState message="Loading project overview..." />;
  }

  const updateProject = async (updates: Partial<Project>) => {
    try {
      const updateData: any = {};
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.description !== undefined)
        updateData.description =
          updates.description === null ? undefined : updates.description;
      if (updates.isPublic !== undefined)
        updateData.isPublic = updates.isPublic;

      await ProjectApi.updateProject(projectId, updateData);
      window.location.reload();
    } catch (error) {
      console.error("Failed to update project:", error);
    }
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#0064FF] rounded-lg flex items-center justify-center">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <path d="M9 3v18" />
                  <path d="M15 3v18" />
                  <path d="M3 9h18" />
                  <path d="M3 15h18" />
                </svg>
              </div>
              <div className="flex-1">
                {isEditingName ? (
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onBlur={async () => {
                      if (editingName.trim() && editingName !== project.name) {
                        await updateProject({ name: editingName.trim() });
                      }
                      setIsEditingName(false);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.currentTarget.blur();
                      } else if (e.key === "Escape") {
                        setEditingName(project.name);
                        setIsEditingName(false);
                      }
                    }}
                    className="text-2xl font-bold bg-transparent border-0 border-b-2 border-[#0064FF] px-0 py-0 focus:outline-none"
                    autoFocus
                  />
                ) : (
                  <h1
                    className="text-2xl font-bold text-gray-900 cursor-pointer hover:text-[#0064FF] transition-colors"
                    onClick={() => {
                      setEditingName(project.name);
                      setIsEditingName(true);
                    }}
                  >
                    {project.name}
                  </h1>
                )}
              </div>
            </div>
            <button
              onClick={() => openModal("settings", { project })}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Settings size={16} />
              프로젝트 설정
            </button>
          </div>

          {isEditingDescription ? (
            <textarea
              value={editingDescription}
              onChange={(e) => setEditingDescription(e.target.value)}
              onBlur={async () => {
                if (editingDescription !== project.description) {
                  await updateProject({
                    description: editingDescription || null,
                  });
                }
                setIsEditingDescription(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setEditingDescription(project.description || "");
                  setIsEditingDescription(false);
                }
              }}
              className="w-full p-2 text-gray-600 bg-gray-50 border border-[#0064FF] rounded resize-none focus:outline-none"
              rows={3}
              autoFocus
            />
          ) : (
            <p
              className="text-gray-600 cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors"
              onClick={() => {
                setEditingDescription(project.description || "");
                setIsEditingDescription(true);
              }}
            >
              {project.description || "Click to add a project description..."}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Project Information
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Created</span>
                <span className="text-gray-900">
                  {new Date(project.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Last Updated</span>
                <span className="text-gray-900">
                  {new Date(project.updatedAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Visibility</span>
                <span
                  className={`px-2 py-0.5 rounded text-xs font-medium ${
                    project.isPublic
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-200 text-gray-700"
                  }`}
                >
                  {project.isPublic ? "Public" : "Private"}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              API Configuration
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Servers</span>
                <span className="text-gray-900">
                  {project.servers?.length || 0} configured
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">MSA Mode</span>
                <span
                  className={`px-2 py-0.5 rounded text-xs font-medium ${
                    project.servers &&
                    Array.isArray(project.servers) &&
                    project.servers.length > 1
                      ? "bg-blue-100 text-blue-700"
                      : "bg-gray-200 text-gray-700"
                  }`}
                >
                  {project.servers &&
                  Array.isArray(project.servers) &&
                  project.servers.length > 1
                    ? "Enabled"
                    : "Disabled"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Getting Started
          </h2>
          <div className="prose prose-sm max-w-none">
            <p className="text-gray-600">
              Welcome to your API documentation project. Here's how to get
              started:
            </p>
            <ol className="list-decimal list-inside space-y-2 text-gray-600">
              <li>Create folders to organize your API endpoints</li>
              <li>Add endpoints to document your API operations</li>
              <li>Define schemas for request and response models</li>
              <li>Set up variables for environment-specific values</li>
              <li>Test your APIs directly from the documentation</li>
            </ol>
          </div>
        </div>

        <div className="mt-8 flex gap-3">
          <button
            onClick={() =>
              window.dispatchEvent(new CustomEvent("openProjectSettings"))
            }
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
          >
            Project Settings
          </button>
          <button
            onClick={() =>
              window.dispatchEvent(new CustomEvent("openImportModal"))
            }
            className="px-4 py-2 bg-[#0064FF] hover:bg-[#0050C8] text-white rounded-lg text-sm font-medium transition-colors"
          >
            Import OpenAPI
          </button>
          <button
            onClick={() =>
              window.dispatchEvent(new CustomEvent("openExportModal"))
            }
            className="px-4 py-2 border border-gray-200 hover:border-gray-300 text-gray-700 rounded-lg text-sm font-medium transition-colors"
          >
            Export Documentation
          </button>
        </div>
      </div>
    </div>
  );
}
