import { Button } from "@/components/ui/button";
import { Loader2, Save, X } from "lucide-react";
import React from "react";
import { ValidationCheckButton } from "./validation-check-button";
import { type ValidationResult } from "@/lib/form-validator";

interface CrudFormActionsProps {
  isSubmitting?: boolean;
  onSave?: () => void;
  onCancel?: () => void;
  onValidationCheck?: () => ValidationResult;
  saveLabel?: string;
  cancelLabel?: string;
  showValidation?: boolean;
  className?: string;
}

export function CrudFormActions({
  isSubmitting,
  onSave,
  onCancel,
  onValidationCheck,
  saveLabel = "Salvar",
  cancelLabel = "Cancelar",
  showValidation = true,
  className,
}: CrudFormActionsProps) {
  return (
    <div className="flex items-center gap-2">
      {onCancel && (
        <Button variant="outline" onClick={onCancel} disabled={isSubmitting} type="button">
          <X className="mr-2 h-4 w-4" />
          {cancelLabel}
        </Button>
      )}
      
      {showValidation && onValidationCheck && (
        <ValidationCheckButton 
          onCheck={onValidationCheck}
          variant="outline"
          size="default"
        />
      )}
      
      <Button 
        onClick={onSave} 
        disabled={isSubmitting} 
        type={onSave ? "button" : "submit"}
      >
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {!isSubmitting && <Save className="mr-2 h-4 w-4" />}
        {saveLabel}
      </Button>
    </div>
  );
}
