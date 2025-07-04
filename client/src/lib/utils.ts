import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

export function formatDateTime(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function calculateAge(birthDate: string | Date): number {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
}

export function getAttributeColor(value: number): string {
  if (value >= 15) return "text-green-500"; // Excellent
  if (value >= 12) return "text-yellow-500"; // Good
  if (value >= 8) return "text-orange-500"; // Average
  return "text-red-500"; // Poor
}

export function getAttributeColorClass(value: number): string {
  if (value >= 15) return "attribute-excellent";
  if (value >= 12) return "attribute-good";
  if (value >= 8) return "attribute-average";
  return "attribute-poor";
}

export function formatAbilityStars(value: number): number {
  // Convert ability value (1-200) to 5-star scale
  return Math.min(5, Math.max(0, Math.floor(value / 40)));
}

export function validateAttributeValue(value: string): boolean {
  const num = parseInt(value);
  return !isNaN(num) && num >= 1 && num <= 20;
}

export function validateAbilityValue(value: string): boolean {
  const num = parseInt(value);
  return !isNaN(num) && num >= 1 && num <= 200;
}

export function formatPlayerPosition(positions: string[]): string {
  if (positions.length === 0) return "Unknown";
  if (positions.length === 1) return positions[0];
  if (positions.length <= 3) return positions.join("/");
  return `${positions.slice(0, 2).join("/")}+${positions.length - 2}`;
}

export function calculatePositionSuitability(
  playerAttributes: Record<string, number>,
  requiredAttributes: string[]
): number {
  if (requiredAttributes.length === 0) return 0;
  
  let totalScore = 0;
  let validAttributes = 0;
  
  for (const attr of requiredAttributes) {
    const value = playerAttributes[attr.toLowerCase()];
    if (value !== undefined) {
      totalScore += value;
      validAttributes++;
    }
  }
  
  return validAttributes > 0 ? totalScore / validAttributes : 0;
}

export function sortPlayersByAttribute(
  players: any[],
  attributeName: string,
  direction: 'asc' | 'desc' = 'desc'
): any[] {
  return [...players].sort((a, b) => {
    const aValue = a.attributes?.find((attr: any) => 
      attr.attributeName.toLowerCase() === attributeName.toLowerCase()
    )?.attributeValue || 0;
    
    const bValue = b.attributes?.find((attr: any) => 
      attr.attributeName.toLowerCase() === attributeName.toLowerCase()
    )?.attributeValue || 0;
    
    return direction === 'desc' ? bValue - aValue : aValue - bValue;
  });
}

export function filterPlayersByPosition(
  players: any[],
  positionFilter: string
): any[] {
  if (positionFilter === 'all') return players;
  
  // This would be enhanced with actual position data from the database
  // For now, return all players as position mapping needs to be implemented
  return players;
}

export function filterPlayersByAge(
  players: any[],
  ageFilter: string
): any[] {
  if (ageFilter === 'all') return players;
  
  return players.filter(player => {
    const age = player.age || 0;
    switch (ageFilter) {
      case 'under21': return age < 21;
      case '21-25': return age >= 21 && age <= 25;
      case '26-30': return age >= 26 && age <= 30;
      case 'over30': return age > 30;
      default: return true;
    }
  });
}

export function getPlayerAttributesByCategory(
  attributes: any[]
): { technical: any[]; mental: any[]; physical: any[] } {
  return {
    technical: attributes.filter(attr => attr.attributeCategory === 'technical'),
    mental: attributes.filter(attr => attr.attributeCategory === 'mental'),
    physical: attributes.filter(attr => attr.attributeCategory === 'physical'),
  };
}

export function calculateSquadDepth(players: any[], positionId: number): {
  excellent: number;
  good: number;
  average: number;
  poor: number;
} {
  const scores = players.map(player => 
    player.positionScores?.find((score: any) => score.positionId === positionId)?.score || 0
  );
  
  return {
    excellent: scores.filter(score => score >= 15).length,
    good: scores.filter(score => score >= 12 && score < 15).length,
    average: scores.filter(score => score >= 8 && score < 12).length,
    poor: scores.filter(score => score < 8).length,
  };
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

export function compareAttributes(
  player1Attributes: Record<string, number>,
  player2Attributes: Record<string, number>,
  attributeName: string
): 'better' | 'worse' | 'equal' {
  const value1 = player1Attributes[attributeName.toLowerCase()] || 0;
  const value2 = player2Attributes[attributeName.toLowerCase()] || 0;
  
  if (value1 > value2) return 'better';
  if (value1 < value2) return 'worse';
  return 'equal';
}
