import { create } from "zustand";
import { devtools } from "zustand/middleware";

interface Server {
  name: string;
  url: string;
  description?: string;
}

interface ProjectState {
  currentProjectId: string | null;
  currentProject: any | null;
  servers: Server[];
  activeServer: string | null;
  selectedServerId: number;
  setCurrentProject: (project: any) => void;
  setServers: (servers: Server[]) => void;
  setActiveServer: (serverName: string) => void;
  setSelectedServerId: (serverId: number) => void;
  getActiveServerUrl: () => string | null;
  getSelectedServerUrl: () => string | null;
}

export const useProjectStore = create<ProjectState>()(
  devtools(
    (set, get) => ({
      currentProjectId: null,
      currentProject: null,
      servers: [],
      activeServer: null,
      selectedServerId: 0,

      setCurrentProject: (project) =>
        set(() => ({
          currentProjectId: project?.id || null,
          currentProject: project,
          servers: project?.servers || [],
          activeServer: project?.servers?.[0]?.name || null,
          selectedServerId: 0,
        })),

      setServers: (servers) =>
        set(() => ({
          servers,
          activeServer: servers[0]?.name || null,
        })),

      setActiveServer: (serverName) =>
        set(() => ({
          activeServer: serverName,
        })),

      setSelectedServerId: (serverId) =>
        set(() => ({
          selectedServerId: serverId,
        })),

      getActiveServerUrl: () => {
        const state = get();
        const server = state.servers.find((s) => s.name === state.activeServer);
        return server?.url || null;
      },

      getSelectedServerUrl: () => {
        const state = get();
        const server = state.currentProject?.servers?.[state.selectedServerId] || state.currentProject?.servers?.[0];
        return server?.url || null;
      },
    }),
    {
      name: "project-store",
    }
  )
);