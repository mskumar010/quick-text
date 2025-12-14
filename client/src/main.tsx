import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./globalStyles.css";
import App from "./App.tsx";
import ErrorBoundary from "./ErrorBoundary.tsx";
import { IdProvider } from "./IdContext.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <IdProvider>
        <App />
      </IdProvider>
    </ErrorBoundary>
  </StrictMode>
);
