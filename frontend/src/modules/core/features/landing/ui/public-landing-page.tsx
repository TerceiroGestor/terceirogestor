"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle2, ClipboardCheck, FileChartColumnIncreasing, ShieldCheck, Sparkles, UsersRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { storeTenantSlug, withTenantPath } from "@/lib/tenant-path";

const NAV_ITEMS = [
  { label: "Produto", href: "#produto" },
  { label: "Como Funciona", href: "#como-funciona" },
  { label: "Beneficios", href: "#beneficios" },
  { label: "PWA", href: "#pwa" },
  { label: "Acessar", href: "#acessar" },
];

const pains = [
  "Planilhas espalhadas e retrabalho na rotina de acompanhamento social.",
  "Dificuldade de consolidar evidencias para prestacao de contas e auditoria.",
  "Processos manuais que reduzem tempo de atendimento a familias e beneficiarios.",
  "Equipe com pouca visibilidade do historico completo de cada pessoa atendida.",
];

const capabilities = [
  {
    title: "Prontuario social vivo",
    description:
      "Unifique historico, encaminhamentos, frequencia e evolucao social em um unico lugar.",
    icon: UsersRound,
  },
  {
    title: "Governanca e compliance",
    description:
      "Perfis de acesso, trilha de auditoria e padronizacao operacional por unidade.",
    icon: ShieldCheck,
  },
  {
    title: "Gestao orientada por dados",
    description:
      "Dashboards e relatorios para tomada de decisao rapida por coordenação tecnica.",
    icon: FileChartColumnIncreasing,
  },
  {
    title: "Prestacao de contas pronta",
    description:
      "Documentacao e indicadores organizados para convenios, conselhos e fiscalizacoes.",
    icon: ClipboardCheck,
  },
];

const outcomes = [
  "Reducao de retrabalho administrativo",
  "Maior qualidade no acompanhamento de familias",
  "Padronizacao da rotina da equipe tecnica",
  "Mais confianca para auditorias e convenios",
];

export function PublicLandingPage() {
  const router = useRouter();
  const [tenantSlug, setTenantSlug] = React.useState("");

  const handleAccessInstitution = React.useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const slug = tenantSlug.trim();
      if (!slug) return;
      storeTenantSlug(slug);
      router.push(withTenantPath("/login", slug));
    },
    [router, tenantSlug],
  );

  return (
    <div
      className="min-h-screen w-full min-w-0 overflow-x-hidden text-slate-100"
      style={{
        background:
          "radial-gradient(circle at 18% 12%, rgba(45,212,191,0.20) 0%, transparent 34%), radial-gradient(circle at 84% 24%, rgba(236,72,153,0.18) 0%, transparent 38%), linear-gradient(160deg, #00133c 0%, #0a1f57 48%, #001033 100%)",
        fontFamily: "Sora, Manrope, Segoe UI, sans-serif",
      }}
    >
      <style jsx>{`
        @keyframes tg-fade-up {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes tg-glow {
          0%,
          100% {
            box-shadow: 0 0 0 rgba(56, 189, 248, 0);
          }
          50% {
            box-shadow: 0 0 32px rgba(56, 189, 248, 0.28);
          }
        }

        .reveal {
          animation: tg-fade-up 700ms ease-out both;
        }

        .pulse-glow {
          animation: tg-glow 2.6s ease-in-out infinite;
        }
      `}</style>

      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#00133c]/75 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/pwa/icon-192.png"
              alt="Terceiro Gestor"
              width={32}
              height={32}
              className="rounded-lg"
            />
            <span className="text-sm font-semibold tracking-wide text-white sm:text-base">Terceiro Gestor</span>
          </Link>

          <nav className="hidden items-center gap-5 md:flex">
            {NAV_ITEMS.map((item, index) => (
              <a
                key={item.href}
                href={item.href}
                className="text-sm text-cyan-100/85 transition-colors hover:text-white"
                style={{ animationDelay: `${80 + index * 40}ms` }}
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Button asChild size="sm" variant="ghost" className="text-cyan-100 hover:bg-white/10 hover:text-white">
              <a href="#acessar">Entrar</a>
            </Button>
            <Button asChild size="sm" className="bg-gradient-to-r from-cyan-400 to-emerald-400 text-[#00133c] hover:from-cyan-300 hover:to-emerald-300">
              <Link href="/register">Criar conta</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full min-w-0 max-w-7xl flex-col gap-16 overflow-x-hidden px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <section id="produto" className="reveal grid items-center gap-10 overflow-hidden lg:grid-cols-[1.08fr_0.92fr]">
          <div className="space-y-7">
            <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-cyan-300/35 bg-cyan-400/10 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.18em] text-cyan-100">
              <Sparkles className="h-3.5 w-3.5" />
              Gestao que transforma. Impacto que permanece.
            </div>

            <h1 className="max-w-3xl text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">
              A plataforma institucional para OSCs e equipes do SCFV operarem com qualidade, rastreabilidade e resultado.
            </h1>

            <p className="max-w-2xl text-base leading-8 text-cyan-50/88 sm:text-lg">
              O Terceiro Gestor conecta atendimento, gestao tecnica e prestacao de contas em uma jornada unica. Menos tempo em planilhas, mais tempo transformando vidas com metodo.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="bg-gradient-to-r from-fuchsia-500 to-orange-400 text-white hover:from-fuchsia-400 hover:to-orange-300">
                <Link href="/register">
                  Comecar implantacao
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-cyan-200/40 bg-white/5 text-cyan-50 hover:bg-white/10">
                <a href="#acessar">Entrar com slug da instituicao</a>
              </Button>
            </div>

            <div className="grid gap-3 text-sm text-cyan-50/90 sm:grid-cols-2">
              {outcomes.map((outcome) => (
                <div key={outcome} className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                  <span>{outcome}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="reveal overflow-hidden rounded-[28px] border border-cyan-200/20 bg-gradient-to-b from-white/12 to-white/4 p-5 shadow-[0_30px_90px_rgba(0,0,0,0.36)] lg:p-7" style={{ animationDelay: "140ms" }}>
            <Image
              src="/terceirogestor-identidade-visual.png"
              alt="Identidade visual Terceiro Gestor"
              width={780}
              height={780}
              priority
              className="pulse-glow h-auto w-full rounded-2xl border border-white/10 object-cover"
            />
          </div>
        </section>

        <section id="como-funciona" className="reveal rounded-[28px] border border-cyan-200/20 bg-white/[0.06] p-6 backdrop-blur sm:p-8" style={{ animationDelay: "200ms" }}>
          <h2 className="text-3xl font-semibold text-white">Onde o sistema gera valor imediato</h2>
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {pains.map((pain) => (
              <div key={pain} className="rounded-2xl border border-white/10 bg-[#031947]/65 p-4 text-sm leading-7 text-cyan-50/86">
                {pain}
              </div>
            ))}
          </div>
          <p className="mt-6 text-sm leading-7 text-cyan-100/88">
            A plataforma foi desenhada para a linguagem de trabalho da assistencia social, com trilha operacional desde cadastro institucional ate o acompanhamento continuo de beneficiarios e familias.
          </p>
        </section>

        <section id="beneficios" className="reveal" style={{ animationDelay: "260ms" }}>
          <h2 className="text-3xl font-semibold text-white">Uma entrega profissional para toda a operacao</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {capabilities.map((item) => {
              const Icon = item.icon;
              return (
                <article key={item.title} className="rounded-[22px] border border-white/10 bg-gradient-to-b from-[#0a2f78]/75 to-[#041842]/75 p-5 shadow-[0_16px_38px_rgba(0,0,0,0.28)]">
                  <div className="inline-flex rounded-xl bg-white/10 p-2.5">
                    <Icon className="h-5 w-5 text-cyan-200" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-white">{item.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-cyan-50/85">{item.description}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section id="pwa" className="reveal overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-r from-[#102b74]/70 via-[#0f3f8d]/50 to-[#0e8da3]/45 p-6 sm:p-8" style={{ animationDelay: "320ms" }}>
          <div className="grid items-center gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-cyan-100">Experiencia PWA oficial</p>
              <h2 className="mt-2 text-3xl font-semibold text-white">Instale como app e leve a operacao para campo, escritorio e reunioes tecnicas.</h2>
              <p className="mt-3 text-sm leading-7 text-cyan-50/88">
                O Terceiro Gestor funciona como Progressive Web App com identidade visual proprietaria e fluxo direto por instituicao. Isso garante abertura rapida, navegacao fluida e acesso consistente da equipe no dia a dia.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/15 bg-[#001b4f]/70 p-4 text-center">
                <Image src="/pwa/icon-192.png" alt="Icone PWA 192" width={84} height={84} className="mx-auto" />
                <p className="mt-2 text-xs text-cyan-100">icon-192</p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-[#001b4f]/70 p-4 text-center">
                <Image src="/pwa/icon-192-maskable.png" alt="Icone PWA 192 maskable" width={84} height={84} className="mx-auto" />
                <p className="mt-2 text-xs text-cyan-100">icon-192-maskable</p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-[#001b4f]/70 p-4 text-center">
                <Image src="/pwa/icon-512.png" alt="Icone PWA 512" width={84} height={84} className="mx-auto" />
                <p className="mt-2 text-xs text-cyan-100">icon-512</p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-[#001b4f]/70 p-4 text-center">
                <Image src="/pwa/icon-512-maskable.png" alt="Icone PWA 512 maskable" width={84} height={84} className="mx-auto" />
                <p className="mt-2 text-xs text-cyan-100">icon-512-maskable</p>
              </div>
            </div>
          </div>
        </section>

        <section id="acessar" className="reveal grid gap-7 rounded-[28px] border border-cyan-200/20 bg-white/[0.06] p-6 backdrop-blur sm:p-8 lg:grid-cols-[0.95fr_1.05fr]" style={{ animationDelay: "380ms" }}>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-100">Acesso institucional</p>
            <h2 className="mt-2 text-3xl font-semibold text-white">Sua equipe entra direto no ambiente correto da instituicao.</h2>
            <p className="mt-3 text-sm leading-7 text-cyan-50/88">
              Informe o identificador (slug) para abrir o login da sua organizacao. Depois disso, o sistema memoriza e acelera os proximos acessos no navegador.
            </p>
          </div>

          <div className="rounded-2xl border border-white/12 bg-[#00163e]/75 p-5 shadow-[0_18px_44px_rgba(0,0,0,0.32)]">
            <form className="space-y-5" onSubmit={handleAccessInstitution}>
              <div className="space-y-2">
                <label htmlFor="tenantSlug" className="text-sm font-medium text-cyan-100">
                  Slug da instituicao
                </label>
                <Input
                  id="tenantSlug"
                  placeholder="ex.: terceiro-gestor"
                  className="border-white/20 bg-white/10 text-white placeholder:text-cyan-100/50"
                  value={tenantSlug}
                  onChange={(event) => setTenantSlug(event.target.value)}
                />
                <p className="text-xs text-cyan-100/70">Use o mesmo identificador fornecido no cadastro da organizacao.</p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button type="submit" className="bg-gradient-to-r from-cyan-400 to-blue-500 text-[#00133c] hover:from-cyan-300 hover:to-blue-400">
                  Ir para login
                </Button>
                <Button asChild type="button" variant="outline" className="border-white/20 bg-white/5 text-cyan-50 hover:bg-white/10">
                  <Link href="/register">Registrar nova instituicao</Link>
                </Button>
              </div>
            </form>
          </div>
        </section>
      </main>
    </div>
  );
}
