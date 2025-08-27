import { toast as sonnerToast } from "sonner"

export const useToast = () => {
  const toast = {
    success: (message: string) => {
      sonnerToast.success(message, {
        duration: 3000,
      })
    },
    error: (message: string) => {
      sonnerToast.error(message, {
        duration: 5000,
      })
    },
    info: (message: string) => {
      sonnerToast(message, {
        duration: 3000,
      })
    },
    loading: (message: string) => {
      return sonnerToast.loading(message)
    },
    promise: <T,>(
      promise: Promise<T>,
      {
        loading,
        success,
        error,
      }: {
        loading: string
        success: string | ((data: T) => string)
        error: string | ((error: any) => string)
      }
    ) => {
      return sonnerToast.promise(promise, {
        loading,
        success,
        error,
      })
    },
  }

  return toast
}