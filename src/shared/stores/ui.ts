import { create } from "zustand";
import { devtools } from "zustand/middleware";

type SidebarTab = "apis" | "variables" | "history";
type ApiTab = "overview" | "endpoints" | "schemas";

interface Modal {
  type: "import" | "export" | "share" | "settings" | "createEndpoint" | "createFolder" | "createSchema" | "newEndpoint" | "newFolder" | "newSchema" | null;
  data?: unknown;
}

interface UIState {
  sidebarWidth: number;
  sidebarCollapsed: boolean;
  selectedSidebarTab: SidebarTab;
  selectedApiTab: ApiTab;
  modal: Modal;
  isLoading: boolean;
  loadingMessage: string;
  expandedFolders: Set<string>;
  setSidebarWidth: (width: number) => void;
  toggleSidebar: () => void;
  setSelectedSidebarTab: (tab: SidebarTab) => void;
  setSelectedApiTab: (tab: ApiTab) => void;
  openModal: (type: Modal["type"], data?: unknown) => void;
  closeModal: () => void;
  setLoading: (isLoading: boolean, message?: string) => void;
  toggleFolder: (folderId: string) => void;
  expandFolder: (folderId: string) => void;
  collapseFolder: (folderId: string) => void;
  isExpanded: (folderId: string) => boolean;
}

export const useUIStore = create<UIState>()(
  devtools(
    (set, get) => ({
      sidebarWidth: 380,
      sidebarCollapsed: false,
      selectedSidebarTab: "apis",
      selectedApiTab: "endpoints",
      modal: { type: null },
      isLoading: false,
      loadingMessage: "",
      expandedFolders: new Set<string>(),

      setSidebarWidth: (width) =>
        set(() => ({
          sidebarWidth: width,
        })),

      toggleSidebar: () =>
        set((state) => ({
          sidebarCollapsed: !state.sidebarCollapsed,
        })),

      setSelectedSidebarTab: (tab) =>
        set(() => ({
          selectedSidebarTab: tab,
        })),

      setSelectedApiTab: (tab) =>
        set(() => ({
          selectedApiTab: tab,
        })),

      openModal: (type, data) =>
        set(() => ({
          modal: { type, data },
        })),

      closeModal: () =>
        set(() => ({
          modal: { type: null },
        })),

      setLoading: (isLoading, message = "") =>
        set(() => ({
          isLoading,
          loadingMessage: message,
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

      expandFolder: (folderId) =>
        set((state) => {
          const newExpanded = new Set(state.expandedFolders);
          newExpanded.add(folderId);
          return { expandedFolders: newExpanded };
        }),

      collapseFolder: (folderId) =>
        set((state) => {
          const newExpanded = new Set(state.expandedFolders);
          newExpanded.delete(folderId);
          return { expandedFolders: newExpanded };
        }),

      isExpanded: (folderId) => {
        return get().expandedFolders.has(folderId);
      },
    }),
    {
      name: "ui-store",
    }
  )
);