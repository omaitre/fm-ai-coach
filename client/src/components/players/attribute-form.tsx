import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { TECHNICAL_ATTRIBUTES, MENTAL_ATTRIBUTES, PHYSICAL_ATTRIBUTES } from "@/lib/constants";

interface AttributeFormProps {
  attributes: {
    technical: Record<string, string>;
    mental: Record<string, string>;
    physical: Record<string, string>;
  };
  onAttributeChange: (attributes: AttributeFormProps['attributes']) => void;
}

export default function AttributeForm({ attributes, onAttributeChange }: AttributeFormProps) {
  const handleAttributeChange = (category: 'technical' | 'mental' | 'physical', attribute: string, value: string) => {
    onAttributeChange({
      ...attributes,
      [category]: {
        ...attributes[category],
        [attribute]: value,
      },
    });
  };

  const renderAttributeSection = (
    title: string,
    category: 'technical' | 'mental' | 'physical',
    attributeList: string[]
  ) => (
    <div>
      <h4 className="text-lg font-semibold text-foreground mb-4">{title}</h4>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {attributeList.map((attribute) => (
          <div key={attribute}>
            <Label className="block text-xs text-muted-foreground mb-1">
              {attribute}
            </Label>
            <Input
              type="number"
              min="1"
              max="20"
              value={attributes[category][attribute] || ""}
              onChange={(e) => handleAttributeChange(category, attribute, e.target.value)}
              className="w-full text-sm"
              placeholder="1-20"
            />
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {renderAttributeSection("Technical Attributes", "technical", TECHNICAL_ATTRIBUTES)}
      {renderAttributeSection("Mental Attributes", "mental", MENTAL_ATTRIBUTES)}
      {renderAttributeSection("Physical Attributes", "physical", PHYSICAL_ATTRIBUTES)}
    </div>
  );
}
