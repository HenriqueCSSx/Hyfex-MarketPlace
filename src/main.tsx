import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ErrorBoundary } from "./components/ErrorBoundary";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  // Render a friendly error screen instead of crashing
  document.body.innerHTML = `
    <div style="
      display: flex; 
      justify-content: center; 
      align-items: center; 
      height: 100vh; 
      flex-direction: column; 
      font-family: sans-serif; 
      color: #333; 
      background: #fff;
    ">
      <h1 style="color: #e11d48; margin-bottom: 10px;">Configuration Error</h1>
      <p style="margin-bottom: 20px;">The application cannot connect to the backend.</p>
      <div style="
        background: #f1f5f9; 
        padding: 20px; 
        border-radius: 8px; 
        text-align: left; 
        min-width: 300px;
        box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
      ">
        <p style="margin: 5px 0; display: flex; justify-content: space-between;">
          <span style="font-weight: 600;">VITE_SUPABASE_URL:</span> 
          <span>${supabaseUrl ? '✅ Present' : '❌ Missing'}</span>
        </p>
        <p style="margin: 5px 0; display: flex; justify-content: space-between;">
          <span style="font-weight: 600;">VITE_SUPABASE_ANON_KEY:</span> 
          <span>${supabaseKey ? '✅ Present' : '❌ Missing'}</span>
        </p>
      </div>
      <p style="margin-top: 30px; font-size: 0.9em; color: #666;">
        Please go to your Vercel Project Settings > Environment Variables<br>
        and ensure these keys are added correctly with the <code>VITE_</code> prefix.
      </p>
    </div>
  `;
} else {
  createRoot(document.getElementById("root")!).render(
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}
