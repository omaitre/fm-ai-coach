import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Users, Target } from "lucide-react";

export default function Analytics() {
  const { data: squadStats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/squad/stats"],
  });

  const { data: players, isLoading: playersLoading } = useQuery({
    queryKey: ["/api/players"],
  });

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <header className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground">Analytics Dashboard</h2>
            <p className="text-sm text-muted-foreground">Track squad progression and performance insights</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-6">
        {/* Squad Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Players</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? "..." : squadStats?.totalPlayers || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Active squad members
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Age</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? "..." : squadStats?.averageAge || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Squad maturity level
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Current Ability</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? "..." : squadStats?.averageCA || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Overall squad quality
              </p>
            </CardContent>
          </Card>


        </div>

        {/* Age Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Age Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {playersLoading ? (
                  <div className="space-y-2">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="h-4 bg-muted rounded animate-pulse"></div>
                    ))}
                  </div>
                ) : (
                  <>
                    {[
                      { label: "Under 21", range: [0, 20], color: "bg-green-500" },
                      { label: "21-25", range: [21, 25], color: "bg-blue-500" },
                      { label: "26-30", range: [26, 30], color: "bg-yellow-500" },
                      { label: "Over 30", range: [31, 50], color: "bg-red-500" },
                    ].map(({ label, range, color }) => {
                      const count = players?.filter((p: any) => 
                        p.age >= range[0] && p.age <= range[1]
                      ).length || 0;
                      const percentage = players?.length ? (count / players.length) * 100 : 0;
                      
                      return (
                        <div key={label} className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>{label}</span>
                            <span>{count} players</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${color}`}
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ability Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {playersLoading ? (
                  <div className="space-y-2">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="h-4 bg-muted rounded animate-pulse"></div>
                    ))}
                  </div>
                ) : (
                  <>
                    {[
                      { label: "Elite (170+)", range: [170, 200], color: "bg-green-500" },
                      { label: "High (150-169)", range: [150, 169], color: "bg-blue-500" },
                      { label: "Good (130-149)", range: [130, 149], color: "bg-yellow-500" },
                      { label: "Average (0-129)", range: [0, 129], color: "bg-gray-500" },
                    ].map(({ label, range, color }) => {
                      const count = players?.filter((p: any) => {
                        const ca = p.latestSnapshot?.currentAbility || 0;
                        return ca >= range[0] && ca <= range[1];
                      }).length || 0;
                      const percentage = players?.length ? (count / players.length) * 100 : 0;
                      
                      return (
                        <div key={label} className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>{label}</span>
                            <span>{count} players</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${color}`}
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {playersLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-muted rounded-full animate-pulse"></div>
                    <div className="flex-1 space-y-1">
                      <div className="h-4 bg-muted rounded w-3/4 animate-pulse"></div>
                      <div className="h-3 bg-muted rounded w-1/2 animate-pulse"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : players?.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No recent activity to display</p>
                <p className="text-sm text-muted-foreground">Add some players to see activity here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {players?.slice(0, 5).map((player: any) => (
                  <div key={player.id} className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <Users className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{player.name} was added to the squad</p>
                      <p className="text-xs text-muted-foreground">
                        {player.latestSnapshot?.snapshotDate 
                          ? new Date(player.latestSnapshot.snapshotDate).toLocaleDateString()
                          : "Recently"
                        }
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      CA: {player.latestSnapshot?.currentAbility || "N/A"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
