import { useTransition, useEffect } from "react";
import { useForm, UseFormProps, FieldValues } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ZodSchema } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { logFormAction, logCrudAction, logError } from "@/lib/user-action-logger";

interface UseCrudFormProps<T extends FieldValues> extends UseFormProps<T> {
  schema: ZodSchema<T>;
  onSubmitAction: (data: T) => Promise<{ success: boolean; message: string; data?: any }>;
  onSuccess?: (data?: any) => void;
  successMessage?: string;
  moduleName?: string; // For logging purposes
}

export function useCrudForm<T extends FieldValues>({
  schema,
  onSubmitAction,
  onSuccess,
  successMessage = "Registro salvo com sucesso!",
  moduleName = "CRUD Form",
  ...formProps
}: UseCrudFormProps<T>) {
  const { toast } = useToast();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<T>({
    resolver: zodResolver(schema),
    ...formProps,
  });

  // Log form initialization
  useEffect(() => {
    logFormAction('Form initialized', { 
      hasInitialData: !!formProps.defaultValues,
      mode: formProps.mode || 'onChange'
    }, moduleName);
  }, [moduleName, formProps.defaultValues, formProps.mode]);

  const handleSubmit = form.handleSubmit(async (data) => {
    logFormAction('Form submit started', { 
      isDirty: form.formState.isDirty,
      isValid: form.formState.isValid 
    }, moduleName);

    startTransition(async () => {
      try {
        logCrudAction('Saving data', {}, moduleName);
        const result = await onSubmitAction(data);
        
        if (result.success) {
          logCrudAction('Save successful', { data: result.data }, moduleName);
          toast({
            title: "Sucesso",
            description: result.message || successMessage,
          });
          if (onSuccess) {
            onSuccess(result.data);
          }
        } else {
          logError('Save failed', { message: result.message }, moduleName);
          toast({
            variant: "destructive",
            title: "Erro",
            description: result.message || "Ocorreu um erro ao salvar.",
          });
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logError('Save exception', { error: errorMessage }, moduleName);
        console.error(error);
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Ocorreu um erro inesperado.",
        });
      }
    });
  });

  return {
    form,
    handleSubmit,
    isSubmitting: isPending,
  };
}
