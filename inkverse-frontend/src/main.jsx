import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";
// import 'bootstrap/dist/css/bootstrap.min.css';
import { AuthProvider } from "./Context/AuthProvider.jsx";
import { HashRouter } from "react-router-dom";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <HashRouter>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="*" element={<App />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </HashRouter>
  </StrictMode>,
);
