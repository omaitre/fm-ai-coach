import React from "react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, User, Calendar, Target, TrendingUp, Star } from "lucide-react";

interface PlayerScoreCardProps {
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
  rank: number;
}

export function PlayerScoreCard({
  player,
  score,
  keyAverage,
  preferredAverage,
  keyStrengths,
  attributeBreakdown,
  rank,
}: PlayerScoreCardProps) {
  const getScoreColor = (score: number) => {
    if (score >= 75) return "text-green-700 bg-green-50 border-green-200";
    if (score >= 50) return "text-yellow-700 bg-yellow-50 border-yellow-200";
    return "text-red-700 bg-red-50 border-red-200";
  };

  const getScoreColorProgress = (score: number) => {
    if (score >= 75) return "bg-green-500";
    if (score >= 50) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-4 w-4 text-yellow-500" />;
    return <span className="text-sm font-bold text-muted-foreground">#{rank}</span>;
  };

  const formatAbility = (ca: number, pa: number) => {
    if (!ca && !pa) return "Unknown";
    if (!pa) return `CA: ${ca}`;
    return `${ca}/${pa}`;
  };

  return (
    <div className="border rounded-lg p-4 hover:bg-muted/30 transition-colors">
      <div className="flex items-start justify-between gap-4">
        {/* Left: Player Info & Rank */}
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="flex-shrink-0 mt-1">
            {getRankIcon(rank)}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="font-medium truncate">{player.name}</h4>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>{player.age}y</span>
              </div>
            </div>

            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
              <div className="flex items-center gap-1">
                <Target className="h-3 w-3" />
                <span>{formatAbility(player.currentAbility, player.potentialAbility)}</span>
              </div>
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
                <span>{attributeBreakdown.totalAttributes} attrs</span>
              </div>
            </div>

            {/* Key Strengths */}
            {keyStrengths.length > 0 && (
              <div className="flex items-center gap-2 mb-2">
                <Star className="h-3 w-3 text-amber-500 flex-shrink-0" />
                <div className="flex flex-wrap gap-1 min-w-0">
                  {keyStrengths.map((strength) => (
                    <Badge 
                      key={strength} 
                      variant="secondary" 
                      className="text-xs bg-amber-50 text-amber-700 border-amber-200"
                    >
                      {strength}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Score & Breakdown */}
        <div className="flex-shrink-0 text-right space-y-2">
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg border ${getScoreColor(score)}`}>
            <TrendingUp className="h-4 w-4" />
            <span className="font-bold text-lg">{score}%</span>
          </div>

          {/* Score Breakdown */}
          <div className="space-y-1 text-xs text-muted-foreground">
            <div className="flex justify-between gap-3">
              <span>Key ({attributeBreakdown.keyAttributes}):</span>
              <span className="font-medium">{keyAverage}</span>
            </div>
            {attributeBreakdown.preferredAttributes > 0 && (
              <div className="flex justify-between gap-3">
                <span>Pref ({attributeBreakdown.preferredAttributes}):</span>
                <span className="font-medium">{preferredAverage}</span>
              </div>
            )}
          </div>

          {/* Progress Bar */}
          <div className="w-24">
            <Progress 
              value={Math.min(score, 100)} 
              className="h-2"
              style={{
                background: 'rgb(229 231 235)', // bg-gray-200
              }}
            />
            <style jsx>{`
              .progress-indicator {
                background-color: ${score >= 75 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444'} !important;
              }
            `}</style>
          </div>
        </div>
      </div>
    </div>
  );
}