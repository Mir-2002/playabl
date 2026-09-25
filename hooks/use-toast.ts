"use client"

import { Toast } from "@base-ui/react/toast"

export const toastManager = Toast.createToastManager()

export function useToast() {
  return {
    success: (title: string, description?: string) =>
      toastManager.add({ title, description, type: "success" }),
    error: (title: string, description?: string) =>
      toastManager.add({ title, description, type: "error" }),
    info: (title: string, description?: string) =>
      toastManager.add({ title, description }),
  }
}
