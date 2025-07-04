import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { AlertTriangle } from "lucide-react";

interface AttributeDefinitionModalProps {
  isOpen: boolean;
  positionCode: string;
  roleName: string;
  duty: string;
  onComplete: () => void;
  onCancel: () => void;
}

interface AttributeCategories {
  technical: string[];
  mental: string[];
  physical: string[];
  goalkeeping?: string[];
}

export default function AttributeDefinitionModal({
  isOpen,
  positionCode,
  roleName,
  duty,
  onComplete,
  onCancel
}: AttributeDefinitionModalProps) {
  const { toast } = useToast();
  const [keyAttributes, setKeyAttributes] = useState<string[]>([]);
  const [preferableAttributes, setPreferableAttributes] = useState<string[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const isGoalkeeper = positionCode === 'GK';
  const attributeType = isGoalkeeper ? 'goalkeeper' : 'outfield';

  const { data: availableAttributes } = useQuery<AttributeCategories>({
    queryKey: [`/api/attributes/${attributeType}`],
  });

  const saveAttributesMutation = useMutation({
    mutationFn: async (data: {
      positionCode: string;
      roleName: string;
      duty: string;
      keyAttributes: string[];
      preferableAttributes: string[];
    }) => {
      return apiRequest("POST", "/api/define-attributes", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Attribute definition saved successfully",
      });
      onComplete();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save attribute definition",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    // Validate selections
    const errors: string[] = [];
    const allSelected = [...keyAttributes, ...preferableAttributes];
    const duplicates = allSelected.filter((attr, index) => allSelected.indexOf(attr) !== index);
    
    if (duplicates.length > 0) {
      errors.push(`Duplicate attributes selected: ${duplicates.join(', ')}`);
    }
    
    if (keyAttributes.length === 0) {
      errors.push("At least one key attribute must be selected");
    }

    setValidationErrors(errors);
  }, [keyAttributes, preferableAttributes]);

  const handleAttributeToggle = (attributeName: string, category: 'key' | 'preferable') => {
    if (category === 'key') {
      setKeyAttributes(prev => 
        prev.includes(attributeName)
          ? prev.filter(attr => attr !== attributeName)
          : [...prev, attributeName]
      );
    } else {
      setPreferableAttributes(prev => 
        prev.includes(attributeName)
          ? prev.filter(attr => attr !== attributeName)
          : [...prev, attributeName]
      );
    }
  };

  const isAttributeSelected = (attributeName: string) => {
    return keyAttributes.includes(attributeName) || preferableAttributes.includes(attributeName);
  };

  const getAttributeCategory = (attributeName: string): 'key' | 'preferable' | null => {
    if (keyAttributes.includes(attributeName)) return 'key';
    if (preferableAttributes.includes(attributeName)) return 'preferable';
    return null;
  };

  const handleSave = () => {
    if (validationErrors.length > 0) {
      toast({
        title: "Validation Error",
        description: validationErrors[0],
        variant: "destructive",
      });
      return;
    }

    saveAttributesMutation.mutate({
      positionCode,
      roleName,
      duty,
      keyAttributes,
      preferableAttributes,
    });
  };

  const renderAttributeCategory = (categoryName: string, attributes: string[]) => (
    <div key={categoryName} className="space-y-3">
      <h4 className="font-semibold text-sm uppercase tracking-wide text-foreground border-b pb-2">
        {categoryName}
      </h4>
      <div className="space-y-2">
        {attributes.map((attribute) => {
          const category = getAttributeCategory(attribute);
          
          return (
            <div key={attribute} className="flex items-center justify-between py-2 px-3 hover:bg-muted/50 rounded-md">
              <span className="text-sm font-medium flex-1">{attribute}</span>
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`key-${attribute}`}
                    checked={category === 'key'}
                    onCheckedChange={() => handleAttributeToggle(attribute, 'key')}
                    disabled={category === 'preferable'}
                  />
                  <label
                    htmlFor={`key-${attribute}`}
                    className="text-sm text-muted-foreground cursor-pointer"
                  >
                    Key
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`pref-${attribute}`}
                    checked={category === 'preferable'}
                    onCheckedChange={() => handleAttributeToggle(attribute, 'preferable')}
                    disabled={category === 'key'}
                  />
                  <label
                    htmlFor={`pref-${attribute}`}
                    className="text-sm text-muted-foreground cursor-pointer"
                  >
                    Preferable
                  </label>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onCancel}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Define Attributes: {positionCode} - {roleName} ({duty})
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              This Position+Role+Duty combination hasn't been defined yet. Please select the key and preferable attributes for optimal player evaluation.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Key Attributes (Weight: 1.0)</h3>
                <p className="text-sm text-muted-foreground">
                  Essential attributes that are critical for this role
                </p>
              </div>
              
              {validationErrors.length > 0 && (
                <Alert variant="destructive">
                  <AlertDescription>
                    {validationErrors.map((error, index) => (
                      <div key={index}>{error}</div>
                    ))}
                  </AlertDescription>
                </Alert>
              )}

              {availableAttributes ? (
                <div className="space-y-4">
                  {Object.entries(availableAttributes).map(([categoryName, attributes]) =>
                    renderAttributeCategory(categoryName, attributes.sort((a, b) => a.localeCompare(b)))
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Loading attributes...</p>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Selection Summary</h3>
                <p className="text-sm text-muted-foreground">
                  Review your attribute selections
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-foreground mb-2">
                    Key Attributes ({keyAttributes.length})
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {keyAttributes.map((attr) => (
                      <Badge key={attr} variant="default" className="text-xs">
                        {attr}
                      </Badge>
                    ))}
                    {keyAttributes.length === 0 && (
                      <span className="text-sm text-muted-foreground">No key attributes selected</span>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-foreground mb-2">
                    Preferable Attributes ({preferableAttributes.length})
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {preferableAttributes.map((attr) => (
                      <Badge key={attr} variant="secondary" className="text-xs">
                        {attr}
                      </Badge>
                    ))}
                    {preferableAttributes.length === 0 && (
                      <span className="text-sm text-muted-foreground">No preferable attributes selected</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button variant="outline" onClick={onCancel}>
              Cancel Tactic Creation
            </Button>
            <Button
              onClick={handleSave}
              disabled={validationErrors.length > 0 || saveAttributesMutation.isPending}
            >
              {saveAttributesMutation.isPending ? "Saving..." : "Save & Continue"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}