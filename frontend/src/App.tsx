import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Leads from "./pages/Leads";
import Deals from "./pages/Deals";
import Documents from "./pages/Documents";
import AutoReplies from "./pages/AutoReplies";
import Broadcasts from "./pages/Broadcasts";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="leads" element={<Leads />} />
          <Route path="deals" element={<Deals />} />
          <Route path="documents" element={<Documents />} />
          <Route path="auto-replies" element={<AutoReplies />} />
          <Route path="broadcasts" element={<Broadcasts />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
