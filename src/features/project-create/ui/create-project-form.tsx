"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { ProjectApi, CreateProjectData } from "@/entities/project"

import { Button, Input, Card } from "@/shared/ui/components"
import { Globe, Lock } from "@/shared/ui/icons"

const createProjectSchema = z.object({
  name: z.string().min(1, "Project name is required").max(100, "Project name is too long"),
  description: z.string().optional(),
  isPublic: z.boolean().default(false)
})

type CreateProjectForm = z.infer<typeof createProjectSchema>

interface CreateProjectFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

export function CreateProjectForm({ onSuccess, onCancel }: CreateProjectFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<CreateProjectForm>({
    resolver: zodResolver(createProjectSchema) as any,
    defaultValues: {
      name: "",
      description: "",
      isPublic: false
    }
  })

  const isPublic = watch("isPublic")

  const onSubmit = async (data: CreateProjectForm) => {
    try {
      setIsLoading(true)
      setError(undefined)
      
      const project = await ProjectApi.createProject(data)
      
      if (onSuccess) {
        onSuccess()
      } else {
        router.push(`/dashboard?project=${project.id}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create project")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            Create New Project
          </h2>
          <p className="text-sm text-gray-600">
            Start building your API documentation
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Project Name"
            placeholder="My API Documentation"
            error={errors.name?.message}
            {...register("name")}
          />

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Description (Optional)
            </label>
            <textarea
              placeholder="Describe your API project..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
              {...register("description")}
            />
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Visibility
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  checked={!isPublic}
                  onChange={() => setValue("isPublic", false)}
                  className="text-primary focus:ring-primary"
                />
                <Lock size={16} className="text-gray-500" />
                <div>
                  <div className="text-sm font-medium text-gray-900">Private</div>
                  <div className="text-xs text-gray-500">Only team members can access</div>
                </div>
              </label>
              <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  checked={isPublic}
                  onChange={() => setValue("isPublic", true)}
                  className="text-primary focus:ring-primary"
                />
                <Globe size={16} className="text-gray-500" />
                <div>
                  <div className="text-sm font-medium text-gray-900">Public</div>
                  <div className="text-xs text-gray-500">Anyone can view the documentation</div>
                </div>
              </label>
            </div>
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
              {isLoading ? "Creating..." : "Create Project"}
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