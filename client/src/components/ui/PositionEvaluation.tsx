import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlayerScoreCard } from "./PlayerScoreCard";

interface PositionEvaluationProps {
  evaluation: {
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
  };
}

export function PositionEvaluation({ evaluation }: PositionEvaluationProps) {
  const { position, players, attributeConfig, error } = evaluation;

  const getPositionDisplayName = () => {
    return `${position.positionCode} - ${position.roleName} (${position.duty})`;
  };

  const getDutyColor = (duty: string) => {
    switch (duty.toLowerCase()) {
      case "attack":
        return "bg-red-100 text-red-800 border-red-200";
      case "support":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "defend":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-lg">{getPositionDisplayName()}</span>
            <Badge className={getDutyColor(position.duty)} variant="outline">
              {position.duty}
            </Badge>
          </div>
          {players.length > 0 && (
            <span className="text-sm text-muted-foreground font-normal">
              Top {players.length} candidates
            </span>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {error ? (
          <div className="text-center py-8">
            <div className="bg-amber-50 text-amber-800 p-4 rounded-lg border border-amber-200">
              <p className="text-sm">{error}</p>
            </div>
          </div>
        ) : players.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No suitable players found for this position</p>
          </div>
        ) : (
          <>
            {/* Key & Preferred Attributes Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm bg-muted/30 p-4 rounded-lg">
              <div>
                <h5 className="font-medium mb-2 text-green-700">
                  Key Attributes ({attributeConfig.keyAttributes.length}) - 70% weight
                </h5>
                <div className="flex flex-wrap gap-1">
                  {attributeConfig.keyAttributes.map((attr) => (
                    <Badge key={attr} variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                      {attr}
                    </Badge>
                  ))}
                </div>
              </div>
              
              {attributeConfig.preferredAttributes.length > 0 && (
                <div>
                  <h5 className="font-medium mb-2 text-blue-700">
                    Preferred Attributes ({attributeConfig.preferredAttributes.length}) - 30% weight
                  </h5>
                  <div className="flex flex-wrap gap-1">
                    {attributeConfig.preferredAttributes.map((attr) => (
                      <Badge key={attr} variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                        {attr}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Player Rankings */}
            <div className="grid gap-3">
              {players.map((playerEval, index) => (
                <PlayerScoreCard
                  key={playerEval.player.id}
                  player={playerEval.player}
                  score={playerEval.score}
                  keyAverage={playerEval.keyAverage}
                  preferredAverage={playerEval.preferredAverage}
                  keyStrengths={playerEval.keyStrengths}
                  attributeBreakdown={playerEval.attributeBreakdown}
                  rank={index + 1}
                />
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}