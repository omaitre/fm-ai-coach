// Football Manager tactical configuration data

export const FORMATIONS = {
  '4-4-2': {
    name: '4-4-2',
    positions: ['GK', 'DR', 'DCR', 'DCL', 'DL', 'MR', 'MCR', 'MCL', 'ML', 'STC', 'STC']
  },
  '4-3-3': {
    name: '4-3-3', 
    positions: ['GK', 'DR', 'DCR', 'DCL', 'DL', 'MCR', 'MC', 'MCL', 'AML', 'STC', 'AMR']
  },
  '5-3-2': {
    name: '5-3-2',
    positions: ['GK', 'DR', 'DCR', 'DC', 'DCL', 'DL', 'MCR', 'MC', 'MCL', 'STC', 'STC']
  },
  '4-2-3-1': {
    name: '4-2-3-1',
    positions: ['GK', 'DR', 'DCR', 'DCL', 'DL', 'DMR', 'DML', 'AMR', 'AMC', 'AML', 'STC']
  },
  '3-5-2': {
    name: '3-5-2',
    positions: ['GK', 'DCR', 'DC', 'DCL', 'WBR', 'MCR', 'MC', 'MCL', 'WBL', 'STC', 'STC']
  }
} as const;

// Legacy tactical data - replaced by FM_POSITION_DATA in Phase 2
export const TACTICAL_DATA = {
  'GK': {
    'Goalkeeper': {
      duties: ['Defend']
    },
    'Sweeper Keeper': {
      duties: ['Defend', 'Support']
    }
  },
  'DR': {
    'Full Back': {
      duties: ['Defend', 'Support', 'Attack']
    },
    'Wing Back': {
      duties: ['Support', 'Attack']
    },
    'No Nonsense Full Back': {
      duties: ['Defend']
    },
    'Complete Wing Back': {
      duties: ['Support', 'Attack']
    }
  },
  'DL': {
    'Full Back': {
      duties: ['Defend', 'Support', 'Attack']
    },
    'Wing Back': {
      duties: ['Support', 'Attack']
    },
    'No Nonsense Full Back': {
      duties: ['Defend']
    },
    'Complete Wing Back': {
      duties: ['Support', 'Attack']
    }
  },
  'DCR': {
    'Central Defender': {
      duties: ['Defend', 'Support']
    },
    'Ball Playing Defender': {
      duties: ['Defend', 'Support']
    },
    'No Nonsense Centre Back': {
      duties: ['Defend']
    },
    'Libero': {
      duties: ['Support']
    }
  },
  'DCL': {
    'Central Defender': {
      duties: ['Defend', 'Support']
    },
    'Ball Playing Defender': {
      duties: ['Defend', 'Support']
    },
    'No Nonsense Centre Back': {
      duties: ['Defend']
    },
    'Libero': {
      duties: ['Support']
    }
  },
  'DC': {
    'Central Defender': {
      duties: ['Defend', 'Support']
    },
    'Ball Playing Defender': {
      duties: ['Defend', 'Support']
    },
    'No Nonsense Centre Back': {
      duties: ['Defend']
    },
    'Libero': {
      duties: ['Support']
    }
  },
  'WBR': {
    'Wing Back': {
      duties: ['Support', 'Attack']
    },
    'Complete Wing Back': {
      duties: ['Support', 'Attack']
    }
  },
  'WBL': {
    'Wing Back': {
      duties: ['Support', 'Attack']
    },
    'Complete Wing Back': {
      duties: ['Support', 'Attack']
    }
  },
  'DMR': {
    'Defensive Midfielder': {
      duties: ['Defend', 'Support']
    },
    'Ball Winning Midfielder': {
      duties: ['Defend', 'Support']
    },
    'Deep Lying Playmaker': {
      duties: ['Defend', 'Support']
    },
    'Anchor Man': {
      duties: ['Defend']
    }
  },
  'DML': {
    'Defensive Midfielder': {
      duties: ['Defend', 'Support']
    },
    'Ball Winning Midfielder': {
      duties: ['Defend', 'Support']
    },
    'Deep Lying Playmaker': {
      duties: ['Defend', 'Support']
    },
    'Anchor Man': {
      duties: ['Defend']
    }
  },
  'MR': {
    'Wide Midfielder': {
      duties: ['Defend', 'Support', 'Attack']
    },
    'Winger': {
      duties: ['Support', 'Attack']
    },
    'Wide Playmaker': {
      duties: ['Support', 'Attack']
    }
  },
  'ML': {
    'Wide Midfielder': {
      duties: ['Defend', 'Support', 'Attack']
    },
    'Winger': {
      duties: ['Support', 'Attack']
    },
    'Wide Playmaker': {
      duties: ['Support', 'Attack']
    }
  },
  'MCR': {
    'Central Midfielder': {
      duties: ['Defend', 'Support', 'Attack']
    },
    'Box to Box Midfielder': {
      duties: ['Support']
    },
    'Deep Lying Playmaker': {
      duties: ['Defend', 'Support']
    },
    'Advanced Playmaker': {
      duties: ['Support', 'Attack']
    },
    'Ball Winning Midfielder': {
      duties: ['Defend', 'Support']
    }
  },
  'MCL': {
    'Central Midfielder': {
      duties: ['Defend', 'Support', 'Attack']
    },
    'Box to Box Midfielder': {
      duties: ['Support']
    },
    'Deep Lying Playmaker': {
      duties: ['Defend', 'Support']
    },
    'Advanced Playmaker': {
      duties: ['Support', 'Attack']
    },
    'Ball Winning Midfielder': {
      duties: ['Defend', 'Support']
    }
  },
  'MC': {
    'Central Midfielder': {
      duties: ['Defend', 'Support', 'Attack']
    },
    'Box to Box Midfielder': {
      duties: ['Support']
    },
    'Deep Lying Playmaker': {
      duties: ['Defend', 'Support']
    },
    'Advanced Playmaker': {
      duties: ['Support', 'Attack']
    },
    'Ball Winning Midfielder': {
      duties: ['Defend', 'Support']
    }
  },
  'AMR': {
    'Attacking Midfielder': {
      duties: ['Support', 'Attack']
    },
    'Winger': {
      duties: ['Support', 'Attack']
    },
    'Inside Forward': {
      duties: ['Support', 'Attack']
    },
    'Wide Playmaker': {
      duties: ['Support', 'Attack']
    }
  },
  'AML': {
    'Attacking Midfielder': {
      duties: ['Support', 'Attack']
    },
    'Winger': {
      duties: ['Support', 'Attack']
    },
    'Inside Forward': {
      duties: ['Support', 'Attack']
    },
    'Wide Playmaker': {
      duties: ['Support', 'Attack']
    }
  },
  'AMC': {
    'Attacking Midfielder': {
      duties: ['Support', 'Attack']
    },
    'Advanced Playmaker': {
      duties: ['Support', 'Attack']
    },
    'Enganche': {
      duties: ['Support']
    },
    'False Nine': {
      duties: ['Support']
    }
  },
  'STC': {
    'Advanced Forward': {
      duties: ['Attack']
    },
    'Deep Lying Forward': {
      duties: ['Attack', 'Support']
    },
    'Target Man': {
      duties: ['Attack', 'Support']
    },
    'Complete Forward': {
      duties: ['Support', 'Attack']
    },
    'Pressing Forward': {
      duties: ['Defend', 'Support', 'Attack']
    },
    'False Nine': {
      duties: ['Support']
    },
    'Poacher': {
      duties: ['Attack']
    }
  }
} as const;

// Separate attribute lists for GK vs outfield
export const GOALKEEPER_ATTRIBUTES = {
  technical: ['First Touch', 'Kicking', 'Passing', 'Throwing'],
  mental: ['Aggression', 'Anticipation', 'Bravery', 'Composure', 'Concentration', 'Decisions', 'Determination', 'Leadership', 'Positioning', 'Teamwork', 'Vision', 'Work Rate'],
  physical: ['Acceleration', 'Agility', 'Balance', 'Jumping Reach', 'Natural Fitness', 'Pace', 'Stamina', 'Strength'],
  goalkeeping: ['Aerial Reach', 'Command of Area', 'Communication', 'Eccentricity', 'Handling', 'One on Ones', 'Reflexes', 'Rushing Out', 'Tendency to Punch']
} as const;

export const OUTFIELD_ATTRIBUTES = {
  technical: ['Corners', 'Crossing', 'Dribbling', 'Finishing', 'First Touch', 'Free Kick Taking', 'Heading', 'Long Shots', 'Long Throws', 'Marking', 'Passing', 'Penalty Taking', 'Tackling', 'Technique'],
  mental: ['Aggression', 'Anticipation', 'Bravery', 'Composure', 'Concentration', 'Decisions', 'Determination', 'Flair', 'Leadership', 'Off the Ball', 'Positioning', 'Teamwork', 'Vision', 'Work Rate'],
  physical: ['Acceleration', 'Agility', 'Balance', 'Jumping Reach', 'Natural Fitness', 'Pace', 'Stamina', 'Strength']
} as const;

// Enhanced functions using authentic FM data
import { 
  getPositionRoles as getFMPositionRoles, 
  getRoleDuties as getFMRoleDuties,
  getRoleName as getFMRoleName,
  FM_POSITION_DATA,
  isValidPositionCode,
  isValidRoleForPosition,
  isValidDutyForRole
} from "./fm-position-data";

export function getPositionRoles(positionCode: string): string[] {
  return getFMPositionRoles(positionCode);
}

export function getRoleDuties(positionCode: string, roleCode: string): string[] {
  return getFMRoleDuties(positionCode, roleCode);
}

export function getRoleName(positionCode: string, roleCode: string): string {
  return getFMRoleName(positionCode, roleCode);
}

// Get all position codes for UI components
export function getAllPositionCodes(): string[] {
  return Object.keys(FM_POSITION_DATA);
}

// Get formatted position display name
export function getPositionDisplayName(positionCode: string): string {
  const position = FM_POSITION_DATA[positionCode];
  return position ? position.name : positionCode;
}

// Validation functions for UI
export { isValidPositionCode, isValidRoleForPosition, isValidDutyForRole };

export function isGoalkeeperPosition(positionCode: string): boolean {
  return positionCode === 'GK';
}

export function getAvailableAttributes(positionCode: string) {
  return isGoalkeeperPosition(positionCode) ? GOALKEEPER_ATTRIBUTES : OUTFIELD_ATTRIBUTES;
}

export type FormationKey = keyof typeof FORMATIONS;
export type PositionCode = keyof typeof TACTICAL_DATA;
export type AttributeCategory = 'technical' | 'mental' | 'physical' | 'goalkeeping';