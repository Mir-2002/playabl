"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState } from "react"
import { Toast } from "@base-ui/react/toast"
import { toastManager } from "@/hooks/use-toast"
import { X } from "lucide-react"

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <Toast.Provider toastManager={toastManager} timeout={4000}>
        {children}
        <ToastViewport />
      </Toast.Provider>
    </QueryClientProvider>
  )
}

function ToastViewport() {
  const { toasts } = Toast.useToastManager()

  return (
    <Toast.Viewport className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-[calc(100vw-2rem)] max-w-sm sm:right-6 sm:bottom-6 outline-none">
      {toasts.map((toast) => (
        <Toast.Root
          key={toast.id}
          toast={toast}
          className="group relative flex items-start gap-3 rounded-xl border-2 border-foreground bg-card p-4 shadow-hard-sm overflow-hidden data-[starting-style]:translate-y-4 data-[starting-style]:opacity-0 data-[ending-style]:translate-y-4 data-[ending-style]:opacity-0 transition-all duration-[--dur-slow] ease-[--ease-pop]"
        >
          {/* Kind stripe */}
          <span
            className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
            style={{
              background:
                (toast as { type?: string }).type === "success"
                  ? "#34D399"
                  : (toast as { type?: string }).type === "error"
                    ? "var(--destructive)"
                    : "#8B5CF6",
            }}
            aria-hidden
          />
          <div className="flex-1 min-w-0 pl-2">
            <Toast.Title className="font-heading font-bold text-sm text-foreground" />
            {(toast as { description?: string }).description && (
              <Toast.Description className="text-xs text-muted-foreground mt-0.5" />
            )}
          </div>
          <Toast.Close className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-md hover:bg-muted transition-colors focus-visible:ring-2 focus-visible:ring-ring">
            <X className="w-3 h-3" />
          </Toast.Close>
        </Toast.Root>
      ))}
    </Toast.Viewport>
  )
}
