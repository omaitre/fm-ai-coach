import { db } from "../sqlite-db.js";
import { 
  tactics, 
  positions,
  type InsertTactic,
  type InsertPosition,
  type Tactic,
  type Position
} from "../../shared/sqlite-schema.js";
import { eq, and } from "drizzle-orm";

export interface FormationTemplate {
  formation: string;
  name: string;
  positions: Array<{
    positionCode: string;
    role: string;
    duty: string;
    defaultRole?: string;
    defaultDuty?: string;
  }>;
}

export interface TacticWithPositions extends Tactic {
  positions: Position[];
}

export class TacticService {
  
  // Predefined formation templates
  private formationTemplates: FormationTemplate[] = [
    {
      formation: "4-4-2",
      name: "4-4-2 Classic",
      positions: [
        { positionCode: "GK", role: "GK", duty: "defend" },
        { positionCode: "DL", role: "FB", duty: "defend", defaultRole: "FB", defaultDuty: "support" },
        { positionCode: "DC", role: "CD", duty: "defend" },
        { positionCode: "DC", role: "CD", duty: "defend" },
        { positionCode: "DR", role: "FB", duty: "defend", defaultRole: "FB", defaultDuty: "support" },
        { positionCode: "ML", role: "W", duty: "support", defaultRole: "W", defaultDuty: "attack" },
        { positionCode: "MC", role: "CM", duty: "support" },
        { positionCode: "MC", role: "CM", duty: "support" },
        { positionCode: "MR", role: "W", duty: "support", defaultRole: "W", defaultDuty: "attack" },
        { positionCode: "ST", role: "AF", duty: "attack" },
        { positionCode: "ST", role: "DLF", duty: "support" }
      ]
    },
    {
      formation: "4-3-3",
      name: "4-3-3 Control",
      positions: [
        { positionCode: "GK", role: "GK", duty: "defend" },
        { positionCode: "DL", role: "FB", duty: "support" },
        { positionCode: "DC", role: "CD", duty: "defend" },
        { positionCode: "DC", role: "CD", duty: "defend" },
        { positionCode: "DR", role: "FB", duty: "support" },
        { positionCode: "DM", role: "DM", duty: "defend" },
        { positionCode: "MC", role: "CM", duty: "support" },
        { positionCode: "MC", role: "CM", duty: "support" },
        { positionCode: "AML", role: "W", duty: "attack" },
        { positionCode: "ST", role: "AF", duty: "attack" },
        { positionCode: "AMR", role: "W", duty: "attack" }
      ]
    },
    {
      formation: "4-2-3-1",
      name: "4-2-3-1 Gegenpress",
      positions: [
        { positionCode: "GK", role: "SK", duty: "support" },
        { positionCode: "DL", role: "FB", duty: "support" },
        { positionCode: "DC", role: "CD", duty: "defend" },
        { positionCode: "DC", role: "CD", duty: "defend" },
        { positionCode: "DR", role: "FB", duty: "support" },
        { positionCode: "DM", role: "DM", duty: "defend" },
        { positionCode: "DM", role: "DM", duty: "support" },
        { positionCode: "AML", role: "IF", duty: "attack" },
        { positionCode: "AMC", role: "AM", duty: "attack" },
        { positionCode: "AMR", role: "IF", duty: "attack" },
        { positionCode: "ST", role: "PF", duty: "attack" }
      ]
    },
    {
      formation: "3-5-2",
      name: "3-5-2 Wing Play",
      positions: [
        { positionCode: "GK", role: "GK", duty: "defend" },
        { positionCode: "DC", role: "CD", duty: "defend" },
        { positionCode: "DC", role: "CD", duty: "defend" },
        { positionCode: "DC", role: "CD", duty: "defend" },
        { positionCode: "ML", role: "WB", duty: "support" },
        { positionCode: "DM", role: "DM", duty: "defend" },
        { positionCode: "MC", role: "CM", duty: "support" },
        { positionCode: "MC", role: "CM", duty: "support" },
        { positionCode: "MR", role: "WB", duty: "support" },
        { positionCode: "ST", role: "AF", duty: "attack" },
        { positionCode: "ST", role: "F9", duty: "support" }
      ]
    },
    {
      formation: "5-3-2",
      name: "5-3-2 Defensive",
      positions: [
        { positionCode: "GK", role: "GK", duty: "defend" },
        { positionCode: "DL", role: "WB", duty: "defend" },
        { positionCode: "DC", role: "CD", duty: "defend" },
        { positionCode: "DC", role: "CD", duty: "defend" },
        { positionCode: "DC", role: "CD", duty: "defend" },
        { positionCode: "DR", role: "WB", duty: "defend" },
        { positionCode: "MC", role: "CM", duty: "defend" },
        { positionCode: "MC", role: "CM", duty: "support" },
        { positionCode: "MC", role: "CM", duty: "defend" },
        { positionCode: "ST", role: "TM", duty: "support" },
        { positionCode: "ST", role: "AF", duty: "attack" }
      ]
    }
  ];

  public getFormationTemplates(): FormationTemplate[] {
    return this.formationTemplates;
  }

  public async createTacticFromTemplate(templateName: string, tacticName?: string): Promise<number> {
    const template = this.formationTemplates.find(t => t.name === templateName);
    if (!template) {
      throw new Error(`Formation template ${templateName} not found`);
    }

    // Deactivate any currently active tactic
    await db.update(tactics)
      .set({ isActive: false })
      .where(eq(tactics.isActive, true));

    // Create new tactic
    const newTactic: InsertTactic = {
      name: tacticName || template.name,
      formation: template.formation,
      isActive: true
    };

    const tacticResult = await db.insert(tactics).values(newTactic).returning({ id: tactics.id });
    const tacticId = tacticResult[0].id;

    // Create positions
    const positionInserts: InsertPosition[] = template.positions.map(pos => ({
      tacticId,
      positionCode: pos.positionCode,
      role: pos.role,
      duty: pos.duty
    }));

    await db.insert(positions).values(positionInserts);

    return tacticId;
  }

  public async getActiveTactic(): Promise<TacticWithPositions | null> {
    const activeTactic = await db.select()
      .from(tactics)
      .where(eq(tactics.isActive, true))
      .limit(1);

    if (activeTactic.length === 0) {
      return null;
    }

    const tacticPositions = await db.select()
      .from(positions)
      .where(eq(positions.tacticId, activeTactic[0].id));

    return {
      ...activeTactic[0],
      positions: tacticPositions
    };
  }

  public async getAllTactics(): Promise<TacticWithPositions[]> {
    const allTactics = await db.select().from(tactics);
    
    const tacticsWithPositions = await Promise.all(
      allTactics.map(async (tactic) => {
        const tacticPositions = await db.select()
          .from(positions)
          .where(eq(positions.tacticId, tactic.id));

        return {
          ...tactic,
          positions: tacticPositions
        };
      })
    );

    return tacticsWithPositions;
  }

  public async updatePositionRole(
    tacticId: number, 
    positionId: number, 
    newRole: string, 
    newDuty: string
  ): Promise<void> {
    await db.update(positions)
      .set({ role: newRole, duty: newDuty })
      .where(and(
        eq(positions.tacticId, tacticId),
        eq(positions.id, positionId)
      ));
  }

  public async setActiveTactic(tacticId: number): Promise<void> {
    // Deactivate all tactics
    await db.update(tactics).set({ isActive: false });
    
    // Activate specified tactic
    await db.update(tactics)
      .set({ isActive: true })
      .where(eq(tactics.id, tacticId));
  }

  public async deleteTactic(tacticId: number): Promise<void> {
    // Positions will be deleted automatically due to foreign key cascade
    await db.delete(tactics).where(eq(tactics.id, tacticId));
  }

  public getRolesByPosition(positionCode: string): Array<{ role: string; duties: string[] }> {
    // Define available roles and duties for each position
    const roleMap: Record<string, Array<{ role: string; duties: string[] }>> = {
      "GK": [
        { role: "GK", duties: ["defend"] },
        { role: "SK", duties: ["defend", "support", "attack"] }
      ],
      "DL": [
        { role: "FB", duties: ["defend", "support", "attack"] },
        { role: "WB", duties: ["defend", "support", "attack"] },
        { role: "IWB", duties: ["defend", "support"] },
        { role: "CWB", duties: ["support", "attack"] }
      ],
      "DR": [
        { role: "FB", duties: ["defend", "support", "attack"] },
        { role: "WB", duties: ["defend", "support", "attack"] },
        { role: "IWB", duties: ["defend", "support"] },
        { role: "CWB", duties: ["support", "attack"] }
      ],
      "DC": [
        { role: "CD", duties: ["defend"] },
        { role: "BPD", duties: ["defend", "support"] },
        { role: "L", duties: ["defend"] },
        { role: "NCB", duties: ["defend"] }
      ],
      "DM": [
        { role: "DM", duties: ["defend", "support"] },
        { role: "BWM", duties: ["defend", "support"] },
        { role: "A", duties: ["defend", "support"] },
        { role: "HB", duties: ["defend"] },
        { role: "DLP", duties: ["defend", "support"] }
      ],
      "ML": [
        { role: "W", duties: ["support", "attack"] },
        { role: "WM", duties: ["defend", "support", "attack"] },
        { role: "IW", duties: ["support", "attack"] }
      ],
      "MR": [
        { role: "W", duties: ["support", "attack"] },
        { role: "WM", duties: ["defend", "support", "attack"] },
        { role: "IW", duties: ["support", "attack"] }
      ],
      "MC": [
        { role: "CM", duties: ["defend", "support", "attack"] },
        { role: "BWM", duties: ["defend", "support"] },
        { role: "DLP", duties: ["defend", "support"] },
        { role: "AP", duties: ["support", "attack"] },
        { role: "BBM", duties: ["support"] },
        { role: "CAR", duties: ["support"] }
      ],
      "AML": [
        { role: "W", duties: ["support", "attack"] },
        { role: "IF", duties: ["support", "attack"] },
        { role: "IW", duties: ["support", "attack"] }
      ],
      "AMR": [
        { role: "W", duties: ["support", "attack"] },
        { role: "IF", duties: ["support", "attack"] },
        { role: "IW", duties: ["support", "attack"] }
      ],
      "AMC": [
        { role: "AM", duties: ["support", "attack"] },
        { role: "T", duties: ["attack"] },
        { role: "AP", duties: ["support", "attack"] },
        { role: "SS", duties: ["attack"] }
      ],
      "ST": [
        { role: "AF", duties: ["attack"] },
        { role: "DLF", duties: ["support", "attack"] },
        { role: "CF", duties: ["support", "attack"] },
        { role: "TM", duties: ["support", "attack"] },
        { role: "P", duties: ["attack"] },
        { role: "F9", duties: ["support"] },
        { role: "PF", duties: ["defend", "support", "attack"] },
        { role: "T", duties: ["attack"] }
      ]
    };

    return roleMap[positionCode] || [];
  }
}