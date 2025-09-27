// Re-export components and utilities
export * from "./components/ChatPortfolio";
export * from "./components/TraditionalPortfolio";
export * from "./components/PortfolioDock";
export * from "./components/ThemeToggle";
export * from "./components/chat/Composer";
export * from "./components/chat/EmptyState";
export * from "./components/chat/Header";
export * from "./components/chat/Thread";
export * from "./components/chat/Suggestions";
export * from "./components/chat/types";
export * from "./types/portfolio";
export * from "./config/portfolio-config";
export { cn } from "./lib/cn";

// Ensure CSS is loaded when importing the package
import "./styles.css";

// Note: The compiled CSS (with CSS modules) will be loaded automatically
// when components that use CSS modules are imported
