# FM Tactical Squad Analyzer - Product Requirements Document

## Product Vision
**A focused desktop tool that analyzes Football Manager squads against tactical setups to identify player-position mismatches and recruitment gaps, helping FM players optimize their tactics and transfer strategy.**

## Core Value Proposition
Transform the tedious manual process of evaluating which players fit which tactical roles into an instant, visual analysis that shows:
- Which positions are well-covered vs. have gaps
- Specific attribute targets for recruitment
- Player progression over time

---

## Target Users

### Primary: Serious FM Players
- Play FM 2+ hours per week
- Manage teams across full seasons
- Care about tactical optimization
- Currently do manual player-role analysis

### Secondary: Casual FM Players  
- Play FM seasonally/sporadically
- Want quick tactical insights
- Less time for manual analysis
- Use tool 2x per year (transfer windows)

---

## Core User Journey

```
Open Tool → Select Formation → Define Roles/Duties → Upload Squad HTML → 
Get Tactical Analysis → Identify Gaps → Export Recruitment Targets
```

**Success Metric**: User returns every transfer window (2x/year retention)

---

## Core Features (MVP)

### 1. Squad Import (Zero Error Tolerance)
**Input**: FM Squad View HTML export
**Output**: Parsed player database with all attributes

**Requirements**:
- Parse HTML table structure accurately
- Extract all 50+ attributes per player
- Handle position abbreviations (D(LC), M/AM(R), etc.)
- Store player data locally (SQLite)
- Smart player recognition across imports (name + age matching)
- Show import validation summary

**Success Criteria**: 100% attribute accuracy, zero parsing errors

### 2. Tactic Definition (Minimal Friction)
**Input**: Formation selection + role/duty assignment
**Output**: Tactical template for analysis

**Requirements**:
- Preset formations: 4-4-2, 4-3-3, 4-2-3-1, 3-5-2, 5-3-2, etc. (~12 most common)
- Dropdown role selection per position
- Dropdown duty selection per role
- Save/load custom tactics locally
- Default role suggestions per formation

**Success Criteria**: Create tactic in <2 minutes

### 3. Position Analysis Engine
**Input**: Squad data + tactical setup
**Output**: Player suitability scores per position

**Algorithm**:
- Score players using key + preferred attributes for each role/duty combination
- Weight key attributes higher than preferred
- Generate 0-100 suitability score
- Rank top 5 players per position
- Identify attribute gaps (what's missing for ideal fit)

**Success Criteria**: Accurate role-suitability rankings that match FM logic

### 4. Visual Tactical Report
**Layout**: Split screen design
- **Left Pane**: Tactical formation with color-coded positions
  - Green: Well covered (multiple good options)
  - Yellow: Adequate (one good option)
  - Red: Gap (no good options)
- **Right Pane**: Position detail view
  - Top 5 player rankings for selected position
  - Suitability scores and key attribute breakdown
  - Specific recruitment targets ("Need: Crossing 15+, Pace 12+")

**Success Criteria**: User can identify worst positions and recruitment needs in <30 seconds

### 5. Recruitment Intelligence
**Output**: Actionable attribute targets per position

**Requirements**:
- Show specific attribute values needed to fill gaps
- Format for FM scouting searches
- Export recruitment brief (text/CSV)
- Position priority ranking (worst gaps first)

**Success Criteria**: User can immediately run FM scout search with provided criteria

### 6. Player Progression Tracking
**Input**: Multiple HTML imports over time
**Output**: Player development analysis

**Requirements**:
- Auto-detect same players across imports (name + age matching)
- Show attribute changes over time
- Flag improved/declined players
- Position suitability evolution

**Success Criteria**: Track player development accurately across seasons

---

## Technical Requirements

### Architecture
- **Desktop Application**: Electron or native desktop
- **Offline-First**: All data stored locally
- **File-Based**: SQLite database, no server required
- **Single User**: Personal tool, no multi-user features

### Data Storage
- **Players Table**: Name, Age, CA, PA, Attributes, Import Date
- **Imports Table**: Import metadata and file references  
- **Tactics Table**: Saved tactical setups
- **Analysis Table**: Cached position analysis results

### Performance
- Parse HTML import in <5 seconds
- Generate tactical analysis in <3 seconds
- Support squads up to 50 players
- Handle 10+ historical imports per player

---

## Feature Boundaries (What We DON'T Build)

### Explicitly Excluded
- ❌ Complex analytics/charts (focus on actionable insights only)
- ❌ Multi-team comparisons
- ❌ Advanced statistical analysis
- ❌ Social features or sharing
- ❌ Tactic creation from scratch (presets only)
- ❌ Player value/contract analysis
- ❌ Match performance integration
- ❌ Cloud sync or online features

---

## Success Metrics

### Primary KPIs
1. **User Retention**: % of users who return within 6 months
2. **Session Value**: Time from import to actionable insight <5 minutes
3. **Feature Adoption**: % of users who export recruitment targets

### Secondary KPIs  
4. **Import Accuracy**: Zero reported attribute parsing errors
5. **User Efficiency**: Avg time to identify top 3 problem positions
6. **Tool Stickiness**: Number of tactics analyzed per user

---

## User Experience Principles

### 1. Zero-Friction Import
- Drag-and-drop HTML files
- Instant validation feedback
- Clear error messages if parsing fails

### 2. Immediate Value
- Show tactical overview within seconds of import
- Highlight biggest gaps prominently
- Provide actionable next steps

### 3. Focused Interface
- Single-purpose screens
- Minimal clicks to core insights
- No feature bloat or unnecessary options

### 4. Recruitment-Ready Output
- Copy-pasteable search criteria
- Formatted for FM scouting interface
- Specific, achievable attribute targets

---

## Technical Deliverables

### Phase 1: Core Engine (Week 1-2)
- HTML parser + validation
- Tactical position analysis algorithm
- Basic UI wireframes

### Phase 2: UI Implementation (Week 3-4)  
- Split-pane tactical view
- Position analysis interface
- Formation/role selection

### Phase 3: Intelligence Layer (Week 5-6)
- Recruitment target generation
- Player progression tracking
- Export functionality

### Phase 4: Polish & Testing (Week 7-8)
- Error handling
- Performance optimization
- User testing and refinement

---

## Competitive Analysis

### Current User Behavior
- **FM In-Game**: Manual position switching, difficult to compare
- **Spreadsheets**: Time-consuming, error-prone attribute entry
- **Existing Tools**: Either too complex or lack tactical focus

### Our Advantage
- **Speed**: Instant HTML import vs. manual entry
- **Focus**: Tactical analysis only, no feature bloat  
- **Actionability**: Direct recruitment targets vs. generic analysis
- **Simplicity**: Works offline, no setup required

---

## Risk Mitigation

### Technical Risks
- **HTML parsing failures**: Extensive testing with various FM versions
- **Attribute mapping errors**: Comprehensive validation suite
- **Performance issues**: Optimize for 50+ player squads

### Product Risks
- **Low user adoption**: Focus on transfer window timing/marketing
- **Feature creep**: Strict scope boundaries, resist additional features
- **User abandonment**: Prioritize immediate value over comprehensive features

---

## Definition of Done

### MVP Success Criteria
1. ✅ Parse FM HTML exports with 100% accuracy
2. ✅ Generate tactical analysis in <30 seconds
3. ✅ Show clear position gaps with specific recruitment targets
4. ✅ Export actionable scouting criteria
5. ✅ Track player progression across multiple imports
6. ✅ Run offline on Windows/Mac/Linux

### User Validation
- 5 target users can complete full workflow (import → analysis → recruitment targets) in <5 minutes
- Zero critical bugs in parsing or analysis logic
- User reports this saves 30+ minutes vs. manual analysis

**Ready for Claude Code implementation when all MVP criteria are met.**