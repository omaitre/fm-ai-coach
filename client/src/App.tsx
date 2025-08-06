import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { TacticalAnalyzer } from "./TacticalAnalyzer";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TacticalAnalyzer />
    </QueryClientProvider>
  );
}

export default App;