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
  private positionRequirements: Map<string, PositionRequirements> = new Map();
  
  constructor() {
    this.initializePositionRequirements();
  }

  private initializePositionRequirements() {
    // Football Manager position requirements based on authentic tactical knowledge
    const requirements: Record<string, PositionRequirements> = {
      // Goalkeeper
      "GK-GK-defend": {
        key_attributes: ["Handling", "Reflexes", "One on Ones"],
        preferred_attributes: ["Kicking", "Command of Area", "Communication", "Aerial Reach"]
      },
      "GK-SK-defend": {
        key_attributes: ["Handling", "Reflexes", "Kicking"],
        preferred_attributes: ["Passing", "First Touch", "One on Ones", "Rushing Out"]
      },
      "GK-SK-support": {
        key_attributes: ["Handling", "Kicking", "Passing"],
        preferred_attributes: ["First Touch", "Reflexes", "Vision", "Rushing Out"]
      },

      // Full Backs
      "DL-FB-defend": {
        key_attributes: ["Marking", "Tackling", "Positioning"],
        preferred_attributes: ["Pace", "Stamina", "Concentration", "Strength"]
      },
      "DL-FB-support": {
        key_attributes: ["Crossing", "Pace", "Stamina"],
        preferred_attributes: ["Marking", "Tackling", "Dribbling", "Work Rate"]
      },
      "DL-FB-attack": {
        key_attributes: ["Crossing", "Pace", "Dribbling"],
        preferred_attributes: ["Stamina", "Work Rate", "Technique", "Off the Ball"]
      },
      "DR-FB-defend": {
        key_attributes: ["Marking", "Tackling", "Positioning"],
        preferred_attributes: ["Pace", "Stamina", "Concentration", "Strength"]
      },
      "DR-FB-support": {
        key_attributes: ["Crossing", "Pace", "Stamina"],
        preferred_attributes: ["Marking", "Tackling", "Dribbling", "Work Rate"]
      },
      "DR-FB-attack": {
        key_attributes: ["Crossing", "Pace", "Dribbling"],
        preferred_attributes: ["Stamina", "Work Rate", "Technique", "Off the Ball"]
      },

      // Wing Backs
      "DL-WB-defend": {
        key_attributes: ["Crossing", "Stamina", "Marking"],
        preferred_attributes: ["Pace", "Tackling", "Work Rate", "Dribbling"]
      },
      "DL-WB-support": {
        key_attributes: ["Crossing", "Stamina", "Pace"],
        preferred_attributes: ["Dribbling", "Work Rate", "Marking", "Technique"]
      },
      "DL-WB-attack": {
        key_attributes: ["Crossing", "Pace", "Dribbling"],
        preferred_attributes: ["Stamina", "Work Rate", "Technique", "Off the Ball"]
      },
      "DR-WB-defend": {
        key_attributes: ["Crossing", "Stamina", "Marking"],
        preferred_attributes: ["Pace", "Tackling", "Work Rate", "Dribbling"]
      },
      "DR-WB-support": {
        key_attributes: ["Crossing", "Stamina", "Pace"],
        preferred_attributes: ["Dribbling", "Work Rate", "Marking", "Technique"]
      },
      "DR-WB-attack": {
        key_attributes: ["Crossing", "Pace", "Dribbling"],
        preferred_attributes: ["Stamina", "Work Rate", "Technique", "Off the Ball"]
      },

      // Center Backs
      "DC-CD-defend": {
        key_attributes: ["Marking", "Heading", "Positioning"],
        preferred_attributes: ["Tackling", "Jumping Reach", "Concentration", "Strength"]
      },
      "DC-BPD-defend": {
        key_attributes: ["Passing", "Marking", "Positioning"],
        preferred_attributes: ["Vision", "Technique", "Composure", "Heading"]
      },
      "DC-BPD-support": {
        key_attributes: ["Passing", "Vision", "Positioning"],
        preferred_attributes: ["Technique", "Composure", "Marking", "First Touch"]
      },

      // Defensive Midfield
      "DM-DM-defend": {
        key_attributes: ["Tackling", "Work Rate", "Positioning"],
        preferred_attributes: ["Marking", "Stamina", "Passing", "Concentration"]
      },
      "DM-DM-support": {
        key_attributes: ["Passing", "Work Rate", "Positioning"],
        preferred_attributes: ["Tackling", "Vision", "Stamina", "Technique"]
      },
      "DM-BWM-defend": {
        key_attributes: ["Tackling", "Aggression", "Work Rate"],
        preferred_attributes: ["Stamina", "Marking", "Bravery", "Strength"]
      },
      "DM-BWM-support": {
        key_attributes: ["Tackling", "Work Rate", "Passing"],
        preferred_attributes: ["Stamina", "Aggression", "Vision", "Marking"]
      },
      "DM-DLP-defend": {
        key_attributes: ["Passing", "Vision", "Positioning"],
        preferred_attributes: ["Technique", "Composure", "Work Rate", "Concentration"]
      },
      "DM-DLP-support": {
        key_attributes: ["Passing", "Vision", "Technique"],
        preferred_attributes: ["Composure", "First Touch", "Long Shots", "Work Rate"]
      },

      // Central Midfield
      "MC-CM-defend": {
        key_attributes: ["Passing", "Work Rate", "Tackling"],
        preferred_attributes: ["Stamina", "Positioning", "Marking", "Decisions"]
      },
      "MC-CM-support": {
        key_attributes: ["Passing", "Vision", "Work Rate"],
        preferred_attributes: ["Technique", "Decisions", "Stamina", "First Touch"]
      },
      "MC-CM-attack": {
        key_attributes: ["Passing", "Long Shots", "Off the Ball"],
        preferred_attributes: ["Vision", "Technique", "Finishing", "Work Rate"]
      },
      "MC-BBM-support": {
        key_attributes: ["Passing", "Stamina", "Work Rate"],
        preferred_attributes: ["Technique", "Off the Ball", "Tackling", "Long Shots"]
      },
      "MC-AP-support": {
        key_attributes: ["Passing", "Vision", "Technique"],
        preferred_attributes: ["Composure", "First Touch", "Long Shots", "Decisions"]
      },
      "MC-AP-attack": {
        key_attributes: ["Passing", "Vision", "Long Shots"],
        preferred_attributes: ["Technique", "Off the Ball", "Composure", "Finishing"]
      },

      // Wide Midfield
      "ML-W-support": {
        key_attributes: ["Crossing", "Dribbling", "Pace"],
        preferred_attributes: ["Work Rate", "Stamina", "Technique", "Acceleration"]
      },
      "ML-W-attack": {
        key_attributes: ["Crossing", "Dribbling", "Pace"],
        preferred_attributes: ["Finishing", "Technique", "Acceleration", "Off the Ball"]
      },
      "MR-W-support": {
        key_attributes: ["Crossing", "Dribbling", "Pace"],
        preferred_attributes: ["Work Rate", "Stamina", "Technique", "Acceleration"]
      },
      "MR-W-attack": {
        key_attributes: ["Crossing", "Dribbling", "Pace"],
        preferred_attributes: ["Finishing", "Technique", "Acceleration", "Off the Ball"]
      },
      "ML-WM-defend": {
        key_attributes: ["Crossing", "Work Rate", "Stamina"],
        preferred_attributes: ["Tackling", "Marking", "Pace", "Dribbling"]
      },
      "ML-WM-support": {
        key_attributes: ["Crossing", "Work Rate", "Stamina"],
        preferred_attributes: ["Dribbling", "Pace", "Passing", "Tackling"]
      },
      "ML-WM-attack": {
        key_attributes: ["Crossing", "Dribbling", "Pace"],
        preferred_attributes: ["Work Rate", "Stamina", "Off the Ball", "Technique"]
      },
      "MR-WM-defend": {
        key_attributes: ["Crossing", "Work Rate", "Stamina"],
        preferred_attributes: ["Tackling", "Marking", "Pace", "Dribbling"]
      },
      "MR-WM-support": {
        key_attributes: ["Crossing", "Work Rate", "Stamina"],
        preferred_attributes: ["Dribbling", "Pace", "Passing", "Tackling"]
      },
      "MR-WM-attack": {
        key_attributes: ["Crossing", "Dribbling", "Pace"],
        preferred_attributes: ["Work Rate", "Stamina", "Off the Ball", "Technique"]
      },

      // Attacking Midfield
      "AMC-AM-support": {
        key_attributes: ["Passing", "Vision", "Technique"],
        preferred_attributes: ["Long Shots", "Off the Ball", "Composure", "First Touch"]
      },
      "AMC-AM-attack": {
        key_attributes: ["Off the Ball", "Long Shots", "Passing"],
        preferred_attributes: ["Finishing", "Vision", "Technique", "Composure"]
      },
      "AMC-AP-support": {
        key_attributes: ["Passing", "Vision", "Technique"],
        preferred_attributes: ["Composure", "First Touch", "Long Shots", "Decisions"]
      },
      "AMC-AP-attack": {
        key_attributes: ["Passing", "Vision", "Long Shots"],
        preferred_attributes: ["Technique", "Off the Ball", "Composure", "Finishing"]
      },
      "AML-W-support": {
        key_attributes: ["Crossing", "Dribbling", "Pace"],
        preferred_attributes: ["Work Rate", "Stamina", "Technique", "Acceleration"]
      },
      "AML-W-attack": {
        key_attributes: ["Crossing", "Dribbling", "Pace"],
        preferred_attributes: ["Finishing", "Technique", "Acceleration", "Off the Ball"]
      },
      "AMR-W-support": {
        key_attributes: ["Crossing", "Dribbling", "Pace"],
        preferred_attributes: ["Work Rate", "Stamina", "Technique", "Acceleration"]
      },
      "AMR-W-attack": {
        key_attributes: ["Crossing", "Dribbling", "Pace"],
        preferred_attributes: ["Finishing", "Technique", "Acceleration", "Off the Ball"]
      },
      "AML-IF-support": {
        key_attributes: ["Dribbling", "Pace", "Technique"],
        preferred_attributes: ["Finishing", "Long Shots", "Off the Ball", "Acceleration"]
      },
      "AML-IF-attack": {
        key_attributes: ["Finishing", "Dribbling", "Pace"],
        preferred_attributes: ["Off the Ball", "Long Shots", "Technique", "Composure"]
      },
      "AMR-IF-support": {
        key_attributes: ["Dribbling", "Pace", "Technique"],
        preferred_attributes: ["Finishing", "Long Shots", "Off the Ball", "Acceleration"]
      },
      "AMR-IF-attack": {
        key_attributes: ["Finishing", "Dribbling", "Pace"],
        preferred_attributes: ["Off the Ball", "Long Shots", "Technique", "Composure"]
      },

      // Strikers
      "ST-AF-attack": {
        key_attributes: ["Finishing", "Off the Ball", "Composure"],
        preferred_attributes: ["Pace", "Acceleration", "Dribbling", "First Touch"]
      },
      "ST-DLF-support": {
        key_attributes: ["Passing", "Off the Ball", "First Touch"],
        preferred_attributes: ["Vision", "Technique", "Finishing", "Work Rate"]
      },
      "ST-DLF-attack": {
        key_attributes: ["Finishing", "Off the Ball", "First Touch"],
        preferred_attributes: ["Passing", "Technique", "Composure", "Vision"]
      },
      "ST-CF-support": {
        key_attributes: ["Passing", "Technique", "Off the Ball"],
        preferred_attributes: ["Vision", "First Touch", "Work Rate", "Finishing"]
      },
      "ST-CF-attack": {
        key_attributes: ["Finishing", "Off the Ball", "Technique"],
        preferred_attributes: ["Composure", "First Touch", "Pace", "Dribbling"]
      },
      "ST-TM-support": {
        key_attributes: ["Heading", "Strength", "Jumping Reach"],
        preferred_attributes: ["Passing", "Hold Up Ball", "Work Rate", "Positioning"]
      },
      "ST-TM-attack": {
        key_attributes: ["Finishing", "Heading", "Strength"],
        preferred_attributes: ["Jumping Reach", "Composure", "Off the Ball", "Hold Up Ball"]
      },
      "ST-P-attack": {
        key_attributes: ["Finishing", "Off the Ball", "Positioning"],
        preferred_attributes: ["Composure", "Anticipation", "Acceleration", "First Touch"]
      },
      "ST-F9-support": {
        key_attributes: ["Passing", "Vision", "Technique"],
        preferred_attributes: ["Off the Ball", "Dribbling", "First Touch", "Long Shots"]
      },
      "ST-PF-defend": {
        key_attributes: ["Work Rate", "Tackling", "Stamina"],
        preferred_attributes: ["Finishing", "Off the Ball", "Pressing", "Aggression"]
      },
      "ST-PF-support": {
        key_attributes: ["Work Rate", "Off the Ball", "Finishing"],
        preferred_attributes: ["Stamina", "Pressing", "Technique", "Passing"]
      },
      "ST-PF-attack": {
        key_attributes: ["Finishing", "Off the Ball", "Work Rate"],
        preferred_attributes: ["Pace", "Acceleration", "Pressing", "Composure"]
      }
    };

    // Initialize the position requirements map
    for (const [key, value] of Object.entries(requirements)) {
      this.positionRequirements.set(key, value);
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
    // Create lookup key in format "POSITION-ROLE-DUTY"
    const lookupKey = `${positionCode}-${role}-${duty}`;
    return this.positionRequirements.get(lookupKey) || null;
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