import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface Position {
  code: string;
  name: string;
}

interface Role {
  code: string;
  name: string;
}

interface Duty {
  code: string;
  name: string;
}

interface PositionRoleSelectorProps {
  selectedPosition?: string;
  selectedRole?: string;
  selectedDuty?: string;
  onPositionChange: (position: string) => void;
  onRoleChange: (role: string) => void;
  onDutyChange: (duty: string) => void;
  disabled?: boolean;
}

export function PositionRoleSelector({
  selectedPosition,
  selectedRole,
  selectedDuty,
  onPositionChange,
  onRoleChange,
  onDutyChange,
  disabled = false,
}: PositionRoleSelectorProps) {
  // Fetch all available positions
  const { data: positions = [] } = useQuery<Position[]>({
    queryKey: ["/api/positions"],
    enabled: !disabled,
  });

  // Fetch roles for selected position
  const { data: roles = [] } = useQuery<Role[]>({
    queryKey: ["/api/roles", selectedPosition],
    enabled: !!selectedPosition && !disabled,
  });

  // Fetch duties for selected position+role
  const { data: duties = [] } = useQuery<Duty[]>({
    queryKey: ["/api/duties", selectedPosition, selectedRole],
    enabled: !!selectedPosition && !!selectedRole && !disabled,
  });

  // Reset dependent selections when parent changes
  useEffect(() => {
    if (selectedPosition && selectedRole && !roles.find(r => r.code === selectedRole)) {
      onRoleChange("");
      onDutyChange("");
    }
  }, [selectedPosition, roles, selectedRole, onRoleChange, onDutyChange]);

  useEffect(() => {
    if (selectedPosition && selectedRole && selectedDuty && !duties.find(d => d.code === selectedDuty)) {
      onDutyChange("");
    }
  }, [selectedPosition, selectedRole, duties, selectedDuty, onDutyChange]);

  const handlePositionChange = (position: string) => {
    onPositionChange(position);
    onRoleChange("");
    onDutyChange("");
  };

  const handleRoleChange = (role: string) => {
    onRoleChange(role);
    onDutyChange("");
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Position Selection */}
      <div className="space-y-2">
        <Label htmlFor="position">Position</Label>
        <Select
          value={selectedPosition || ""}
          onValueChange={handlePositionChange}
          disabled={disabled}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select position" />
          </SelectTrigger>
          <SelectContent>
            {positions.map((position) => (
              <SelectItem key={position.code} value={position.code}>
                {position.code} - {position.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Role Selection */}
      <div className="space-y-2">
        <Label htmlFor="role">Role</Label>
        <Select
          value={selectedRole || ""}
          onValueChange={handleRoleChange}
          disabled={disabled || !selectedPosition || roles.length === 0}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select role" />
          </SelectTrigger>
          <SelectContent>
            {roles.map((role) => (
              <SelectItem key={role.code} value={role.code}>
                {role.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Duty Selection */}
      <div className="space-y-2">
        <Label htmlFor="duty">Duty</Label>
        <Select
          value={selectedDuty || ""}
          onValueChange={onDutyChange}
          disabled={disabled || !selectedPosition || !selectedRole || duties.length === 0}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select duty" />
          </SelectTrigger>
          <SelectContent>
            {duties.map((duty) => (
              <SelectItem key={duty.code} value={duty.code}>
                {duty.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}