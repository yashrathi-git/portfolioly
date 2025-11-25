import HeaderBar from "@/components/HeaderBar";
import { AppShellFooter } from "@/components/AppShellFooter";
import RootProviders from "@/components/RootProviders";
import type { ReactNode } from "react";

export default function AppShellLayout({ children }: { children: ReactNode }) {
  return (
    <RootProviders>
      <div className="min-h-dvh grid grid-rows-[auto_1fr_auto]">
        <HeaderBar />
        <main className="min-h-0">{children}</main>
        <AppShellFooter />
      </div>
    </RootProviders>
  );
}
