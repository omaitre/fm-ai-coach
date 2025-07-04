import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertCircle } from "lucide-react";

interface PositionValidationTooltipProps {
  errors: string[];
  children: React.ReactNode;
}

export function PositionValidationTooltip({ errors, children }: PositionValidationTooltipProps) {
  if (errors.length === 0) {
    return <>{children}</>;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="relative">
            {children}
            <AlertCircle className="absolute -top-1 -right-1 w-3 h-3 text-destructive" />
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-1">
            <p className="font-medium text-xs">Validation Errors:</p>
            {errors.map((error, index) => (
              <p key={index} className="text-xs">• {error}</p>
            ))}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}