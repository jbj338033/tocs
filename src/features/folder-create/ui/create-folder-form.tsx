"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { FolderApi, CreateFolderData } from "@/entities/folder"

import { Button, Input, Card } from "@/shared/ui/components"

const createFolderSchema = z.object({
  name: z.string().min(1, "Folder name is required").max(100, "Folder name is too long"),
  description: z.string().optional(),
  parentId: z.string().optional()
})

type CreateFolderForm = z.infer<typeof createFolderSchema>

interface CreateFolderFormProps {
  projectId: string
  parentId?: string
  onSuccess?: () => void
  onCancel?: () => void
}

export function CreateFolderForm({ projectId, parentId, onSuccess, onCancel }: CreateFolderFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>()

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<CreateFolderForm>({
    resolver: zodResolver(createFolderSchema),
    defaultValues: {
      name: "",
      description: "",
      parentId
    }
  })

  const onSubmit = async (data: CreateFolderForm) => {
    try {
      setIsLoading(true)
      setError(undefined)
      
      await FolderApi.createFolder(projectId, data)
      
      if (onSuccess) {
        onSuccess()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create folder")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            Create New Folder
          </h2>
          <p className="text-sm text-gray-600">
            Group related endpoints together
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Folder Name"
            placeholder="Authentication"
            error={errors.name?.message}
            {...register("name")}
          />

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Description (Optional)
            </label>
            <textarea
              placeholder="Describe this folder..."
              rows={2}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
              {...register("description")}
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? "Creating..." : "Create Folder"}
            </Button>
            {onCancel && (
              <Button
                type="button"
                variant="ghost"
                onClick={onCancel}
                disabled={isLoading}
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </div>
    </Card>
  )
}