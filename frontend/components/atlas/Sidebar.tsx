"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Database,
  Clock,
  Layers,
  MessageSquare,
  FlaskConical,
} from "lucide-react";

const NAV = [
  { href: "/briefing",  label: "Briefing",   Icon: LayoutDashboard, badge: "3" },
  { href: "/portfolio", label: "Portfolio",  Icon: Building2,       badge: "25" },
  { href: "/query",     label: "Ask Atlas",  Icon: MessageSquare,   badge: "⌘K" },
  { href: "/eval",      label: "Eval Mode",  Icon: FlaskConical,    badge: "DEMO" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      style={{
        position: "sticky",
        top: 0,
        alignSelf: "start",
        height: "100vh",
        borderRight: "1px solid var(--atlas-z-200)",
        background: "#ffffff",
        display: "flex",
        flexDirection: "column",
        padding: "18px 14px",
        gap: "4px",
      }}
    >
      {/* Brand */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "6px 8px 16px",
          marginBottom: 6,
          borderBottom: "1px solid var(--atlas-z-200)",
        }}
      >
        <div
          style={{
            width: 26,
            height: 26,
            borderRadius: 6,
            background: "var(--atlas-z-900)",
            color: "white",
            display: "grid",
            placeItems: "center",
            fontWeight: 700,
            fontSize: 13,
            letterSpacing: "-0.02em",
            flexShrink: 0,
          }}
        >
          A
        </div>
        <span style={{ fontWeight: 600, letterSpacing: "-0.01em", fontSize: 14 }}>
          Atlas
        </span>
        <span
          style={{
            marginLeft: "auto",
            fontFamily: "var(--font-geist-mono)",
            fontSize: 10,
            color: "var(--atlas-z-500)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          v0.1
        </span>
      </div>

      {/* Workspace nav */}
      <div
        style={{
          fontSize: 10,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color: "var(--atlas-z-500)",
          padding: "14px 8px 6px",
        }}
      >
        Workspace
      </div>

      {NAV.map(({ href, label, Icon, badge }) => {
        const active = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "7px 8px",
              borderRadius: 6,
              color: active ? "var(--atlas-z-900)" : "var(--atlas-z-600)",
              fontSize: 13,
              fontWeight: active ? 500 : 400,
              background: active ? "var(--atlas-z-100)" : "transparent",
              textDecoration: "none",
              transition: "background .12s, color .12s",
            }}
            onMouseEnter={(e) => {
              if (!active) (e.currentTarget as HTMLElement).style.background = "var(--atlas-z-100)";
            }}
            onMouseLeave={(e) => {
              if (!active) (e.currentTarget as HTMLElement).style.background = "transparent";
            }}
          >
            <Icon
              size={16}
              style={{
                color: active ? "var(--atlas-accent)" : "var(--atlas-z-500)",
                flexShrink: 0,
              }}
            />
            <span style={{ flex: 1 }}>{label}</span>
            <span
              style={{
                fontFamily: "var(--font-geist-mono)",
                fontSize: 11,
                color: active ? "var(--atlas-z-600)" : "var(--atlas-z-500)",
                background: active ? "#ffffff" : "var(--atlas-z-100)",
                border: active ? "1px solid var(--atlas-z-200)" : "none",
                borderRadius: 4,
                padding: "1px 6px",
              }}
            >
              {badge}
            </span>
          </Link>
        );
      })}

      {/* Context section */}
      <div
        style={{
          fontSize: 10,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color: "var(--atlas-z-500)",
          padding: "14px 8px 6px",
        }}
      >
        Context
      </div>

      <div style={{ padding: "0 8px 6px", display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--atlas-z-600)" }}>
          <Layers size={13} style={{ color: "var(--atlas-z-400)", flexShrink: 0 }} />
          <span>Productivity &amp; Collaboration</span>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontFamily: "var(--font-geist-mono)",
            fontSize: 11,
            color: "var(--atlas-z-500)",
          }}
        >
          <Database size={12} style={{ color: "var(--atlas-z-400)", flexShrink: 0 }} />
          <span>5 sources connected</span>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontFamily: "var(--font-geist-mono)",
            fontSize: 11,
            color: "var(--atlas-z-500)",
          }}
        >
          <Clock size={12} style={{ color: "var(--atlas-z-400)", flexShrink: 0 }} />
          <span>Synced 7m ago</span>
        </div>
      </div>

      {/* User footer */}
      <div
        style={{
          marginTop: "auto",
          padding: "12px 8px 4px",
          borderTop: "1px solid var(--atlas-z-200)",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #0f766e, #134e4a)",
            color: "white",
            display: "grid",
            placeItems: "center",
            fontSize: 11,
            fontWeight: 600,
            flexShrink: 0,
          }}
        >
          SS
        </div>
        <div>
          <div style={{ fontSize: 12.5, fontWeight: 500, color: "var(--atlas-z-900)" }}>
            Sarah Simmons
          </div>
          <div style={{ fontSize: 11, color: "var(--atlas-z-500)" }}>
            GM · P&amp;C product line
          </div>
        </div>
      </div>
    </aside>
  );
}
