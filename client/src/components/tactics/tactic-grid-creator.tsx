import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Toggle } from "@/components/ui/toggle";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { CheckCircle, Circle, Target, ChevronDown, ChevronUp, RotateCcw, Lightbulb, AlertTriangle, Clock, CheckCircle2, Zap, BarChart3 } from "lucide-react";

interface TacticGridCreatorProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editMode?: boolean;
  tacticId?: number;
  initialData?: {
    id: number;
    name: string;
    formation?: string;
    instructions?: string;
    isActive: boolean;
    positions?: Array<{
      id: number;
      positionCode: string;
      positionName: string;
      roleName?: string;
      duty?: string;
      attributes?: Array<{
        attributeName: string;
        weight: number;
      }>;
    }>;
  };
}

interface Formation {
  name: string;
  positions: string[];
}

interface PositionConfig {
  positionCode: string;
  positionName: string;
  roleName: string;
  duty: string;
  playerId?: number;
  keyAttributes: string[];
  preferableAttributes: string[];
  isConfigured: boolean;
  isAutoPopulated: boolean;
  validationErrors: string[];
  isLoading: boolean;
}

interface AttributeCategories {
  technical: string[];
  mental: string[];
  physical: string[];
  goalkeeping?: string[];
}

// Helper functions moved outside component to be accessible by child components
const getPositionCompletionStatus = (position: PositionConfig): 'complete' | 'partial' | 'incomplete' => {
  if (position.validationErrors.length === 0 && position.roleName && position.duty && position.keyAttributes.length > 0) {
    return 'complete';
  }
  if (position.roleName || position.duty || position.keyAttributes.length > 0) {
    return 'partial';
  }
  return 'incomplete';
};

const getOverallProgress = (positions: PositionConfig[] = []) => {
  const completed = positions.filter(p => getPositionCompletionStatus(p) === 'complete').length;
  return {
    completed,
    total: positions.length,
    percentage: positions.length > 0 ? Math.round((completed / positions.length) * 100) : 0
  };
};

export default function TacticGridCreator({ isOpen, onClose, onSuccess, editMode = false, tacticId, initialData }: TacticGridCreatorProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<'formation' | 'grid'>('formation');
  const [tacticName, setTacticName] = useState("");
  const [selectedFormation, setSelectedFormation] = useState<string>("");
  const [positions, setPositions] = useState<PositionConfig[]>([]);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const [instructions, setInstructions] = useState("");

  const { data: formations } = useQuery<Record<string, Formation>>({
    queryKey: ["/api/formations"],
  });

  const { data: players } = useQuery<any[]>({
    queryKey: ["/api/players"],
  });

  const createTacticMutation = useMutation({
    mutationFn: async (tacticData: any) => {
      return apiRequest("POST", "/api/tactics", tacticData);
    },
    onSuccess: (data) => {
      // Comprehensive cache invalidation
      queryClient.invalidateQueries({ queryKey: ["/api/tactics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tactics/active"] });
      queryClient.invalidateQueries({ queryKey: ["/api/formations"] });
      
      toast({
        title: "Tactic Created",
        description: `"${data.name}" has been created successfully`,
      });
      onSuccess();
      handleClose();
    },
    onError: (error: any) => {
      console.error("Create tactic error:", error);
      const errorMessage = error?.message || "Failed to create tactic";
      toast({
        title: "Creation Failed",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const updateTacticMutation = useMutation({
    mutationFn: async (tacticData: any) => {
      return apiRequest("PUT", `/api/tactics/${tacticId}`, tacticData);
    },
    onSuccess: (data) => {
      // Comprehensive cache invalidation and optimistic updates
      queryClient.invalidateQueries({ queryKey: ["/api/tactics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tactics", tacticId] });
      queryClient.invalidateQueries({ queryKey: ["/api/tactics/active"] });
      
      // Update specific cache entries optimistically
      queryClient.setQueryData(["/api/tactics", tacticId], data);
      
      toast({
        title: "Tactic Updated",
        description: `"${data.name}" has been updated successfully`,
      });
      onSuccess();
      handleClose();
    },
    onError: (error: any) => {
      console.error("Update tactic error:", error);
      const errorMessage = error?.message || "Failed to update tactic";
      toast({
        title: "Update Failed",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Initialize form data for edit mode
  useEffect(() => {
    if (editMode && initialData && isOpen) {
      setTacticName(initialData.name);
      setSelectedFormation(initialData.formation || "");
      setInstructions(initialData.instructions || "");
      setStep('grid');
      
      // Convert initial positions to PositionConfig format
      if (initialData.positions && initialData.positions.length > 0) {
        const positionConfigs: PositionConfig[] = initialData.positions.map(pos => {
          // Convert role names back to role codes for the UI
          let roleCode = pos.roleName || "";
          
          // Map common role names to codes for edit mode compatibility
          const roleNameToCodeMap: Record<string, string> = {
            'Goalkeeper': 'GK', 'Sweeper Keeper': 'SK',
            'Full Back': 'FB', 'Wing Back': 'WB', 'Central Defender': 'CD',
            'Ball Playing Defender': 'BPD', 'No-Nonsense Centre Back': 'NCB',
            'No-Nonsense Full Back': 'NFB', 'Complete Wing Back': 'CWB',
            'Inverted Wing Back': 'IWB', 'Libero': 'L',
            'Advanced Playmaker': 'AP', 'Deep Lying Playmaker': 'DLP',
            'Box to Box Midfielder': 'BBM', 'Ball Winning Midfielder': 'BWM',
            'Central Midfielder': 'CM', 'Target Man': 'TM', 'Poacher': 'P',
            'Advanced Forward': 'AF', 'Inside Forward': 'IF', 'False Nine': 'F9',
            'Complete Forward': 'CF', 'Pressing Forward': 'PF', 'Deep Lying Forward': 'DLF',
            'Trequartista': 'T', 'Inverted Winger': 'IW', 'Winger': 'W',
            'Mezzala': 'MEZ', 'Carrilero': 'CAR', 'Roaming Playmaker': 'RP',
            'Attacking Midfielder': 'AM', 'Shadow Striker': 'SS', 'Enganche': 'E'
          };
          
          if (roleNameToCodeMap[pos.roleName || ""]) {
            roleCode = roleNameToCodeMap[pos.roleName || ""];
          }
          
          return {
            positionCode: pos.positionCode,
            positionName: pos.positionName,
            roleName: roleCode,
            duty: pos.duty || "",
            playerId: undefined,
            keyAttributes: pos.attributes?.filter(attr => attr.weight === 3).map(attr => attr.attributeName) || [],
            preferableAttributes: pos.attributes?.filter(attr => attr.weight === 2).map(attr => attr.attributeName) || [],
            isConfigured: !!(pos.roleName && pos.duty && pos.attributes?.length),
            isAutoPopulated: true, // Mark as auto-populated since data came from FM
            validationErrors: [],
            isLoading: false,
          };
        });
        setPositions(positionConfigs);
      }
    } else if (!editMode && isOpen) {
      // Reset for create mode
      setStep('formation');
      setTacticName("");
      setSelectedFormation("");
      setInstructions("");
      setPositions([]);
      setCollapsedSections({});
    }
  }, [editMode, initialData, isOpen]);

  const handleClose = () => {
    if (!editMode) {
      setStep('formation');
      setTacticName("");
      setSelectedFormation("");
      setInstructions("");
      setPositions([]);
      setCollapsedSections({});
    }
    onClose();
  };

  const handleFormationSelect = (formationKey: string) => {
    if (!formations) return;
    
    const formation = formations[formationKey];
    setSelectedFormation(formationKey);
    
    const initialPositions: PositionConfig[] = formation.positions.map((posCode, index) => ({
      positionCode: posCode,
      positionName: getPositionName(posCode, index, formation.positions),
      roleName: "",
      duty: "",
      playerId: undefined,
      keyAttributes: [],
      preferableAttributes: [],
      isConfigured: false,
      isAutoPopulated: false,
      validationErrors: [],
      isLoading: false,
    }));
    
    setPositions(initialPositions);
    setStep('grid');
  };

  const getPositionName = (posCode: string, index: number, formationPositions: string[]) => {
    const samePositions = formationPositions.filter((p, i) => p === posCode && i <= index);
    if (samePositions.length > 1) {
      const sides = ['Left', 'Center', 'Right'];
      return `${posCode} ${sides[samePositions.length - 1] || ''}`.trim();
    }
    return posCode;
  };

  const validatePosition = (position: PositionConfig): string[] => {
    const errors: string[] = [];
    
    if (!position.roleName) {
      errors.push("Role is required");
    }
    if (!position.duty) {
      errors.push("Duty is required");
    }
    if (position.keyAttributes.length === 0) {
      errors.push("At least one key attribute is required");
    }
    
    // Special validation for goalkeepers
    if (position.positionCode === 'GK') {
      const hasGoalkeeperAttributes = position.keyAttributes.some(attr => 
        ['Aerial Reach', 'Command of Area', 'Communication', 'Eccentricity', 'Handling', 'Kicking', 'One on Ones', 'Reflexes', 'Rushing Out', 'Tendency to Punch', 'Throwing'].includes(attr)
      );
      if (!hasGoalkeeperAttributes) {
        errors.push("Goalkeeper positions should have at least one goalkeeping attribute");
      }
    }
    
    return errors;
  };



  const updatePositionConfig = (index: number, updates: Partial<PositionConfig>) => {
    const newPositions = [...positions];
    newPositions[index] = { ...newPositions[index], ...updates };
    
    const position = newPositions[index];
    position.validationErrors = validatePosition(position);
    position.isConfigured = position.validationErrors.length === 0;
    
    setPositions(newPositions);

    // Show completion toast for newly completed positions
    if (position.isConfigured && !positions[index].isConfigured) {
      toast({
        title: "Position Configured",
        description: `${position.positionCode} (${position.roleName}) is now complete`,
      });
    }
  };

  const autoCompletePosition = async (index: number) => {
    const position = positions[index];
    
    // If position has role and duty, try to auto-populate with FM data
    if (position.roleName && position.duty) {
      try {
        const response = await fetch(`/api/check-attributes/${position.positionCode}/${position.roleName}/${position.duty}`);
        const data = await response.json();
        
        if (data.exists && data.attributes) {
          updatePositionConfig(index, {
            keyAttributes: data.attributes.keyAttributes || [],
            preferableAttributes: data.attributes.preferableAttributes || [],
            isAutoPopulated: true,
          });
          
          toast({
            title: "FM Data Applied",
            description: `${position.positionCode} updated with authentic FM attributes`,
          });
          return;
        }
      } catch (error) {
        console.error('Error fetching FM data:', error);
      }
    }

    // Show guidance for incomplete positions
    toast({
      title: "Position Incomplete",
      description: `${position.positionCode} needs role and duty selection first`,
      variant: "destructive",
    });
  };

  const handleCreateTactic = () => {
    if (!tacticName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a tactic name",
        variant: "destructive",
      });
      return;
    }

    if (!editMode && !selectedFormation) {
      toast({
        title: "Error",
        description: "Please select a formation", 
        variant: "destructive",
      });
      return;
    }

    const positionsWithoutAttributes = positions.filter(p => p.keyAttributes.length === 0);
    if (positionsWithoutAttributes.length > 0) {
      toast({
        title: "Attributes Required",
        description: "All positions must have at least one key attribute selected",
        variant: "destructive",
      });
      return;
    }

    const tacticData = {
      name: tacticName,
      formation: selectedFormation,
      instructions: instructions,
      positions: positions.map(p => ({
        positionName: p.positionName,
        positionCode: p.positionCode,
        roleName: p.roleName,
        duty: p.duty,
        playerId: p.playerId || null,
        attributes: [
          ...p.keyAttributes.map(attr => ({ attributeName: attr, weight: 3 })),
          ...p.preferableAttributes.map(attr => ({ attributeName: attr, weight: 2 }))
        ]
      }))
    };

    if (editMode) {
      updateTacticMutation.mutate(tacticData);
    } else {
      createTacticMutation.mutate(tacticData);
    }
  };

  const progress = getOverallProgress(positions);
  const configuredCount = progress.completed;
  const totalPositions = progress.total;
  const progressPercentage = progress.percentage;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            {editMode ? "Edit Tactic" : "Create New Tactic"}
          </DialogTitle>
        </DialogHeader>

        {step === 'formation' && (
          <div className="space-y-6 flex-1 overflow-y-auto">
            <div>
              <Label htmlFor="tacticName">Tactic Name</Label>
              <Input
                id="tacticName"
                value={tacticName}
                onChange={(e) => setTacticName(e.target.value)}
                placeholder="Enter tactic name"
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="instructions">Instructions (Optional)</Label>
              <Input
                id="instructions"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Enter tactical instructions"
                className="mt-2"
              />
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Select Formation</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {formations && Object.entries(formations).map(([key, formation]) => (
                  <Card
                    key={key}
                    className="cursor-pointer hover:border-primary transition-colors"
                    onClick={() => handleFormationSelect(key)}
                  >
                    <CardHeader>
                      <CardTitle className="text-center">{formation.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center text-sm text-muted-foreground">
                        {formation.positions.length} positions
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2 justify-center">
                        {formation.positions.slice(0, 5).map((pos, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {pos}
                          </Badge>
                        ))}
                        {formation.positions.length > 5 && (
                          <Badge variant="secondary" className="text-xs">
                            +{formation.positions.length - 5}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 'grid' && (
          <div className="flex-1 overflow-hidden flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-4">
                  <h3 className="text-lg font-semibold">Configure Positions</h3>
                  <Badge variant="outline">
                    {tacticName} - {formations?.[selectedFormation]?.name}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Progress value={progressPercentage} className="flex-1 max-w-xs" />
                  <span className="text-sm text-muted-foreground">
                    {configuredCount}/{totalPositions} configured
                  </span>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => setStep('formation')}
              >
                Back to Formation
              </Button>
            </div>

            <div className="flex-1 overflow-auto">
              <ProgressDashboard 
                positions={positions}
                onAutoComplete={autoCompletePosition}
              />
              <TacticGrid
                positions={positions}
                players={players || []}
                onUpdatePosition={updatePositionConfig}
              />
            </div>

            <div className="flex justify-between items-center pt-4 border-t">
              <ValidationSummary positions={positions} />
              <div className="flex space-x-2">
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateTactic}
                  disabled={(createTacticMutation.isPending || updateTacticMutation.isPending) || (!editMode && configuredCount < totalPositions)}
                >
                  {(createTacticMutation.isPending || updateTacticMutation.isPending) 
                    ? (editMode ? "Updating..." : "Creating...") 
                    : (editMode ? "Save Changes" : "Create Tactic")}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

interface TacticGridProps {
  positions?: PositionConfig[];
  players?: any[];
  onUpdatePosition: (index: number, updates: Partial<PositionConfig>) => void;
}

function TacticGrid({ positions = [], players = [], onUpdatePosition }: TacticGridProps) {
  return (
    <div className="border rounded-lg overflow-hidden bg-card">
      <div className="grid gap-2 p-4 bg-muted/50 border-b" style={{ gridTemplateColumns: `repeat(${positions.length}, 1fr)` }}>
        {positions.map((position, index) => (
          <PositionHeader key={index} position={position} />
        ))}
      </div>

      <div className="p-4 space-y-6">
        <div className="space-y-4">
          <h4 className="font-semibold text-sm uppercase tracking-wide border-b pb-2">
            Position Configuration
          </h4>
          
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Role</Label>
            <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${positions.length}, 1fr)` }}>
              {positions.map((position, index) => (
                <PositionRoleSelect
                  key={`role-${index}`}
                  position={position}
                  onUpdate={(updates) => onUpdatePosition(index, updates)}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Duty</Label>
            <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${positions.length}, 1fr)` }}>
              {positions.map((position, index) => (
                <PositionDutySelect
                  key={`duty-${index}`}
                  position={position}
                  onUpdate={(updates) => onUpdatePosition(index, updates)}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Player (Optional)</Label>
            <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${positions.length}, 1fr)` }}>
              {positions.map((position, index) => (
                <PositionPlayerSelect
                  key={`player-${index}`}
                  position={position}
                  players={players}
                  onUpdate={(updates) => onUpdatePosition(index, updates)}
                />
              ))}
            </div>
          </div>
        </div>

        <Separator />

        <PositionAttributesGrid
          positions={positions}
          onUpdatePosition={onUpdatePosition}
        />
      </div>
    </div>
  );
}

function PositionHeader({ position }: { position: PositionConfig }) {
  const getStatusIcon = () => {
    if (position.isLoading) {
      return <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />;
    }
    
    const status = getPositionCompletionStatus(position);
    switch (status) {
      case 'complete':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'partial':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'incomplete':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default:
        return <Circle className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = () => {
    const status = getPositionCompletionStatus(position);
    switch (status) {
      case 'complete':
        return 'border-green-500 bg-green-50';
      case 'partial':
        return 'border-yellow-500 bg-yellow-50';
      case 'incomplete':
        return 'border-red-500 bg-red-50';
      default:
        return 'border-muted';
    }
  };

  return (
    <div className={`text-center space-y-1 p-2 rounded border-2 ${getStatusColor()}`}>
      <div className="flex items-center justify-center gap-1">
        {getStatusIcon()}
        <span className="font-medium text-sm">{position.positionCode}</span>
        {position.isAutoPopulated && (
          <Zap className="w-3 h-3 text-blue-500" />
        )}
      </div>
      <div className="text-xs text-muted-foreground">{position.positionName}</div>
      {position.validationErrors.length > 0 && (
        <div className="text-xs text-red-600 max-w-24 mx-auto">
          {position.validationErrors[0]}
        </div>
      )}
    </div>
  );
}

function ProgressDashboard({ positions = [], onAutoComplete }: { positions?: PositionConfig[]; onAutoComplete: (index: number) => void }) {
  const progress = getOverallProgress(positions);
  const incompletePositions = positions.filter(p => getPositionCompletionStatus(p) !== 'complete');

  return (
    <div className="mb-6 p-4 bg-muted/30 rounded-lg border">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold">Configuration Progress</h3>
          <Badge variant={positions.filter(p => p.isAutoPopulated).length > 0 ? "default" : "secondary"} className="text-xs">
            <Zap className="w-3 h-3 mr-1" />
            {positions.filter(p => p.isAutoPopulated).length} FM Authentic
          </Badge>
        </div>
        <span className="text-sm text-muted-foreground">
          {progress.completed}/{progress.total} positions configured
        </span>
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Progress value={progress.percentage} className="flex-1" />
          <span className="text-sm font-medium">{progress.percentage}%</span>
          {positions.some(p => p.roleName && p.duty && !p.isAutoPopulated) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                positions.forEach((position, index) => {
                  if (position.roleName && position.duty && !position.isAutoPopulated) {
                    onAutoComplete(index);
                  }
                });
              }}
              className="text-xs whitespace-nowrap"
            >
              <Zap className="w-3 h-3 mr-1" />
              Auto-Fill FM Data
            </Button>
          )}
        </div>
        
        {incompletePositions.length > 0 && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">Incomplete:</span>
            <div className="flex gap-1 flex-wrap">
              {incompletePositions.slice(0, 5).map((pos, idx) => {
                const posIndex = positions.findIndex(p => p === pos);
                return (
                  <button
                    key={idx}
                    onClick={() => onAutoComplete(posIndex)}
                    className="px-2 py-1 bg-destructive/10 text-destructive rounded text-xs hover:bg-destructive/20 transition-colors"
                  >
                    {pos.positionCode}
                  </button>
                );
              })}
              {incompletePositions.length > 5 && (
                <span className="text-muted-foreground">+{incompletePositions.length - 5} more</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ValidationSummary({ positions = [] }: { positions?: PositionConfig[] }) {
  const errors = positions.flatMap(p => p.validationErrors);
  const warnings = positions.filter(p => getPositionCompletionStatus(p) === 'partial').length;

  if (errors.length === 0 && warnings === 0) {
    return (
      <div className="flex items-center gap-2 text-green-600">
        <CheckCircle2 className="w-4 h-4" />
        <span className="text-sm">All positions configured correctly</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4 text-xs">
      {errors.length > 0 && (
        <div className="flex items-center gap-1 text-red-600">
          <AlertTriangle className="w-4 h-4" />
          <span>{errors.length} error{errors.length !== 1 ? 's' : ''}</span>
        </div>
      )}
      {warnings > 0 && (
        <div className="flex items-center gap-1 text-yellow-600">
          <Clock className="w-4 h-4" />
          <span>{warnings} incomplete</span>
        </div>
      )}
    </div>
  );
}

interface Role {
  code: string;
  name: string;
}

function PositionRoleSelect({ position, onUpdate }: { position: PositionConfig; onUpdate: (updates: Partial<PositionConfig>) => void }) {
  const { data: roles = [] } = useQuery<Role[]>({
    queryKey: [`/api/roles/${position.positionCode}`],
    enabled: !!position.positionCode,
  });

  return (
    <Select
      value={position.roleName}
      onValueChange={(value) => onUpdate({ roleName: value, duty: "", keyAttributes: [], preferableAttributes: [] })}
    >
      <SelectTrigger className="h-8 text-xs">
        <SelectValue placeholder="Role" />
      </SelectTrigger>
      <SelectContent>
        {roles.map((role) => (
          <SelectItem key={role.code} value={role.code}>
            {role.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

interface Duty {
  code: string;
  name: string;
}

function PositionDutySelect({ position, onUpdate }: { position: PositionConfig; onUpdate: (updates: Partial<PositionConfig>) => void }) {
  const { data: duties = [] } = useQuery<Duty[]>({
    queryKey: [`/api/duties/${position.positionCode}/${position.roleName || ''}`],
    enabled: !!position.positionCode && !!position.roleName,
  });

  const handleDutyChange = async (duty: string) => {
    onUpdate({ duty, isLoading: true });
    
    try {
      const response = await fetch(`/api/check-attributes/${position.positionCode}/${position.roleName}/${duty}`);
      const data = await response.json();
      
      console.log(`Duty change for ${position.positionCode}/${position.roleName}/${duty}:`, data);
      
      if (data.exists && data.attributes) {
        onUpdate({
          duty,
          keyAttributes: data.attributes.keyAttributes || [],
          preferableAttributes: data.attributes.preferableAttributes || [],
          isAutoPopulated: true,
          isLoading: false,
        });
      } else {
        onUpdate({
          duty,
          keyAttributes: [],
          preferableAttributes: [],
          isAutoPopulated: false,
          isLoading: false,
        });
      }
    } catch (error) {
      console.error('Error fetching attributes:', error);
      onUpdate({ duty, isLoading: false });
    }
  };

  return (
    <Select
      value={position.duty}
      onValueChange={handleDutyChange}
      disabled={!position.roleName}
    >
      <SelectTrigger className="h-8 text-xs">
        <SelectValue placeholder="Duty" />
      </SelectTrigger>
      <SelectContent>
        {duties.map((duty) => (
          <SelectItem key={duty.code} value={duty.code}>
            {duty.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function PositionPlayerSelect({ position, players, onUpdate }: { position: PositionConfig; players: any[]; onUpdate: (updates: Partial<PositionConfig>) => void }) {
  return (
    <Select
      value={position.playerId?.toString() || "unassigned"}
      onValueChange={(value) => onUpdate({ playerId: value === "unassigned" ? undefined : parseInt(value) })}
    >
      <SelectTrigger className="h-8 text-xs">
        <SelectValue placeholder="Player" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="unassigned">Unassigned</SelectItem>
        {players.map((player) => (
          <SelectItem key={player.id} value={player.id.toString()}>
            {player.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function PositionAttributesGrid({ positions = [], onUpdatePosition }: { positions?: PositionConfig[]; onUpdatePosition: (index: number, updates: Partial<PositionConfig>) => void }) {
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  
  const { data: goalkeeperAttributes } = useQuery<AttributeCategories>({
    queryKey: ["/api/attributes/goalkeeper"],
  });

  const { data: outfieldAttributes } = useQuery<AttributeCategories>({
    queryKey: ["/api/attributes/outfield"],
  });

  const toggleSection = (sectionName: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [sectionName]: !prev[sectionName]
    }));
  };

  const copyPositionAttributes = (fromIndex: number, toIndex: number) => {
    const fromPosition = positions[fromIndex];
    onUpdatePosition(toIndex, {
      keyAttributes: [...fromPosition.keyAttributes],
      preferableAttributes: [...fromPosition.preferableAttributes],
      isAutoPopulated: false,
    });
  };

  const resetPositionAttributes = async (positionIndex: number) => {
    const position = positions[positionIndex];
    
    // Try to reset to FM authentic data first
    if (position.roleName && position.duty) {
      try {
        const response = await fetch(`/api/check-attributes/${position.positionCode}/${position.roleName}/${position.duty}`);
        const data = await response.json();
        
        if (data.exists && data.attributes) {
          onUpdatePosition(positionIndex, {
            keyAttributes: data.attributes.keyAttributes || [],
            preferableAttributes: data.attributes.preferableAttributes || [],
            isAutoPopulated: true,
          });
          return; // Successfully reset to FM data
        }
      } catch (error) {
        console.error('Error fetching FM data for reset:', error);
      }
    }
    
    // Fallback to clearing attributes
    onUpdatePosition(positionIndex, {
      keyAttributes: [],
      preferableAttributes: [],
      isAutoPopulated: false,
    });
  };

  const selectAllKey = (positionIndex: number, attributes: string[]) => {
    const position = positions[positionIndex];
    const newKeyAttributes = [...new Set([...position.keyAttributes, ...attributes])];
    const newPreferableAttributes = position.preferableAttributes.filter(attr => !attributes.includes(attr));
    
    onUpdatePosition(positionIndex, {
      keyAttributes: newKeyAttributes,
      preferableAttributes: newPreferableAttributes,
      isAutoPopulated: false,
    });
  };

  const selectAllPreferable = (positionIndex: number, attributes: string[]) => {
    const position = positions[positionIndex];
    const newPreferableAttributes = [...new Set([...position.preferableAttributes, ...attributes])];
    const newKeyAttributes = position.keyAttributes.filter(attr => !attributes.includes(attr));
    
    onUpdatePosition(positionIndex, {
      keyAttributes: newKeyAttributes,
      preferableAttributes: newPreferableAttributes,
      isAutoPopulated: false,
    });
  };

  const renderAttributeSection = (categoryName: string, attributes: string[]) => {
    const isCollapsed = collapsedSections[categoryName];
    const sectionIcon = categoryName === 'Technical' ? '⚽' : 
                       categoryName === 'Mental' ? '🧠' :
                       categoryName === 'Physical' ? '💪' : '🥅';
    
    return (
      <div key={categoryName} className="space-y-3 border rounded-lg p-4 bg-card">
        <div className="flex items-center justify-between">
          <button 
            className="flex items-center gap-2 font-medium text-sm text-foreground hover:text-primary transition-colors"
            onClick={() => toggleSection(categoryName)}
          >
            <span className="text-lg">{sectionIcon}</span>
            <span className="uppercase tracking-wide">{categoryName}</span>
            <span className="text-xs text-muted-foreground">({attributes.length})</span>
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>

        </div>
        
        {!isCollapsed && (
          <div className="space-y-3">
            {attributes.map((attribute) => (
              <div key={attribute} className="space-y-2 border-l-2 border-muted pl-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">{attribute}</div>
                  <div className="flex items-center gap-1">
                    <Lightbulb className="w-3 h-3 text-muted-foreground" />
                  </div>
                </div>
                <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${positions.length}, 1fr)` }}>
                  {positions.map((position, posIndex) => {
                    if (categoryName === 'Goalkeeping' && position.positionCode !== 'GK') {
                      return <div key={posIndex} className="h-8" />;
                    }

                    const isKey = position.keyAttributes.includes(attribute);
                    const isPreferable = position.preferableAttributes.includes(attribute);
                    
                    return (
                      <EnhancedAttributeToggle
                        key={posIndex}
                        attribute={attribute}
                        position={position}
                        positions={positions}
                        positionIndex={posIndex}
                        isKey={isKey}
                        isPreferable={isPreferable}
                        onUpdatePosition={onUpdatePosition}
                        onCopyFrom={copyPositionAttributes}
                        onReset={resetPositionAttributes}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b pb-2">
        <h4 className="font-semibold text-sm uppercase tracking-wide">
          Attribute Requirements
        </h4>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const allSections = ['Technical', 'Mental', 'Physical', 'Goalkeeping'];
              const allCollapsed = allSections.every(section => collapsedSections[section]);
              const newState = allSections.reduce((acc, section) => ({
                ...acc,
                [section]: !allCollapsed
              }), {});
              setCollapsedSections(newState);
            }}
            className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded border"
          >
            {Object.values(collapsedSections).every(Boolean) ? 'Expand All' : 'Collapse All'}
          </button>
          <button
            onClick={() => {
              positions.forEach((_, index) => {
                onUpdatePosition(index, {
                  keyAttributes: [],
                  preferableAttributes: [],
                  isAutoPopulated: false,
                });
              });
            }}
            className="text-xs text-destructive hover:text-destructive/80 px-2 py-1 rounded border border-destructive/20"
          >
            Reset All
          </button>
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-primary rounded" />
            Key (Essential)
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-400 rounded" />
            Preferable (Nice to have)
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 border rounded" />
            Not selected
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full" />
            Auto-populated
          </div>
        </div>
        <div className="text-xs text-muted-foreground">
          Hover over attribute rows for quick actions
        </div>
      </div>

      {(goalkeeperAttributes?.technical || outfieldAttributes?.technical) && 
        renderAttributeSection('Technical', 
          Array.from(new Set([...(goalkeeperAttributes?.technical || []), ...(outfieldAttributes?.technical || [])]))
            .sort((a, b) => a.localeCompare(b)))}

      {(goalkeeperAttributes?.mental || outfieldAttributes?.mental) && 
        renderAttributeSection('Mental', 
          Array.from(new Set([...(goalkeeperAttributes?.mental || []), ...(outfieldAttributes?.mental || [])]))
            .sort((a, b) => a.localeCompare(b)))}

      {(goalkeeperAttributes?.physical || outfieldAttributes?.physical) && 
        renderAttributeSection('Physical', 
          Array.from(new Set([...(goalkeeperAttributes?.physical || []), ...(outfieldAttributes?.physical || [])]))
            .sort((a, b) => a.localeCompare(b)))}

      {goalkeeperAttributes?.goalkeeping && 
        renderAttributeSection('Goalkeeping', goalkeeperAttributes.goalkeeping.sort((a, b) => a.localeCompare(b)))}
    </div>
  );
}

interface EnhancedAttributeToggleProps {
  attribute: string;
  position: PositionConfig;
  positions: PositionConfig[];
  positionIndex: number;
  isKey: boolean;
  isPreferable: boolean;
  onUpdatePosition: (index: number, updates: Partial<PositionConfig>) => void;
  onCopyFrom: (fromIndex: number, toIndex: number) => void;
  onReset: (positionIndex: number) => void;
}

function EnhancedAttributeToggle({ 
  attribute, 
  position, 
  positions, 
  positionIndex, 
  isKey, 
  isPreferable, 
  onUpdatePosition,
  onCopyFrom,
  onReset 
}: EnhancedAttributeToggleProps) {
  const [showActions, setShowActions] = useState(false);
  const [hoverTimer, setHoverTimer] = useState<NodeJS.Timeout | null>(null);
  const [hideTimer, setHideTimer] = useState<NodeJS.Timeout | null>(null);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (hoverTimer) clearTimeout(hoverTimer);
      if (hideTimer) clearTimeout(hideTimer);
    };
  }, [hoverTimer, hideTimer]);

  const handleMouseEnter = () => {
    // Clear any existing hide timer
    if (hideTimer) {
      clearTimeout(hideTimer);
      setHideTimer(null);
    }
    
    // Set a delay before showing the tooltip
    const timer = setTimeout(() => {
      setShowActions(true);
    }, 300); // 300ms delay before showing
    
    setHoverTimer(timer);
  };

  const handleMouseLeave = () => {
    // Clear the show timer if we're leaving before it fires
    if (hoverTimer) {
      clearTimeout(hoverTimer);
      setHoverTimer(null);
    }
    
    // Set a longer delay before hiding to allow mouse movement to tooltip
    const timer = setTimeout(() => {
      setShowActions(false);
    }, 200); // 200ms delay before hiding
    
    setHideTimer(timer);
  };

  const handleTooltipMouseEnter = () => {
    // Clear hide timer when mouse enters tooltip area
    if (hideTimer) {
      clearTimeout(hideTimer);
      setHideTimer(null);
    }
  };

  const handleTooltipMouseLeave = () => {
    // Hide immediately when leaving tooltip area
    setShowActions(false);
  };

  const handleToggle = (type: 'key' | 'preferable') => {
    const newKeyAttributes = [...position.keyAttributes];
    const newPreferableAttributes = [...position.preferableAttributes];
    
    if (type === 'key') {
      if (isKey) {
        const index = newKeyAttributes.indexOf(attribute);
        newKeyAttributes.splice(index, 1);
      } else {
        newKeyAttributes.push(attribute);
        const prefIndex = newPreferableAttributes.indexOf(attribute);
        if (prefIndex !== -1) {
          newPreferableAttributes.splice(prefIndex, 1);
        }
      }
    } else {
      if (isPreferable) {
        const index = newPreferableAttributes.indexOf(attribute);
        newPreferableAttributes.splice(index, 1);
      } else {
        newPreferableAttributes.push(attribute);
        const keyIndex = newKeyAttributes.indexOf(attribute);
        if (keyIndex !== -1) {
          newKeyAttributes.splice(keyIndex, 1);
        }
      }
    }
    
    onUpdatePosition(positionIndex, {
      keyAttributes: newKeyAttributes,
      preferableAttributes: newPreferableAttributes,
      isAutoPopulated: false,
    });
  };

  return (
    <div 
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="flex gap-1">
        <button
          onClick={() => handleToggle('key')}
          className={`w-6 h-6 text-xs font-medium border rounded transition-all duration-200 hover:scale-105 ${
            isKey ? 'bg-primary text-primary-foreground border-primary shadow-sm' : 
            'border-input bg-background hover:bg-primary/10 hover:border-primary/50'
          }`}
          disabled={isPreferable}
          title="Mark as Key attribute"
        >
          K
        </button>
        <button
          onClick={() => handleToggle('preferable')}
          className={`w-6 h-6 text-xs font-medium border rounded transition-all duration-200 hover:scale-105 ${
            isPreferable ? 'bg-blue-400 text-white border-blue-400 shadow-sm' : 
            'border-input bg-background hover:bg-blue-100 hover:border-blue-300'
          }`}
          disabled={isKey}
          title="Mark as Preferable attribute"
        >
          P
        </button>
      </div>

      {showActions && (
        <div 
          className="absolute top-8 left-0 z-20 bg-popover border rounded-md shadow-lg p-2 flex gap-2 min-w-max animate-in fade-in-0 zoom-in-95 duration-200"
          onMouseEnter={handleTooltipMouseEnter}
          onMouseLeave={handleTooltipMouseLeave}
        >
          <button
            onClick={() => onReset(positionIndex)}
            className="p-1 hover:bg-accent rounded text-xs transition-colors"
            title="Reset all attributes for this position"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
          {positions.length > 1 && (
            <select
              onChange={(e) => e.target.value && onCopyFrom(parseInt(e.target.value), positionIndex)}
              className="text-xs p-1 bg-background border rounded hover:bg-accent transition-colors min-w-0"
              title="Copy attributes from another position"
              defaultValue=""
            >
              <option value="">Copy from...</option>
              {positions.map((pos, idx) => (
                idx !== positionIndex && (
                  <option key={idx} value={idx}>
                    {pos.positionCode}
                  </option>
                )
              ))}
            </select>
          )}
        </div>
      )}
    </div>
  );
}