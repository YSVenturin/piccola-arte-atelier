import { Route, Routes } from "react-router";
import { HomePage } from "./pages/HomePage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { ProductListPage } from "./pages/ProductListPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/produtos" element={<ProductListPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;