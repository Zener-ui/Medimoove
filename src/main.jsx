import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

const preloader = document.getElementById("initial-preloader");
if (preloader) {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      preloader.classList.add("fade-out");
      setTimeout(() => preloader.remove(), 400);
    });
  });
}
