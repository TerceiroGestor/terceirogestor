"use client";

import * as React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MODULE_TABS_LIST_CLASS_NAME,
  MODULE_TAB_TRIGGER_CLASS_NAME,
} from "@/web-client/ui/ModulePrimitives";

export type DetailSideTabItem = {
  value: string;
  label: string;
  badge?: React.ReactNode;
  content: React.ReactNode;
};

export function DetailSideTabs({
  tabs,
  defaultValue,
}: {
  tabs: DetailSideTabItem[];
  defaultValue?: string;
}) {
  const visibleTabs = tabs.filter(Boolean);
  const resolvedDefaultValue = defaultValue ?? visibleTabs[0]?.value;

  if (!resolvedDefaultValue) {
    return null;
  }

  return (
    <Tabs defaultValue={resolvedDefaultValue} className="flex h-full min-h-0 flex-col">
      <TabsList className={MODULE_TABS_LIST_CLASS_NAME}>
        {visibleTabs.map((tab) => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            className={MODULE_TAB_TRIGGER_CLASS_NAME}
          >
            <span>{tab.label}</span>
            {tab.badge ? (
              <span className="ml-2 text-[11px] font-medium tabular-nums text-muted-foreground">
                {tab.badge}
              </span>
            ) : null}
          </TabsTrigger>
        ))}
      </TabsList>

      {visibleTabs.map((tab) => (
        <TabsContent key={tab.value} value={tab.value} className="mt-4 min-h-0 flex-1">
          <div className="h-full min-h-0">{tab.content}</div>
        </TabsContent>
      ))}
    </Tabs>
  );
}
