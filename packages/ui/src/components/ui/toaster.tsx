"use client"

import * as React from "react"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "./toast" // Use relative import inside the package
import { Button } from "./button"
import { Copy, Check } from "lucide-react"
import { ScrollArea } from "./scroll-area"

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
function ToastComponent({ id, title, description, action, variant, ...props }: any) {
  const [hasCopied, setHasCopied] = React.useState(false);

  const fullErrorText = React.useMemo(() => {
    const titleText = getTextContent(title);
    const descriptionText = getTextContent(description);
    return `${titleText ? titleText + "\n" : ""}${descriptionText || ""}`.trim();
  }, [title, description]);


  const handleCopy = () => {
    if (fullErrorText) {
      navigator.clipboard.writeText(fullErrorText);
      setHasCopied(true);
      setTimeout(() => setHasCopied(false), 2000); // Reset icon after 2 seconds
    }
  };

  return (
    <>
      <Toast key={id} variant={variant} {...props} className="flex-col items-start gap-2">
        <div className="w-full flex justify-between items-start gap-2">
            <div className="grid gap-1 flex-grow">
              {title && <ToastTitle>{title}</ToastTitle>}
            </div>
            <div className="flex flex-col gap-2 self-start flex-shrink-0">
              <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-muted-foreground hover:bg-secondary"
                  onClick={handleCopy}
                  aria-label="Copiar notificação"
                >
                  {hasCopied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
              </Button>
            </div>
            <ToastClose />
        </div>

        {description && (
            <ScrollArea className="w-full max-h-[200px] pr-4">
                <ToastDescription className="text-xs whitespace-pre-wrap">{description}</ToastDescription>
            </ScrollArea>
        )}
      </Toast>
    </>
  );
}

export function Toaster() {
  const toasts: any[] = []; // Mock toasts array

  return (
    <ToastProvider>
      {toasts.map(toastProps => (
        <ToastComponent key={toastProps.id} {...toastProps} />
      ))}
      <ToastViewport />
    </ToastProvider>
  )
}