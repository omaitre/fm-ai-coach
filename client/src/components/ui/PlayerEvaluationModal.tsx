import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PositionEvaluation } from "./PositionEvaluation";

interface TacticEvaluation {
  tactic: {
    id: number;
    name: string;
    formation: string;
  };
  evaluations: Array<{
    position: {
      id: number;
      positionCode: string;
      roleName: string;
      duty: string;
    };
    players: Array<{
      player: {
        id: number;
        name: string;
        age: number;
        currentAbility: number;
        potentialAbility: number;
      };
      score: number;
      keyAverage: number;
      preferredAverage: number;
      keyStrengths: string[];
      attributeBreakdown: {
        keyAttributes: number;
        preferredAttributes: number;
        totalAttributes: number;
      };
    }>;
    attributeConfig: {
      keyAttributes: string[];
      preferredAttributes: string[];
    };
    error?: string;
  }>;
  metadata: {
    totalPlayers: number;
    evaluatedAt: string;
  };
}

interface PlayerEvaluationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  evaluation: TacticEvaluation | null | undefined;
  isLoading: boolean;
  error?: Error | null;
}

// Pragmatic type guard - checks essential structure only
function isValidEvaluation(evaluation: unknown): evaluation is TacticEvaluation {
  return (
    evaluation !== null &&
    evaluation !== undefined &&
    typeof evaluation === 'object' &&
    'tactic' in (evaluation as any) &&
    'evaluations' in (evaluation as any) &&
    'metadata' in (evaluation as any)
  );
}

export function PlayerEvaluationModal({
  open,
  onOpenChange,
  evaluation,
  isLoading,
  error,
}: PlayerEvaluationModalProps) {
  // Determine the current state with clear precedence
  const getModalState = () => {
    if (isLoading) return 'loading';
    if (error) return 'error';
    if (!evaluation) return 'empty';
    if (!isValidEvaluation(evaluation)) return 'invalid';
    return 'success';
  };

  const modalState = getModalState();
  const validEvaluation = modalState === 'success' ? (evaluation as TacticEvaluation) : null;

  // Render title based on state
  const renderTitle = () => {
    switch (modalState) {
      case 'loading':
        return (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Evaluating Players...
          </>
        );
      case 'error':
        return (
          <>
            <AlertCircle className="h-5 w-5 text-destructive" />
            Evaluation Failed
          </>
        );
      case 'success':
        return (
          <>
            Player Evaluation: {validEvaluation!.tactic.name}
            <Badge variant="outline" className="ml-auto">
              {validEvaluation!.tactic.formation}
            </Badge>
          </>
        );
      default:
        return "Player Evaluation";
    }
  };

  // Render content based on state
  const renderContent = () => {
    switch (modalState) {
      case 'loading':
        return (
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-3">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Analyzing players against tactical requirements...
              </p>
            </div>
          </div>
        );

      case 'error':
        return (
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-3">
              <AlertCircle className="h-8 w-8 mx-auto text-destructive" />
              <div>
                <p className="font-medium text-destructive mb-1">Evaluation Failed</p>
                <p className="text-sm text-muted-foreground">
                  {error?.message || "Unable to evaluate players for this tactic"}
                </p>
              </div>
            </div>
          </div>
        );

      case 'invalid':
        return (
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-3">
              <AlertCircle className="h-8 w-8 mx-auto text-amber-500" />
              <div>
                <p className="font-medium text-amber-600 mb-1">Invalid Data</p>
                <p className="text-sm text-muted-foreground">
                  The evaluation data received is malformed
                </p>
              </div>
            </div>
          </div>
        );

      case 'success':
        return (
          <div className="space-y-6">
            {/* Evaluation Summary */}
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Total Players:</span>
                  <p className="font-medium">{validEvaluation!.metadata.totalPlayers}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Positions:</span>
                  <p className="font-medium">{validEvaluation!.evaluations.length}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Evaluated:</span>
                  <p className="font-medium">
                    {new Date(validEvaluation!.metadata.evaluatedAt).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Position Evaluations */}
            <div className="grid gap-6">
              {validEvaluation!.evaluations.map((positionEval) => (
                <PositionEvaluation
                  key={`${positionEval.position.positionCode}-${positionEval.position.roleName}-${positionEval.position.duty}`}
                  evaluation={positionEval}
                />
              ))}
            </div>

            {/* Score Legend */}
            <div className="bg-muted/30 rounded-lg p-4">
              <h4 className="font-medium mb-3">Suitability Score Legend</h4>
              <div className="flex gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span>Excellent (75-100%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <span>Good (50-75%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span>Poor (&lt;50%)</span>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No evaluation data available</p>
          </div>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] p-0" aria-describedby="evaluation-content">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center gap-3">
            {renderTitle()}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] px-6 pb-6" id="evaluation-content">
          {renderContent()}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}