import { JSDOM } from "jsdom";

// FM attribute name mappings (abbreviation -> full name)
const FM_ATTRIBUTE_MAPPINGS: Record<string, string> = {
  // Technical
  "Cor": "Corners",
  "Cro": "Crossing", 
  "Dri": "Dribbling",
  "Fin": "Finishing",
  "Fir": "First Touch",
  "Fre": "Free Kick Taking",
  "Hea": "Heading",
  "L Th": "Long Throws",
  "Lon": "Long Shots",
  "Mar": "Marking",
  "Pas": "Passing",
  "Pen": "Penalty Taking",
  "Tck": "Tackling",
  "Tec": "Technique",
  
  // Mental
  "Agg": "Aggression",
  "Ant": "Anticipation",
  "Bra": "Bravery",
  "Cmp": "Composure",
  "Cnt": "Concentration",
  "Dec": "Decisions",
  "Det": "Determination",
  "Fla": "Flair",
  "Ldr": "Leadership",
  "OtB": "Off The Ball",
  "Pos": "Positioning",
  "Tea": "Teamwork",
  "Vis": "Vision",
  "Wor": "Work Rate",
  
  // Physical
  "Acc": "Acceleration",
  "Agi": "Agility",
  "Bal": "Balance",
  "Jum": "Jumping Reach",
  "Nat": "Natural Fitness",
  "Pac": "Pace",
  "Sta": "Stamina",
  "Str": "Strength",
  
  // Goalkeeper
  "Aer": "Aerial Reach",
  "Cmd": "Command of Area",
  "Com": "Communication",
  "Ecc": "Eccentricity",
  "Han": "Handling",
  "Kic": "Kicking",
  "1v1": "One on Ones",
  "Ref": "Reflexes",
  "TRO": "Rushing Out",
  "Thr": "Throwing",
  "Pun": "Punching",
};

export interface ParsedPlayer {
  name: string;
  age: number;
  currentAbility: number | null;
  potentialAbility: number | null;
  position: string;
  attributes: Record<string, number>;
}

export interface ParseResult {
  success: boolean;
  players: ParsedPlayer[];
  errors: string[];
  warnings: string[];
}

export class FMHtmlParser {
  private dom: JSDOM;
  
  constructor(htmlContent: string) {
    this.dom = new JSDOM(htmlContent);
  }

  public parse(): ParseResult {
    const result: ParseResult = {
      success: false,
      players: [],
      errors: [],
      warnings: []
    };

    try {
      const table = this.findPlayerTable();
      if (!table) {
        result.errors.push("No player data table found in HTML");
        return result;
      }

      const { headers, headerMap } = this.parseTableHeaders(table);
      if (headers.length === 0) {
        result.errors.push("No valid headers found in table");
        return result;
      }

      const rows = this.getDataRows(table);
      if (rows.length === 0) {
        result.errors.push("No player data rows found");
        return result;
      }

      // Validate required columns
      const requiredColumns = ["Name", "Age", "CA", "PA", "Position"];
      const missingColumns = requiredColumns.filter(col => !headerMap.has(col));
      if (missingColumns.length > 0) {
        result.errors.push(`Missing required columns: ${missingColumns.join(", ")}`);
        return result;
      }

      // Parse each player row
      for (let i = 0; i < rows.length; i++) {
        try {
          const player = this.parsePlayerRow(rows[i], headers, headerMap);
          if (player) {
            result.players.push(player);
          }
        } catch (error) {
          result.warnings.push(`Failed to parse player row ${i + 1}: ${error}`);
        }
      }

      if (result.players.length === 0) {
        result.errors.push("No valid players could be parsed");
        return result;
      }

      result.success = true;
      return result;

    } catch (error) {
      result.errors.push(`Parser error: ${error}`);
      return result;
    }
  }

  private findPlayerTable(): Element | null {
    const document = this.dom.window.document;
    const tables = document.querySelectorAll("table");
    
    // Look for table with player data (should have Name, Age, CA, PA columns)
    for (const table of tables) {
      const firstRow = table.querySelector("tr");
      if (firstRow) {
        const headerText = firstRow.textContent?.toLowerCase() || "";
        if (headerText.includes("name") && headerText.includes("age") && headerText.includes("ca")) {
          return table;
        }
      }
    }
    
    return null;
  }

  private parseTableHeaders(table: Element): { headers: string[], headerMap: Map<string, number> } {
    const headerRow = table.querySelector("tr");
    if (!headerRow) {
      return { headers: [], headerMap: new Map() };
    }

    const headers: string[] = [];
    const headerMap = new Map<string, number>();
    const cells = headerRow.querySelectorAll("th, td");

    cells.forEach((cell, index) => {
      const cellText = cell.textContent?.trim() || "";
      if (cellText) {
        // Map abbreviated attribute names to full names
        const fullName = FM_ATTRIBUTE_MAPPINGS[cellText] || cellText;
        headers.push(fullName);
        headerMap.set(fullName, index);
        
        // Also map original abbreviated name
        if (cellText !== fullName) {
          headerMap.set(cellText, index);
        }
      }
    });

    return { headers, headerMap };
  }

  private getDataRows(table: Element): Element[] {
    const rows = Array.from(table.querySelectorAll("tr"));
    // Skip header row (first row)
    return rows.slice(1).filter(row => {
      const cells = row.querySelectorAll("td");
      return cells.length > 0;
    });
  }

  private parsePlayerRow(row: Element, headers: string[], headerMap: Map<string, number>): ParsedPlayer | null {
    const cells = row.querySelectorAll("td");
    if (cells.length === 0) return null;

    // Extract basic info
    const nameIndex = headerMap.get("Name");
    const ageIndex = headerMap.get("Age");
    const caIndex = headerMap.get("CA");
    const paIndex = headerMap.get("PA");
    const positionIndex = headerMap.get("Position");

    if (nameIndex === undefined || ageIndex === undefined || positionIndex === undefined) {
      throw new Error("Missing required player data columns");
    }

    const name = cells[nameIndex]?.textContent?.trim();
    const ageText = cells[ageIndex]?.textContent?.trim();
    const caText = cells[caIndex]?.textContent?.trim();
    const paText = cells[paIndex]?.textContent?.trim();
    const position = cells[positionIndex]?.textContent?.trim();

    if (!name || !ageText || !position) {
      throw new Error("Missing required player data");
    }

    const age = parseInt(ageText);
    if (isNaN(age)) {
      throw new Error(`Invalid age: ${ageText}`);
    }

    const currentAbility = caText ? parseInt(caText) : null;
    const potentialAbility = paText ? parseInt(paText) : null;

    // Extract attributes
    const attributes: Record<string, number> = {};
    
    for (let i = 0; i < headers.length; i++) {
      const header = headers[i];
      
      // Skip non-attribute columns
      if (["Name", "Age", "CA", "PA", "Position"].includes(header)) {
        continue;
      }
      
      const cellValue = cells[i]?.textContent?.trim();
      if (cellValue && cellValue !== "-" && cellValue !== "") {
        const numValue = parseInt(cellValue);
        if (!isNaN(numValue)) {
          attributes[header] = numValue;
        }
      }
    }

    return {
      name,
      age,
      currentAbility,
      potentialAbility,
      position,
      attributes
    };
  }
}

// Utility function to validate FM HTML structure
export function validateFMHtmlStructure(htmlContent: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  try {
    const dom = new JSDOM(htmlContent);
    const document = dom.window.document;
    
    // Check for basic HTML structure
    if (!document.querySelector("table")) {
      errors.push("No HTML table found");
    }
    
    // Check for player-like data
    const tables = document.querySelectorAll("table");
    let hasPlayerTable = false;
    
    for (const table of tables) {
      const firstRow = table.querySelector("tr");
      if (firstRow) {
        const headerText = firstRow.textContent?.toLowerCase() || "";
        if (headerText.includes("name") && headerText.includes("age")) {
          hasPlayerTable = true;
          break;
        }
      }
    }
    
    if (!hasPlayerTable) {
      errors.push("No valid FM player data table found");
    }
    
  } catch (error) {
    errors.push(`HTML parsing error: ${error}`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}