import React, { useState, useEffect, useCallback } from 'react';
import { Button } from './ui/button';
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

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <Settings className="w-5 h-5" />
            <h2 className="text-xl font-semibold">Select Formation</h2>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Formation Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map((template) => (
                  <div 
                    key={template.name}
                    className={`
                      border rounded-lg p-4 cursor-pointer transition-all
                      ${selectedTemplate?.name === template.name 
                        ? 'ring-2 ring-blue-500 bg-blue-50 border-blue-200' 
                        : 'hover:shadow-md border-gray-200'
                      }
                    `}
                    onClick={() => setSelectedTemplate(template)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold">{template.formation}</h3>
                      <div className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                        {template.positions.length} positions
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{template.name}</p>
                    
                    <div className="space-y-2 text-sm">
                      {(() => {
                        const lines = getPositionsByLine(template.positions);
                        return (
                          <>
                            {lines.attack.length > 0 && (
                              <div className="flex items-center gap-2">
                                <span className="text-gray-500 min-w-16 text-xs">Attack:</span>
                                <div className="flex flex-wrap gap-1">
                                  {lines.attack.map((pos, i) => (
                                    <span key={i} className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-xs">
                                      {pos.positionCode}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {lines.midfield.length > 0 && (
                              <div className="flex items-center gap-2">
                                <span className="text-gray-500 min-w-16 text-xs">Midfield:</span>
                                <div className="flex flex-wrap gap-1">
                                  {lines.midfield.map((pos, i) => (
                                    <span key={i} className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs">
                                      {pos.positionCode}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {lines.defense.length > 0 && (
                              <div className="flex items-center gap-2">
                                <span className="text-gray-500 min-w-16 text-xs">Defense:</span>
                                <div className="flex flex-wrap gap-1">
                                  {lines.defense.map((pos, i) => (
                                    <span key={i} className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs">
                                      {pos.positionCode}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                ))}
              </div>

              {/* Selected Formation Details */}
              {selectedTemplate && (
                <div className="border rounded-lg p-6 bg-gray-50">
                  <div className="flex items-center gap-2 mb-4">
                    <Play className="w-5 h-5" />
                    <h3 className="text-lg font-semibold">{selectedTemplate.name} Details</h3>
                  </div>
                  
                  <div className="space-y-4">
                    {/* Position List */}
                    <div>
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Position Assignments ({selectedTemplate.positions.length})
                      </h4>
                      
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {selectedTemplate.positions.map((position, index) => (
                          <div key={index} className="bg-white rounded-lg p-3 border">
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
                      <input
                        type="text"
                        placeholder={selectedTemplate.name}
                        value={customTacticName}
                        onChange={(e) => setCustomTacticName(e.target.value)}
                        className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Leave empty to use the default name
                      </p>
                    </div>
                  </div>
                </div>
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
        </div>
      </div>
    </div>
  );
}