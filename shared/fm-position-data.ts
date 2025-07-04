// Comprehensive Football Manager Position/Role/Duty Data
// Compiled from authentic FM role requirements

export interface RoleDutyAttributes {
  key_attributes: string[];
  preferred_attributes: string[];
}

export interface Role {
  name: string;
  duties: Record<string, RoleDutyAttributes>;
}

export interface Position {
  name: string;
  roles: Record<string, Role>;
}

export interface PositionData {
  positions: Record<string, Position>;
}

// Individual position data imports
import * as fs from "fs";
import * as path from "path";

// Note: This module loads authentic Football Manager position/role/duty data
// from JSON files containing official FM attribute requirements

// Load JSON data function
function loadPositionData(filename: string): PositionData {
  try {
    const filePath = path.join(process.cwd(), "attached_assets", filename);
    const rawData = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(rawData) as PositionData;
  } catch (error) {
    console.error(`Failed to load position data from ${filename}:`, error);
    return { positions: {} };
  }
}

// Load all position data
const stData = loadPositionData("st_position_data_1750867479841.json");
const amlData = loadPositionData("aml_position_data_1750867479842.json");
const amrData = loadPositionData("amr_position_data_1750867479842.json");
const amcData = loadPositionData("amc_position_data_1750867479843.json");
const mcData = loadPositionData("mc_position_data_1750867479843.json");
const dmData = loadPositionData("dm_position_data_1750867479843.json");
const mlData = loadPositionData("ml_position_data_1750867479843.json");
const mrData = loadPositionData("mr_position_data_1750867479843.json");
const cdData = loadPositionData("cd_position_data_1750867479844.json");
const dlData = loadPositionData("dl_position_data_1750867479844.json");
const drData = loadPositionData("dr_position_data_1750867479844.json");
const gkData = loadPositionData("gk_position_data_1750867479844.json");

// Unified FM position data structure
export const FM_POSITION_DATA: Record<string, Position> = {
  // Goalkeeper
  GK: gkData.positions.GK,
  
  // Defenders
  DR: drData.positions.DR,
  DL: dlData.positions.DL,
  CD: cdData.positions.CD,
  DCR: cdData.positions.CD, // Reuse CD data for right center back
  DCL: cdData.positions.CD, // Reuse CD data for left center back
  DC: cdData.positions.CD,  // Reuse CD data for center back
  
  // Midfielders
  DM: dmData.positions.DM,
  DMR: dmData.positions.DM, // Reuse DM data for right defensive mid
  DML: dmData.positions.DM, // Reuse DM data for left defensive mid
  MC: mcData.positions.MC,
  MCR: mcData.positions.MC, // Reuse MC data for right center mid
  MCL: mcData.positions.MC, // Reuse MC data for left center mid
  MR: mrData.positions.MR,
  ML: mlData.positions.ML,
  
  // Attacking Midfielders
  AMC: amcData.positions.AMC,
  AMR: amrData.positions.AMR,
  AML: amlData.positions.AML,
  
  // Forwards
  ST: stData.positions.ST,
  STC: stData.positions.ST, // Reuse ST data for center striker
  
  // Wing Backs (use defender data as base)
  WBR: drData.positions.DR,
  WBL: dlData.positions.DL,
};

// Utility functions for position data access
export function getPositionData(positionCode: string): Position | null {
  return FM_POSITION_DATA[positionCode] || null;
}

export function getPositionRoles(positionCode: string): string[] {
  const position = getPositionData(positionCode);
  return position ? Object.keys(position.roles) : [];
}

export function getRoleName(positionCode: string, roleCode: string): string {
  const position = getPositionData(positionCode);
  return position?.roles[roleCode]?.name || roleCode;
}

export function getRoleDuties(positionCode: string, roleCode: string): string[] {
  const position = getPositionData(positionCode);
  const role = position?.roles[roleCode];
  return role ? Object.keys(role.duties) : [];
}

export function getRoleDutyAttributes(
  positionCode: string, 
  roleCode: string, 
  duty: string
): RoleDutyAttributes | null {
  const position = getPositionData(positionCode);
  const role = position?.roles[roleCode];
  return role?.duties[duty] || null;
}

// Validation functions
export function isValidPositionCode(positionCode: string): boolean {
  return positionCode in FM_POSITION_DATA;
}

export function isValidRoleForPosition(positionCode: string, roleCode: string): boolean {
  const position = getPositionData(positionCode);
  return position ? roleCode in position.roles : false;
}

export function isValidDutyForRole(positionCode: string, roleCode: string, duty: string): boolean {
  const position = getPositionData(positionCode);
  const role = position?.roles[roleCode];
  return role ? duty in role.duties : false;
}

// Export all position codes for easy reference
export const ALL_POSITION_CODES = Object.keys(FM_POSITION_DATA);

// Export role codes by position for UI components
export const POSITION_ROLE_MAP: Record<string, string[]> = Object.fromEntries(
  Object.entries(FM_POSITION_DATA).map(([posCode, position]) => [
    posCode,
    Object.keys(position.roles)
  ])
);