# FM Tactical Squad Analyzer - Development Guide

## Project Overview

**FM Tactical Squad Analyzer** is a focused desktop tool that analyzes Football Manager squads against tactical setups to identify player-position mismatches and recruitment gaps. It transforms the tedious manual process of evaluating player suitability into instant, visual analysis.

### Target Users
- **Primary**: Serious FM players (2+ hours/week, full seasons, tactical optimization focus)
- **Secondary**: Casual FM players seeking quick tactical insights during transfer windows

### Core Value Proposition
- **Speed**: Instant HTML import vs. manual entry
- **Focus**: Tactical analysis only, no feature bloat  
- **Actionability**: Direct recruitment targets vs. generic analysis
- **Simplicity**: Works offline, no setup required

## Technical Architecture

### Technology Stack
```
Frontend:  React 18 + TypeScript + Vite
Styling:   Tailwind CSS + Radix UI components
Backend:   Node.js + Express + TypeScript
Database:  SQLite (offline-first, local storage)
ORM:       Drizzle ORM with migrations
Build:     Vite (frontend) + esbuild (backend)
```

### Architecture Principles
- **Desktop Application**: Electron-ready, local-first
- **Offline-First**: All data stored locally in SQLite
- **Single User**: No multi-user features or authentication
- **API-First**: Clear separation between client and server
- **Performance**: <5s HTML parsing, <3s tactical analysis

### Project Structure
```
├── client/src/              # React frontend
│   ├── components/          # React components
│   │   ├── ui/             # Radix UI components
│   │   ├── TacticalPitch.tsx
│   │   ├── PositionDetailsPanel.tsx
│   │   ├── ImportModal.tsx
│   │   └── FormationSelector.tsx
│   ├── lib/                # Utils and configuration
│   ├── hooks/              # React hooks
│   └── TacticalAnalyzer.tsx # Main app component
├── server/                 # Node.js backend
│   ├── analysis/           # Position scoring engine
│   ├── parsers/           # FM HTML parser
│   ├── services/          # Data services
│   ├── tactical-server.ts # Main server entry
│   └── tactical-routes.ts # API endpoints
├── shared/                # Shared types and schemas
│   ├── sqlite-schema.ts   # Database schema
│   └── tactical-config.ts # FM tactical data
└── data/                  # SQLite database files
```

## Database Schema

### Core Tables

**players**: Master player registry
```sql
- id: INTEGER PRIMARY KEY AUTOINCREMENT
- name: TEXT NOT NULL
- age: INTEGER NOT NULL  
- created_at: TIMESTAMP
```

**snapshots**: Player attribute snapshots over time
```sql
- id: INTEGER PRIMARY KEY AUTOINCREMENT
- player_id: INTEGER REFERENCES players(id)
- current_ability: INTEGER
- potential_ability: INTEGER
- import_date: TIMESTAMP
```

**attributes**: Individual attribute values per snapshot
```sql
- id: INTEGER PRIMARY KEY AUTOINCREMENT
- snapshot_id: INTEGER REFERENCES snapshots(id)
- name: TEXT NOT NULL
- value: INTEGER NOT NULL
```

**tactics**: Saved tactical formations
```sql
- id: INTEGER PRIMARY KEY AUTOINCREMENT
- name: TEXT NOT NULL
- formation: TEXT NOT NULL (e.g., "4-4-2")
- is_active: BOOLEAN DEFAULT false
- created_at: TIMESTAMP
```

**positions**: Position assignments within tactics
```sql
- id: INTEGER PRIMARY KEY AUTOINCREMENT
- tactic_id: INTEGER REFERENCES tactics(id)
- position_code: TEXT NOT NULL (e.g., "GK", "DR", "AMC")
- role: TEXT NOT NULL (e.g., "Central Midfielder")
- duty: TEXT NOT NULL (e.g., "Support", "Attack")
```

**position_scores**: Cached player suitability scores
```sql
- id: INTEGER PRIMARY KEY AUTOINCREMENT
- player_id: INTEGER REFERENCES players(id)
- position_id: INTEGER REFERENCES positions(id)
- snapshot_id: INTEGER REFERENCES snapshots(id)
- score: REAL NOT NULL (0-100 suitability score)
- calculated_at: TIMESTAMP
```

### Data Flow
1. **Import**: HTML → ParsedPlayer → players/snapshots/attributes
2. **Analysis**: players + attributes + tactical config → position scores
3. **Display**: position scores → UI coverage levels and rankings

## FM Domain Knowledge

### Attribute Categories
```typescript
GOALKEEPER_ATTRIBUTES = {
  technical: ['First Touch', 'Kicking', 'Passing', 'Throwing'],
  mental: ['Anticipation', 'Decisions', 'Positioning', 'Concentration', ...],
  physical: ['Agility', 'Reflexes', 'Jumping Reach', ...],
  goalkeeping: ['Handling', 'One on Ones', 'Command of Area', ...]
}

OUTFIELD_ATTRIBUTES = {
  technical: ['Crossing', 'Dribbling', 'Passing', 'Finishing', ...],
  mental: ['Vision', 'Work Rate', 'Teamwork', 'Decisions', ...], 
  physical: ['Pace', 'Stamina', 'Strength', 'Acceleration', ...]
}
```

### Attribute Mappings (HTML abbreviations → Full names)
```typescript
"Cor" → "Corners"
"Cro" → "Crossing"
"Dri" → "Dribbling"
"Fin" → "Finishing"
// ... 50+ mappings in fm-html-parser.ts
```

### Position Analysis Algorithm
1. **Input**: Player attributes + Position requirements (key/preferred attributes)
2. **Scoring**: 
   - Key attributes: Weight 2.0, must be 12+ for good coverage
   - Preferred attributes: Weight 1.0, recommended 12+
   - Overall score: (weighted_total / max_possible) * 100
3. **Coverage Levels**:
   - **Excellent**: Top score 80%+ with backup 60%+
   - **Good**: Top score 70%+ with backup 60%+
   - **Adequate**: Top score 60%+
   - **Poor**: Top score 40-60%
   - **Critical**: Top score <40%

### Tactical Formations
Currently supported: 4-4-2, 4-3-3, 4-2-3-1, 3-5-2, 5-3-2

Position codes: GK, DR/DL, DCR/DCL/DC, WBR/WBL, DMR/DML, MR/ML, MCR/MCL/MC, AMR/AML/AMC, STC

## Frontend Architecture

### Main Component Structure
```typescript
TacticalAnalyzer (main app)
├── ImportModal (drag-drop HTML import)
├── FormationSelector (tactical setup)
├── TacticalPitch (left pane - formation visualization)
└── PositionDetailsPanel (right pane - player analysis)
```

### UI Design System
- **Base**: Tailwind CSS with custom design tokens
- **Components**: Radix UI primitives (buttons, dialogs, selects, etc.)
- **Layout**: Split-screen design optimized for workflow
- **Colors**: Coverage-based color coding (green/blue/yellow/orange/red)
- **Interactions**: Click positions for details, hover for quick info

### State Management
- Local state with React hooks (useState, useEffect)
- API integration via fetch with error handling
- Real-time updates on import/formation changes
- No external state management library (Redux, Zustand) needed

### Key UI Patterns
```typescript
// Coverage color mapping
const getCoverageColor = (level: string) => {
  switch (level) {
    case 'excellent': return 'bg-green-500';
    case 'good': return 'bg-blue-500';
    case 'adequate': return 'bg-yellow-500';
    case 'poor': return 'bg-orange-500';
    case 'critical': return 'bg-red-500';
  }
};

// Position analysis data flow
interface AnalysisResult {
  positionCode: string;
  role: string;
  duty: string;
  playerScores: PlayerPositionScore[];
  averageScore: number;
  coverageLevel: 'excellent' | 'good' | 'adequate' | 'poor' | 'critical';
}
```

## Backend Architecture

### API Design
**Base URL**: `/api`

**Endpoints**:
```
GET  /api/health              # Health check
POST /api/import             # Import HTML squad data
GET  /api/stats              # Database statistics
GET  /api/analysis/tactic    # Current tactic analysis
GET  /api/analysis/recruitment # Recruitment targets
POST /api/tactics            # Create/update tactics
GET  /api/tactics            # List saved tactics
```

### Core Services

**PlayerService**: Manages player data and imports
```typescript
- importPlayersFromHtml(htmlContent: string): ImportResult
- getPlayersWithLatestSnapshot(): PlayerWithSnapshot[]
- getPlayerProgressHistory(playerId: number): ProgressHistory
- getDatabaseStats(): DatabaseStats
```

**TacticService**: Manages tactical configurations
```typescript
- createTactic(formation: string, positions: PositionData[]): Tactic
- getActiveTactic(): Tactic | null
- analyzeTactic(tacticId: number): TacticalAnalysis
```

**PositionAnalyzer**: Core analysis engine
```typescript
- analyzePosition(positionCode, role, duty, players): AnalysisResult
- generateRecruitmentTargets(position, currentPlayers): RecruitmentTargets
```

### HTML Parser Architecture
**FMHtmlParser** class handles FM HTML exports:
1. **DOM parsing**: Extract table structure using JSDOM
2. **Header mapping**: Map abbreviated attribute names to full names
3. **Data validation**: Ensure required columns (Name, Age, CA, PA)
4. **Attribute extraction**: Parse all 50+ attributes per player
5. **Error handling**: Comprehensive validation with detailed feedback

## Development Workflow

### Scripts
```bash
npm run dev          # Start both client and server in development
npm run dev:client   # Frontend only (Vite dev server)
npm run dev:server   # Backend only (tsx with hot reload)
npm run build        # Production build (client + server)
npm run start        # Start production server
npm run check        # TypeScript type checking
npm run db:push      # Apply database schema changes
```

### Development Setup
1. Clone repository
2. Run `npm install`
3. Database auto-initializes on first server start
4. Frontend runs on `localhost:5173`, API on `localhost:3001`
5. Hot reload enabled for both client and server

### File Organization Conventions
- **Interfaces**: Define at top of files, export for reuse
- **Components**: Single responsibility, props interfaces
- **Services**: Class-based for stateful operations
- **Utilities**: Pure functions in `/lib` directories
- **Types**: Shared types in `/shared` directory

### Error Handling Patterns
```typescript
// API responses always include success/error states
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  warnings?: string[];
}

// Parser results include detailed feedback
interface ParseResult {
  success: boolean;
  players: ParsedPlayer[];
  errors: string[];
  warnings: string[];
}
```

## Code Quality Standards

### TypeScript Usage
- **Strict mode**: All strict compiler options enabled
- **Interface definitions**: Comprehensive type coverage
- **Null safety**: Explicit null/undefined handling
- **Generic types**: Used for reusable components and services

### Performance Requirements
- **HTML parsing**: Must complete in <5 seconds for 50+ players
- **Tactical analysis**: Must complete in <3 seconds
- **UI responsiveness**: No blocking operations on main thread
- **Memory usage**: Efficient handling of large squad datasets

### UI/UX Principles
1. **Zero-friction import**: Drag-drop HTML files with instant validation
2. **Immediate value**: Show tactical overview within seconds
3. **Focused interface**: Single-purpose screens, minimal clicks
4. **Clear feedback**: Loading states, error messages, progress indicators

### Accessibility Considerations
- Semantic HTML structure
- Keyboard navigation support
- Color-blind friendly coverage indicators
- Screen reader compatible labels

## Current Features & Status

### ✅ Implemented Features
- **Squad Import**: Complete HTML parser with attribute mapping
- **Database Layer**: Full schema with player snapshots over time
- **Tactical Analysis**: Position scoring with coverage levels
- **Formation Selection**: 5 preset formations with role/duty configuration
- **Visual Interface**: Split-screen tactical pitch with position details
- **Recruitment Targets**: Exportable attribute requirements
- **Player Progression**: Track attribute changes over multiple imports

### ⚠️ Known Limitations
1. **Missing Position Data**: PositionAnalyzer references missing JSON files in `attached_assets/`
2. **Formation Variety**: Limited to 5 preset formations
3. **Testing**: No automated test suite implemented
4. **Error Recovery**: Limited error recovery in parser edge cases

### 🚧 Technical Debt
- **Position analyzer**: Hardcoded file paths need fixing
- **Database queries**: Some use raw SQL instead of Drizzle ORM
- **Type coverage**: Some any types in complex data transformations
- **Component organization**: Some large components could be split

## Deployment & Production

### Build Process
- **Client**: Vite builds to `dist/` with optimized bundles
- **Server**: esbuild creates single `tactical-server.js` file
- **Database**: SQLite files in `/data` directory (auto-created)

### Environment Configuration
```bash
NODE_ENV=production    # Production mode
PORT=3001             # Server port (default)
```

### Production Considerations
- **Static files**: Server serves client build in production
- **Error logging**: Console-based logging (consider structured logging)
- **Database backup**: Manual SQLite file backup recommended
- **Security**: CORS configured for all origins (tighten for production)

## Future Development Guidelines

### Adding New Features
1. **Follow existing patterns**: Service → API → Component → UI
2. **Update database schema**: Use Drizzle migrations
3. **Maintain FM domain accuracy**: Validate against actual FM data
4. **Test with real data**: Import actual FM HTML exports

### Code Contribution Standards
- **TypeScript first**: No JavaScript files
- **Component interfaces**: Props and state typing
- **Error boundaries**: Graceful failure handling
- **Performance testing**: Measure import/analysis times

### Extension Points
- **New formations**: Add to `FORMATIONS` config
- **Position roles**: Extend tactical configuration data  
- **Export formats**: Additional recruitment target formats
- **Analysis algorithms**: Pluggable scoring mechanisms

## Troubleshooting Guide

### Common Issues

**Import Failures**:
- Check HTML structure matches expected FM export format
- Validate required columns (Name, Age, CA, PA, Position)
- Review attribute name mappings in `fm-html-parser.ts`

**Analysis Errors**:
- Verify position data files exist (currently missing)
- Check tactic has active status in database
- Ensure players have required attributes

**Database Issues**:
- Delete `/data` directory to reset database
- Check foreign key constraints on data modifications
- Use `npm run db:push` after schema changes

**Performance Problems**:
- Profile large squad imports (50+ players)
- Monitor memory usage during analysis calculations
- Consider batch processing for multiple formation analysis

### Debug Utilities
```typescript
// Enable detailed logging
console.log('Parser result:', parseResult);
console.log('Analysis data:', analysisResult);

// Database inspection
SELECT * FROM players LIMIT 10;
SELECT COUNT(*) FROM snapshots;
SELECT * FROM position_scores WHERE score > 80;
```

---

## Summary

This FM Tactical Squad Analyzer is a focused, desktop-first tool designed to solve a specific problem for FM players: quickly identifying tactical gaps and recruitment needs. The architecture prioritizes offline functionality, performance, and ease of use over complex features.

The codebase follows modern TypeScript/React patterns with a clear separation between client and server. The domain model accurately reflects FM's tactical system while the UI provides immediate, actionable insights.

Key architectural decisions (SQLite, offline-first, split-screen UI) support the core user workflow: import squad → select formation → identify gaps → export targets.

For future development, maintain focus on the core value proposition while ensuring any new features integrate cleanly with the existing service-oriented architecture.