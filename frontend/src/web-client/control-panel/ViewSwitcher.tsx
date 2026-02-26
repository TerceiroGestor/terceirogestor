"use client";

import * as React from "react";
import {
  RecordBrowserViewSwitcher,
  type RecordBrowserViewOption,
} from "@/components/record-browser/RecordBrowserViewSwitcher";

export function ViewSwitcher<V extends string>({
  value,
  options,
  onChange,
}: {
  value: V;
  options: RecordBrowserViewOption<V>[];
  onChange: (next: V) => void;
}) {
  return (
    <RecordBrowserViewSwitcher value={value} options={options} onChange={onChange} />
  );
}

