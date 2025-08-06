# FM Tactical Squad Analyzer

A focused desktop tool that analyzes Football Manager squads against tactical setups to identify player-position mismatches and recruitment gaps, helping FM players optimize their tactics and transfer strategy.

## 🎯 Core Value Proposition

Transform the tedious manual process of evaluating which players fit which tactical roles into an instant, visual analysis that shows:
- Which positions are well-covered vs. have gaps
- Specific attribute targets for recruitment  
- Player progression over time

## ✨ Key Features

### 📥 Squad Import (Zero Error Tolerance)
- Parse FM Squad View HTML exports with 100% accuracy
- Extract all 50+ player attributes automatically
- Handle position abbreviations (D(LC), M/AM(R), etc.)
- Smart player recognition across multiple imports

### ⚽ Tactical Analysis Engine
- Preset formations: 4-4-2, 4-3-3, 4-2-3-1, 3-5-2, 5-3-2
- Player suitability scoring using key + preferred attributes
- Color-coded position coverage (Green/Yellow/Red)
- Top 5 player rankings per position

### 📊 Visual Tactical Report  
- **Split-screen design** for optimal workflow
- **Left Pane**: Interactive tactical formation with color-coded positions
- **Right Pane**: Position details with player rankings and attribute breakdowns
- Instant identification of recruitment needs

### 🎯 Recruitment Intelligence
- Generate specific attribute targets ("Need: Crossing 15+, Pace 12+")
- Export recruitment briefs for FM scouting searches
- Position priority ranking (worst gaps first)

### 📈 Player Development Tracking
- Auto-detect same players across imports (name + age matching)
- Track attribute changes over time
- Position suitability evolution analysis

## 🔧 Technical Stack

- **Frontend**: React + Vite with TypeScript
- **Backend**: Node.js + Express
- **Database**: SQLite (offline-first, no server required)
- **Styling**: Tailwind CSS with Radix UI components
- **Architecture**: Desktop application with local data storage

## 🚀 Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd fm-ai-coach
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173` (frontend) - API runs on `localhost:3001`

## 📋 Usage Workflow

1. **Export Squad from FM**: Squad View → Actions → Export as HTML
2. **Import Squad**: Drag and drop the HTML file into the tool
3. **Select Formation**: Choose from preset tactical formations (4-4-2, 4-3-3, etc.)
4. **Analyze Coverage**: View color-coded position analysis
5. **Identify Gaps**: Click positions to see detailed player rankings
6. **Export Targets**: Generate recruitment criteria for FM scouts

## 🎨 UI Design Principles

### Zero-Friction Import
- Drag-and-drop HTML files
- Instant validation feedback
- Clear error messages if parsing fails

### Immediate Value
- Show tactical overview within seconds of import
- Highlight biggest gaps prominently  
- Provide actionable next steps

### Focused Interface
- Single-purpose screens
- Minimal clicks to core insights
- No feature bloat or unnecessary options

## 📈 Performance Requirements

- Parse HTML import in <5 seconds
- Generate tactical analysis in <3 seconds
- Support squads up to 50 players
- Handle 10+ historical imports per player

## 🏗️ Architecture

```
├── server/
│   ├── tactical-server.ts      # Main server entry point
│   ├── sqlite-db.ts           # SQLite database setup
│   ├── tactical-routes.ts     # API endpoints
│   ├── parsers/
│   │   └── fm-html-parser.ts  # HTML parsing logic
│   ├── analysis/
│   │   └── position-analyzer.ts # Player scoring engine
│   └── services/
│       ├── player-service.ts   # Player data management
│       └── tactic-service.ts   # Tactical setup management
├── client/src/
│   ├── TacticalAnalyzer.tsx   # Main application component
│   └── components/
│       ├── TacticalGrid.tsx   # Formation visualization
│       ├── PositionDetails.tsx # Player analysis details
│       ├── ImportModal.tsx    # File upload interface
│       └── FormationSelector.tsx # Tactical setup
└── shared/
    └── sqlite-schema.ts       # Database schema
```

## 🗄️ Database Schema

- **players**: Core player data (name, age)
- **snapshots**: Player attributes at specific import dates
- **attributes**: Individual attribute values per snapshot
- **tactics**: Saved tactical formations
- **positions**: Position assignments within tactics
- **position_scores**: Cached player suitability scores

## 🎯 Success Metrics

- **User Retention**: % of users who return within 6 months
- **Session Value**: Time from import to actionable insight <5 minutes
- **Feature Adoption**: % of users who export recruitment targets
- **Import Accuracy**: Zero reported attribute parsing errors

## 🏆 Competitive Advantages

- **Speed**: Instant HTML import vs. manual entry
- **Focus**: Tactical analysis only, no feature bloat
- **Actionability**: Direct recruitment targets vs. generic analysis  
- **Simplicity**: Works offline, no setup required

## 📜 License

MIT License - see LICENSE file for details

---

Built for serious FM players who want to optimize their tactical setup and transfer strategy with data-driven insights.