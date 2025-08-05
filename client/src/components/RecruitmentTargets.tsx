import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { AlertTriangle, Target } from 'lucide-react';

interface RecruitmentTarget {
  position: string;
  targets: string[];
}

interface RecruitmentTargetsProps {
  targets: RecruitmentTarget[];
}

export function RecruitmentTargets({ targets }: RecruitmentTargetsProps) {
  if (targets.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center text-gray-500">
            <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No recruitment priorities identified</p>
            <p className="text-sm">Your squad coverage looks good!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-orange-500" />
          Recruitment Priorities
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {targets.map((target, index) => (
          <div key={index} className="border rounded-lg p-4">
            <div className="font-medium mb-2">{target.position}</div>
            <div className="space-y-1">
              {target.targets.map((targetText, targetIndex) => (
                <Badge key={targetIndex} variant="outline" className="mr-2 mb-2">
                  {targetText}
                </Badge>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}