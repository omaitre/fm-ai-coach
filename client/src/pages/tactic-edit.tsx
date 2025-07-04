import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Loader2, Target, Settings, Users, Trophy, Edit } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import TacticGridCreator from "@/components/tactics/tactic-grid-creator";

interface TacticEditProps {}

export default function TacticEdit({}: TacticEditProps) {
  const params = useParams();
  const tacticId = parseInt(params?.id || "0");
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [, setLocation] = useLocation();

  // Fetch tactic data for editing
  const { data: tactic, isLoading, error } = useQuery({
    queryKey: ["/api/tactics", tacticId],
    queryFn: async () => {
      const response = await fetch(`/api/tactics/${tacticId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch tactic");
      }
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="flex-1 overflow-auto p-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading tactic...</span>
        </div>
      </div>
    );
  }

  if (error || !tactic) {
    return (
      <div className="flex-1 overflow-auto p-6">
        <div className="mb-6">
          <Link href="/tactics">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Tactics
            </Button>
          </Link>
        </div>
        <Card>
          <CardContent className="p-12 text-center">
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Tactic Not Found
            </h3>
            <p className="text-muted-foreground mb-4">
              The tactic you're trying to edit doesn't exist or couldn't be loaded.
            </p>
            <Link href="/tactics">
              <Button>Return to Tactics</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <Link href="/tactics">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Tactics
          </Button>
        </Link>
      </div>

      {/* Page Title */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Settings className="w-8 h-8 text-primary" />
              Edit Tactic
            </h1>
            <p className="text-muted-foreground mt-1">
              Modify the configuration for "{tactic.name}"
            </p>
          </div>
          <div className="flex items-center gap-2">
            {tactic.isActive && (
              <Badge variant="default" className="flex items-center gap-1">
                <Trophy className="w-3 h-3" />
                Active Tactic
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Configuration */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Tactic Name</label>
                    <p className="text-lg font-semibold">{tactic.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Formation</label>
                    <p className="text-lg">{tactic.formation || "Custom Formation"}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                    <p className="text-lg">
                      {tactic.isActive ? (
                        <Badge variant="default">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Positions Configured</label>
                    <p className="text-lg font-semibold">{tactic.positions?.length || 0}</p>
                  </div>
                </div>
              </div>
              
              {tactic.instructions && (
                <>
                  <Separator className="my-4" />
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Instructions</label>
                    <p className="mt-1 text-sm leading-relaxed">{tactic.instructions}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Positions Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Position Configuration
                <Badge variant="outline">{tactic.positions?.length || 0} positions</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {tactic.positions && tactic.positions.length > 0 ? (
                <div className="space-y-4">
                  {tactic.positions.map((position: any, index: number) => (
                    <div key={position.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <Badge variant="secondary" className="font-mono text-xs">
                              {position.positionCode}
                            </Badge>
                            <span className="font-medium">{position.positionName}</span>
                            {position.positionSide && (
                              <Badge variant="outline" className="text-xs capitalize">
                                {position.positionSide}
                              </Badge>
                            )}
                          </div>
                          
                          {position.roleName && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span>Role: <span className="font-medium">{position.roleName}</span></span>
                              {position.duty && (
                                <span>• Duty: <span className="font-medium">{position.duty}</span></span>
                              )}
                            </div>
                          )}
                          
                          {position.attributes && position.attributes.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {position.attributes.slice(0, 6).map((attr: any, attrIndex: number) => (
                                <Badge key={attrIndex} variant="outline" className="text-xs">
                                  {attr.attributeName}
                                </Badge>
                              ))}
                              {position.attributes.length > 6 && (
                                <Badge variant="outline" className="text-xs">
                                  +{position.attributes.length - 6} more
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                        
                        <div className="text-right">
                          <div className="text-sm text-muted-foreground">
                            {position.attributes?.length || 0} attributes
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No positions configured yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Summary & Actions */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Formation</span>
                <span className="font-medium">{tactic.formation || "Custom"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Positions</span>
                <span className="font-medium">{tactic.positions?.length || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Attributes</span>
                <span className="font-medium">
                  {tactic.positions?.reduce((total: number, pos: any) => total + (pos.attributes?.length || 0), 0) || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge variant={tactic.isActive ? "default" : "secondary"}>
                  {tactic.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full" onClick={() => setIsEditing(true)}>
                <Edit className="w-4 h-4 mr-2" />
                Edit Configuration
              </Button>
              
              <Link href="/tactics" className="block">
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Tactics
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tactic Grid Creator for Editing */}
      <TacticGridCreator
        isOpen={isEditing}
        onClose={() => setIsEditing(false)}
        onSuccess={() => {
          setIsEditing(false);
          // Navigate back to tactics list with a slight delay for better UX
          setTimeout(() => setLocation("/tactics"), 100);
        }}
        editMode={true}
        tacticId={tacticId}
        initialData={tactic}
      />
    </div>
  );
}