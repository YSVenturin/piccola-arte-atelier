import { useLocation } from "react-router";

import { getRouteMetadata } from "./config/pageMetadata";
import { usePageMetadata } from "./hooks/usePageMetadata";
import { AppRoutes } from "./routes/AppRoutes";

function App() {
  const { pathname } = useLocation();
  usePageMetadata(getRouteMetadata(pathname));

  return <AppRoutes />;
}

export default App;
