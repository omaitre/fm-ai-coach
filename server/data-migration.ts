// Data migration script to populate position role duty attributes with authentic FM data
import { storage } from "./storage";
import { FM_POSITION_DATA, getRoleDutyAttributes } from "@shared/fm-position-data";

interface MigrationResult {
  success: boolean;
  processed: number;
  errors: string[];
  details: Array<{
    positionCode: string;
    roleCode: string;
    duty: string;
    status: 'created' | 'updated' | 'error';
    error?: string;
  }>;
}

export async function migrateFMPositionData(): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: true,
    processed: 0,
    errors: [],
    details: []
  };

  try {
    console.log("Starting FM position data migration...");
    
    for (const [positionCode, positionData] of Object.entries(FM_POSITION_DATA)) {
      for (const [roleCode, roleData] of Object.entries(positionData.roles)) {
        for (const [duty, attributeData] of Object.entries(roleData.duties)) {
          try {
            // Check if this combination already exists
            const existing = await storage.getPositionRoleDutyAttribute(
              positionCode, 
              roleData.name, 
              duty
            );

            const attributeRecord = {
              positionCode,
              roleName: roleData.name,
              duty,
              keyAttributes: JSON.stringify(attributeData.key_attributes),
              preferableAttributes: JSON.stringify(attributeData.preferred_attributes)
            };

            if (existing) {
              // Update existing record
              await storage.updatePositionRoleDutyAttribute(
                positionCode,
                roleData.name,
                duty,
                attributeRecord
              );
              
              result.details.push({
                positionCode,
                roleCode,
                duty,
                status: 'updated'
              });
            } else {
              // Create new record
              await storage.createPositionRoleDutyAttribute(attributeRecord);
              
              result.details.push({
                positionCode,
                roleCode,
                duty,
                status: 'created'
              });
            }

            result.processed++;
            
          } catch (error) {
            const errorMsg = `Failed to process ${positionCode}-${roleCode}-${duty}: ${error}`;
            result.errors.push(errorMsg);
            result.details.push({
              positionCode,
              roleCode,
              duty,
              status: 'error',
              error: errorMsg
            });
            console.error(errorMsg);
          }
        }
      }
    }

    if (result.errors.length > 0) {
      result.success = false;
      console.error(`Migration completed with ${result.errors.length} errors`);
    } else {
      console.log(`Migration successful: ${result.processed} records processed`);
    }

  } catch (error) {
    result.success = false;
    result.errors.push(`Migration failed: ${error}`);
    console.error("Migration failed:", error);
  }

  return result;
}

// Validation function to check data integrity after migration
export async function validateMigrationData(): Promise<{
  isValid: boolean;
  issues: string[];
  summary: {
    totalCombinations: number;
    migratedCombinations: number;
    missingCombinations: string[];
  };
}> {
  const issues: string[] = [];
  const missingCombinations: string[] = [];
  let totalCombinations = 0;
  let migratedCombinations = 0;

  try {
    // Count expected combinations
    for (const [positionCode, positionData] of Object.entries(FM_POSITION_DATA)) {
      for (const [roleCode, roleData] of Object.entries(positionData.roles)) {
        for (const duty of Object.keys(roleData.duties)) {
          totalCombinations++;
          
          try {
            const existing = await storage.getPositionRoleDutyAttribute(
              positionCode,
              roleData.name,
              duty
            );
            
            if (existing) {
              migratedCombinations++;
              
              // Validate attribute data
              try {
                const keyAttrs = JSON.parse(existing.keyAttributes || '[]');
                const prefAttrs = JSON.parse(existing.preferableAttributes || '[]');
                
                if (!Array.isArray(keyAttrs) || !Array.isArray(prefAttrs)) {
                  issues.push(`Invalid attribute format for ${positionCode}-${roleData.name}-${duty}`);
                }
              } catch (e) {
                issues.push(`Invalid JSON in attributes for ${positionCode}-${roleData.name}-${duty}`);
              }
            } else {
              missingCombinations.push(`${positionCode}-${roleData.name}-${duty}`);
            }
          } catch (error) {
            issues.push(`Error checking ${positionCode}-${roleData.name}-${duty}: ${error}`);
          }
        }
      }
    }

  } catch (error) {
    issues.push(`Validation failed: ${error}`);
  }

  return {
    isValid: issues.length === 0 && missingCombinations.length === 0,
    issues,
    summary: {
      totalCombinations,
      migratedCombinations,
      missingCombinations
    }
  };
}