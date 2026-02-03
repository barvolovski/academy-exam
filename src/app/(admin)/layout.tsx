import Link from "next/link";
import { LogoutButton } from "./_components/logout-button";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r flex flex-col">
        <div className="p-6">
          <Link href="/admin" className="text-xl font-bold">
            Academy Admin
          </Link>
        </div>
        <nav className="px-4 space-y-2 flex-1">
          <Link
            href="/admin"
            className="block px-4 py-2 rounded-md hover:bg-accent"
          >
            Dashboard
          </Link>
          <Link
            href="/admin/problems"
            className="block px-4 py-2 rounded-md hover:bg-accent"
          >
            Problems
          </Link>
          <Link
            href="/admin/exams"
            className="block px-4 py-2 rounded-md hover:bg-accent"
          >
            Exams
          </Link>
          <Link
            href="/admin/results"
            className="block px-4 py-2 rounded-md hover:bg-accent"
          >
            Results
          </Link>
          <Link
            href="/admin/settings/ai"
            className="block px-4 py-2 rounded-md hover:bg-accent"
          >
            Settings
          </Link>
        </nav>
        <div className="px-4 pb-4 border-t pt-4">
          <LogoutButton />
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
