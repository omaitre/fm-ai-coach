import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs";
import { storage } from "./storage";
import { insertPlayerSchema, insertTacticSchema, insertPositionSchema, insertPositionRoleDutyAttributeSchema } from "@shared/schema";
import { FORMATIONS, getPositionRoles, getRoleDuties, getRoleName, getAllPositionCodes, getPositionDisplayName, getAvailableAttributes, isGoalkeeperPosition } from "@shared/tactical-config";
import { migrateFMPositionData, validateMigrationData } from "./data-migration";
import { z } from "zod";

// Configure multer for HTML file uploads only
const upload = multer({
  dest: "uploads/",
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "text/html" || file.originalname.toLowerCase().endsWith(".html")) {
      return cb(null, true);
    } else {
      cb(new Error("Only HTML files are allowed"));
    }
  },
});

// Attribute mapping for FM HTML exports
const attributeMapping: Record<string, string> = {
  'Acc': 'Acceleration',
  'Wor': 'Work Rate', 
  'Vis': 'Vision',
  'Thr': 'Throwing',
  'Tec': 'Technique',
  'Tea': 'Teamwork',
  'Tck': 'Tackling',
  'Str': 'Strength',
  'Sta': 'Stamina',
  'TRO': 'Tendency to Rush Out',
  'Ref': 'Reflexes',
  'Pun': 'Tendency to Punch',
  'Pos': 'Positioning',
  'Pen': 'Penalty Taking',
  'Pas': 'Passing',
  'Pac': 'Pace',
  '1v1': 'One on Ones',
  'OtB': 'Off the Ball',
  'Nat': 'Natural Fitness',
  'Mar': 'Marking',
  'L Th': 'Long Throws',
  'Lon': 'Long Shots',
  'Ldr': 'Leadership',
  'Kic': 'Kicking',
  'Jum': 'Jumping Reach',
  'Hea': 'Heading',
  'Han': 'Handling',
  'Fre': 'Free Kick Taking',
  'Fla': 'Flair',
  'Fir': 'First Touch',
  'Fin': 'Finishing',
  'Ecc': 'Eccentricity',
  'Dri': 'Dribbling',
  'Det': 'Determination',
  'Dec': 'Decisions',
  'Cro': 'Crossing',
  'Cor': 'Corners',
  'Cnt': 'Concentration',
  'Cmp': 'Composure',
  'Com': 'Communication',
  'Cmd': 'Command of Area',
  'Bra': 'Bravery',
  'Bal': 'Balance',
  'Ant': 'Anticipation',
  'Agi': 'Agility',
  'Agg': 'Aggression',
  'Aer': 'Aerial Reach'
};

// Categorize attributes
const technicalAttributes = ['Corners', 'Crossing', 'Dribbling', 'Finishing', 'First Touch', 'Free Kick Taking', 'Heading', 'Long Shots', 'Long Throws', 'Marking', 'Passing', 'Penalty Taking', 'Tackling', 'Technique'];
const mentalAttributes = ['Aggression', 'Anticipation', 'Bravery', 'Composure', 'Concentration', 'Decisions', 'Determination', 'Flair', 'Leadership', 'Off the Ball', 'Positioning', 'Teamwork', 'Vision', 'Work Rate'];
const physicalAttributes = ['Acceleration', 'Agility', 'Balance', 'Jumping Reach', 'Natural Fitness', 'Pace', 'Stamina', 'Strength'];
const goalkeeperAttributes = ['Aerial Reach', 'Command of Area', 'Communication', 'Eccentricity', 'Handling', 'Kicking', 'One on Ones', 'Reflexes', 'Tendency to Rush Out', 'Tendency to Punch', 'Throwing'];

function getAttributeCategory(attributeName: string): string {
  if (technicalAttributes.includes(attributeName)) return 'technical';
  if (mentalAttributes.includes(attributeName)) return 'mental';
  if (physicalAttributes.includes(attributeName)) return 'physical';
  if (goalkeeperAttributes.includes(attributeName)) return 'goalkeeper';
  return 'other';
}

// Position mapping from FM HTML export to our position system
function parsePositionString(positionStr: string): string[] {
  const positions: string[] = [];
  
  // Split by comma and clean up
  const parts = positionStr.split(',').map(p => p.trim());
  
  for (const part of parts) {
    // Handle slash notation (e.g., "M/AM (C)" means both M and AM)
    if (part.includes('/')) {
      const slashParts = part.split('/');
      const positionSuffix = part.includes('(') ? part.substring(part.indexOf('(')) : '';
      
      slashParts.forEach(slashPart => {
        const cleanPart = slashPart.trim() + ' ' + positionSuffix;
        positions.push(...parsePositionString(cleanPart.trim()));
      });
      continue;
    }
    
    if (part.includes('GK')) {
      positions.push('GK');
    } else if (part.includes('AM')) {
      // Check AM before M to avoid conflicts
      if (part.includes('(C)')) {
        positions.push('AMC', 'AMCL', 'AMCR');
      } else if (part.includes('(L)')) {
        positions.push('AML');
      } else if (part.includes('(R)')) {
        positions.push('AMR');
      } else {
        positions.push('AMC', 'AMCL', 'AMCR');
      }
    } else if (part.includes('DM')) {
      // Check DM before D to avoid conflicts
      if (part.includes('(C)')) {
        positions.push('DM', 'DMCL', 'DMCR');
      } else if (part.includes('(L)')) {
        positions.push('DMCL');
      } else if (part.includes('(R)')) {
        positions.push('DMCR');
      } else {
        positions.push('DM', 'DMCL', 'DMCR');
      }
    } else if (part.includes('ST')) {
      if (part.includes('(C)')) {
        positions.push('STC');
      } else if (part.includes('(L)')) {
        positions.push('STL');
      } else if (part.includes('(R)')) {
        positions.push('STR');
      } else {
        positions.push('STC', 'STL', 'STR');
      }
    } else if (part.includes('M')) {
      // Generic M check after AM and DM
      if (part.includes('(C)')) {
        positions.push('MC', 'MCL', 'MCR');
      } else if (part.includes('(L)')) {
        positions.push('ML');
      } else if (part.includes('(R)')) {
        positions.push('MR');
      } else {
        positions.push('MC', 'MCL', 'MCR');
      }
    } else if (part.includes('D')) {
      // Generic D check after DM
      if (part.includes('(LC)')) {
        positions.push('DL', 'DC', 'DCL', 'DCR');
      } else if (part.includes('(RC)')) {
        positions.push('DR', 'DC', 'DCL', 'DCR');
      } else if (part.includes('(C)')) {
        positions.push('DC', 'DCL', 'DCR');
      } else if (part.includes('(L)')) {
        positions.push('DL');
      } else if (part.includes('(R)')) {
        positions.push('DR');
      } else {
        // Generic D
        positions.push('DC', 'DCL', 'DCR');
      }
    }
  }
  
  // Remove duplicates and return
  return Array.from(new Set(positions));
}

// Parse FM HTML export
function parseHtmlExport(htmlContent: string): Array<{
  name: string;
  age: number;
  currentAbility: number;
  potentialAbility: number;
  position: string;
  positions: string[];
  attributes: Array<{ name: string; value: number; category: string }>;
}> {
  const players: Array<any> = [];
  
  // Simple HTML parsing - find table rows
  const rows = htmlContent.split('<tr bgcolor="#EEEEEE">').slice(1); // Skip header row
  
  rows.forEach(row => {
    const cells = row.split('<td>').slice(1).map(cell => 
      cell.split('</td>')[0].trim()
    );
    
    if (cells.length < 5) return; // Skip incomplete rows
    
    const parsedPositions = parsePositionString(cells[4]);
    console.log(`Player: ${cells[0]}, Position String: "${cells[4]}", Parsed Positions:`, parsedPositions);
    
    // Special debugging for Mylo Hall
    if (cells[0] === 'Mylo Hall') {
      console.log('=== MYLO HALL SPECIAL DEBUG ===');
      console.log('Raw cells:', cells);
      console.log('Position cell (index 4):', cells[4]);
      console.log('Parsed positions:', parsedPositions);
      console.log('================================');
    }
    
    const player = {
      name: cells[0],
      age: parseInt(cells[1]) || 0,
      currentAbility: parseInt(cells[2]) || 0,
      potentialAbility: parseInt(cells[3]) || 0,
      position: cells[4],
      positions: parsedPositions,
      attributes: [] as Array<{ name: string; value: number; category: string }>
    };
    
    // Parse attributes starting from index 5
    const attributeKeys = Object.keys(attributeMapping);
    attributeKeys.forEach((key, index) => {
      const cellIndex = 5 + index;
      if (cellIndex < cells.length) {
        const value = parseInt(cells[cellIndex]);
        if (!isNaN(value) && value > 0) {
          const fullName = attributeMapping[key];
          player.attributes.push({
            name: fullName,
            value: value,
            category: getAttributeCategory(fullName)
          });
        }
      }
    });
    
    if (player.name && player.attributes.length > 0) {
      players.push(player);
    }
  });
  
  return players;
}

// Calculate position suitability score
async function calculatePositionScore(snapshotId: number, positionId: number): Promise<number> {
  const positionAttributes = await storage.getPositionAttributes(positionId);
  const snapshotAttributes = await storage.getAttributesBySnapshot(snapshotId);

  if (positionAttributes.length === 0) return 0;

  const attributeMap = new Map(
    snapshotAttributes.map(attr => [attr.attributeName.toLowerCase(), attr.attributeValue])
  );

  let totalScore = 0;
  let validAttributes = 0;

  for (const posAttr of positionAttributes) {
    const value = attributeMap.get(posAttr.attributeName.toLowerCase());
    if (value !== undefined) {
      totalScore += value * (posAttr.weight || 1.0);
      validAttributes++;
    }
  }

  return validAttributes > 0 ? totalScore / validAttributes : 0;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Player Management Routes
  app.get("/api/players", async (req, res) => {
    try {
      const players = await storage.getPlayersWithLatestSnapshots();
      res.json(players);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch players" });
    }
  });

  app.get("/api/players/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const player = await storage.getPlayer(id);
      if (!player) {
        return res.status(404).json({ message: "Player not found" });
      }

      const snapshots = await storage.getSnapshotsByPlayer(id);
      const snapshotsWithAttributes = await Promise.all(
        snapshots.map(async (snapshot) => ({
          ...snapshot,
          attributes: await storage.getAttributesBySnapshot(snapshot.id),
        }))
      );

      res.json({ ...player, snapshots: snapshotsWithAttributes });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch player" });
    }
  });

  app.post("/api/players", async (req, res) => {
    try {
      const playerData = insertPlayerSchema.parse(req.body);
      const player = await storage.createPlayer(playerData);
      res.status(201).json(player);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create player" });
    }
  });

  app.delete("/api/players/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deletePlayer(id);
      if (!success) {
        return res.status(404).json({ message: "Player not found" });
      }
      res.json({ message: "Player deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete player" });
    }
  });



  app.delete("/api/snapshots/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteSnapshot(id);
      if (!success) {
        return res.status(404).json({ message: "Snapshot not found" });
      }
      res.json({ message: "Snapshot deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete snapshot" });
    }
  });

  // Tactics Management Routes
  app.get("/api/tactics", async (req, res) => {
    try {
      const tactics = await storage.getAllTactics();
      const tacticsWithPositions = await Promise.all(
        tactics.map(async (tactic) => ({
          ...tactic,
          positions: await storage.getPositionsByTactic(tactic.id),
        }))
      );
      res.json(tacticsWithPositions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tactics" });
    }
  });

  app.get("/api/tactics/active", async (req, res) => {
    try {
      const activeTactic = await storage.getActiveTactic();
      if (!activeTactic) {
        return res.status(404).json({ message: "No active tactic found" });
      }

      const positions = await storage.getPositionsByTactic(activeTactic.id);
      const positionsWithAttributes = await Promise.all(
        positions.map(async (position) => ({
          ...position,
          attributes: await storage.getPositionAttributes(position.id),
        }))
      );

      res.json({ ...activeTactic, positions: positionsWithAttributes });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch active tactic" });
    }
  });

  app.post("/api/tactics", async (req, res) => {
    try {
      const tacticData = insertTacticSchema.parse(req.body);
      const tactic = await storage.createTactic(tacticData);
      res.status(201).json(tactic);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create tactic" });
    }
  });

  app.post("/api/tactics/:id/activate", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.setActiveTactic(id);
      if (!success) {
        return res.status(404).json({ message: "Tactic not found" });
      }
      res.json({ message: "Tactic activated successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to activate tactic" });
    }
  });

  app.delete("/api/tactics/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteTactic(id);
      if (!success) {
        return res.status(404).json({ message: "Tactic not found" });
      }
      res.json({ message: "Tactic deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete tactic" });
    }
  });

  // Get single tactic with full details for editing
  app.get("/api/tactics/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const tactic = await storage.getTactic(id);
      if (!tactic) {
        return res.status(404).json({ message: "Tactic not found" });
      }

      const positions = await storage.getPositionsByTactic(tactic.id);
      const positionsWithAttributes = await Promise.all(
        positions.map(async (position) => ({
          ...position,
          attributes: await storage.getPositionAttributes(position.id),
        }))
      );

      res.json({ ...tactic, positions: positionsWithAttributes });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tactic" });
    }
  });

  // Update existing tactic
  app.put("/api/tactics/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Extract positions from request body before validation
      const { positions: positionsData, ...tacticFields } = req.body;
      
      // Validate tactic data
      const tacticData = insertTacticSchema.parse(tacticFields);
      
      // Update the tactic
      const updatedTactic = await storage.updateTactic(id, tacticData);
      if (!updatedTactic) {
        return res.status(404).json({ message: "Tactic not found" });
      }

      // Handle position updates if provided
      if (positionsData && Array.isArray(positionsData)) {
        // Delete existing positions for this tactic
        const existingPositions = await storage.getPositionsByTactic(id);
        for (const position of existingPositions) {
          await storage.deletePosition(position.id);
        }

        // Create new positions
        for (const positionData of positionsData) {
          const positionToCreate = {
            tacticId: id,
            positionName: positionData.positionName,
            positionCode: positionData.positionCode,
            positionSide: positionData.positionSide || null,
            roleName: positionData.roleName || null,
            duty: positionData.duty || null,
            playerId: positionData.playerId || null,
          };

          const createdPosition = await storage.createPosition(positionToCreate);

          // Create position attributes if provided
          if (positionData.attributes && Array.isArray(positionData.attributes)) {
            const attributesToCreate = positionData.attributes.map((attr: any) => ({
              positionId: createdPosition.id,
              attributeName: attr.attributeName,
              weight: attr.weight,
            }));

            if (attributesToCreate.length > 0) {
              await storage.createMultiplePositionAttributes(attributesToCreate);
            }
          }
        }
      }

      // Return updated tactic with positions
      const positions = await storage.getPositionsByTactic(id);
      const positionsWithAttributes = await Promise.all(
        positions.map(async (position) => ({
          ...position,
          attributes: await storage.getPositionAttributes(position.id),
        }))
      );

      res.json({ ...updatedTactic, positions: positionsWithAttributes });
    } catch (error) {
      console.error("Update tactic error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update tactic" });
    }
  });

  // Tactic Evaluation Route
  app.get("/api/tactics/:id/evaluate", async (req, res) => {
    try {
      const tacticId = parseInt(req.params.id);
      
      // Get optimized tactic evaluation data in single query
      const evaluationData = await storage.getTacticEvaluation(tacticId);
      
      if (evaluationData.positions.length === 0) {
        return res.status(400).json({ message: "No positions configured for this tactic" });
      }

      if (evaluationData.players.length === 0) {
        return res.status(400).json({ message: "No players found in database" });
      }

      // Evaluate players for each position
      const evaluationResults = evaluationData.positions.map((position) => {
        const positionRoleDutyAttrs = position.positionRoleDutyAttributes;

        if (!positionRoleDutyAttrs) {
          return {
            position: {
              id: position.id,
              positionCode: position.positionCode,
              roleName: position.roleName,
              duty: position.duty,
            },
            players: [],
            error: "No attribute configuration found for this position/role/duty combination"
          };
        }

        // Parse key and preferred attributes (handle JSON strings)
        let keyAttributes = [];
        let preferredAttributes = [];
        
        try {
          keyAttributes = Array.isArray(positionRoleDutyAttrs.keyAttributes) 
            ? positionRoleDutyAttrs.keyAttributes 
            : JSON.parse(positionRoleDutyAttrs.keyAttributes || '[]');
        } catch (e) {
          console.error('Failed to parse keyAttributes:', positionRoleDutyAttrs.keyAttributes);
        }
        
        try {
          preferredAttributes = Array.isArray(positionRoleDutyAttrs.preferredAttributes) 
            ? positionRoleDutyAttrs.preferredAttributes 
            : JSON.parse(positionRoleDutyAttrs.preferredAttributes || '[]');
        } catch (e) {
          console.error('Failed to parse preferredAttributes:', positionRoleDutyAttrs.preferredAttributes);
        }

        if (keyAttributes.length === 0 && preferredAttributes.length === 0) {
          return {
            position: {
              id: position.id,
              positionCode: position.positionCode,
              roleName: position.roleName,
              duty: position.duty,
            },
            players: [],
            error: "No key or preferred attributes configured"
          };
        }

        // Evaluate each player for this position using pre-loaded data
        const playerEvaluations = evaluationData.players.map((player) => {
          const attributeMap = new Map(
            player.attributes.map(attr => [attr.attributeName.toLowerCase(), attr.attributeValue])
          );

          // Calculate key attributes average
          let keyTotal = 0;
          let keyCount = 0;
          keyAttributes.forEach(attrName => {
            const value = attributeMap.get(attrName.toLowerCase());
            if (value !== undefined) {
              keyTotal += value;
              keyCount++;
            }
          });
          const keyAverage = keyCount > 0 ? keyTotal / keyCount : 0;

          // Calculate preferred attributes average
          let preferredTotal = 0;
          let preferredCount = 0;
          preferredAttributes.forEach(attrName => {
            const value = attributeMap.get(attrName.toLowerCase());
            if (value !== undefined) {
              preferredTotal += value;
              preferredCount++;
            }
          });
          const preferredAverage = preferredCount > 0 ? preferredTotal / preferredCount : 0;

          // Calculate weighted score: Key 70%, Preferred 30%
          const weightedScore = (keyAverage * 0.7) + (preferredAverage * 0.3);
          
          // Final score as percentage (out of 20 max attribute value)
          const finalScore = (weightedScore / 20) * 100;

          // Identify key strengths (attributes >= 15)
          const keyStrengths = player.attributes
            .filter(attr => attr.attributeValue >= 15)
            .sort((a, b) => b.attributeValue - a.attributeValue)
            .slice(0, 3)
            .map(attr => attr.attributeName);

          return {
            player: {
              id: player.id,
              name: player.name,
              age: player.age,
              currentAbility: player.latestSnapshot.currentAbility,
              potentialAbility: player.latestSnapshot.potentialAbility
            },
            score: Math.round(finalScore * 10) / 10, // Round to 1 decimal
            keyAverage: Math.round(keyAverage * 10) / 10,
            preferredAverage: Math.round(preferredAverage * 10) / 10,
            keyStrengths,
            attributeBreakdown: {
              keyAttributes: keyCount,
              preferredAttributes: preferredCount,
              totalAttributes: player.attributes.length
            }
          };
        });

        // Sort by score descending and take top 5
        const topPlayers = playerEvaluations
          .sort((a, b) => b.score - a.score)
          .slice(0, 5);

        return {
          position: {
            id: position.id,
            positionCode: position.positionCode,
            roleName: position.roleName,
            duty: position.duty,
          },
          players: topPlayers,
          attributeConfig: {
            keyAttributes,
            preferredAttributes
          }
        };
      });

      res.json({
        tactic: {
          id: evaluationData.tactic.id,
          name: evaluationData.tactic.name,
          formation: evaluationData.tactic.formation
        },
        evaluations: evaluationResults,
        metadata: {
          totalPlayers: evaluationData.players.length,
          evaluatedAt: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error("Tactic evaluation error:", error);
      res.status(500).json({ message: "Failed to evaluate tactic" });
    }
  });

  // Position Management Routes
  app.post("/api/positions", async (req, res) => {
    try {
      const { position, attributes } = req.body;
      const positionData = insertPositionSchema.parse(position);
      
      const createdPosition = await storage.createPosition(positionData);

      // Save position attributes
      if (attributes && attributes.length > 0) {
        const attributesToInsert = attributes.map((attrName: string) => ({
          positionId: createdPosition.id,
          attributeName: attrName,
          weight: 1.0,
        }));
        await storage.createMultiplePositionAttributes(attributesToInsert);
      }

      res.status(201).json(createdPosition);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create position" });
    }
  });

  app.delete("/api/positions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deletePosition(id);
      if (!success) {
        return res.status(404).json({ message: "Position not found" });
      }
      res.json({ message: "Position deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete position" });
    }
  });

  app.get("/api/positions/:id/rankings", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const rankings = await storage.getPlayerRankingsForPosition(id);
      res.json(rankings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch position rankings" });
    }
  });

  // Squad Analysis Routes
  app.get("/api/squad/stats", async (req, res) => {
    try {
      const players = await storage.getPlayersWithLatestSnapshots();
      
      const totalPlayers = players.length;
      const averageAge = players.reduce((sum, p) => sum + (p.age || 0), 0) / totalPlayers || 0;
      const averageCA = players.reduce((sum, p) => sum + (p.latestSnapshot?.currentAbility || 0), 0) / totalPlayers || 0;

      res.json({
        totalPlayers,
        averageAge: Math.round(averageAge * 10) / 10,
        averageCA: Math.round(averageCA),
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch squad statistics" });
    }
  });

  // HTML Import Route
  app.post("/api/import-html", upload.single("html"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No HTML file provided" });
      }

      // Read the HTML file
      const htmlContent = fs.readFileSync(req.file.path, 'utf-8');
      console.log("HTML file size:", htmlContent.length);
      console.log("HTML preview (first 500 chars):", htmlContent.substring(0, 500));
      
      // Parse players from HTML
      const parsedPlayers = parseHtmlExport(htmlContent);
      
      if (parsedPlayers.length === 0) {
        return res.status(400).json({ message: "No valid players found in HTML file" });
      }

      const importResults = {
        totalPlayers: parsedPlayers.length,
        successfulImports: 0,
        failedImports: 0,
        errors: [] as string[],
        players: [] as any[]
      };

      // Import each player
      for (const playerData of parsedPlayers) {
        try {
          // Create player
          const newPlayer = await storage.createPlayer({
            name: playerData.name,
            age: playerData.age,
            positions: playerData.positions, // Already converted in storage.ts
          });       
        
          // Create snapshot
          const snapshot = await storage.createSnapshot({
            playerId: player.id,
            currentAbility: playerData.currentAbility || null,
            potentialAbility: playerData.potentialAbility || null,
            screenshotPath: null, // No screenshot for HTML imports
            snapshotDate: new Date(),
          });

          // Create attributes
          const attributesToInsert = playerData.attributes.map(attr => ({
            snapshotId: snapshot.id,
            attributeName: attr.name,
            attributeValue: attr.value,
            attributeCategory: attr.category,
          }));

          if (attributesToInsert.length > 0) {
            await storage.createMultipleAttributes(attributesToInsert);
          }

          // Calculate position scores if there's an active tactic
          const activeTactic = await storage.getActiveTactic();
          if (activeTactic) {
            const positions = await storage.getPositionsByTactic(activeTactic.id);
            for (const position of positions) {
              const score = await calculatePositionScore(snapshot.id, position.id);
              await storage.createPlayerPositionScore({
                playerId: player.id,
                positionId: position.id,
                snapshotId: snapshot.id,
                score,
              });
            }
          }

          importResults.successfulImports++;
          importResults.players.push(player);
        } catch (error) {
          importResults.failedImports++;
          importResults.errors.push(`Failed to import ${playerData.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Clean up uploaded file
      fs.unlinkSync(req.file.path);

      res.json(importResults);
    } catch (error) {
      res.status(500).json({ message: "Failed to import HTML file" });
    }
  });



  // Tactical System Routes

  // Get all formations
  app.get("/api/formations", (req, res) => {
    res.json(FORMATIONS);
  });

  // FM Data Migration endpoints
  app.post("/api/migrate-fm-data", async (req, res) => {
    try {
      const result = await migrateFMPositionData();
      res.json(result);
    } catch (error) {
      console.error("Migration endpoint error:", error);
      res.status(500).json({ 
        success: false, 
        error: "Migration failed", 
        details: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  app.get("/api/validate-fm-data", async (req, res) => {
    try {
      const validation = await validateMigrationData();
      res.json(validation);
    } catch (error) {
      console.error("Validation endpoint error:", error);
      res.status(500).json({ 
        error: "Validation failed", 
        details: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // Enhanced position/role/duty endpoints using authentic FM data
  
  // Get all available positions with display names
  app.get("/api/positions", (req, res) => {
    try {
      const positions = getAllPositionCodes().map(code => ({
        code,
        name: getPositionDisplayName(code)
      }));
      
      if (positions.length === 0) {
        return res.status(500).json({ message: "No position data loaded" });
      }
      
      res.json(positions);
    } catch (error) {
      console.error("Error fetching positions:", error);
      res.status(500).json({ message: "Failed to fetch positions" });
    }
  });

  // Get roles for a position with role codes and names
  app.get("/api/roles/:position", (req, res) => {
    try {
      const positionCode = req.params.position;
      
      // Validate position exists
      if (!getAllPositionCodes().includes(positionCode)) {
        return res.status(404).json({ message: `Position '${positionCode}' not found` });
      }
      
      const roleCodes = getPositionRoles(positionCode);
      const roles = roleCodes.map(code => ({
        code,
        name: getRoleName(positionCode, code)
      }));
      
      res.json(roles);
    } catch (error) {
      console.error(`Error fetching roles for ${req.params.position}:`, error);
      res.status(500).json({ message: "Failed to fetch roles" });
    }
  });

  // Get duties for position+role (role can be name or code)
  app.get("/api/duties/:position/:role", (req, res) => {
    try {
      const { position, role } = req.params;
      
      // Validate position exists
      if (!getAllPositionCodes().includes(position)) {
        return res.status(404).json({ message: `Position '${position}' not found` });
      }
      
      // Validate role exists for position
      const roleCodes = getPositionRoles(position);
      if (!roleCodes.includes(role)) {
        return res.status(404).json({ message: `Role '${role}' not found for position '${position}'` });
      }
      
      const duties = getRoleDuties(position, role);
      
      if (duties.length === 0) {
        return res.status(404).json({ message: `No duties found for position '${position}' and role '${role}'` });
      }
      
      // Return duties with proper capitalization
      const formattedDuties = duties.map(duty => ({
        code: duty,
        name: duty.charAt(0).toUpperCase() + duty.slice(1)
      }));
      res.json(formattedDuties);
    } catch (error) {
      console.error(`Error fetching duties for ${position}/${role}:`, error);
      res.status(500).json({ message: "Failed to fetch duties" });
    }
  });

  // Check if Position+Role+Duty combination has defined attributes
  app.get("/api/check-attributes/:position/:role/:duty", async (req, res) => {
    try {
      const { position, role, duty } = req.params;
      
      // The role parameter comes as role code from frontend, but we need to find the role name in DB
      // Get all roles for this position to find the mapping
      const roleCodes = getPositionRoles(position);
      let roleNameForDB = role;
      
      // If role is a code, get the corresponding name for DB lookup
      if (roleCodes.includes(role)) {
        roleNameForDB = getRoleName(position, role);
      }
      
      console.log(`[ATTRIBUTE LOOKUP] ${position}/${role} -> ${roleNameForDB}/${duty}`);
      
      const attributes = await storage.getPositionRoleDutyAttribute(position, roleNameForDB, duty);
      
      if (attributes) {
        res.json({
          exists: true,
          attributes: {
            keyAttributes: JSON.parse(attributes.keyAttributes),
            preferableAttributes: JSON.parse(attributes.preferableAttributes)
          }
        });
      } else {
        res.json({ exists: false });
      }
    } catch (error) {
      console.error(`Error checking attributes for ${req.params.position}/${req.params.role}/${req.params.duty}:`, error);
      res.status(500).json({ message: "Failed to check attributes" });
    }
  });

  // Save attribute definition for Position+Role+Duty
  app.post("/api/define-attributes", async (req, res) => {
    try {
      const validation = insertPositionRoleDutyAttributeSchema.safeParse({
        ...req.body,
        keyAttributes: JSON.stringify(req.body.keyAttributes || []),
        preferableAttributes: JSON.stringify(req.body.preferableAttributes || [])
      });

      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid attribute definition",
          errors: validation.error.errors 
        });
      }

      const attributes = await storage.createPositionRoleDutyAttribute(validation.data);
      res.json(attributes);
    } catch (error) {
      res.status(500).json({ message: "Failed to save attribute definition" });
    }
  });

  // Get attribute lists (GK vs outfield)
  app.get("/api/attributes/:type", (req, res) => {
    try {
      const type = req.params.type;
      if (type === "goalkeeper") {
        res.json(getAvailableAttributes("GK"));
      } else if (type === "outfield") {
        res.json(getAvailableAttributes("DR")); // Any outfield position
      } else {
        res.status(400).json({ message: "Invalid attribute type. Use 'goalkeeper' or 'outfield'" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch attributes" });
    }
  });

  // Calculate player suitability for position+role+duty
  app.get("/api/player-suitability/:playerId/:position/:role/:duty", async (req, res) => {
    try {
      const { playerId, position, role, duty } = req.params;
      
      // Get player's latest snapshot and attributes
      const player = await storage.getPlayer(parseInt(playerId));
      if (!player) {
        return res.status(404).json({ message: "Player not found" });
      }

      const latestSnapshot = await storage.getLatestSnapshotByPlayer(player.id);
      if (!latestSnapshot) {
        return res.status(404).json({ message: "No player data found" });
      }

      const playerAttributes = await storage.getAttributesBySnapshot(latestSnapshot.id);
      
      // Get position role duty attributes
      const positionDef = await storage.getPositionRoleDutyAttribute(position, role, duty);
      if (!positionDef) {
        return res.status(404).json({ message: "Position role duty combination not defined" });
      }

      const keyAttributes = JSON.parse(positionDef.keyAttributes);
      const preferableAttributes = JSON.parse(positionDef.preferableAttributes);

      // Calculate suitability score
      let totalScore = 0;
      let maxPossibleScore = 0;
      const breakdown: Record<string, number> = {};

      // Process key attributes (weight 1.0)
      for (const attrName of keyAttributes) {
        const playerAttr = playerAttributes.find(a => a.attributeName === attrName);
        const value = playerAttr?.attributeValue || 0;
        totalScore += value;
        maxPossibleScore += 20; // Max FM attribute value
        breakdown[attrName] = value;
      }

      // Process preferable attributes (weight 1.0)
      for (const attrName of preferableAttributes) {
        const playerAttr = playerAttributes.find(a => a.attributeName === attrName);
        const value = playerAttr?.attributeValue || 0;
        totalScore += value;
        maxPossibleScore += 20;
        breakdown[attrName] = value;
      }

      const score = maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 100 : 0;

      res.json({
        score: Math.round(score * 100) / 100,
        breakdown
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to calculate player suitability" });
    }
  });

  // Calculate position scores for all players
  app.post("/api/positions/:id/calculate-scores", async (req, res) => {
    try {
      const positionId = parseInt(req.params.id);
      const players = await storage.getAllPlayers();
      const scores = [];

      for (const player of players) {
        const latestSnapshot = await storage.getLatestSnapshotByPlayer(player.id);
        if (latestSnapshot) {
          const score = await storage.calculateAndStorePositionScore(player.id, positionId, latestSnapshot.id);
          scores.push(score);
        }
      }

      res.json({ calculated: scores.length, scores });
    } catch (error) {
      console.error("Calculate position scores error:", error);
      res.status(500).json({ message: "Failed to calculate position scores" });
    }
  });

  // Get position evaluation rankings
  app.get("/api/positions/:id/evaluation", async (req, res) => {
    try {
      const positionId = parseInt(req.params.id);
      const rankings = await storage.getPositionEvaluationRankings(positionId);
      
      res.json(rankings);
    } catch (error) {
      console.error("Position evaluation error:", error);
      res.status(500).json({ message: "Failed to get position evaluation" });
    }
  });

  // Get tactic squad analysis
  app.get("/api/tactics/:id/squad-analysis", async (req, res) => {
    try {
      const tacticId = parseInt(req.params.id);
      const analysis = await storage.getTacticSquadAnalysis(tacticId);
      
      res.json(analysis);
    } catch (error) {
      console.error("Squad analysis error:", error);
      res.status(500).json({ message: "Failed to get squad analysis" });
    }
  });

  // Batch calculate scores for entire tactic
  app.post("/api/tactics/:id/calculate-all-scores", async (req, res) => {
    try {
      const tacticId = parseInt(req.params.id);
      const positions = await storage.getPositionsByTactic(tacticId);
      const players = await storage.getAllPlayers();
      
      let totalCalculated = 0;

      for (const position of positions) {
        for (const player of players) {
          const latestSnapshot = await storage.getLatestSnapshotByPlayer(player.id);
          if (latestSnapshot) {
            await storage.calculateAndStorePositionScore(player.id, position.id, latestSnapshot.id);
            totalCalculated++;
          }
        }
      }

      res.json({ 
        message: "Scores calculated successfully",
        totalCalculated,
        positionsProcessed: positions.length,
        playersProcessed: players.length
      });
    } catch (error) {
      console.error("Batch calculate scores error:", error);
      res.status(500).json({ message: "Failed to calculate scores" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
