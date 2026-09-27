import type { ReactNode } from "react";
import { Sidebar } from "@/components/Sidebar";
import { MobileNav } from "@/components/MobileNav";
import { AppStatusBar } from "@/components/AppStatusBar";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-dvh w-full overflow-hidden bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="flex-1 overflow-y-auto pb-20 lg:pb-0">{children}</main>
        <AppStatusBar />
      </div>
      <MobileNav />
    </div>
  );
}
