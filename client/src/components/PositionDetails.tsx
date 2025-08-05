import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { User, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';

interface PlayerScore {
  playerId: number;
  playerName: string;
  score: number;
  keyAttributeScore: number;  
  preferredAttributeScore: number;
  missingKeyAttributes: Array<{ attribute: string; current: number; recommended: number }>;
  missingPreferredAttributes: Array<{ attribute: string; current: number; recommended: number }>;
}

interface PositionAnalysis {
  positionCode: string;
  role: string;
  duty: string;
  playerScores: PlayerScore[];
  averageScore: number;
  coverageLevel: 'excellent' | 'good' | 'adequate' | 'poor' | 'critical';
}

interface PositionDetailsProps {
  analysis: PositionAnalysis | null;
  positionCode: string;
}

export function PositionDetails({ analysis, positionCode }: PositionDetailsProps) {
  if (!analysis) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center text-gray-500">
            <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No analysis available for this position</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getCoverageColor = (level: string) => {
    switch (level) {
      case 'excellent': return 'text-green-600 bg-green-50 border-green-200';
      case 'good': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'adequate': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'poor': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getCoverageIcon = (level: string) => {
    switch (level) {
      case 'excellent':
      case 'good':
        return <TrendingUp className="w-4 h-4" />;
      case 'poor':
      case 'critical':
        return <TrendingDown className="w-4 h-4" />;
      default:
        return <User className="w-4 h-4" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 70) return 'text-blue-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className="h-full flex flex-col gap-6">
      {/* Position Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{positionCode} - {analysis.role}</span>
            <Badge className={`${getCoverageColor(analysis.coverageLevel)} border`}>
              {getCoverageIcon(analysis.coverageLevel)}
              <span className="ml-1 capitalize">{analysis.coverageLevel}</span>
            </Badge>
          </CardTitle>
          
          <div className="text-sm text-gray-600">
            <span>{analysis.duty} duty</span>
            <span className="mx-2">•</span>
            <span>Average Score: <span className={getScoreColor(analysis.averageScore)}>{Math.round(analysis.averageScore)}%</span></span>
          </div>
        </CardHeader>
      </Card>

      {/* Player Rankings */}
      <Card className="flex-1">
        <CardHeader>
          <CardTitle className="text-lg">Player Suitability Rankings</CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {analysis.playerScores.length > 0 ? (
            analysis.playerScores.map((player, index) => (
              <div key={player.playerId} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full text-sm font-semibold">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium">{player.playerName}</div>
                      <div className="text-sm text-gray-500">
                        Player ID: {player.playerId}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-bold ${getScoreColor(player.score)}`}>
                      {player.score}%
                    </div>
                    <div className="text-xs text-gray-500">Overall</div>
                  </div>
                </div>

                {/* Attribute Breakdown */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span>Key Attributes</span>
                      <span className="font-medium">{player.keyAttributeScore}%</span>
                    </div>
                    <Progress value={player.keyAttributeScore} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span>Preferred Attributes</span>
                      <span className="font-medium">{player.preferredAttributeScore}%</span>
                    </div>
                    <Progress value={player.preferredAttributeScore} className="h-2" />
                  </div>
                </div>

                {/* Missing Attributes */}
                {(player.missingKeyAttributes.length > 0 || player.missingPreferredAttributes.length > 0) && (
                  <div className="space-y-2">
                    {player.missingKeyAttributes.length > 0 && (
                      <div>
                        <div className="flex items-center gap-1 text-xs text-red-600 font-medium mb-1">
                          <AlertTriangle className="w-3 h-3" />
                          Missing Key Attributes
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {player.missingKeyAttributes.slice(0, 3).map((attr, i) => (
                            <Badge key={i} variant="destructive" className="text-xs">
                              {attr.attribute}: {attr.current} (need {attr.recommended}+)
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {player.missingPreferredAttributes.length > 0 && (
                      <div>
                        <div className="text-xs text-orange-600 font-medium mb-1">
                          Missing Preferred Attributes
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {player.missingPreferredAttributes.slice(0, 3).map((attr, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {attr.attribute}: {attr.current} (want {attr.recommended}+)
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No players analyzed for this position</p>
              <p className="text-sm">Import player data to see suitability rankings</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recruitment Recommendations */}
      {analysis.coverageLevel === 'critical' || analysis.coverageLevel === 'poor' ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              Recruitment Priority
            </CardTitle>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                This position needs immediate attention. Look for players with:
              </p>
              
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                <div className="text-sm">
                  <div className="font-medium text-orange-800 mb-2">Priority Attributes:</div>
                  <div className="text-orange-700">
                    Based on the {analysis.role} role, focus on finding players with strong key attributes 
                    and reasonable preferred attributes to fill this gap.
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        analysis.coverageLevel === 'adequate' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="w-5 h-5 text-blue-500" />
                Squad Depth
              </CardTitle>
            </CardHeader>
            
            <CardContent>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="text-sm text-blue-700">
                  Consider adding depth to this position to improve tactical flexibility 
                  and provide rotation options.
                </div>
              </div>
            </CardContent>
          </Card>
        )
      )}
    </div>
  );
}