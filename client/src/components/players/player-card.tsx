import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User } from "lucide-react";
import { TECHNICAL_ATTRIBUTES, MENTAL_ATTRIBUTES, PHYSICAL_ATTRIBUTES } from "@/lib/constants";

interface Player {
  id: number;
  name: string;
  age?: number;
  latestSnapshot?: {
    id: number;
    currentAbility?: number;
    potentialAbility?: number;
    snapshotDate: string;
  };
  attributes?: Array<{
    attributeName: string;
    attributeValue: number;
    attributeCategory: string;
  }>;
}

interface PlayerCardProps {
  player: Player;
  selectedPositionId?: number;
  onClick?: () => void;
}

function getAttributeColor(value: number): string {
  if (value >= 15) return "attribute-excellent";
  if (value >= 12) return "attribute-good";
  if (value >= 8) return "attribute-average";
  return "attribute-poor";
}

function renderAbilityStars(value: number, isPotential = false): JSX.Element[] {
  const stars = Math.floor(value / 40); // Convert to 5-star scale
  const elements = [];
  
  for (let i = 0; i < 5; i++) {
    elements.push(
      <div
        key={i}
        className={`ability-star ${
          i < stars 
            ? isPotential ? "potential" : "filled"
            : "empty"
        }`}
      />
    );
  }
  
  return elements;
}

function getKeyAttributes(attributes: Player['attributes']): { name: string; value: number }[] {
  if (!attributes || attributes.length === 0) return [];
  
  // Get a mix of key attributes from different categories
  const keyAttributeNames = [
    "Passing", "Vision", "Technique", "Finishing", 
    "Crossing", "Dribbling", "Pace", "Acceleration",
    "Marking", "Tackling", "Heading", "Decisions"
  ];
  
  const attributeMap = new Map(
    attributes.map(attr => [attr.attributeName.toLowerCase(), attr.attributeValue])
  );
  
  return keyAttributeNames
    .map(name => ({
      name,
      value: attributeMap.get(name.toLowerCase()) || 0
    }))
    .filter(attr => attr.value > 0)
    .slice(0, 4); // Show top 4 key attributes
}

export default function PlayerCard({ player, selectedPositionId, onClick }: PlayerCardProps) {
  const keyAttributes = getKeyAttributes(player.attributes);
  const currentAbility = player.latestSnapshot?.currentAbility || 0;
  const potentialAbility = player.latestSnapshot?.potentialAbility || 0;
  
  // Calculate a simple position score (would be replaced with actual position analysis)
  const averageKeyAttributes = keyAttributes.length > 0 
    ? keyAttributes.reduce((sum, attr) => sum + attr.value, 0) / keyAttributes.length
    : 0;

  return (
    <Card className="fm-player-card" onClick={onClick}>
      <CardContent className="p-6">
        {/* Player Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
              <User className="text-muted-foreground text-lg" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{player.name}</h3>
              <p className="text-sm text-muted-foreground">
                {/* This would be derived from position analysis */}
                Multiple positions
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Age</p>
            <p className="font-semibold text-foreground">{player.age || "N/A"}</p>
          </div>
        </div>

        {/* Ability Ratings */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-muted rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">Current Ability</p>
            <div className="flex items-center space-x-2">
              <div className="flex space-x-1">
                {renderAbilityStars(currentAbility)}
              </div>
              <span className="text-sm font-medium text-foreground">
                {currentAbility || "N/A"}
              </span>
            </div>
          </div>
          <div className="bg-muted rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">Potential Ability</p>
            <div className="flex items-center space-x-2">
              <div className="flex space-x-1">
                {renderAbilityStars(potentialAbility, true)}
              </div>
              <span className="text-sm font-medium text-foreground">
                {potentialAbility || "N/A"}
              </span>
            </div>
          </div>
        </div>

        {/* Key Attributes */}
        <div className="mb-4">
          <h4 className="text-xs font-medium text-muted-foreground mb-3">KEY ATTRIBUTES</h4>
          <div className="grid grid-cols-2 gap-2">
            {keyAttributes.length > 0 ? (
              keyAttributes.map((attr, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">{attr.name}</span>
                  <span className={`text-sm font-medium ${getAttributeColor(attr.value)}`}>
                    {attr.value}
                  </span>
                </div>
              ))
            ) : (
              <div className="col-span-2 text-center text-xs text-muted-foreground py-2">
                No attribute data available
              </div>
            )}
          </div>
        </div>

        {/* Position Suitability */}
        <div className="border-t border-border pt-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Position Suitability</span>
            <span className={`text-sm font-semibold ${getAttributeColor(averageKeyAttributes)}`}>
              {averageKeyAttributes > 0 ? `${averageKeyAttributes.toFixed(1)}/20` : "N/A"}
            </span>
          </div>
          {averageKeyAttributes > 0 && (
            <div className="w-full bg-muted rounded-full h-2 mt-2">
              <div 
                className={`h-2 rounded-full ${
                  averageKeyAttributes >= 15 ? "bg-green-500" :
                  averageKeyAttributes >= 12 ? "bg-yellow-500" :
                  averageKeyAttributes >= 8 ? "bg-orange-500" : "bg-red-500"
                }`}
                style={{ width: `${(averageKeyAttributes / 20) * 100}%` }}
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
