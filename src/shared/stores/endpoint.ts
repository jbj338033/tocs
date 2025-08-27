import { create } from "zustand";
import { devtools } from "zustand/middleware";

interface EndpointState {
  selectedEndpointId: string | null;
  selectedEndpoint: any | null;
  endpoints: any[];
  folders: any[];
  searchQuery: string;
  expandedFolders: Set<string>;
  setSelectedEndpoint: (endpoint: any) => void;
  setEndpoints: (endpoints: any[]) => void;
  setFolders: (folders: any[]) => void;
  setSearchQuery: (query: string) => void;
  toggleFolder: (folderId: string) => void;
  expandAllFolders: () => void;
  collapseAllFolders: () => void;
}

export const useEndpointStore = create<EndpointState>()(
  devtools(
    (set, get) => ({
      selectedEndpointId: null,
      selectedEndpoint: null,
      endpoints: [],
      folders: [],
      searchQuery: "",
      expandedFolders: new Set<string>(),

      setSelectedEndpoint: (endpoint) =>
        set(() => ({
          selectedEndpointId: endpoint?.id || null,
          selectedEndpoint: endpoint,
        })),

      setEndpoints: (endpoints) =>
        set(() => ({
          endpoints,
        })),

      setFolders: (folders) =>
        set(() => ({
          folders,
        })),

      setSearchQuery: (query) =>
        set(() => ({
          searchQuery: query,
        })),

      toggleFolder: (folderId) =>
        set((state) => {
          const newExpanded = new Set(state.expandedFolders);
          if (newExpanded.has(folderId)) {
            newExpanded.delete(folderId);
          } else {
            newExpanded.add(folderId);
          }
          return { expandedFolders: newExpanded };
        }),

      expandAllFolders: () =>
        set((state) => ({
          expandedFolders: new Set(state.folders.map((f) => f.id)),
        })),

      collapseAllFolders: () =>
        set(() => ({
          expandedFolders: new Set<string>(),
        })),
    }),
    {
      name: "endpoint-store",
    }
  )
);