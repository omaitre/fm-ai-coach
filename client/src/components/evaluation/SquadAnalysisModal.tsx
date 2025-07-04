import { useQuery, useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Users, 
  Award, 
  Calculator, 
  AlertTriangle,
  Trophy,
  Target,
  CheckCircle,
  Clock,
  Zap
} from "lucide-react";

interface SquadAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  tactic: {
    id: number;
    name: string;
    formation: string;
  };
}

interface SquadAnalysis {
  positions: Array<{
    id: number;
    positionCode: string;
    positionName: string;
    roleName: string;
    duty: string;
    bestPlayers: Array<{
      id: number;
      name: string;
      age: number;
      position: string;
      snapshot: {
        currentAbility: number;
        potentialAbility: number;
      };
      score: {
        fitnessPercentage: string;
      };
    }>;
    playerCount: number;
    averageScore: number;
  }>;
  overallFitness: number;
  squadGaps: string[];
}

export function SquadAnalysisModal({ isOpen, onClose, tactic }: SquadAnalysisModalProps) {
  const { toast } = useToast();

  const { data: analysis, isLoading, refetch } = useQuery<SquadAnalysis>({
    queryKey: [`/api/tactics/${tactic.id}/squad-analysis`],
    enabled: isOpen && !!tactic.id,
  });

  const calculateAllScoresMutation = useMutation({
    mutationFn: () => apiRequest(`/api/tactics/${tactic.id}/calculate-all-scores`, {
      method: "POST",
    }),
    onSuccess: (data: any) => {
      toast({
        title: "Squad Analysis Complete",
        description: `Calculated ${data.totalCalculated} player-position scores`,
      });
      refetch();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to calculate squad analysis",
        variant: "destructive",
      });
    },
  });

  const getPositionFitnessColor = (score: number) => {
    if (score >= 75) return "text-green-600 bg-green-50 border-green-200";
    if (score >= 60) return "text-blue-600 bg-blue-50 border-blue-200";
    if (score >= 45) return "text-yellow-600 bg-yellow-50 border-yellow-200";
    return "text-red-600 bg-red-50 border-red-200";
  };

  const getOverallFitnessColor = (fitness: number) => {
    if (fitness >= 70) return "text-green-600";
    if (fitness >= 55) return "text-yellow-600";
    return "text-red-600";
  };

  const getOverallFitnessIcon = (fitness: number) => {
    if (fitness >= 70) return <TrendingUp className="w-5 h-5" />;
    if (fitness >= 55) return <Target className="w-5 h-5" />;
    return <TrendingDown className="w-5 h-5" />;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <BarChart3 className="w-5 h-5" />
            Squad Analysis - {tactic.name}
            <Badge variant="outline" className="ml-2">
              {tactic.formation}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-auto space-y-6">
          {/* Action Header */}
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border">
            <div className="flex items-center gap-6">
              {analysis && (
                <>
                  <div className={`flex items-center gap-2 ${getOverallFitnessColor(analysis.overallFitness)}`}>
                    {getOverallFitnessIcon(analysis.overallFitness)}
                    <div>
                      <div className="font-bold text-lg">
                        {analysis.overallFitness.toFixed(1)}%
                      </div>
                      <div className="text-xs font-medium">
                        Overall Fitness
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      {analysis.positions.length} Positions
                    </span>
                  </div>
                  {analysis.squadGaps.length > 0 && (
                    <div className="flex items-center gap-2 text-amber-600">
                      <AlertTriangle className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        {analysis.squadGaps.length} Squad Gaps
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
            <Button
              onClick={() => calculateAllScoresMutation.mutate()}
              disabled={calculateAllScoresMutation.isPending}
              size="sm"
            >
              <Calculator className="w-4 h-4 mr-2" />
              {calculateAllScoresMutation.isPending ? "Calculating..." : "Recalculate All"}
            </Button>
          </div>

          {/* Loading State */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 animate-spin" />
                <span>Analyzing squad fitness...</span>
              </div>
            </div>
          ) : !analysis ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calculator className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Analysis Available</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Calculate player scores to analyze squad fitness for this tactic.
                </p>
                <Button onClick={() => calculateAllScoresMutation.mutate()}>
                  <Calculator className="w-4 h-4 mr-2" />
                  Calculate Squad Analysis
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Squad Gaps Alert */}
              {analysis.squadGaps.length > 0 && (
                <Card className="border-amber-200 bg-amber-50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-amber-800">
                      <AlertTriangle className="w-5 h-5" />
                      Squad Gaps Identified
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {analysis.squadGaps.map((gap, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm text-amber-700">
                          <div className="w-2 h-2 bg-amber-400 rounded-full" />
                          {gap}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Position Analysis Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {analysis.positions.map((position) => {
                  const positionFitness = position.averageScore;
                  const fitnessColor = getPositionFitnessColor(positionFitness);

                  return (
                    <Card key={position.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-sm font-semibold">
                              {position.positionCode}
                            </CardTitle>
                            <p className="text-xs text-muted-foreground">
                              {position.roleName} ({position.duty})
                            </p>
                          </div>
                          <div className={`px-2 py-1 rounded-md border text-xs font-medium ${fitnessColor}`}>
                            {positionFitness.toFixed(1)}%
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {/* Progress Bar */}
                        <div>
                          <Progress value={positionFitness} className="h-2" />
                          <div className="flex justify-between text-xs text-muted-foreground mt-1">
                            <span>{position.playerCount} players</span>
                            <span>Avg fitness</span>
                          </div>
                        </div>

                        {/* Best Players */}
                        <div className="space-y-2">
                          <h4 className="text-xs font-medium text-muted-foreground">Best Players</h4>
                          {position.bestPlayers.length === 0 ? (
                            <div className="text-xs text-muted-foreground italic">
                              No evaluations available
                            </div>
                          ) : (
                            <div className="space-y-1">
                              {position.bestPlayers.slice(0, 3).map((player, index) => (
                                <div key={player.id} className="flex items-center justify-between text-xs">
                                  <div className="flex items-center gap-2">
                                    <div className="flex items-center justify-center w-4 h-4 rounded-full bg-muted text-xs font-medium">
                                      {index + 1}
                                    </div>
                                    <span className="font-medium">{player.name}</span>
                                    <Badge variant="secondary" className="text-xs px-1 py-0">
                                      {player.age}y
                                    </Badge>
                                  </div>
                                  <div className="font-medium">
                                    {parseFloat(player.score.fitnessPercentage).toFixed(1)}%
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Overall Summary */}
              <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-800">
                    <Trophy className="w-5 h-5" />
                    Squad Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {analysis.overallFitness.toFixed(1)}%
                      </div>
                      <div className="text-sm text-blue-700">Overall Fitness</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {analysis.positions.filter(p => p.averageScore >= 60).length}
                      </div>
                      <div className="text-sm text-green-700">Strong Positions</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-amber-600">
                        {analysis.squadGaps.length}
                      </div>
                      <div className="text-sm text-amber-700">Areas to Improve</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            Squad analysis based on player attributes and position requirements
          </div>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}