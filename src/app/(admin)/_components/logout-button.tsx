"use client";

export function LogoutButton() {
  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    // Use window.location for hard redirect to clear cache
    window.location.href = "/admin/login";
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
