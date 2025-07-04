import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import SquadOverview from "@/pages/squad-overview";
import Tactics from "@/pages/tactics";
import TacticEdit from "@/pages/tactic-edit";
import Analytics from "@/pages/analytics";
import Transfers from "@/pages/transfers";
import Sidebar from "@/components/layout/sidebar";

function Router() {
  return (
    <div className="flex h-screen bg-background text-foreground">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Switch>
          <Route path="/" component={SquadOverview} />
          <Route path="/tactics" component={Tactics} />
          <Route path="/tactics/:id/edit" component={TacticEdit} />
          <Route path="/analytics" component={Analytics} />
          <Route path="/transfers" component={Transfers} />
          <Route component={NotFound} />
        </Switch>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
