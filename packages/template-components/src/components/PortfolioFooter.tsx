import { WandIcon } from "./icons/PortfoliolyWandIcon";

export type PortfolioFooterProps = {
  variant?: "chat" | "traditional";
  className?: string;
};

export const PortfolioFooter = ({
  variant = "chat",
  className = "",
}: PortfolioFooterProps) => {
  const isChatVariant = variant === "chat";

  return (
    <div
      className={`flex items-center justify-center gap-1.5 text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)] ${
        isChatVariant ? "py-4 text-xs" : "py-3 text-[10px]"
      } ${className}`}
    >
      <a
        href="https://portfolioly.app/"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 opacity-60 hover:opacity-100 transition-opacity"
      >
        <span className="text-[var(--muted-foreground)]">Built with</span>
        <WandIcon
          className={`${
            isChatVariant ? "h-3.5 w-3.5" : "h-3 w-3"
          } text-[oklch(0.74_0.15_310)]`}
        />
        <span className="font-medium text-[var(--foreground)]">
          Portfolioly
        </span>
      </a>
    </div>
  );
};
