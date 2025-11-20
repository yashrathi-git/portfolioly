import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, LucideIcon } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface DashboardCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  href?: string;
  onClick?: () => void;
  badge?: string;
  children?: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export function DashboardCard({
  title,
  description,
  icon: Icon,
  href,
  onClick,
  badge,
  children,
  className,
  disabled,
}: DashboardCardProps) {
  const CardContentWrapper = ({ children }: { children: React.ReactNode }) => {
    if (href) {
      return (
        <Link href={href} className="block h-full">
          {children}
        </Link>
      );
    }
    if (onClick) {
      return (
        <button
          onClick={onClick}
          disabled={disabled}
          className="w-full text-left h-full disabled:cursor-default"
        >
          {children}
        </button>
      );
    }
    return <div className="h-full">{children}</div>;
  };

  return (
    <CardContentWrapper>
      <Card
        className={cn(
          "h-full group relative overflow-hidden border bg-card transition-all duration-300 hover:border-foreground/20 hover:shadow-sm",
          disabled && "disabled:cursor-default disabled:hover:border-border disabled:hover:shadow-none",
          className
        )}
      >
        {badge && (
          <Badge
            variant="secondary"
            className="absolute top-4 right-4 bg-muted text-muted-foreground border-0 font-normal"
          >
            {badge}
          </Badge>
        )}
        <CardHeader>
          <div className="mb-4 inline-flex items-center justify-center rounded-lg border bg-background p-2.5 text-foreground shadow-sm w-12 h-12 group-hover:scale-105 transition-transform duration-300">
            <Icon className="h-5 w-5" />
          </div>
          <CardTitle className="flex items-center justify-between text-lg font-medium">
            <span>{title}</span>
            {!disabled && (
              <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
            )}
          </CardTitle>
          <CardDescription className="text-sm pt-1.5">
            {description}
          </CardDescription>
        </CardHeader>
        {children && <CardContent>{children}</CardContent>}
      </Card>
    </CardContentWrapper>
  );
}
