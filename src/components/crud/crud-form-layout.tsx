import React from "react";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface CrudFormLayoutProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function CrudFormLayout({
  title,
  description,
  actions,
  children,
  className,
}: CrudFormLayoutProps) {
  return (
    <div className="space-y-6 p-6 pb-16 block">
      <div className="space-y-0.5">
        <div className="flex items-center justify-between">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
                {description && (
                    <p className="text-muted-foreground">
                    {description}
                    </p>
                )}
            </div>
            {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      </div>
      <Separator className="my-6" />
      <div className={cn("flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0", className)}>
        <div className="flex-1 lg:max-w-full">{children}</div>
      </div>
    </div>
  );
}
