import { QueryProvider } from "./app/providers/query-provider";
import { AppRouter } from "./app/router";

function App() {
  return (
    <QueryProvider>
      <AppRouter />
    </QueryProvider>
  );
}

export default App;
