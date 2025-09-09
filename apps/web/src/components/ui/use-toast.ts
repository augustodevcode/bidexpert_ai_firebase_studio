import * as React from "react"
import { toast as showToast, ToastAction, ToastProps } from "@bidexpert/ui"

export function useToast() {
  const toast = React.useCallback((props: ToastProps & {
    title?: React.ReactNode
    description?: React.ReactNode
    action?: React.ReactElement<typeof ToastAction>
  }) => {
    return showToast({
      ...props,
    })
  }, [])

  return { toast }
}