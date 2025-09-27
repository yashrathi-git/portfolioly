export const portfolioConfig = {
  enableChatPortfolio: true,
  enableTraditionalPortfolio: true,
} as const;

export type PortfolioConfig = typeof portfolioConfig;
