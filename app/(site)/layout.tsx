import { BackButton } from "@/components/BackButton";
import { MobileTabBar } from "@/components/MobileTabBar";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { getProductCategories } from "@/lib/categories";
import { getSession, type SessionUser } from "@/lib/session";

async function getSessionUser(): Promise<SessionUser | null> {
  const session = await getSession();
  return session.user ?? null;
}

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [user, categories] = await Promise.all([
    getSessionUser(),
    getProductCategories(),
  ]);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader user={user} categories={categories} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-28 pt-6 md:pb-12">
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
