import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import TacticGridCreator from "@/components/tactics/tactic-grid-creator";
import { PlayerEvaluationModal } from "@/components/evaluation/PlayerEvaluationModal";
import { SquadAnalysisModal } from "@/components/evaluation/SquadAnalysisModal";
import { Target, Users, BarChart3, Calendar, Edit, Play, Zap } from "lucide-react";

interface Tactic {
  id: number;
  name: string;
  formation: string;
  instructions: string;
  isActive: boolean;
  createdAt: string;
  positions: Array<{
    id: number;
    positionCode: string;
    positionName: string;
    roleName: string;
    duty: string;
    playerId?: number;
    attributes: Array<{
      attributeName: string;
      weight: number;
    }>;
  }>;
}

export default function TacticsPage() {
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);
  const [editingTactic, setEditingTactic] = useState<Tactic | null>(null);
  const [evaluationPosition, setEvaluationPosition] = useState<any>(null);
  const [squadAnalysisTactic, setSquadAnalysisTactic] = useState<any>(null);

  const { data: tactics = [], isLoading } = useQuery<Tactic[]>({
    queryKey: ["/api/tactics"],
  });

  const { data: activeTactic } = useQuery<Tactic>({
    queryKey: ["/api/tactics/active"],
  });

  const handleEditTactic = (tactic: Tactic) => {
    setEditingTactic(tactic);
    setIsCreatorOpen(true);
  };

  const handleCreateNew = () => {
    setEditingTactic(null);
    setIsCreatorOpen(true);
  };

  const getFormationBadgeColor = (formation: string) => {
    const colorMap: Record<string, string> = {
      '4-4-2': 'bg-blue-100 text-blue-800',
      '4-3-3': 'bg-green-100 text-green-800',
      '5-3-2': 'bg-purple-100 text-purple-800',
      '3-5-2': 'bg-orange-100 text-orange-800',
      '4-2-3-1': 'bg-indigo-100 text-indigo-800',
    };
    return colorMap[formation] || 'bg-gray-100 text-gray-800';
  };

  const getCompletionPercentage = (tactic: Tactic) => {
    if (!tactic.positions?.length) return 0;
    
    const configuredPositions = tactic.positions.filter(pos => 
      pos.roleName && pos.duty && pos.attributes && pos.attributes.length > 0
    );
    
    return Math.round((configuredPositions.length / tactic.positions.length) * 100);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tactical Analysis</h1>
          <p className="text-muted-foreground">
            Create and analyze tactical formations with player evaluations
          </p>
        </div>
        <Button onClick={handleCreateNew} className="flex items-center gap-2">
          <Target className="w-4 h-4" />
          Create New Tactic
        </Button>
      </div>

      {/* Active Tactic Overview */}
      {activeTactic && (
        <Card className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <Play className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-green-800">Active Tactic</CardTitle>
                  <p className="text-sm text-green-600">{activeTactic.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSquadAnalysisTactic({
                    id: activeTactic.id,
                    name: activeTactic.name,
                    formation: activeTactic.formation
                  })}
                  className="text-green-700 border-green-300 hover:bg-green-100"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Squad Analysis
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEditTactic(activeTactic)}
                  className="text-green-700 border-green-300 hover:bg-green-100"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                <Badge className={getFormationBadgeColor(activeTactic.formation)}>
                  {activeTactic.formation}
                </Badge>
                <span className="text-sm text-green-700">Formation</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Progress 
                    value={getCompletionPercentage(activeTactic)} 
                    className="w-20 h-2" 
                  />
                  <span className="text-sm font-medium text-green-700">
                    {getCompletionPercentage(activeTactic)}%
                  </span>
                </div>
                <span className="text-sm text-green-700">Complete</span>
              </div>
              <div className="flex items-center gap-3">
                <Users className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-700">
                  {activeTactic.positions.length} Positions
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tactics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tactics.map((tactic) => {
          const completionPercentage = getCompletionPercentage(tactic);
          const isActive = activeTactic?.id === tactic.id;

          return (
            <Card 
              key={tactic.id} 
              className={`hover:shadow-lg transition-all duration-200 ${
                isActive ? 'ring-2 ring-green-200 shadow-md' : ''
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {tactic.name}
                      {isActive && (
                        <Badge variant="default" className="bg-green-100 text-green-800 text-xs">
                          Active
                        </Badge>
                      )}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className={getFormationBadgeColor(tactic.formation)}>
                        {tactic.formation}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {tactic.positions.length} positions
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Completion Progress */}
                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Configuration</span>
                    <span className="font-medium">{completionPercentage}%</span>
                  </div>
                  <Progress value={completionPercentage} className="h-2" />
                </div>

                {/* Instructions Preview */}
                {tactic.instructions && (
                  <div className="text-sm text-muted-foreground line-clamp-2">
                    {tactic.instructions}
                  </div>
                )}

                {/* Created Date */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  {new Date(tactic.createdAt).toLocaleDateString()}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditTactic(tactic)}
                    className="flex-1"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSquadAnalysisTactic({
                      id: tactic.id,
                      name: tactic.name,
                      formation: tactic.formation
                    })}
                  >
                    <BarChart3 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Empty State */}
      {!isLoading && tactics.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Target className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">No Tactics Created</h3>
            <p className="text-muted-foreground mb-6">
              Create your first tactical formation to start analyzing your squad
            </p>
            <Button onClick={handleCreateNew}>
              <Target className="w-4 h-4 mr-2" />
              Create Your First Tactic
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Modals */}
      <TacticGridCreator
        isOpen={isCreatorOpen}
        onClose={() => {
          setIsCreatorOpen(false);
          setEditingTactic(null);
        }}
        onSuccess={() => {
          setIsCreatorOpen(false);
          setEditingTactic(null);
        }}
        editMode={!!editingTactic}
        tacticId={editingTactic?.id}
        initialData={editingTactic ? {
          id: editingTactic.id,
          name: editingTactic.name,
          formation: editingTactic.formation,
          instructions: editingTactic.instructions,
          isActive: editingTactic.isActive,
          positions: editingTactic.positions
        } : undefined}
      />

      {evaluationPosition && (
        <PlayerEvaluationModal
          isOpen={!!evaluationPosition}
          onClose={() => setEvaluationPosition(null)}
          position={evaluationPosition}
        />
      )}

      {squadAnalysisTactic && (
        <SquadAnalysisModal
          isOpen={!!squadAnalysisTactic}
          onClose={() => setSquadAnalysisTactic(null)}
          tactic={squadAnalysisTactic}
        />
      )}
    </div>
  );
}