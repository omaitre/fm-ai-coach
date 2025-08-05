import express from "express";
import multer from "multer";
import { PlayerService } from "./services/player-service.js";
import { TacticService } from "./services/tactic-service.js";
import { PositionAnalyzer } from "./analysis/position-analyzer.js";
import { validateFMHtmlStructure } from "./parsers/fm-html-parser.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });
const playerService = new PlayerService();
const tacticService = new TacticService();
const positionAnalyzer = new PositionAnalyzer();

// Upload and parse FM HTML file
router.post("/import/html", upload.single("htmlFile"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const htmlContent = req.file.buffer.toString("utf-8");
    
    // Validate HTML structure first
    const validation = validateFMHtmlStructure(htmlContent);
    if (!validation.isValid) {
      return res.status(400).json({ 
        error: "Invalid FM HTML file", 
        details: validation.errors 
      });
    }

    // Import players
    const result = await playerService.importPlayersFromHtml(htmlContent);
    
    res.json(result);
  } catch (error) {
    console.error("Import error:", error);
    res.status(500).json({ error: "Failed to import HTML file" });
  }
});

// Get all players with latest snapshots
router.get("/players", async (req, res) => {
  try {
    const players = await playerService.getPlayersWithLatestSnapshot();
    res.json(players);
  } catch (error) {
    console.error("Get players error:", error);
    res.status(500).json({ error: "Failed to get players" });
  }
});

// Get player progression history
router.get("/players/:id/history", async (req, res) => {
  try {
    const playerId = parseInt(req.params.id);
    if (isNaN(playerId)) {
      return res.status(400).json({ error: "Invalid player ID" });
    }

    const history = await playerService.getPlayerProgressHistory(playerId);
    res.json(history);
  } catch (error) {
    console.error("Get player history error:", error);
    res.status(500).json({ error: "Failed to get player history" });
  }
});

// Get formation templates
router.get("/formations", async (req, res) => {
  try {
    const templates = tacticService.getFormationTemplates();
    res.json(templates);
  } catch (error) {
    console.error("Get formations error:", error);
    res.status(500).json({ error: "Failed to get formations" });
  }
});

// Create tactic from template
router.post("/tactics/create", async (req, res) => {
  try {
    const { templateName, tacticName } = req.body;
    
    if (!templateName) {
      return res.status(400).json({ error: "Template name is required" });
    }

    const tacticId = await tacticService.createTacticFromTemplate(templateName, tacticName);
    res.json({ tacticId, success: true });
  } catch (error) {
    console.error("Create tactic error:", error);
    res.status(500).json({ error: "Failed to create tactic" });
  }
});

// Get active tactic
router.get("/tactics/active", async (req, res) => {
  try {
    const activeTactic = await tacticService.getActiveTactic();
    res.json(activeTactic);
  } catch (error) {
    console.error("Get active tactic error:", error);
    res.status(500).json({ error: "Failed to get active tactic" });
  }
});

// Get all tactics
router.get("/tactics", async (req, res) => {
  try {
    const tactics = await tacticService.getAllTactics();
    res.json(tactics);
  } catch (error) {
    console.error("Get tactics error:", error);
    res.status(500).json({ error: "Failed to get tactics" });
  }
});

// Update position role/duty
router.put("/tactics/:tacticId/positions/:positionId", async (req, res) => {
  try {
    const tacticId = parseInt(req.params.tacticId);
    const positionId = parseInt(req.params.positionId);
    const { role, duty } = req.body;

    if (isNaN(tacticId) || isNaN(positionId)) {
      return res.status(400).json({ error: "Invalid IDs" });
    }

    if (!role || !duty) {
      return res.status(400).json({ error: "Role and duty are required" });
    }

    await tacticService.updatePositionRole(tacticId, positionId, role, duty);
    res.json({ success: true });
  } catch (error) {
    console.error("Update position error:", error);
    res.status(500).json({ error: "Failed to update position" });
  }
});

// Analyze active tactic
router.get("/analysis/tactic", async (req, res) => {
  try {
    const activeTactic = await tacticService.getActiveTactic();
    if (!activeTactic) {
      return res.status(400).json({ error: "No active tactic found" });
    }

    const players = await playerService.getPlayersWithLatestSnapshot();
    
    // Convert players to format expected by analyzer
    const analyzePlayers = players.map(p => ({
      id: p.id,
      name: p.name,
      age: p.age,
      attributes: p.attributes
    }));

    // Analyze each position
    const positionAnalyses = await Promise.all(
      activeTactic.positions.map(async (position) => {
        try {
          return positionAnalyzer.analyzePosition(
            position.positionCode,
            position.role,
            position.duty,
            analyzePlayers
          );
        } catch (error) {
          console.warn(`Failed to analyze position ${position.positionCode}:`, error);
          return {
            positionCode: position.positionCode,
            role: position.role,
            duty: position.duty,
            playerScores: [],
            averageScore: 0,
            coverageLevel: 'critical' as const
          };
        }
      })
    );

    res.json({
      tactic: activeTactic,
      analysis: positionAnalyses
    });
  } catch (error) {
    console.error("Tactic analysis error:", error);
    res.status(500).json({ error: "Failed to analyze tactic" });
  }
});

// Generate recruitment targets
router.get("/analysis/recruitment", async (req, res) => {
  try {
    const activeTactic = await tacticService.getActiveTactic();
    if (!activeTactic) {
      return res.status(400).json({ error: "No active tactic found" });
    }

    const players = await playerService.getPlayersWithLatestSnapshot();
    
    // Convert players to format expected by analyzer
    const analyzePlayers = players.map(p => ({
      id: p.id,
      name: p.name,
      age: p.age,
      attributes: p.attributes
    }));

    // Generate recruitment targets for each position
    const recruitmentTargets = activeTactic.positions.map(position => {
      try {
        return positionAnalyzer.generateRecruitmentTargets(
          position.positionCode,
          position.role,
          position.duty,
          analyzePlayers
        );
      } catch (error) {
        console.warn(`Failed to generate targets for position ${position.positionCode}:`, error);
        return {
          position: `${position.positionCode} - ${position.role} (${position.duty})`,
          targets: []
        };
      }
    }).filter(target => target.targets.length > 0);

    res.json({ recruitmentTargets });
  } catch (error) {
    console.error("Recruitment targets error:", error);
    res.status(500).json({ error: "Failed to generate recruitment targets" });
  }
});

// Get available roles for position
router.get("/positions/:positionCode/roles", async (req, res) => {
  try {
    const { positionCode } = req.params;
    const roles = tacticService.getRolesByPosition(positionCode);
    res.json(roles);
  } catch (error) {
    console.error("Get roles error:", error);
    res.status(500).json({ error: "Failed to get roles" });
  }
});

// Database stats
router.get("/stats", async (req, res) => {
  try {
    const stats = await playerService.getDatabaseStats();
    res.json(stats);
  } catch (error) {
    console.error("Get stats error:", error);
    res.status(500).json({ error: "Failed to get stats" });
  }
});

// Clear all data
router.delete("/data", async (req, res) => {
  try {
    await playerService.deleteAllData();
    res.json({ success: true });
  } catch (error) {
    console.error("Clear data error:", error);
    res.status(500).json({ error: "Failed to clear data" });
  }
});

export default router;