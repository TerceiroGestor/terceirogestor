"use client";

import * as React from "react";
import {
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  FileLock2,
  GraduationCap,
  HeartPulse,
  IdCard,
  Lock,
  MapPin,
  Phone,
  Pill,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { type PeopleDetailTabValue } from "@/modules/people/shared/domain/people-relation-routes";

type PeopleDetailTabsProps = {
  onValueChange: (value: PeopleDetailTabValue) => void;
};

type TabItem = {
  value: string;
  label: string;
  icon: LucideIcon;
  disabled?: boolean;
};

const tabItems: TabItem[] = [
  { value: "dados-basicos", label: "Dados básicos", icon: IdCard },
  { value: "contatos", label: "Contatos", icon: Phone },
  { value: "endereco", label: "Endereço", icon: MapPin },
  { value: "documentos", label: "Documentos sensíveis", icon: FileLock2 },
  { value: "familia", label: "Família", icon: Users },
  { value: "financeiro", label: "Financeiro", icon: Wallet },
  { value: "saude", label: "Saúde", icon: HeartPulse },
  { value: "medicacoes", label: "Medicação", icon: Pill },
  { value: "escolaridade", label: "Escolaridade", icon: GraduationCap },
  { value: "reclusao", label: "Reclusão", icon: Lock },
  { value: "atendimentos", label: "Atendimentos", icon: ClipboardList, disabled: true },
];

export function PeopleDetailTabs({ onValueChange }: PeopleDetailTabsProps) {
  const scrollRef = React.useRef<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(false);

  const updateScrollState = React.useCallback(() => {
    const element = scrollRef.current;
    if (!element) return;
    const remaining = element.scrollWidth - element.clientWidth - element.scrollLeft;
    setCanScrollLeft(element.scrollLeft > 12);
    setCanScrollRight(remaining > 12);
  }, []);

  React.useEffect(() => {
    updateScrollState();
    const element = scrollRef.current;
    if (!element) return;
    const handle = () => updateScrollState();
    element.addEventListener("scroll", handle, { passive: true });
    window.addEventListener("resize", handle);
    return () => {
      element.removeEventListener("scroll", handle);
      window.removeEventListener("resize", handle);
    };
  }, [updateScrollState]);

  const scrollBy = React.useCallback((direction: "left" | "right") => {
    scrollRef.current?.scrollBy({
      left: direction === "right" ? 220 : -220,
      behavior: "smooth",
    });
  }, []);

  return (
    <div className="relative border-t border-border/60 pt-2">
      <div
        ref={scrollRef}
        className={
          canScrollLeft
            ? "overflow-x-auto pl-10 pr-10 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            : "overflow-x-auto pr-10 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        }
      >
        <TabsList className="h-auto w-max min-w-full flex-nowrap justify-start gap-1.5 rounded-none border-0 bg-transparent p-0">
          {tabItems.map((item) => {
            const Icon = item.icon;
            const isSensitive = item.value === "documentos";
            return (
              <TabsTrigger
                key={item.value}
                value={item.value}
                disabled={item.disabled}
                onClick={() =>
                  !item.disabled && onValueChange(item.value as PeopleDetailTabValue)
                }
                className={
                  isSensitive
                    ? "group relative h-9 shrink-0 whitespace-nowrap rounded-md border-0 px-3 text-sm font-medium text-amber-700/80 shadow-none transition-colors data-[state=active]:bg-amber-500/10 data-[state=active]:text-amber-700 data-[state=active]:font-semibold data-[state=inactive]:hover:bg-muted/70 data-[state=inactive]:hover:text-amber-700 dark:text-amber-400/80 dark:data-[state=active]:bg-amber-400/10 dark:data-[state=active]:text-amber-400"
                    : "group relative h-9 shrink-0 whitespace-nowrap rounded-md border-0 px-3 text-sm font-medium text-muted-foreground shadow-none transition-colors data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:font-semibold data-[state=inactive]:hover:bg-muted/70 data-[state=inactive]:hover:text-foreground"
                }
              >
                <span className="flex items-center gap-2">
                  <Icon className="size-4" />
                  <span>{item.label}</span>
                </span>
              </TabsTrigger>
            );
          })}
        </TabsList>
      </div>
      {canScrollLeft ? (
        <button
          type="button"
          onClick={() => scrollBy("left")}
          className="absolute left-0 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-border/60 bg-background/95 text-muted-foreground shadow-sm transition hover:text-foreground"
          aria-label="Ver abas anteriores"
          title="Ver abas anteriores"
        >
          <ChevronLeft className="size-4" />
        </button>
      ) : null}
      {canScrollRight ? (
        <button
          type="button"
          onClick={() => scrollBy("right")}
          className="absolute right-0 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-border/60 bg-background/95 text-muted-foreground shadow-sm transition hover:text-foreground"
          aria-label="Ver mais abas"
          title="Ver mais abas"
        >
          <ChevronRight className="size-4" />
        </button>
      ) : null}
    </div>
  );
}
