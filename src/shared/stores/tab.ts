import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { Endpoint } from "@/entities/folder";

export interface Tab {
  id: string;
  type: 'endpoint' | 'new' | 'overview' | 'schema';
  title: string;
  endpoint?: Endpoint;
  schema?: any;
  isModified?: boolean;
  requestData?: {
    url: string;
    method: string;
    headers: any[];
    params: any[];
    body: string;
    auth: any;
    cookies: any[];
  };
  newData?: {
    name: string;
    method: string;
    path: string;
    description: string;
  };
}

interface TabState {
  tabs: Tab[];
  activeTabId: string;
  addTab: (tab: Tab) => void;
  removeTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
  updateTab: (tabId: string, updates: Partial<Tab>) => void;
  openEndpoint: (endpoint: Endpoint) => void;
  openNewRequest: () => void;
  openOverview: () => void;
  openSchema: (schema: any) => void;
  reorderTabs: (tabs: Tab[]) => void;
}

export const useTabStore = create<TabState>()(
  devtools(
    (set, get) => ({
      tabs: [],
      activeTabId: "",

      addTab: (tab) =>
        set((state) => ({
          tabs: [...state.tabs, tab],
          activeTabId: tab.id,
        })),

      removeTab: (tabId) =>
        set((state) => {
          const filtered = state.tabs.filter((tab) => tab.id !== tabId);
          let newActiveTabId = state.activeTabId;
          
          if (state.activeTabId === tabId && filtered.length > 0) {
            newActiveTabId = filtered[filtered.length - 1].id;
          } else if (filtered.length === 0) {
            newActiveTabId = "";
          }
          
          return {
            tabs: filtered,
            activeTabId: newActiveTabId,
          };
        }),

      setActiveTab: (tabId) =>
        set(() => ({
          activeTabId: tabId,
        })),

      updateTab: (tabId, updates) =>
        set((state) => ({
          tabs: state.tabs.map((tab) =>
            tab.id === tabId ? { ...tab, ...updates } : tab
          ),
        })),

      openEndpoint: (endpoint) => {
        const state = get();
        const existingTab = state.tabs.find(
          (tab) => tab.type === 'endpoint' && tab.endpoint?.id === endpoint.id
        );
        
        if (existingTab) {
          set({ activeTabId: existingTab.id });
        } else {
          const requestData = {
            url: endpoint.path || '',
            method: endpoint.method || 'GET',
            headers: endpoint.headers?.map((h: any) => ({
              key: h.key,
              value: h.value,
              description: h.description || '',
              enabled: true
            })) || [],
            params: endpoint.parameters?.filter((p: any) => p.in === 'query').map((p: any) => ({
              key: p.name,
              value: p.default || '',
              description: p.description || '',
              enabled: true
            })) || [],
            body: endpoint.body?.example || '',
            auth: { type: 'none', credentials: {} },
            cookies: []
          };

          const newTab: Tab = {
            id: `endpoint-${endpoint.id}-${Date.now()}`,
            type: 'endpoint',
            title: endpoint.name,
            endpoint,
            requestData,
            isModified: false,
          };
          
          set((state) => ({
            tabs: [...state.tabs, newTab],
            activeTabId: newTab.id,
          }));
        }
      },

      openNewRequest: () => {
        const newTab: Tab = {
          id: `new-${Date.now()}`,
          type: 'new',
          title: 'Untitled Request',
          newData: {
            name: "",
            method: "GET",
            path: "",
            description: ""
          }
        };
        
        set((state) => ({
          tabs: [...state.tabs, newTab],
          activeTabId: newTab.id,
        }));
      },

      openOverview: () => {
        const state = get();
        const existingOverviewTab = state.tabs.find(tab => tab.type === 'overview');
        
        if (existingOverviewTab) {
          set({ activeTabId: existingOverviewTab.id });
        } else {
          const newTab: Tab = {
            id: `overview-${Date.now()}`,
            type: 'overview',
            title: 'Overview'
          };
          
          set((state) => ({
            tabs: [...state.tabs, newTab],
            activeTabId: newTab.id,
          }));
        }
      },

      openSchema: (schema) => {
        const state = get();
        const existingTab = state.tabs.find(
          (tab) => tab.type === 'schema' && tab.schema?.id === schema.id
        );
        
        if (existingTab) {
          set({ activeTabId: existingTab.id });
        } else {
          const newTab: Tab = {
            id: `schema-${schema.id}-${Date.now()}`,
            type: 'schema',
            title: schema.name,
            schema,
            isModified: false,
          };
          
          set((state) => ({
            tabs: [...state.tabs, newTab],
            activeTabId: newTab.id,
          }));
        }
      },

      reorderTabs: (tabs) =>
        set(() => ({
          tabs,
        })),
    }),
    {
      name: "tab-store",
    }
  )
);