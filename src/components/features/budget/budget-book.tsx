"use client";

import { useEffect, useRef } from "react";
import { mountBudget } from "../../../../public/budget/page.js";
import type { readBudget } from "@/services/budget";

type AccountBook = ReturnType<typeof readBudget> & {username:string; name:string};

export function BudgetBook({ markup, account }: { markup:string; account:AccountBook }) {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = host.current!;
    // The book has its own document styles, including resets for buttons and dialogs.
    const root = element.shadowRoot ?? element.attachShadow({ mode:"open" });
    root.innerHTML = markup;
    const previousLanguage = document.documentElement.lang;
    const dispose = mountBudget(root, account);
    return () => {
      dispose();
      document.documentElement.lang = previousLanguage;
    };
  }, [markup, account]);

  return <div ref={host} />;
}
