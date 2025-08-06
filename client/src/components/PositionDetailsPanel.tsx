import React from 'react';
import { Users, TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from 'lucide-react';

interface PlayerScore {
  playerId: number;
  playerName: string;
  score: number;
  keyAttributeScore: number;
  preferredAttributeScore: number;
  missingKeyAttributes: Array<{ 
    attribute: string; 
    current: number; 
    recommended: number; 
  }>;
  missingPreferredAttributes: Array<{ 
    attribute: string; 
    current: number; 
    recommended: number; 
  }>;
}

interface PositionAnalysis {
  positionCode: string;
  role: string;
  duty: string;
  playerScores: PlayerScore[];
  averageScore: number;
  coverageLevel: 'excellent' | 'good' | 'adequate' | 'poor' | 'critical';
}

interface PositionDetailsPanelProps {
  selectedPosition: string | null;
  positionAnalysis: PositionAnalysis | null;
}

export function PositionDetailsPanel({ 
  selectedPosition, 
  positionAnalysis 
}: PositionDetailsPanelProps) {
  const getCoverageColor = (level: string) => {
    switch (level) {
      case 'excellent': return 'bg-green-500';
      case 'good': return 'bg-blue-500';
      case 'adequate': return 'bg-yellow-500';
      case 'poor': return 'bg-orange-500';
      case 'critical': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getCoverageIcon = (level: string) => {
    switch (level) {
      case 'excellent':
      case 'good':
        return <CheckCircle className="w-4 h-4" />;
      case 'adequate':
        return <TrendingUp className="w-4 h-4" />;
      case 'poor':
        return <TrendingDown className="w-4 h-4" />;
      case 'critical':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Users className="w-4 h-4" />;
    }
  };

  if (!selectedPosition || !positionAnalysis) {
    return (
      <div className="bg-white rounded-lg shadow-sm h-full flex items-center justify-center">
        <div className="text-center text-gray-500">
          <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Select a position to view detailed analysis</p>
        </div>
      </div>
    );
  }

  const topPlayer = positionAnalysis.playerScores[0];
  
  return (
    <div className="bg-white rounded-lg shadow-sm h-full p-6 overflow-y-auto">
      <div className="space-y-6">
        {/* Position Header */}
        <div>
          <h3 className="text-lg font-semibold mb-2">
            {selectedPosition} Analysis
          </h3>
          <div className="text-sm text-gray-600">
            {positionAnalysis.role} ({positionAnalysis.duty})
          </div>
        </div>

        {/* Coverage Status */}
        <div className={`${getCoverageColor(positionAnalysis.coverageLevel)} text-white rounded-lg p-4`}>
          <div className="flex items-center gap-2 mb-2">
            {getCoverageIcon(positionAnalysis.coverageLevel)}
            <div className="font-medium capitalize">
              {positionAnalysis.coverageLevel} Coverage
            </div>
          </div>
          <div className="text-sm opacity-90">
            Squad Average: {Math.round(positionAnalysis.averageScore)}%
          </div>
          {topPlayer && (
            <div className="text-sm opacity-90">
              Best Player: {Math.round(topPlayer.score)}% ({topPlayer.playerName})
            </div>
          )}
        </div>

        {/* Top Players List */}
        <div>
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <Users className="w-4 h-4" />
            Squad Ranking ({positionAnalysis.playerScores.length})
          </h4>
          <div className="space-y-2">
            {positionAnalysis.playerScores.slice(0, 8).map((player, index) => (
              <div 
                key={player.playerId} 
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  index === 0 ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`
                      text-xs font-bold px-2 py-1 rounded-full 
                      ${index === 0 ? 'bg-yellow-500 text-white' : 'bg-gray-500 text-white'}
                    `}>
                      #{index + 1}
                    </span>
                    <div className="font-medium text-sm">{player.playerName}</div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    ID: {player.playerId} • Key: {Math.round(player.keyAttributeScore)}% • Pref: {Math.round(player.preferredAttributeScore)}%
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-lg">{Math.round(player.score)}%</div>
                  <div className={`text-xs ${
                    player.score >= 70 ? 'text-green-600' : 
                    player.score >= 50 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {player.score >= 70 ? 'Excellent' : 
                     player.score >= 50 ? 'Adequate' : 'Poor'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Detailed Analysis for Top Player */}
        {topPlayer && (
          <div>
            <h4 className="font-medium mb-3">
              Detailed Analysis: {topPlayer.playerName}
            </h4>
            
            {/* Missing Key Attributes */}
            {topPlayer.missingKeyAttributes.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <span className="text-sm font-medium text-red-700">Key Attribute Gaps</span>
                </div>
                <div className="space-y-1">
                  {topPlayer.missingKeyAttributes.map((attr, index) => (
                    <div key={index} className="flex items-center justify-between bg-red-50 border border-red-200 rounded px-3 py-2">
                      <span className="text-sm font-medium text-red-800">{attr.attribute}</span>
                      <span className="text-xs text-red-600">
                        {attr.current} → {attr.recommended} needed
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Missing Preferred Attributes */}
            {topPlayer.missingPreferredAttributes.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm font-medium text-yellow-700">Preferred Attribute Gaps</span>
                </div>
                <div className="space-y-1">
                  {topPlayer.missingPreferredAttributes.map((attr, index) => (
                    <div key={index} className="flex items-center justify-between bg-yellow-50 border border-yellow-200 rounded px-3 py-2">
                      <span className="text-sm font-medium text-yellow-800">{attr.attribute}</span>
                      <span className="text-xs text-yellow-600">
                        {attr.current} → {attr.recommended} optimal
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Recruitment Recommendations */}
        {(positionAnalysis.coverageLevel === 'critical' || positionAnalysis.coverageLevel === 'poor') && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              <div className="font-medium text-orange-800">Recruitment Priority</div>
            </div>
            <div className="text-sm text-orange-700 space-y-2">
              <p>
                This position requires immediate attention. Consider recruiting players with:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Strong {positionAnalysis.role} attributes</li>
                <li>Experience in {positionAnalysis.duty} duties</li>
                {topPlayer && topPlayer.missingKeyAttributes.length > 0 && (
                  <li>
                    High values in: {topPlayer.missingKeyAttributes.slice(0, 3).map(attr => attr.attribute).join(', ')}
                  </li>
                )}
              </ul>
            </div>
          </div>
        )}

        {/* Squad Depth Summary */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium mb-3 text-gray-800">Squad Depth Summary</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-gray-600">Above 70%:</div>
              <div className="font-semibold text-green-600">
                {positionAnalysis.playerScores.filter(p => p.score >= 70).length} players
              </div>
            </div>
            <div>
              <div className="text-gray-600">50-69%:</div>
              <div className="font-semibold text-yellow-600">
                {positionAnalysis.playerScores.filter(p => p.score >= 50 && p.score < 70).length} players
              </div>
            </div>
            <div>
              <div className="text-gray-600">Below 50%:</div>
              <div className="font-semibold text-red-600">
                {positionAnalysis.playerScores.filter(p => p.score < 50).length} players
              </div>
            </div>
            <div>
              <div className="text-gray-600">Total Options:</div>
              <div className="font-semibold text-gray-800">
                {positionAnalysis.playerScores.length} players
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}