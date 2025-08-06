import './index.css'
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

// Cache the root instance to prevent multiple createRoot() calls
const container = document.getElementById('root');
let root;

// Check if root already exists, if not create it
if (!root) {
  root = ReactDOM.createRoot(container);
}

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)