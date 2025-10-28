import HeaderBar from "@/components/HeaderBar";
import type { ReactNode } from "react";

export default function AppShellLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh grid grid-rows-[auto_1fr]">
      <HeaderBar />
      <main className="min-h-0">{children}</main>
    </div>
  );
}
