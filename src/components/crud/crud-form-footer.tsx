import React from "react";
import { Separator } from "@/components/ui/separator";

interface CrudFormFooterProps {
  children: React.ReactNode;
  className?: string;
}

export function CrudFormFooter({ children, className }: CrudFormFooterProps) {
  return (
    <>
      <Separator className="my-6" />
      <div className="flex items-center justify-end space-x-2">
        {children}
      </div>
    </>
  );
}
