import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import Categories from "./pages/Categories";
import CategoryDetail from "./pages/CategoryDetail";
import ProjectDetail from "./pages/ProjectDetail";
import Wizard from "./pages/Wizard";
import ContentPackage from "./pages/ContentPackage";
import ContentPackageHistory from "./pages/ContentPackageHistory";
import NotFound from "./pages/NotFound";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <div className="app-layout">
        <Navbar />
        <main className="app-main">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/categories/:id" element={<CategoryDetail />} />
            <Route path="/project/:projectId" element={<ProjectDetail />} />
            <Route path="/wizard/:categoryId" element={<Wizard />} />
            <Route path="/content-package" element={<ContentPackage />} />
            <Route path="/content-package/history" element={<ContentPackageHistory />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
