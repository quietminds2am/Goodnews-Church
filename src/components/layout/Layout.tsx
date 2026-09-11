import type { ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main id="main-content" className="min-w-0 flex-1 overflow-x-hidden">
        {children}
      </main>
      <Footer />
    </div>
  );
}
