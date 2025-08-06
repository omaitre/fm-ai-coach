import React from 'react';

interface TacticalPosition {
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

interface TacticalPitchProps {
  positions: TacticalPosition[];
  analysis: PositionAnalysis[];
  selectedPosition: string | null;
  onPositionSelect: (positionCode: string) => void;
  formation: string;
}

export function TacticalPitch({ 
  positions, 
  analysis, 
  selectedPosition, 
  onPositionSelect,
  formation 
}: TacticalPitchProps) {
  const getCoverageColor = (level: string) => {
    switch (level) {
      case 'excellent': return 'bg-green-500 hover:bg-green-600';
      case 'good': return 'bg-blue-500 hover:bg-blue-600';
      case 'adequate': return 'bg-yellow-500 hover:bg-yellow-600';
      case 'poor': return 'bg-orange-500 hover:bg-orange-600';
      case 'critical': return 'bg-red-500 hover:bg-red-600';
      default: return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  const getPositionLayout = (formation: string, positions: TacticalPosition[]) => {
    // Organize positions into lines based on position codes
    const lines = {
      goalkeeper: positions.filter(p => p.positionCode === 'GK'),
      defense: positions.filter(p => 
        p.positionCode.startsWith('D') && 
        p.positionCode !== 'DM'
      ),
      midfield: positions.filter(p => 
        p.positionCode.startsWith('M') || 
        p.positionCode === 'DM' || 
        p.positionCode.startsWith('AM')
      ),
      attack: positions.filter(p => p.positionCode === 'ST')
    };

    return lines;
  };

  const lines = getPositionLayout(formation, positions);

  const renderPositionButton = (position: TacticalPosition) => {
    const positionAnalysis = analysis.find(a => a.positionCode === position.positionCode);
    const isSelected = selectedPosition === position.positionCode;
    const coverageColor = positionAnalysis ? getCoverageColor(positionAnalysis.coverageLevel) : 'bg-gray-500 hover:bg-gray-600';

    return (
      <button
        key={position.id}
        className={`
          relative rounded-full w-16 h-16 text-white text-xs font-bold transition-all duration-200 transform hover:scale-105 shadow-lg
          ${coverageColor}
          ${isSelected ? 'ring-4 ring-white ring-opacity-80 scale-110' : ''}
        `}
        onClick={() => onPositionSelect(position.positionCode)}
        title={`${position.positionCode} - ${position.role} (${position.duty})`}
      >
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-bold text-sm">{position.positionCode}</span>
          {positionAnalysis && (
            <span className="text-xs opacity-90 font-medium">
              {Math.round(positionAnalysis.playerScores[0]?.score || 0)}%
            </span>
          )}
        </div>
        
        {/* Player name tooltip */}
        {positionAnalysis && positionAnalysis.playerScores[0] && (
          <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded opacity-0 hover:opacity-100 transition-opacity whitespace-nowrap z-10">
            {positionAnalysis.playerScores[0].playerName}
          </div>
        )}
      </button>
    );
  };

  const renderPositionLine = (linePositions: TacticalPosition[], justify: string = 'center') => {
    if (linePositions.length === 0) return null;
    
    return (
      <div className={`flex items-center gap-4 ${justify === 'center' ? 'justify-center' : justify === 'between' ? 'justify-between' : 'justify-evenly'}`}>
        {linePositions.map(position => renderPositionButton(position))}
      </div>
    );
  };

  return (
    <div className="relative bg-gradient-to-b from-green-400 to-green-500 rounded-lg p-8 h-full min-h-[600px]">
      {/* Pitch markings */}
      <div className="absolute inset-4 border-2 border-white border-opacity-60 rounded-lg">
        {/* Center circle */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 border-2 border-white border-opacity-60 rounded-full"></div>
        
        {/* Center line */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-0.5 h-full bg-white bg-opacity-60"></div>
        
        {/* Penalty areas */}
        <div className="absolute top-8 left-1/2 transform -translate-x-1/2 w-24 h-16 border-2 border-white border-opacity-60 border-b-0"></div>
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 w-24 h-16 border-2 border-white border-opacity-60 border-t-0"></div>
        
        {/* Goal areas */}
        <div className="absolute top-8 left-1/2 transform -translate-x-1/2 w-12 h-8 border-2 border-white border-opacity-60 border-b-0"></div>
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 w-12 h-8 border-2 border-white border-opacity-60 border-t-0"></div>
      </div>

      {/* Formation display */}
      <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white px-3 py-1 rounded-lg">
        <span className="text-sm font-semibold">{formation}</span>
      </div>

      {/* Position layout */}
      <div className="relative h-full flex flex-col justify-between py-8">
        {/* Attack line */}
        <div className="flex-shrink-0">
          {renderPositionLine(lines.attack)}
        </div>

        {/* Midfield line */}
        <div className="flex-1 flex items-center">
          {renderPositionLine(lines.midfield)}
        </div>

        {/* Defense line */}
        <div className="flex-shrink-0">
          {renderPositionLine(lines.defense)}
        </div>

        {/* Goalkeeper */}
        <div className="flex-shrink-0 mt-4">
          {renderPositionLine(lines.goalkeeper)}
        </div>
      </div>

      {/* Coverage legend */}
      <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white p-2 rounded-lg">
        <div className="text-xs space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>Excellent</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span>Good</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span>Adequate</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
            <span>Poor</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span>Critical</span>
          </div>
        </div>
      </div>
    </div>
  );
}