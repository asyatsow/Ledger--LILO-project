"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpenCheck,
  Brain,
  Bug,
  LayoutDashboard,
} from "lucide-react";
import { useEffect, useState } from "react";
import { loadDebts, stats } from "@/lib/store";
import type { Concept } from "@/lib/types";

const concepts: Concept[] = [
  "off_by_one",
  "null_handling",
  "scope_error",
  "type_mismatch",
  "logic_error",
];

export function Shell({
  children,
}: {
  children: React.ReactNode;
}) {
  const path = usePathname();
  const [testHref, setTestHref] = useState("/dashboard");

  useEffect(() => {
    let cancelled = false;

    loadDebts().then((debts) => {
      if (cancelled) return;

      const next = concepts
        .map((concept) => ({
          concept,
          result: stats(debts, concept),
        }))
        .filter((row) => row.result.focusDebtId)
        .sort(
          (a, b) =>
            a.result.readiness - b.result.readiness,
        )[0];

      setTestHref(
        next
          ? `/test/${next.concept}/${next.result.focusDebtId}`
          : "/dashboard",
      );
    });

    return () => {
      cancelled = true;
    };
  }, [path]);

  if (path === "/") {
    return <>{children}</>;
  }

  const nav = [
    {
      href: "/dashboard",
      label: "Overview",
      icon: LayoutDashboard,
    },
    {
      href: "/log-bug",
      label: "Log a fix",
      icon: Bug,
    },
    {
      href: testHref,
      label: "Practice",
      icon: Brain,
    },
  ];

  return (
    <div className="app-frame">
      <header className="app-topbar">
        <Link href="/" className="brand-lockup light-brand">
          <span className="brand-mark">
            <BookOpenCheck size={18} />
          </span>

          <span>Ledger</span>
        </Link>

        <span
          className="profile-avatar"
          aria-label="User profile"
        >
          MK
        </span>
      </header>

      <div className="app-body">
        <aside className="app-sidebar">
          <nav aria-label="Application navigation">
            {nav.map(
              ({
                href,
                label,
                icon: Icon,
              }) => {
                const active =
                  path === href ||
                  (href !== "/dashboard" &&
                    path.startsWith(`${href}/`));

                return (
                  <Link
                    key={label}
                    href={href}
                    className={`app-nav-link ${
                      active ? "active" : ""
                    }`}
                  >
                    <Icon size={18} />
                    <span>{label}</span>
                  </Link>
                );
              },
            )}
          </nav>

          <p className="sidebar-note">
            Your learning should stay with you after the AI
            tab closes.
          </p>
        </aside>

        <div className="app-content">
          {children}
        </div>
      </div>
    </div>
  );
}