import React from 'react';
import { cn } from '../lib/utils';

interface Position {
  id: number;
  positionCode: string;
  role: string;
  duty: string;
}

interface PositionAnalysis {
  positionCode: string;
  role: string;
  duty: string;
  playerScores: Array<{
    playerId: number;
    playerName: string;
    score: number;
  }>;
  averageScore: number;
  coverageLevel: 'excellent' | 'good' | 'adequate' | 'poor' | 'critical';
}

interface TacticalGridProps {
  tactic: {
    id: number;
    name: string;
    formation: string;
    positions: Position[];
  };
  analysis: PositionAnalysis[];
  selectedPosition: string | null;
  onPositionSelect: (positionCode: string) => void;
}

export function TacticalGrid({ tactic, analysis, selectedPosition, onPositionSelect }: TacticalGridProps) {
  const getPositionAnalysis = (positionCode: string) => {
    return analysis.find(a => a.positionCode === positionCode);
  };

  const getCoverageColor = (level: string) => {
    switch (level) {
      case 'excellent': return 'bg-green-500 border-green-600 hover:bg-green-600';
      case 'good': return 'bg-blue-500 border-blue-600 hover:bg-blue-600';
      case 'adequate': return 'bg-yellow-500 border-yellow-600 hover:bg-yellow-600';
      case 'poor': return 'bg-orange-500 border-orange-600 hover:bg-orange-600';
      case 'critical': return 'bg-red-500 border-red-600 hover:bg-red-600';
      default: return 'bg-gray-500 border-gray-600 hover:bg-gray-600';
    }
  };

  const getPositionLayout = (formation: string) => {
    // Define position layouts for different formations
    const layouts: Record<string, Array<{ row: number; col: number; span?: number }>> = {
      '4-4-2': [
        { row: 0, col: 2 }, // GK
        { row: 1, col: 0 }, // DL  
        { row: 1, col: 1 }, // DC
        { row: 1, col: 3 }, // DC
        { row: 1, col: 4 }, // DR
        { row: 2, col: 0 }, // ML
        { row: 2, col: 1 }, // MC
        { row: 2, col: 3 }, // MC
        { row: 2, col: 4 }, // MR
        { row: 3, col: 1 }, // ST
        { row: 3, col: 3 }, // ST
      ],
      '4-3-3': [
        { row: 0, col: 2 }, // GK
        { row: 1, col: 0 }, // DL
        { row: 1, col: 1 }, // DC
        { row: 1, col: 3 }, // DC
        { row: 1, col: 4 }, // DR
        { row: 2, col: 2 }, // DM
        { row: 2, col: 1 }, // MC
        { row: 2, col: 3 }, // MC
        { row: 3, col: 0 }, // AML
        { row: 3, col: 2 }, // ST
        { row: 3, col: 4 }, // AMR
      ],
      '4-2-3-1': [
        { row: 0, col: 2 }, // GK
        { row: 1, col: 0 }, // DL
        { row: 1, col: 1 }, // DC
        { row: 1, col: 3 }, // DC
        { row: 1, col: 4 }, // DR
        { row: 2, col: 1 }, // DM
        { row: 2, col: 3 }, // DM
        { row: 3, col: 0 }, // AML
        { row: 3, col: 2 }, // AMC
        { row: 3, col: 4 }, // AMR
        { row: 4, col: 2 }, // ST
      ],
      '3-5-2': [
        { row: 0, col: 2 }, // GK
        { row: 1, col: 1 }, // DC
        { row: 1, col: 2 }, // DC
        { row: 1, col: 3 }, // DC
        { row: 2, col: 0 }, // ML
        { row: 2, col: 1 }, // DM
        { row: 2, col: 2 }, // MC
        { row: 2, col: 3 }, // MC
        { row: 2, col: 4 }, // MR
        { row: 3, col: 1 }, // ST
        { row: 3, col: 3 }, // ST
      ],
      '5-3-2': [
        { row: 0, col: 2 }, // GK
        { row: 1, col: 0 }, // DL
        { row: 1, col: 1 }, // DC
        { row: 1, col: 2 }, // DC
        { row: 1, col: 3 }, // DC
        { row: 1, col: 4 }, // DR
        { row: 2, col: 1 }, // MC
        { row: 2, col: 2 }, // MC
        { row: 2, col: 3 }, // MC
        { row: 3, col: 1 }, // ST
        { row: 3, col: 3 }, // ST
      ]
    };

    return layouts[formation] || layouts['4-4-2'];
  };

  const positionLayout = getPositionLayout(tactic.formation);

  return (
    <div className="w-full h-full relative">
      {/* Football Pitch Background */}
      <div className="absolute inset-0 bg-gradient-to-t from-green-600 to-green-500 rounded-lg overflow-hidden">
        {/* Pitch markings */}
        <div className="absolute inset-4 border-2 border-white/30 rounded">
          {/* Center circle */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 border-2 border-white/30 rounded-full"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-white/30 rounded-full"></div>
          
          {/* Halfway line */}
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/30 transform -translate-y-0.5"></div>
          
          {/* Goal areas */}
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-16 h-8 border-2 border-white/30 border-b-0"></div>
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-16 h-8 border-2 border-white/30 border-t-0"></div>
          
          {/* Penalty areas */}
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-32 h-16 border-2 border-white/30 border-b-0"></div>
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-16 border-2 border-white/30 border-t-0"></div>
        </div>
      </div>

      {/* Position Grid */}
      <div className="relative z-10 p-8 h-full">
        <div className="grid grid-rows-5 grid-cols-5 gap-4 h-full">
          {tactic.positions.map((position, index) => {
            const layout = positionLayout[index] || { row: 0, col: 0 };
            const positionAnalysis = getPositionAnalysis(position.positionCode);
            const isSelected = selectedPosition === position.positionCode;
            
            return (
              <div
                key={position.id}
                className={cn(
                  "relative cursor-pointer transition-all duration-200 rounded-lg border-2 shadow-lg",
                  "flex flex-col items-center justify-center text-white text-xs font-medium",
                  "min-h-16 p-2",
                  isSelected && "ring-4 ring-white ring-opacity-50 scale-105 z-20",
                  positionAnalysis 
                    ? getCoverageColor(positionAnalysis.coverageLevel)
                    : "bg-gray-500 border-gray-600 hover:bg-gray-600"
                )}
                style={{
                  gridRow: layout.row + 1,
                  gridColumn: `${layout.col + 1} / span ${layout.span || 1}`,
                }}
                onClick={() => onPositionSelect(position.positionCode)}
              >
                <div className="text-center">
                  <div className="font-semibold">{position.positionCode}</div>
                  <div className="text-xs opacity-90">{position.role}</div>
                  <div className="text-xs opacity-75">({position.duty})</div>
                  
                  {positionAnalysis && (
                    <div className="mt-1">
                      <div className="text-xs font-bold">
                        {positionAnalysis.playerScores[0]?.score || 0}%
                      </div>
                      {positionAnalysis.playerScores[0] && (
                        <div className="text-xs opacity-90 truncate max-w-20">
                          {positionAnalysis.playerScores[0].playerName}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-white/90 rounded-lg p-3 text-xs">
        <div className="font-semibold mb-2">Coverage Levels</div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>Excellent (80%+, backup)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span>Good (70%+, backup)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-500 rounded"></div>
            <span>Adequate (60%+)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-orange-500 rounded"></div>
            <span>Poor (40%+)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span>Critical (&lt;40%)</span>
          </div>
        </div>
      </div>
    </div>
  );
}