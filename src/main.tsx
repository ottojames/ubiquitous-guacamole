import { Buffer } from 'buffer';
import process from 'process';

if (!(globalThis as any).Buffer) (globalThis as any).Buffer = Buffer;
if (!(globalThis as any).process) (globalThis as any).process = process;

import './index.css';
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ErrorBoundary } from "@/components/dev/ErrorBoundary";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
