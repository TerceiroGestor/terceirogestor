"use client";

import * as React from "react";
import { X } from "lucide-react";
import { Toast as ToastPrimitive } from "radix-ui";
import { cn } from "@/lib/utils";

type ToastVariant = "default" | "destructive" | "success";

export type ToastOptions = {
  id?: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  variant?: ToastVariant;
  duration?: number;
};

type ToastItem = Required<Pick<ToastOptions, "id">> & ToastOptions;

type ToastContextValue = {
  toast: (options: ToastOptions) => { id: string };
  dismiss: (id?: string) => void;
};

const ToastContext = React.createContext<ToastContextValue | null>(null);

function ToastRoot({
  children,
  variant = "default",
  className,
  ...props
}: React.ComponentProps<typeof ToastPrimitive.Root> & { variant?: ToastVariant }) {
  return (
    <ToastPrimitive.Root
      className={cn(
        "group pointer-events-auto relative flex w-full items-start gap-3 overflow-hidden rounded-xl border bg-background p-4 shadow-lg",
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-right-2 data-[state=open]:slide-in-from-right-2",
        variant === "destructive" ? "border-destructive/40 bg-destructive/5" : null,
        variant === "success" ? "border-emerald-500/40 bg-emerald-500/5" : null,
        className,
      )}
      {...props}
    >
      {children}
    </ToastPrimitive.Root>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);

  const dismiss = React.useCallback((id?: string) => {
    if (!id) {
      setToasts([]);
      return;
    }
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const toast = React.useCallback((options: ToastOptions) => {
    const id =
      options.id ??
      (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`);
    const item: ToastItem = { ...options, id };
    setToasts((prev) => [...prev, item]);
    return { id };
  }, []);

  const value = React.useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      <ToastPrimitive.Provider swipeDirection="right">
        {children}

        <ToastPrimitive.Viewport className="fixed bottom-4 right-4 z-[100] flex max-h-screen w-[min(420px,calc(100vw-2rem))] flex-col justify-end gap-2 outline-none" />

        {toasts.map((toastItem) => (
          <ToastRoot
            key={toastItem.id}
            variant={toastItem.variant}
            duration={toastItem.duration ?? 4500}
            defaultOpen
            onOpenChange={(open) => {
              if (!open) dismiss(toastItem.id);
            }}
          >
            <div className="grid flex-1 gap-1">
              {toastItem.title ? (
                <ToastPrimitive.Title className="text-sm font-semibold">
                  {toastItem.title}
                </ToastPrimitive.Title>
              ) : null}
              {toastItem.description ? (
                <ToastPrimitive.Description className="text-sm text-muted-foreground">
                  {toastItem.description}
                </ToastPrimitive.Description>
              ) : null}
            </div>
            <ToastPrimitive.Close
              aria-label="Fechar"
              className="rounded-md p-1 text-muted-foreground opacity-70 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="size-4" />
            </ToastPrimitive.Close>
          </ToastRoot>
        ))}
      </ToastPrimitive.Provider>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within <ToastProvider />");
  }
  return context;
}

