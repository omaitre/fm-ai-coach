import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Search, TrendingUp, Target } from "lucide-react";

export default function Transfers() {

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <header className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground">Transfer Analysis</h2>
            <p className="text-sm text-muted-foreground">Coming soon - Evaluate potential signings using HTML exports</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-6">
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="opacity-50">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">HTML Import</h3>
                  <p className="text-sm text-muted-foreground">Coming soon</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="opacity-50">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                  <Search className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Search Database</h3>
                  <p className="text-sm text-muted-foreground">Coming soon</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="opacity-50">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Market Analysis</h3>
                  <p className="text-sm text-muted-foreground">Coming soon</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Transfer Analysis Guide */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              How Transfer Analysis Will Work
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-foreground mb-3">Future Process</h4>
                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                  <li>Export player data from FM as HTML</li>
                  <li>Import transfer targets using HTML export</li>
                  <li>Compare against your current squad</li>
                  <li>Get instant position suitability analysis</li>
                </ol>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-3">Planned Features</h4>
                <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                  <li>Position suitability scores for your active tactic</li>
                  <li>Direct comparison with current squad members</li>
                  <li>Strength and weakness identification</li>
                  <li>Age and potential evaluation</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Empty State */}
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-6" />
            <h3 className="text-xl font-semibold text-foreground mb-4">Transfer Analysis Coming Soon</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Transfer target evaluation will be available in a future update, using HTML exports for consistent data import.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
