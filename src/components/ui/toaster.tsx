// src/components/ui/toaster.tsx
"use client"

import * as React from "react"
import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

// This component is simplified to remove the non-functional copy button
function ToastComponent({ id, title, description, action, variant, ...props }: any) {
  return (
      <Toast key={id} variant={variant} {...props}>
        <div className="grid gap-1">
          {title && <ToastTitle>{title}</ToastTitle>}
          {description && <ToastDescription>{description}</ToastDescription>}
        </div>
        {action}
        <ToastClose />
      </Toast>
  );
}

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(toastProps => (
        <ToastComponent key={toastProps.id} {...toastProps} />
      ))}
      <ToastViewport />
    </ToastProvider>
  )
}
