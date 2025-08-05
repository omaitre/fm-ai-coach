import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);  
const __dirname = dirname(__filename);

export interface PlayerAttributes {
  [key: string]: number;
}

export interface Player {
  id: number;
  name: string;
  age: number;
  attributes: PlayerAttributes;
}

export interface PositionRequirements {
  key_attributes: string[];
  preferred_attributes: string[];
}

export interface PlayerPositionScore {
  playerId: number;
  playerName: string;
  score: number; // 0-100
  keyAttributeScore: number;
  preferredAttributeScore: number;
  missingKeyAttributes: { attribute: string; current: number; recommended: number }[];
  missingPreferredAttributes: { attribute: string; current: number; recommended: number }[];
}

export interface AnalysisResult {
  positionCode: string;
  role: string;
  duty: string;
  playerScores: PlayerPositionScore[];
  averageScore: number;
  coverageLevel: 'excellent' | 'good' | 'adequate' | 'poor' | 'critical';
}

export class PositionAnalyzer {
  private positionData: Map<string, any> = new Map();
  
  constructor() {
    this.loadPositionData();
  }

  private loadPositionData() {
    // Load all position data files
    const positionFiles = [
      'gk_position_data_1750867479844.json',
      'st_position_data_1750867479841.json',
      'amc_position_data_1750867479843.json',
      'aml_position_data_1750867479842.json',
      'amr_position_data_1750867479842.json',
      'cd_position_data_1750867479844.json',
      'dl_position_data_1750867479844.json',
      'dm_position_data_1750867479843.json',
      'dr_position_data_1750867479844.json',
      'mc_position_data_1750867479843.json',
      'ml_position_data_1750867479843.json',
      'mr_position_data_1750867479843.json'
    ];

    for (const file of positionFiles) {
      try {
        const filePath = join(__dirname, '..', '..', 'attached_assets', file);
        const data = JSON.parse(readFileSync(filePath, 'utf-8'));
        
        // Extract position code from filename
        const positionCode = file.split('_')[0].toUpperCase();
        this.positionData.set(positionCode, data);
      } catch (error) {
        console.warn(`Failed to load position data file ${file}:`, error);
      }
    }
  }

  public analyzePosition(
    positionCode: string, 
    role: string, 
    duty: string, 
    players: Player[]
  ): AnalysisResult {
    const requirements = this.getPositionRequirements(positionCode, role, duty);
    if (!requirements) {
      throw new Error(`No requirements found for ${positionCode} ${role} ${duty}`);
    }

    const playerScores = players.map(player => 
      this.calculatePlayerScore(player, requirements)
    ).sort((a, b) => b.score - a.score);

    const averageScore = playerScores.length > 0 
      ? playerScores.reduce((sum, p) => sum + p.score, 0) / playerScores.length 
      : 0;

    const coverageLevel = this.determineCoverageLevel(playerScores);

    return {
      positionCode,
      role,
      duty,
      playerScores: playerScores.slice(0, 5), // Top 5 players
      averageScore,
      coverageLevel
    };
  }

  private getPositionRequirements(
    positionCode: string, 
    role: string, 
    duty: string
  ): PositionRequirements | null {
    const data = this.positionData.get(positionCode);
    if (!data?.positions) return null;

    const position = Object.values(data.positions)[0] as any;
    if (!position?.roles) return null;

    const roleData = position.roles[role];
    if (!roleData?.duties) return null;

    const dutyData = roleData.duties[duty];
    if (!dutyData) return null;

    return {
      key_attributes: dutyData.key_attributes || [],
      preferred_attributes: dutyData.preferred_attributes || []
    };
  }

  private calculatePlayerScore(
    player: Player, 
    requirements: PositionRequirements
  ): PlayerPositionScore {
    const keyAttrWeight = 2.0;
    const preferredAttrWeight = 1.0;
    const minRecommendedValue = 12; // Minimum recommended attribute value

    let keyAttributeScore = 0;
    let keyAttributeMax = 0;
    let preferredAttributeScore = 0; 
    let preferredAttributeMax = 0;

    const missingKeyAttributes: { attribute: string; current: number; recommended: number }[] = [];
    const missingPreferredAttributes: { attribute: string; current: number; recommended: number }[] = [];

    // Calculate key attributes score
    for (const attr of requirements.key_attributes) {
      const value = player.attributes[attr] || 0;
      keyAttributeScore += value * keyAttrWeight;
      keyAttributeMax += 20 * keyAttrWeight; // FM attributes max at 20
      
      if (value < minRecommendedValue) {
        missingKeyAttributes.push({
          attribute: attr,
          current: value,
          recommended: minRecommendedValue
        });
      }
    }

    // Calculate preferred attributes score
    for (const attr of requirements.preferred_attributes) {
      const value = player.attributes[attr] || 0;
      preferredAttributeScore += value * preferredAttrWeight;
      preferredAttributeMax += 20 * preferredAttrWeight; // FM attributes max at 20
      
      if (value < minRecommendedValue) {
        missingPreferredAttributes.push({
          attribute: attr,
          current: value,
          recommended: minRecommendedValue
        });
      }
    }

    // Calculate overall score (0-100)
    const totalScore = keyAttributeScore + preferredAttributeScore;
    const totalMax = keyAttributeMax + preferredAttributeMax;
    const score = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0;

    return {
      playerId: player.id,
      playerName: player.name,
      score,
      keyAttributeScore: keyAttributeMax > 0 ? Math.round((keyAttributeScore / keyAttributeMax) * 100) : 0,
      preferredAttributeScore: preferredAttributeMax > 0 ? Math.round((preferredAttributeScore / preferredAttributeMax) * 100) : 0,
      missingKeyAttributes,
      missingPreferredAttributes
    };
  }

  private determineCoverageLevel(scores: PlayerPositionScore[]): 'excellent' | 'good' | 'adequate' | 'poor' | 'critical' {
    if (scores.length === 0) return 'critical';
    
    const topScore = scores[0].score;
    const hasBackup = scores.length > 1 && scores[1].score >= 60;
    
    if (topScore >= 80 && hasBackup) return 'excellent';
    if (topScore >= 70 && hasBackup) return 'good';
    if (topScore >= 60) return 'adequate';
    if (topScore >= 40) return 'poor';
    return 'critical';
  }

  public generateRecruitmentTargets(
    positionCode: string,
    role: string, 
    duty: string,
    currentPlayers: Player[]
  ): { position: string; targets: string[] } {
    const analysis = this.analyzePosition(positionCode, role, duty, currentPlayers);
    const targets: string[] = [];

    if (analysis.coverageLevel === 'critical' || analysis.coverageLevel === 'poor') {
      const requirements = this.getPositionRequirements(positionCode, role, duty);
      if (requirements) {
        // Suggest key attributes that are most needed
        const keyTargets = requirements.key_attributes.slice(0, 3).map(attr => `${attr} 14+`);
        const preferredTargets = requirements.preferred_attributes.slice(0, 2).map(attr => `${attr} 12+`);
        
        targets.push(`Priority: ${keyTargets.join(', ')}`);
        if (preferredTargets.length > 0) {
          targets.push(`Preferred: ${preferredTargets.join(', ')}`);
        }
      }
    }

    return {
      position: `${positionCode} - ${role} (${duty})`,
      targets
    };
  }
}