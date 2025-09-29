import React, { createContext, useContext, useMemo, ReactNode } from "react";
import { TemplateConfig, defaultTemplateConfig } from "../config/template-config";

interface TemplateProviderProps {
  children: ReactNode;
  config?: Partial<TemplateConfig>;
}

const TemplateConfigContext = createContext<TemplateConfig | null>(null);

export function TemplateProvider({ children, config }: TemplateProviderProps) {
  const mergedConfig = useMemo(() => ({
    ...defaultTemplateConfig,
    ...config,
  }), [config]);

  return (
    <TemplateConfigContext.Provider value={mergedConfig}>
      {children}
    </TemplateConfigContext.Provider>
  );
}

export function useTemplateConfig() {
  const context = useContext(TemplateConfigContext);

  if (!context) {
    throw new Error("useTemplateConfig must be used within a TemplateProvider");
  }

  return context;
}

export default TemplateProvider;

