import { Buffer } from 'buffer';
import process from 'process';

if (!(globalThis as any).Buffer) (globalThis as any).Buffer = Buffer;
if (!(globalThis as any).process) (globalThis as any).process = process;

import './index.css';
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ErrorBoundary } from "@/components/dev/ErrorBoundary";
import { AuthProvider } from "@/contexts/AuthContext";
import { initSentry } from "@/lib/sentry";

// Initialize Sentry error tracking
initSentry();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
