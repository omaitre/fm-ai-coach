import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { 
  Users, 
  ChevronRight, 
  BarChart3, 
  ArrowRightLeft, 
  Target
} from "lucide-react";

export default function Sidebar() {
  const [location] = useLocation();
  const { data: activeTactic } = useQuery({
    queryKey: ["/api/tactics/active"],
  });

  const navItems = [
    {
      path: "/",
      label: "Squad Overview",
      icon: Users,
      active: location === "/",
    },
    {
      path: "/tactics",
      label: "Tactics",
      icon: Target,
      active: location === "/tactics",
    },
    {
      path: "/analytics",
      label: "Analytics",
      icon: BarChart3,
      active: location === "/analytics",
    },
    {
      path: "/transfers",
      label: "Transfers",
      icon: ArrowRightLeft,
      active: location === "/transfers",
    },
  ];

  return (
    <div className="w-64 fm-sidebar flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <Target className="text-primary-foreground text-lg" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">FM Tracker</h1>
            <p className="text-xs text-muted-foreground">Squad Analytics</p>
          </div>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.path}>
                <Link href={item.path}>
                  <div className={`fm-nav-item ${item.active ? "active" : ""}`}>
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      
      {/* Active Tactic Info */}
      <div className="p-4 border-t border-border">
        <Card className="p-4">
          <h3 className="text-sm font-medium text-foreground mb-2">Current Tactic</h3>
          <p className="text-xs text-muted-foreground mb-3">
            {activeTactic?.name || "No active tactic"}
          </p>
          <Link href="/tactics">
            <Button className="w-full" size="sm">
              Manage Tactics
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </Card>
      </div>
    </div>
  );
}
