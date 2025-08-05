import React, { useState, useEffect, useCallback } from 'react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from 'react-resizable-panels';
import { Button } from './components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { Badge } from './components/ui/badge';
import { Progress } from './components/ui/progress';
import { Upload, Download, Play, Settings, Users } from 'lucide-react';
import { TacticalGrid } from './components/TacticalGrid';
import { PositionDetails } from './components/PositionDetails';
import { ImportModal } from './components/ImportModal';
import { FormationSelector } from './components/FormationSelector';
import { RecruitmentTargets } from './components/RecruitmentTargets';

interface TacticAnalysis {
  tactic: {
    id: number;
    name: string;
    formation: string;
    positions: Array<{
      id: number;
      positionCode: string;
      role: string;
      duty: string;
    }>;
  };
  analysis: Array<{
    positionCode: string;
    role: string;
    duty: string;
    playerScores: Array<{
      playerId: number;
      playerName: string;
      score: number;
      keyAttributeScore: number;
      preferredAttributeScore: number;
      missingKeyAttributes: Array<{ attribute: string; current: number; recommended: number }>;
      missingPreferredAttributes: Array<{ attribute: string; current: number; recommended: number }>;
    }>;
    averageScore: number;
    coverageLevel: 'excellent' | 'good' | 'adequate' | 'poor' | 'critical';
  }>;
}

interface DatabaseStats {
  totalPlayers: number;
  totalSnapshots: number;
  lastImportDate: string | null;
}

export function TacticalAnalyzer() {
  const [analysis, setAnalysis] = useState<TacticAnalysis | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<string | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showFormationSelector, setShowFormationSelector] = useState(false);
  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchAnalysis = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/analysis/tactic');
      if (response.ok) {
        const data = await response.json();
        setAnalysis(data);
        // Auto-select first position if none selected
        if (!selectedPosition && data.analysis.length > 0) {
          setSelectedPosition(data.analysis[0].positionCode);
        }
      } else if (response.status === 400) {
        // No active tactic, show formation selector
        setShowFormationSelector(true);
      }
    } catch (error) {
      console.error('Failed to fetch analysis:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedPosition]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch('/api/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    fetchAnalysis();
  }, [fetchStats, fetchAnalysis]);

  const handleImportComplete = useCallback(() => {
    setShowImportModal(false);
    fetchStats();
    fetchAnalysis();
  }, [fetchStats, fetchAnalysis]);

  const handleFormationSelected = useCallback(() => {
    setShowFormationSelector(false);
    fetchAnalysis();
  }, [fetchAnalysis]);

  const getSelectedPositionAnalysis = () => {
    if (!analysis || !selectedPosition) return null;
    return analysis.analysis.find(a => a.positionCode === selectedPosition);
  };

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

  const exportRecruitmentTargets = async () => {
    try {
      const response = await fetch('/api/analysis/recruitment');
      if (response.ok) {
        const data = await response.json();
        const content = data.recruitmentTargets
          .map((target: any) => `${target.position}:\n${target.targets.join('\n')}\n`)
          .join('\n');
        
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'recruitment-targets.txt';
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Failed to export targets:', error);
    }
  };

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">FM Tactical Squad Analyzer</h1>
            <p className="text-sm text-gray-600">
              Analyze your squad against tactical setups and identify recruitment gaps
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            {stats && (
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>{stats.totalPlayers} players</span>
                </div>
                {stats.lastImportDate && (
                  <div>
                    Last import: {new Date(stats.lastImportDate).toLocaleDateString()}
                  </div>
                )}
              </div>
            )}
            
            <Button onClick={() => setShowImportModal(true)} variant="outline">
              <Upload className="w-4 h-4 mr-2" />
              Import Squad
            </Button>
            
            <Button onClick={() => setShowFormationSelector(true)} variant="outline">
              <Settings className="w-4 h-4 mr-2" />
              Formation
            </Button>
            
            {analysis && (
              <Button onClick={exportRecruitmentTargets} variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export Targets
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Analyzing tactical setup...</p>
            </div>
          </div>
        ) : analysis ? (
          <ResizablePanelGroup direction="horizontal" className="h-full">
            {/* Left Panel - Tactical Formation */}
            <ResizablePanel defaultSize={60} minSize={40}>
              <div className="h-full p-6">
                <Card className="h-full">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Play className="w-5 h-5" />
                        {analysis.tactic.name} ({analysis.tactic.formation})
                      </CardTitle>
                      
                      {/* Coverage Overview */}
                      <div className="flex gap-2">
                        {['excellent', 'good', 'adequate', 'poor', 'critical'].map(level => {
                          const count = analysis.analysis.filter(a => a.coverageLevel === level).length;
                          if (count === 0) return null;
                          return (
                            <Badge key={level} className={`${getCoverageColor(level)} text-white`}>
                              {count} {level}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="flex-1">
                    <TacticalGrid
                      tactic={analysis.tactic}
                      analysis={analysis.analysis}
                      selectedPosition={selectedPosition}
                      onPositionSelect={setSelectedPosition}
                    />
                  </CardContent>
                </Card>
              </div>
            </ResizablePanel>

            <ResizableHandle withHandle />

            {/* Right Panel - Position Details */}
            <ResizablePanel defaultSize={40} minSize={30}>
              <div className="h-full p-6">
                {selectedPosition ? (
                  <PositionDetails 
                    analysis={getSelectedPositionAnalysis()} 
                    positionCode={selectedPosition}
                  />
                ) : (
                  <Card className="h-full">
                    <CardContent className="flex items-center justify-center h-full">
                      <div className="text-center text-gray-500">
                        <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>Select a position to view player analysis</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-md">
              <Settings className="w-16 h-16 mx-auto mb-6 text-gray-400" />
              <h2 className="text-xl font-semibold mb-4">Get Started</h2>
              <p className="text-gray-600 mb-6">
                Import your FM squad and select a tactical formation to begin analyzing player suitability and identify recruitment gaps.
              </p>
              <div className="flex gap-3 justify-center">
                <Button onClick={() => setShowImportModal(true)}>
                  <Upload className="w-4 h-4 mr-2" />
                  Import Squad
                </Button>
                <Button onClick={() => setShowFormationSelector(true)} variant="outline">
                  <Settings className="w-4 h-4 mr-2" />
                  Choose Formation
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <ImportModal 
        open={showImportModal} 
        onClose={() => setShowImportModal(false)}
        onSuccess={handleImportComplete}
      />
      
      <FormationSelector
        open={showFormationSelector}
        onClose={() => setShowFormationSelector(false)}
        onSuccess={handleFormationSelected}
      />
    </div>
  );
}