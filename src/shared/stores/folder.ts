import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { Folder, Endpoint, FolderApi, EndpointApi } from "@/entities/folder";

interface FolderState {
  folders: Folder[];
  endpoints: Endpoint[];
  loading: boolean;
  error: string | null;
  
  setFolders: (folders: Folder[]) => void;
  setEndpoints: (endpoints: Endpoint[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  addFolder: (folder: Folder) => void;
  updateFolder: (id: string, updates: Partial<Folder>) => void;
  deleteFolder: (id: string) => void;
  
  addEndpoint: (endpoint: Endpoint) => void;
  updateEndpoint: (id: string, updates: Partial<Endpoint>) => void;
  deleteEndpoint: (id: string) => void;
  moveEndpoint: (endpointId: string, newFolderId: string | null) => void;
  reorderEndpoints: (endpoints: Endpoint[]) => void;
  loadFolders: (projectId: string) => Promise<void>;
  loadEndpoints: (projectId: string) => Promise<void>;
  loadAll: (projectId: string) => Promise<void>;
  getEndpointsByFolder: (folderId: string | null) => Endpoint[];
  getChildFolders: (parentId: string | null) => Folder[];
}

export const useFolderStore = create<FolderState>()(
  devtools(
    (set, get) => ({
      folders: [],
      endpoints: [],
      loading: false,
      error: null,

      setFolders: (folders) => set({ folders }),
      setEndpoints: (endpoints) => set({ endpoints }),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),

      addFolder: (folder) =>
        set((state) => ({
          folders: [...state.folders, folder],
        })),

      updateFolder: (id, updates) =>
        set((state) => ({
          folders: state.folders.map((folder) =>
            folder.id === id ? { ...folder, ...updates } : folder
          ),
        })),

      deleteFolder: (id) =>
        set((state) => ({
          folders: state.folders.filter((folder) => folder.id !== id),
          endpoints: state.endpoints.filter((endpoint) => endpoint.folderId !== id),
        })),

      addEndpoint: (endpoint) =>
        set((state) => ({
          endpoints: [...state.endpoints, endpoint],
        })),

      updateEndpoint: (id, updates) =>
        set((state) => ({
          endpoints: state.endpoints.map((endpoint) =>
            endpoint.id === id ? { ...endpoint, ...updates } : endpoint
          ),
        })),

      deleteEndpoint: (id) =>
        set((state) => ({
          endpoints: state.endpoints.filter((endpoint) => endpoint.id !== id),
        })),

      moveEndpoint: (endpointId, newFolderId) =>
        set((state) => ({
          endpoints: state.endpoints.map((endpoint) =>
            endpoint.id === endpointId
              ? { ...endpoint, folderId: newFolderId }
              : endpoint
          ),
        })),

      reorderEndpoints: (endpoints) => set({ endpoints }),

      loadFolders: async (projectId) => {
        try {
          set({ loading: true, error: null });
          const folders = await FolderApi.getFolders(projectId);
          set({ folders, loading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : "Failed to load folders", 
            loading: false 
          });
        }
      },

      loadEndpoints: async (projectId) => {
        try {
          set({ loading: true, error: null });
          const endpoints = await EndpointApi.getEndpoints(projectId);
          set({ endpoints, loading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : "Failed to load endpoints", 
            loading: false 
          });
        }
      },

      loadAll: async (projectId) => {
        try {
          set({ loading: true, error: null });
          const [folders, endpoints] = await Promise.all([
            FolderApi.getFolders(projectId),
            EndpointApi.getEndpoints(projectId),
          ]);
          set({ folders, endpoints, loading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : "Failed to load data", 
            loading: false 
          });
        }
      },

      getEndpointsByFolder: (folderId) => {
        const { endpoints } = get();
        return endpoints.filter((e) => e.folderId === folderId);
      },

      getChildFolders: (parentId) => {
        const { folders } = get();
        return folders.filter((f) =>
          parentId ? f.parentId === parentId : !f.parentId || f.parentId === null
        );
      },
    }),
    {
      name: "folder-store",
    }
  )
);