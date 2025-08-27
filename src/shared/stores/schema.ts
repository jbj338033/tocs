import { create } from "zustand";
import { devtools } from "zustand/middleware";

interface Schema {
  id: string;
  name: string;
  description?: string;
  type: "request" | "response" | "shared";
  schema: any;
  examples?: any;
}

interface SchemaState {
  schemas: Schema[];
  selectedSchemaId: string | null;
  selectedSchema: Schema | null;
  setSchemas: (schemas: Schema[]) => void;
  setSelectedSchema: (schema: Schema | null) => void;
  addSchema: (schema: Schema) => void;
  updateSchema: (id: string, updates: Partial<Schema>) => void;
  deleteSchema: (id: string) => void;
}

export const useSchemaStore = create<SchemaState>()(
  devtools(
    (set) => ({
      schemas: [],
      selectedSchemaId: null,
      selectedSchema: null,

      setSchemas: (schemas) =>
        set(() => ({
          schemas,
        })),

      setSelectedSchema: (schema) =>
        set(() => ({
          selectedSchemaId: schema?.id || null,
          selectedSchema: schema,
        })),

      addSchema: (schema) =>
        set((state) => ({
          schemas: [...state.schemas, schema],
        })),

      updateSchema: (id, updates) =>
        set((state) => ({
          schemas: state.schemas.map((s) =>
            s.id === id ? { ...s, ...updates } : s
          ),
        })),

      deleteSchema: (id) =>
        set((state) => ({
          schemas: state.schemas.filter((s) => s.id !== id),
          selectedSchemaId:
            state.selectedSchemaId === id ? null : state.selectedSchemaId,
          selectedSchema:
            state.selectedSchemaId === id ? null : state.selectedSchema,
        })),
    }),
    {
      name: "schema-store",
    }
  )
);