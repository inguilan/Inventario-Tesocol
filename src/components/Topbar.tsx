"use client";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { Search, LogOut, Bell } from "lucide-react";
import { useState } from "react";
import { useStore } from "@/store/useStore";

interface TopbarProps {
  user?: { name?: string | null; email?: string | null };
}

export default function Topbar({ user }: TopbarProps) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const inventory = useStore((s) => s.inventory);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (q.trim()) {
      router.push(`/inventario?q=${encodeURIComponent(q.trim())}`);
      setQ("");
    }
  }

  const criticalCount = inventory.filter(
    (i) => i.stock === 0 || i.stock <= i.stockMin
  ).length;

  return (
    <header style={{
      position: "sticky", top: 0, zIndex: 50,
      background: "rgba(13,13,13,0.88)", backdropFilter: "blur(20px)",
      borderBottom: "1px solid var(--border)",
      padding: "0 28px", height: 60,
      display: "flex", alignItems: "center", gap: 16,
    }}>
      {/* Search */}
      <form onSubmit={handleSearch} style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 8, padding: "7px 14px", width: 280, transition: "all .2s" }}>
        <Search size={15} color="var(--text3)" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar material por nombre o ref..."
          style={{ background: "none", border: "none", outline: "none", color: "var(--text)", fontSize: 13, width: "100%", fontFamily: "'DM Sans',sans-serif" }}
        />
      </form>

      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
        {/* Alerts */}
        <div style={{ position: "relative", cursor: "pointer" }} onClick={() => router.push("/inventario?q=")}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: "var(--bg3)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Bell size={17} color="var(--text2)" />
          </div>
          {criticalCount > 0 && (
            <div style={{ position: "absolute", top: -4, right: -4, width: 18, height: 18, background: "var(--red)", borderRadius: "50%", fontSize: 10, fontWeight: 700, color: "white", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid var(--bg)" }}>
              {criticalCount}
            </div>
          )}
        </div>

        {/* User */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 14px", borderRadius: 8, background: "var(--bg3)", border: "1px solid var(--border)" }}>
          <div style={{ width: 28, height: 28, background: "var(--orange)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "white" }}>
            {user?.name?.[0] ?? "A"}
          </div>
          <span style={{ fontSize: 13, fontWeight: 500 }}>{user?.name ?? "Admin"}</span>
        </div>

        {/* Logout */}
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          style={{ width: 36, height: 36, borderRadius: 8, background: "transparent", border: "1px solid var(--border)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .2s", color: "var(--text2)" }}
          title="Cerrar sesión"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
}
