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
  Trophy, 
  Target, 
  TrendingUp, 
  User, 
  Calendar, 
  BarChart3, 
  Calculator,
  Medal,
  Star,
  Activity,
  Zap
} from "lucide-react";

interface PlayerEvaluationModalProps {
  isOpen: boolean;
  onClose: () => void;
  position: {
    id: number;
    positionCode: string;
    positionName: string;
    roleName: string;
    duty: string;
  };
}

interface PlayerRanking {
  id: number;
  name: string;
  age: number;
  position: string;
  snapshot: {
    id: number;
    currentAbility: number;
    potentialAbility: number;
    snapshotDate: string;
  };
  score: {
    score: number;
    maxPossibleScore: number;
    keyAttributeScore: number;
    preferredAttributeScore: number;
    otherAttributeScore: number;
    fitnessPercentage: string;
  };
  attributes: Array<{
    attributeName: string;
    value: number;
  }>;
}

export function PlayerEvaluationModal({ isOpen, onClose, position }: PlayerEvaluationModalProps) {
  const { toast } = useToast();

  const { data: rankings = [], isLoading, refetch } = useQuery<PlayerRanking[]>({
    queryKey: [`/api/positions/${position.id}/evaluation`],
    enabled: isOpen && !!position.id,
  });

  const calculateScoresMutation = useMutation({
    mutationFn: () => 
      apiRequest(`/api/positions/${position.id}/calculate-scores`, {
        method: "POST",
      }),
    onSuccess: (data: any) => {
      toast({
        title: "Scores Calculated",
        description: `Calculated scores for ${data.calculated} players`,
      });
      refetch();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to calculate player scores",
        variant: "destructive",
      });
    },
  });

  const getFitnessColor = (percentage: string) => {
    const value = parseFloat(percentage);
    if (value >= 80) return "text-green-600 bg-green-50 border-green-200";
    if (value >= 65) return "text-blue-600 bg-blue-50 border-blue-200";
    if (value >= 50) return "text-yellow-600 bg-yellow-50 border-yellow-200";
    return "text-red-600 bg-red-50 border-red-200";
  };

  const getRankIcon = (index: number) => {
    if (index === 0) return <Medal className="w-5 h-5 text-yellow-500" />;
    if (index === 1) return <Medal className="w-5 h-5 text-gray-400" />;
    if (index === 2) return <Medal className="w-5 h-5 text-amber-600" />;
    return <Star className="w-4 h-4 text-muted-foreground" />;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Trophy className="w-5 h-5" />
            Player Evaluation - {position.positionCode}
            <Badge variant="outline" className="ml-2">
              {position.roleName} ({position.duty})
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-auto space-y-6">
          {/* Action Header */}
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">
                  {position.positionName} Analysis
                </span>
              </div>
              {rankings.length > 0 && (
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    {rankings.length} Players Evaluated
                  </span>
                </div>
              )}
            </div>
            <Button
              onClick={() => calculateScoresMutation.mutate()}
              disabled={calculateScoresMutation.isPending}
              size="sm"
            >
              <Calculator className="w-4 h-4 mr-2" />
              {calculateScoresMutation.isPending ? "Calculating..." : "Recalculate"}
            </Button>
          </div>

          {/* Loading State */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 animate-spin" />
                <span>Loading player evaluations...</span>
              </div>
            </div>
          ) : rankings.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calculator className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Evaluations Available</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Calculate player fitness scores for this position to see rankings.
                </p>
                <Button onClick={() => calculateScoresMutation.mutate()}>
                  <Calculator className="w-4 h-4 mr-2" />
                  Calculate Player Scores
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Top Performers Summary */}
              <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-800">
                    <TrendingUp className="w-5 h-5" />
                    Position Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {parseFloat(rankings[0]?.score.fitnessPercentage || "0").toFixed(1)}%
                      </div>
                      <div className="text-sm text-blue-700">Best Fitness</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {rankings.filter(p => parseFloat(p.score.fitnessPercentage) >= 65).length}
                      </div>
                      <div className="text-sm text-green-700">Suitable Players</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {rankings.length > 0 
                          ? (rankings.reduce((sum, p) => sum + parseFloat(p.score.fitnessPercentage), 0) / rankings.length).toFixed(1)
                          : 0}%
                      </div>
                      <div className="text-sm text-orange-700">Average Fitness</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Player Rankings */}
              <div className="space-y-3">
                {rankings.map((player, index) => {
                  const fitnessPercentage = parseFloat(player.score.fitnessPercentage);
                  const fitnessColor = getFitnessColor(player.score.fitnessPercentage);

                  return (
                    <Card key={player.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          {/* Player Info */}
                          <div className="flex items-center gap-4">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted">
                              {getRankIcon(index)}
                            </div>
                            <div>
                              <h3 className="font-semibold">{player.name}</h3>
                              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                <span>{player.age} years old</span>
                                <span>CA: {player.snapshot.currentAbility}</span>
                                <span>PA: {player.snapshot.potentialAbility}</span>
                              </div>
                            </div>
                          </div>

                          {/* Fitness Score */}
                          <div className="text-right">
                            <div className={`px-3 py-1 rounded-lg border text-lg font-bold ${fitnessColor}`}>
                              {fitnessPercentage.toFixed(1)}%
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              Position Fitness
                            </div>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="mt-4">
                          <Progress value={fitnessPercentage} className="h-2" />
                        </div>

                        {/* Score Breakdown */}
                        <div className="grid grid-cols-3 gap-4 mt-4 text-sm">
                          <div className="text-center p-2 bg-red-50 rounded">
                            <div className="font-semibold text-red-700">
                              {player.score.keyAttributeScore}
                            </div>
                            <div className="text-xs text-red-600">Key Attributes</div>
                          </div>
                          <div className="text-center p-2 bg-blue-50 rounded">
                            <div className="font-semibold text-blue-700">
                              {player.score.preferredAttributeScore}
                            </div>
                            <div className="text-xs text-blue-600">Preferred</div>
                          </div>
                          <div className="text-center p-2 bg-gray-50 rounded">
                            <div className="font-semibold text-gray-700">
                              {player.score.otherAttributeScore}
                            </div>
                            <div className="text-xs text-gray-600">Other</div>
                          </div>
                        </div>

                        {/* Total Score */}
                        <div className="mt-2 text-center text-xs text-muted-foreground">
                          Total: {player.score.score} / {player.score.maxPossibleScore} points
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            Rankings based on position requirements and player attributes
          </div>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}