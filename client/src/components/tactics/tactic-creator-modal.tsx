import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import AttributeDefinitionModal from "./attribute-definition-modal";

interface TacticCreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface Formation {
  name: string;
  positions: string[];
}

interface Player {
  id: number;
  name: string;
  age?: number;
}

interface PositionConfig {
  positionCode: string;
  positionName: string;
  roleName: string;
  duty: string;
  playerId?: number;
}

export default function TacticCreatorModal({ isOpen, onClose, onSuccess }: TacticCreatorModalProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<'formation' | 'positions' | 'complete'>('formation');
  const [tacticName, setTacticName] = useState("");
  const [selectedFormation, setSelectedFormation] = useState<string>("");
  const [positions, setPositions] = useState<PositionConfig[]>([]);
  const [attributeModalData, setAttributeModalData] = useState<{
    isOpen: boolean;
    positionCode: string;
    roleName: string;
    duty: string;
    onComplete: () => void;
  } | null>(null);

  const { data: formations } = useQuery<Record<string, Formation>>({
    queryKey: ["/api/formations"],
  });

  const { data: players } = useQuery<Player[]>({
    queryKey: ["/api/players"],
  });

  const createTacticMutation = useMutation({
    mutationFn: async (tacticData: any) => {
      return apiRequest("POST", "/api/tactics", tacticData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tactics"] });
      toast({
        title: "Success",
        description: "Tactic created successfully",
      });
      onSuccess();
      handleClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create tactic",
        variant: "destructive",
      });
    },
  });

  const handleClose = () => {
    setStep('formation');
    setTacticName("");
    setSelectedFormation("");
    setPositions([]);
    setAttributeModalData(null);
    onClose();
  };

  const handleFormationSelect = (formationKey: string) => {
    if (!formations) return;
    
    const formation = formations[formationKey];
    setSelectedFormation(formationKey);
    
    // Initialize positions based on formation
    const initialPositions = formation.positions.map((posCode, index) => ({
      positionCode: posCode,
      positionName: getPositionName(posCode, index, formation.positions),
      roleName: "",
      duty: "",
      playerId: undefined,
    }));
    
    setPositions(initialPositions);
    setStep('positions');
  };

  const getPositionName = (posCode: string, index: number, formationPositions: string[]) => {
    // Add side designation for repeated positions
    const samePositions = formationPositions.filter((p, i) => p === posCode && i <= index);
    if (samePositions.length > 1) {
      const sides = ['Left', 'Center', 'Right'];
      return `${posCode} ${sides[samePositions.length - 1] || ''}`.trim();
    }
    return posCode;
  };

  const handlePositionChange = async (index: number, field: keyof PositionConfig, value: string) => {
    const newPositions = [...positions];
    const position = newPositions[index];
    
    if (field === 'roleName') {
      // Reset duty when role changes
      position.duty = "";
    }
    
    position[field] = value as any;
    
    // Check if we need attribute definition for new position+role+duty combination
    if (field === 'duty' && position.roleName && position.duty) {
      try {
        const response = await fetch(`/api/check-attributes/${position.positionCode}/${encodeURIComponent(position.roleName)}/${position.duty}`);
        const data = await response.json();
        
        if (!data.exists) {
          // Need to define attributes for this combination
          setAttributeModalData({
            isOpen: true,
            positionCode: position.positionCode,
            roleName: position.roleName,
            duty: position.duty,
            onComplete: () => {
              setAttributeModalData(null);
              setPositions(newPositions);
            }
          });
          return;
        }
      } catch (error) {
        console.error("Failed to check attributes:", error);
      }
    }
    
    setPositions(newPositions);
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

    if (positions.some(p => !p.roleName || !p.duty)) {
      toast({
        title: "Error",
        description: "Please configure all positions with roles and duties",
        variant: "destructive",
      });
      return;
    }

    const tacticData = {
      name: tacticName,
      formation: selectedFormation,
      positions: positions.map(p => ({
        positionName: p.positionName,
        positionCode: p.positionCode,
        roleName: p.roleName,
        duty: p.duty,
        playerId: p.playerId || null,
      }))
    };

    createTacticMutation.mutate(tacticData);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Tactic</DialogTitle>
          </DialogHeader>

          {step === 'formation' && (
            <div className="space-y-6">
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

          {step === 'positions' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Configure Positions</h3>
                  <p className="text-sm text-muted-foreground">
                    {tacticName} - {formations?.[selectedFormation]?.name}
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setStep('formation')}
                >
                  Back to Formation
                </Button>
              </div>

              <PositionConfigurationTable
                positions={positions}
                players={players || []}
                onPositionChange={handlePositionChange}
              />

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateTactic}
                  disabled={createTacticMutation.isPending}
                >
                  {createTacticMutation.isPending ? "Creating..." : "Create Tactic"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {attributeModalData && (
        <AttributeDefinitionModal
          isOpen={attributeModalData.isOpen}
          positionCode={attributeModalData.positionCode}
          roleName={attributeModalData.roleName}
          duty={attributeModalData.duty}
          onComplete={attributeModalData.onComplete}
          onCancel={() => {
            setAttributeModalData(null);
            // Reset the position that triggered this modal
            const newPositions = [...positions];
            const positionIndex = newPositions.findIndex(p => 
              p.positionCode === attributeModalData.positionCode &&
              p.roleName === attributeModalData.roleName
            );
            if (positionIndex !== -1) {
              newPositions[positionIndex].duty = "";
              setPositions(newPositions);
            }
          }}
        />
      )}
    </>
  );
}

interface PositionConfigurationTableProps {
  positions: PositionConfig[];
  players: Player[];
  onPositionChange: (index: number, field: keyof PositionConfig, value: string) => void;
}

function PositionConfigurationTable({ positions, players, onPositionChange }: PositionConfigurationTableProps) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full">
        <thead className="bg-muted">
          <tr>
            <th className="text-left p-3 font-medium">Position</th>
            <th className="text-left p-3 font-medium">Role</th>
            <th className="text-left p-3 font-medium">Duty</th>
            <th className="text-left p-3 font-medium">Player (Optional)</th>
          </tr>
        </thead>
        <tbody>
          {positions.map((position, index) => (
            <PositionRow
              key={index}
              position={position}
              players={players}
              onPositionChange={(field, value) => onPositionChange(index, field, value)}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface PositionRowProps {
  position: PositionConfig;
  players: Player[];
  onPositionChange: (field: keyof PositionConfig, value: string) => void;
}

function PositionRow({ position, players, onPositionChange }: PositionRowProps) {
  const { data: roles } = useQuery<string[]>({
    queryKey: [`/api/roles/${position.positionCode}`],
    enabled: !!position.positionCode,
  });

  const { data: duties } = useQuery<string[]>({
    queryKey: [`/api/duties/${position.positionCode}/${position.roleName}`],
    enabled: !!position.positionCode && !!position.roleName,
  });

  return (
    <tr className="border-t">
      <td className="p-3">
        <div className="font-medium">{position.positionName}</div>
        <div className="text-sm text-muted-foreground">{position.positionCode}</div>
      </td>
      <td className="p-3">
        <Select
          value={position.roleName}
          onValueChange={(value) => onPositionChange('roleName', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select role" />
          </SelectTrigger>
          <SelectContent>
            {roles?.map((role) => (
              <SelectItem key={role} value={role}>
                {role}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </td>
      <td className="p-3">
        <Select
          value={position.duty}
          onValueChange={(value) => onPositionChange('duty', value)}
          disabled={!position.roleName}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select duty" />
          </SelectTrigger>
          <SelectContent>
            {duties?.map((duty) => (
              <SelectItem key={duty} value={duty}>
                {duty}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </td>
      <td className="p-3">
        <Select
          value={position.playerId?.toString() || "unassigned"}
          onValueChange={(value) => onPositionChange('playerId', value === "unassigned" ? "" : value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select player" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="unassigned">No player assigned</SelectItem>
            {players.map((player) => (
              <SelectItem key={player.id} value={player.id.toString()}>
                {player.name} {player.age && `(${player.age})`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </td>
    </tr>
  );
}