import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Settings, Play, Users } from 'lucide-react';

interface FormationTemplate {
  formation: string;
  name: string;
  positions: Array<{
    positionCode: string;
    role: string;
    duty: string;
  }>;
}

interface FormationSelectorProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function FormationSelector({ open, onClose, onSuccess }: FormationSelectorProps) {
  const [templates, setTemplates] = useState<FormationTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<FormationTemplate | null>(null);
  const [customTacticName, setCustomTacticName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fetchTemplates = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/formations');
      if (response.ok) {
        const data = await response.json();
        setTemplates(data);
        if (data.length > 0) {
          setSelectedTemplate(data[0]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch formations:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      fetchTemplates();
    }
  }, [open, fetchTemplates]);

  const handleCreateTactic = useCallback(async () => {
    if (!selectedTemplate) return;

    setIsCreating(true);
    try {
      const response = await fetch('/api/tactics/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateName: selectedTemplate.name,
          tacticName: customTacticName || selectedTemplate.name
        })
      });

      if (response.ok) {
        onSuccess();
      }
    } catch (error) {
      console.error('Failed to create tactic:', error);
    } finally {
      setIsCreating(false);
    }
  }, [selectedTemplate, customTacticName, onSuccess]);

  const getPositionsByLine = (positions: FormationTemplate['positions']) => {
    const lines = {
      goalkeeper: positions.filter(p => p.positionCode === 'GK'),
      defense: positions.filter(p => p.positionCode.startsWith('D') && p.positionCode !== 'DM'),
      midfield: positions.filter(p => 
        p.positionCode.startsWith('M') || 
        p.positionCode === 'DM' || 
        p.positionCode.startsWith('AM')
      ),
      attack: positions.filter(p => p.positionCode === 'ST')
    };
    return lines;
  };

  const handleClose = useCallback(() => {
    setSelectedTemplate(null);
    setCustomTacticName('');
    setIsCreating(false);
    onClose();
  }, [onClose]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Select Formation
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Formation Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((template) => (
                <Card 
                  key={template.name}
                  className={`cursor-pointer transition-all ${
                    selectedTemplate?.name === template.name 
                      ? 'ring-2 ring-blue-500 bg-blue-50' 
                      : 'hover:shadow-md'
                  }`}
                  onClick={() => setSelectedTemplate(template)}
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center justify-between">
                      <span>{template.formation}</span>
                      <Badge variant="secondary">{template.positions.length}</Badge>
                    </CardTitle>
                    <p className="text-sm text-gray-600">{template.name}</p>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      {(() => {
                        const lines = getPositionsByLine(template.positions);
                        return (
                          <>
                            {lines.attack.length > 0 && (
                              <div className="flex items-center gap-2">
                                <span className="text-gray-500 min-w-16">Attack:</span>
                                <div className="flex flex-wrap gap-1">
                                  {lines.attack.map((pos, i) => (
                                    <Badge key={i} variant="outline" className="text-xs">
                                      {pos.positionCode}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {lines.midfield.length > 0 && (
                              <div className="flex items-center gap-2">
                                <span className="text-gray-500 min-w-16">Midfield:</span>
                                <div className="flex flex-wrap gap-1">
                                  {lines.midfield.map((pos, i) => (
                                    <Badge key={i} variant="outline" className="text-xs">
                                      {pos.positionCode}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {lines.defense.length > 0 && (
                              <div className="flex items-center gap-2">
                                <span className="text-gray-500 min-w-16">Defense:</span>
                                <div className="flex flex-wrap gap-1">
                                  {lines.defense.map((pos, i) => (
                                    <Badge key={i} variant="outline" className="text-xs">
                                      {pos.positionCode}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Selected Formation Details */}
            {selectedTemplate && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Play className="w-5 h-5" />
                    {selectedTemplate.name} Details
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Position List */}
                  <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Position Assignments ({selectedTemplate.positions.length})
                    </h4>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {selectedTemplate.positions.map((position, index) => (
                        <div key={index} className="bg-gray-50 rounded-lg p-3">
                          <div className="font-medium text-sm">{position.positionCode}</div>
                          <div className="text-xs text-gray-600">{position.role}</div>
                          <div className="text-xs text-gray-500 capitalize">({position.duty})</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Custom Name Input */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Tactic Name (Optional)
                    </label>
                    <Input
                      placeholder={selectedTemplate.name}
                      value={customTacticName}
                      onChange={(e) => setCustomTacticName(e.target.value)}
                      className="max-w-md"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Leave empty to use the default name
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={handleClose} disabled={isCreating}>
                Cancel
              </Button>
              
              <Button 
                onClick={handleCreateTactic} 
                disabled={!selectedTemplate || isCreating}
              >
                {isCreating ? 'Creating...' : 'Create Tactic'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}