
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
import { Button } from "./button"
import { Copy, Check } from "lucide-react"

// Helper function to recursively extract text content from React nodes
const getTextContent = (node: React.ReactNode): string => {
  if (typeof node === 'string') return node;
  if (typeof node === 'number') return String(node);
  if (node === null || typeof node === 'boolean' || node === undefined) return '';

  if (Array.isArray(node)) {
    return node.map(getTextContent).join('');
  }

  if (React.isValidElement(node) && node.props.children) {
    return getTextContent(node.props.children);
  }

  return '';
};


// Extracted component to handle its own state, avoiding hook calls in a loop.
function ToastComponent({ id, title, description, action, ...props }: any) {
  const [hasCopied, setHasCopied] = React.useState(false);

  const handleCopy = () => {
    const titleText = getTextContent(title);
    const descriptionText = getTextContent(description);
    const textToCopy = `${titleText ? titleText + "\n" : ""}${descriptionText || ""}`.trim();
    
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy);
      setHasCopied(true);
      setTimeout(() => setHasCopied(false), 2000); // Reset icon after 2 seconds
    }
  };

  return (
    <Toast key={id} {...props}>
      <div className="grid gap-1 flex-grow">
        {title && <ToastTitle>{title}</ToastTitle>}
        {description && (
          <ToastDescription>{description}</ToastDescription>
        )}
      </div>
      <div className="flex flex-col gap-2 self-start">
        {action}
        <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-muted-foreground hover:bg-secondary"
            onClick={handleCopy}
            aria-label="Copiar notificação"
          >
            {hasCopied ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
        </Button>
      </div>
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
