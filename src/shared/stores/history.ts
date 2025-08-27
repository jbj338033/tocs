import { create } from "zustand";
import { devtools } from "zustand/middleware";

interface History {
  id: string;
  endpointId: string;
  method: string;
  url: string;
  status: number;
  statusText: string;
  responseTime: number;
  createdAt: string;
}

interface HistoryState {
  histories: History[];
  selectedHistoryId: string | null;
  filter: {
    endpointId?: string;
    status?: number;
    method?: string;
  };
  setHistories: (histories: History[]) => void;
  addHistory: (history: History) => void;
  setSelectedHistory: (history: History | null) => void;
  setFilter: (filter: HistoryState["filter"]) => void;
  clearFilter: () => void;
  getFilteredHistories: () => History[];
}

export const useHistoryStore = create<HistoryState>()(
  devtools(
    (set, get) => ({
      histories: [],
      selectedHistoryId: null,
      filter: {},

      setHistories: (histories) =>
        set(() => ({
          histories,
        })),

      addHistory: (history) =>
        set((state) => ({
          histories: [history, ...state.histories].slice(0, 100), // Keep last 100
        })),

      setSelectedHistory: (history) =>
        set(() => ({
          selectedHistoryId: history?.id || null,
        })),

      setFilter: (filter) =>
        set(() => ({
          filter,
        })),

      clearFilter: () =>
        set(() => ({
          filter: {},
        })),

      getFilteredHistories: () => {
        const state = get();
        return state.histories.filter((history) => {
          if (state.filter.endpointId && history.endpointId !== state.filter.endpointId) {
            return false;
          }
          if (state.filter.status && history.status !== state.filter.status) {
            return false;
          }
          if (state.filter.method && history.method !== state.filter.method) {
            return false;
          }
          return true;
        });
      },
    }),
    {
      name: "history-store",
    }
  )
);