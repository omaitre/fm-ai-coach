import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import {
  Upload,
  Download,
  Search,
  Users,
  Calendar,
  Star,
  FileText,
} from "lucide-react";
import PlayerCard from "@/components/players/player-card";
import { PlayerTable } from "@/components/players/player-table";

import HtmlImportModal from "@/components/players/html-import-modal";

interface SquadStats {
  totalPlayers: number;
  averageAge: number;
  averageCA: number;
}

interface Player {
  id: number;
  name: string;
  age?: number;
  positions?: string[];
  latestSnapshot?: {
    id: number;
    currentAbility?: number;
    potentialAbility?: number;
    snapshotDate: string;
  };
  attributes?: Array<{
    attributeName: string;
    attributeValue: number;
    attributeCategory: string;
  }>;
}

export default function SquadOverview() {
  const [isHtmlImportModalOpen, setIsHtmlImportModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [positionFilter, setPositionFilter] = useState("all");
  const [ageFilter, setAgeFilter] = useState("all");
  const [selectedPositionAnalysis, setSelectedPositionAnalysis] = useState("");

  const { data: squadStats, isLoading: statsLoading } = useQuery<SquadStats>({
    queryKey: ["/api/squad/stats"],
  });

  const {
    data: players,
    isLoading: playersLoading,
    refetch: refetchPlayers,
  } = useQuery<Player[]>({
    queryKey: ["/api/players"],
  });

  const { data: activeTactic } = useQuery({
    queryKey: ["/api/tactics/active"],
  });

  const filteredPlayers =
    players?.filter((player) => {
      const matchesSearch = player.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

      const matchesAge =
        ageFilter === "all" ||
        (() => {
          const age = player.age || 0;
          switch (ageFilter) {
            case "under21":
              return age < 21;
            case "21-25":
              return age >= 21 && age <= 25;
            case "26-30":
              return age >= 26 && age <= 30;
            case "over30":
              return age > 30;
            default:
              return true;
          }
        })();

      const matchesPosition = positionFilter === "all" || (() => {
        if (!player.positions || player.positions.length === 0) return false;
        
        const playerPositions = player.positions;
        switch (positionFilter) {
          case "goalkeeper":
            return playerPositions.includes("GK");
          case "centreback":
            return playerPositions.some(pos => ["DC", "DCR", "DCL"].includes(pos));
          case "fullback":
            return playerPositions.some(pos => ["DL", "DR", "WBL", "WBR"].includes(pos));
          case "defensivemidfielder":
            return playerPositions.some(pos => ["DM", "DMCR", "DMCL"].includes(pos));
          case "midfielder":
            return playerPositions.some(pos => ["MC", "MCR", "MCL"].includes(pos));
          case "attackingmidfielder":
            return playerPositions.some(pos => ["AMC", "AMCR", "AMCL"].includes(pos));
          case "winger":
            return playerPositions.some(pos => ["MR", "ML", "AMR", "AML"].includes(pos));
          case "striker":
            return playerPositions.some(pos => ["STC", "STR", "STL"].includes(pos));
          default:
            return true;
        }
      })();

      return matchesSearch && matchesAge && matchesPosition;
    }) || [];

  return (
    <>
      {/* Header */}
      <header className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground">
              Squad Overview
            </h2>
            <p className="text-sm text-muted-foreground">
              Manage your players and analyze squad depth
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              onClick={() => setIsHtmlImportModalOpen(true)}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <FileText className="w-4 h-4 mr-2" />
              Import Squad
            </Button>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="fm-stat-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Total Players</p>
                  <p className="text-2xl font-bold text-foreground">
                    {statsLoading ? "..." : squadStats?.totalPlayers || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Users className="text-primary text-xl" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="fm-stat-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Avg Squad Age</p>
                  <p className="text-2xl font-bold text-foreground">
                    {statsLoading ? "..." : squadStats?.averageAge || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                  <Calendar className="text-blue-400 text-xl" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="fm-stat-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">
                    Avg Current Ability
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {statsLoading ? "..." : squadStats?.averageCA || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-yellow-500/10 rounded-lg flex items-center justify-center">
                  <Star className="text-yellow-400 text-xl" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter and Search */}
        <Card className="p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search players..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full sm:w-64"
                />
              </div>

              <Select value={positionFilter} onValueChange={setPositionFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="All Positions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Positions</SelectItem>
                  <SelectItem value="goalkeeper">Goalkeeper</SelectItem>
                  <SelectItem value="centreback">Centre Back</SelectItem>
                  <SelectItem value="fullback">Full Back</SelectItem>
                  <SelectItem value="defensivemidfielder">Defensive Mid</SelectItem>
                  <SelectItem value="midfielder">Midfielder</SelectItem>
                  <SelectItem value="attackingmidfielder">Attacking Mid</SelectItem>
                  <SelectItem value="winger">Winger</SelectItem>
                  <SelectItem value="striker">Striker</SelectItem>
                </SelectContent>
              </Select>

              <Select value={ageFilter} onValueChange={setAgeFilter}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue placeholder="All Ages" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Ages</SelectItem>
                  <SelectItem value="under21">Under 21</SelectItem>
                  <SelectItem value="21-25">21-25</SelectItem>
                  <SelectItem value="26-30">26-30</SelectItem>
                  <SelectItem value="over30">Over 30</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <label className="text-sm text-muted-foreground whitespace-nowrap">
                Position Analysis:
              </label>
              <Select
                value={selectedPositionAnalysis}
                onValueChange={setSelectedPositionAnalysis}
              >
                <SelectTrigger className="w-30">
                  <SelectValue placeholder="Select Position" />
                </SelectTrigger>
                <SelectContent>
                  {activeTactic &&
                    activeTactic.positions &&
                    Array.isArray(activeTactic.positions) &&
                    activeTactic.positions.map((position: any) => (
                      <SelectItem
                        key={position.id}
                        value={position.id.toString()}
                      >
                        {position.positionName}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Player Grid */}
        {playersLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="h-64 animate-pulse">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                    <div className="space-y-2">
                      <div className="h-3 bg-muted rounded"></div>
                      <div className="h-3 bg-muted rounded w-5/6"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredPlayers.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No players found
              </h3>
              <p className="text-muted-foreground mb-4">
                {players?.length === 0
                  ? "Start building your squad by importing player data from Football Manager."
                  : "Try adjusting your search filters to find more players."}
              </p>
              <div className="flex gap-3 justify-center">
                <Button onClick={() => setIsHtmlImportModalOpen(true)}>
                  <FileText className="w-4 h-4 mr-2" />
                  Import Squad
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <PlayerTable
            players={filteredPlayers}
            selectedPositionId={
              selectedPositionAnalysis
                ? parseInt(selectedPositionAnalysis)
                : undefined
            }
          />
        )}
      </main>

      <HtmlImportModal
        isOpen={isHtmlImportModalOpen}
        onClose={() => setIsHtmlImportModalOpen(false)}
        onSuccess={() => {
          refetchPlayers();
          setIsHtmlImportModalOpen(false);
        }}
      />
    </>
  );
}
