"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { EndpointApi, CreateEndpointData, HttpMethod } from "@/entities/folder"

import { Button, Input, Card, Select, Badge } from "@/shared/ui/components"

const createEndpointSchema = z.object({
  name: z.string().min(1, "Endpoint name is required").max(100, "Endpoint name is too long"),
  description: z.string().optional(),
  method: z.nativeEnum(HttpMethod),
  path: z.string().min(1, "Path is required"),
  folderId: z.string().optional()
})

type CreateEndpointForm = z.infer<typeof createEndpointSchema>

interface CreateEndpointFormProps {
  projectId: string
  folderId?: string
  onSuccess?: () => void
  onCancel?: () => void
}

const methodOptions = [
  { value: HttpMethod.GET, label: "GET" },
  { value: HttpMethod.POST, label: "POST" },
  { value: HttpMethod.PUT, label: "PUT" },
  { value: HttpMethod.DELETE, label: "DELETE" },
  { value: HttpMethod.PATCH, label: "PATCH" }
]

const methodColors = {
  GET: "text-blue-600 bg-blue-50",
  POST: "text-green-600 bg-green-50",
  PUT: "text-orange-600 bg-orange-50",
  DELETE: "text-red-600 bg-red-50",
  PATCH: "text-purple-600 bg-purple-50",
  HEAD: "text-gray-600 bg-gray-50",
  OPTIONS: "text-gray-600 bg-gray-50"
}

export function CreateEndpointForm({ projectId, folderId, onSuccess, onCancel }: CreateEndpointFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<CreateEndpointForm>({
    resolver: zodResolver(createEndpointSchema),
    defaultValues: {
      name: "",
      description: "",
      method: HttpMethod.GET,
      path: "/",
      folderId
    }
  })

  const selectedMethod = watch("method")

  const onSubmit = async (data: CreateEndpointForm) => {
    try {
      setIsLoading(true)
      setError(undefined)
      
      await EndpointApi.createEndpoint(projectId, data)
      
      if (onSuccess) {
        onSuccess()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create endpoint")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            Create New Endpoint
          </h2>
          <p className="text-sm text-gray-600">
            Add a new API endpoint to your documentation
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Endpoint Name"
            placeholder="Get user profile"
            error={errors.name?.message}
            {...register("name")}
          />

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Description (Optional)
            </label>
            <textarea
              placeholder="Describe what this endpoint does..."
              rows={2}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
              {...register("description")}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Method
              </label>
              <div className="space-y-2">
                {methodOptions.map(option => (
                  <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value={option.value}
                      checked={selectedMethod === option.value}
                      onChange={() => setValue("method", option.value)}
                      className="text-primary focus:ring-primary"
                    />
                    <Badge className={`text-xs px-2 py-1 font-mono ${methodColors[option.value]}`}>
                      {option.label}
                    </Badge>
                  </label>
                ))}
              </div>
            </div>

            <Input
              label="Path"
              placeholder="/users/{id}"
              error={errors.path?.message}
              {...register("path")}
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
              {isLoading ? "Creating..." : "Create Endpoint"}
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