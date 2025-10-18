import React, { createContext, useContext, ReactNode, useMemo } from "react";
import type { DisplayPortfolioData } from "@portfolioly/schema";

interface PortfolioContextValue {
  portfolioData?: DisplayPortfolioData | null;
}

const PortfolioContext = createContext<PortfolioContextValue | null>(null);

interface PortfolioProviderProps {
  children: ReactNode;
  portfolioData?: DisplayPortfolioData | null;
}

export function PortfolioProvider({
  children,
  portfolioData = null,
}: PortfolioProviderProps) {
  const value = useMemo(() => ({ portfolioData }), [portfolioData]);

  return (
    <PortfolioContext.Provider value={value}>
      {children}
    </PortfolioContext.Provider>
  );
}

export function usePortfolioContext() {
  const context = useContext(PortfolioContext);

  if (!context) {
    throw new Error(
      "usePortfolioContext must be used within a PortfolioProvider"
    );
  }

  return context;
}

export default PortfolioProvider;
