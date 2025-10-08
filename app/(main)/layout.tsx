import { ReactNode } from "react";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { MobileTabBar } from "@/components/MobileTabBar";
import { BackButton } from "@/components/BackButton";
import { getSession, SessionUser } from "@/lib/session";

async function getSessionUser(): Promise<SessionUser | null> {
  const session = await getSession();
  return session.user ?? null;
}

export default async function MainLayout({ children }: { children: ReactNode }) {
  const user = await getSessionUser();

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <SiteHeader user={user} />
      <main className="mx-auto max-w-6xl px-4 pb-28 pt-6 md:pb-12">
        <div className="mb-6 flex justify-between">
          <BackButton />
        </div>
        {children}
      </main>
      <SiteFooter />
      <MobileTabBar />
    </div>
  );
}
