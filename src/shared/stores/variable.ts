import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { Variable } from "@/entities/variable";

interface VariableState {
  variables: Variable[];
  selectedVariableId: string | null;
  setVariables: (variables: Variable[]) => void;
  setSelectedVariable: (variable: Variable | null) => void;
  addVariable: (variable: Variable) => void;
  updateVariable: (id: string, updates: Partial<Variable>) => void;
  deleteVariable: (id: string) => void;
  interpolateVariables: (text: string) => string;
}

export const useVariableStore = create<VariableState>()(
  devtools(
    (set, get) => ({
      variables: [],
      selectedVariableId: null,

      setVariables: (variables) =>
        set(() => ({
          variables,
        })),

      setSelectedVariable: (variable) =>
        set(() => ({
          selectedVariableId: variable?.id || null,
        })),

      addVariable: (variable) =>
        set((state) => ({
          variables: [...state.variables, variable],
        })),

      updateVariable: (id, updates) =>
        set((state) => ({
          variables: state.variables.map((v) =>
            v.id === id ? { ...v, ...updates } : v
          ),
        })),

      deleteVariable: (id) =>
        set((state) => ({
          variables: state.variables.filter((v) => v.id !== id),
        })),

      interpolateVariables: (text) => {
        const state = get();
        let interpolated = text;
        
        state.variables.forEach((variable) => {
          const regex = new RegExp(`{{\\s*${variable.key}\\s*}}`, "g");
          interpolated = interpolated.replace(regex, variable.value);
        });
        
        return interpolated;
      },
    }),
    {
      name: "variable-store",
    }
  )
);