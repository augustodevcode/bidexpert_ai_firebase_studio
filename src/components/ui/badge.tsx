import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "badge-base",
  {
    variants: {
      variant: {
        default: "badge-variant-default",
        secondary: "badge-variant-secondary",
        destructive: "badge-variant-destructive",
        outline: "badge-variant-outline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), "whitespace-nowrap", className)} {...props} />
  )
}

export { Badge, badgeVariants }
