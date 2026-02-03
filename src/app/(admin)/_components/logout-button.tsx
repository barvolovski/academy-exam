"use client";

import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="block w-full text-left px-4 py-2 rounded-md hover:bg-accent text-muted-foreground"
    >
      Logout
    </button>
  );
}
