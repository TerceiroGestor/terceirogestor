"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useBreadcrumb } from "@/components/layout/BreadcrumbContext";
import { useRequireAuth } from "@/hooks/use-require-auth";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";

const attendanceData = [
  { month: "Jan", atendimentos: 120, triagens: 40 },
  { month: "Feb", atendimentos: 148, triagens: 52 },
  { month: "Mar", atendimentos: 162, triagens: 60 },
  { month: "Apr", atendimentos: 138, triagens: 46 },
  { month: "May", atendimentos: 174, triagens: 58 },
  { month: "Jun", atendimentos: 191, triagens: 64 },
];

const progressData = [
  { week: "W1", realizados: 84, meta: 90 },
  { week: "W2", realizados: 96, meta: 95 },
  { week: "W3", realizados: 88, meta: 100 },
  { week: "W4", realizados: 112, meta: 105 },
  { week: "W5", realizados: 104, meta: 110 },
];

const typesData = [
  { source: "social", visits: 140, fill: "var(--color-social)" },
  { source: "psicologico", visits: 90, fill: "var(--color-psicologico)" },
  { source: "familiar", visits: 70, fill: "var(--color-familiar)" },
  { source: "outro", visits: 30, fill: "var(--color-outro)" },
];

const attendanceConfig = {
  atendimentos: {
    label: "Atendimentos",
    color: "#2563eb",
  },
  triagens: {
    label: "Triagens",
    color: "#60a5fa",
  },
} satisfies ChartConfig;

const progressConfig = {
  realizados: {
    label: "Realizados",
    color: "#0f766e",
  },
  meta: {
    label: "Meta",
    color: "#94a3b8",
  },
} satisfies ChartConfig;

const typesConfig = {
  social: {
    label: "Social",
    color: "#22c55e",
  },
  psicologico: {
    label: "Psicologico",
    color: "#2563eb",
  },
  familiar: {
    label: "Familiar",
    color: "#f97316",
  },
  outro: {
    label: "Outro",
    color: "#a855f7",
  },
} satisfies ChartConfig;

export default function DashboardPage() {
  const { isLoading } = useRequireAuth();
  const { setPageBreadcrumb } = useBreadcrumb();

  React.useEffect(() => {
    setPageBreadcrumb("Dashboard", []);
  }, [setPageBreadcrumb]);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-sm text-muted-foreground">
        Carregando dashboard...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 px-6 py-8">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
            ONG
          </p>
          <h1 className="text-2xl font-semibold">Visao geral da ONG</h1>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Input className="sm:w-64" placeholder="Buscar cadastros..." />
          <div className="flex items-center gap-2">
            <Button variant="outline">Exportar</Button>
            <Button>Novo registro</Button>
          </div>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Atendidos ativos", value: "324", delta: "+6.2%" },
          { label: "Em fila de espera", value: "58", delta: "-4.8%" },
          { label: "Atendimentos realizados", value: "1.248", delta: "+11.3%" },
          { label: "Novos cadastros", value: "74", delta: "+3.9%" },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardHeader>
              <CardDescription className="text-xs uppercase tracking-[0.3em]">
                {stat.label}
              </CardDescription>
              <CardTitle className="text-2xl">{stat.value}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                {stat.delta} este mes
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.8fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Atendimentos por mes</CardTitle>
            <CardDescription>
              Evolucao mensal de atendimentos e triagens.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={attendanceConfig} className="h-[280px] w-full">
              <BarChart data={attendanceData} accessibilityLayer>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} width={36} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="atendimentos" fill="var(--color-atendimentos)" radius={4} />
                <Bar dataKey="triagens" fill="var(--color-triagens)" radius={4} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tipos de atendimento</CardTitle>
            <CardDescription>Distribuicao por tipo.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={typesConfig} className="h-[260px]">
              <PieChart>
                <ChartTooltip
                  content={
                    <ChartTooltipContent labelKey="source" nameKey="source" />
                  }
                />
                <Pie
                  data={typesData}
                  dataKey="visits"
                  nameKey="source"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={4}
                  stroke="var(--background)"
                />
                <ChartLegend content={<ChartLegendContent nameKey="source" />} verticalAlign="bottom" />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Atendimentos vs meta</CardTitle>
            <CardDescription>Comparativo semanal.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={progressConfig} className="h-[260px]">
              <AreaChart data={progressData} accessibilityLayer>
                <defs>
                  <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0f766e" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0f766e" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="week" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} width={36} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  dataKey="realizados"
                  type="monotone"
                  fill="url(#fillRevenue)"
                  stroke="var(--color-realizados)"
                  strokeWidth={2}
                />
                <Area
                  dataKey="meta"
                  type="monotone"
                  fill="transparent"
                  stroke="var(--color-meta)"
                  strokeDasharray="4 4"
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Atividades recentes</CardTitle>
            <CardDescription>Ultimos registros da ONG.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              {
                title: "Atendimento social registrado",
                detail: "Atendimento · Hoje",
              },
              {
                title: "Nova familia cadastrada",
                detail: "Cadastro · Hoje",
              },
              {
                title: "Ocorrencia atualizada",
                detail: "Ocorrencias · Ontem",
              },
              {
                title: "Relatorio mensal consolidado",
                detail: "Gestao · Semana passada",
              },
            ].map((item, index, all) => (
              <div key={item.title}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold">{item.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.detail}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm">
                    Ver
                  </Button>
                </div>
                {index < all.length - 1 ? <Separator className="mt-4" /> : null}
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
