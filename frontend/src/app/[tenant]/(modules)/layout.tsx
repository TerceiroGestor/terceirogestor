"use client";

import * as React from "react";

export default function ModulesLayout({ children }: { children: React.ReactNode }) {
  return <React.Suspense fallback={null}>{children}</React.Suspense>;
}
