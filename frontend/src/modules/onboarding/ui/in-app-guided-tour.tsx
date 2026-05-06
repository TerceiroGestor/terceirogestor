"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { ArrowBigDownDash, CheckCircle2, ChevronLeft, ChevronRight, MapPinned, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/auth-context";
import { useCurrentUser } from "@/features/auth/current-user-context";
import { getTenantSlugFromPath, withTenantPath } from "@/lib/tenant-path";
import { updateTenant } from "@/modules/onboarding/api/tenant-api";

type TourStep = {
  id: string;
  title: string;
  description: string;
  route: string;
  target: string;
  actionLabel: string;
};

type TourDefinition = {
  id: string;
  title: string;
  steps: TourStep[];
};

type TourOpenEventDetail = {
  tourId?: string;
};

const DEFAULT_TOUR_ID = "onboarding";
const TOUR_OPEN_EVENT = "tg:tour:open";
const TOUR_LAYER_Z_INDEX = 2147483000;
const TOUR_TARGET_Z_INDEX = 2147482990;

function buildTourDismissedStorageKey(tenantSlug: string) {
  return `tg:tour:dismissed:${tenantSlug}`;
}

function isTourDismissedForSession(tenantSlug: string) {
  if (!tenantSlug) return false;
  try {
    return window.sessionStorage.getItem(buildTourDismissedStorageKey(tenantSlug)) === "1";
  } catch {
    return false;
  }
}

function dismissTourForSession(tenantSlug: string) {
  if (!tenantSlug) return;
  try {
    window.sessionStorage.setItem(buildTourDismissedStorageKey(tenantSlug), "1");
  } catch {
    // Ignore storage errors in restricted browser contexts.
  }
}

function createTourCatalog(tenantSlug: string): Record<string, TourDefinition> {
  return {
    onboarding: {
      id: "onboarding",
      title: "Primeira configuração guiada",
      steps: [
        {
          id: "institution",
          title: "Configurar dados da instituição",
          description:
            "Clique neste item para abrir a área da ONG. Lá você define nome institucional, CNPJ, descrição e identidade visual oficial.",
          route: withTenantPath("/admin/tenant", tenantSlug),
          target: "sidebar-admin-tenant",
          actionLabel: "Abrir configurações da instituição",
        },
        {
          id: "program",
          title: "Criar o primeiro programa SCFV",
          description:
            "Agora acesse Programas para cadastrar o programa inicial e organizar os ciclos de atendimento.",
          route: withTenantPath("/programs", tenantSlug),
          target: "sidebar-programs",
          actionLabel: "Ir para Programas",
        },
        {
          id: "team",
          title: "Definir equipe e permissões",
          description:
            "Acesse Usuários para convidar a equipe e distribuir perfis de acesso com segurança e governança.",
          route: withTenantPath("/admin/users", tenantSlug),
          target: "sidebar-admin-users",
          actionLabel: "Ir para Usuários",
        },
        {
          id: "people",
          title: "Iniciar operação do atendimento",
          description:
            "Em Pessoas, comece o cadastro social e a jornada de acompanhamento de beneficiários e famílias.",
          route: withTenantPath("/people", tenantSlug),
          target: "sidebar-people",
          actionLabel: "Ir para Pessoas",
        },
      ],
    },
    "people-create": {
      id: "people-create",
      title: "Fluxo: cadastrar nova pessoa",
      steps: [
        {
          id: "people-list",
          title: "Abrir o módulo de Pessoas",
          description:
            "Entre na listagem de pessoas para iniciar um novo cadastro de beneficiário.",
          route: withTenantPath("/people", tenantSlug),
          target: "sidebar-people",
          actionLabel: "Ir para Pessoas",
        },
        {
          id: "people-new-action",
          title: "Acionar novo cadastro",
          description:
            "Use o botão principal da página (Novo/Cadastrar) para abrir o formulário de cadastro.",
          route: withTenantPath("/people", tenantSlug),
          target: "control-primary-action",
          actionLabel: "Ir para lista e clicar em Novo",
        },
        {
          id: "people-form-fill",
          title: "Preencher os dados do formulário",
          description:
            "No formulário de Nova pessoa, preencha os campos essenciais como nome, tipo, contato e dados de identificação.",
          route: withTenantPath("/people/new", tenantSlug),
          target: "detail-main-content",
          actionLabel: "Abrir formulário",
        },
        {
          id: "people-form-save",
          title: "Salvar o novo cadastro",
          description:
            "Após preencher os dados principais, clique em Salvar para criar o registro e entrar no modo de detalhe.",
          route: withTenantPath("/people/new", tenantSlug),
          target: "detail-save-button",
          actionLabel: "Clicar em Salvar",
        },
        {
          id: "people-autosave",
          title: "Entender o autosave no detalhe",
          description:
            "Depois da criação, a tela entra no modo de atualização contínua. O status mostra quando está Pronto ou Salvando automaticamente.",
          route: withTenantPath("/people", tenantSlug),
          target: "detail-autosave-status",
          actionLabel: "Ver status de autosave",
        },
        {
          id: "people-sideshell",
          title: "Usar o SideShell de apoio",
          description:
            "Use o botão lateral para abrir o SideShell com contexto complementar (auditoria, painéis auxiliares e navegação de suporte).",
          route: withTenantPath("/people", tenantSlug),
          target: "detail-side-toggle",
          actionLabel: "Abrir SideShell",
        },
      ],
    },
  };
}

function matchesRoute(pathname: string, route: string) {
  return pathname === route || pathname.startsWith(`${route}/`);
}

export function InAppGuidedTour() {
  const pathname = usePathname();
  const router = useRouter();
  const tenantSlug = getTenantSlugFromPath(pathname);
  const { token } = useAuth();
  const { tenant, refresh } = useCurrentUser();
  const resolvedTenantSlug = tenantSlug ?? tenant?.slug ?? "";

  const [isOpen, setIsOpen] = React.useState(false);
  const [stepIndex, setStepIndex] = React.useState(0);
  const [activeTourId, setActiveTourId] = React.useState(DEFAULT_TOUR_ID);
  const [targetRect, setTargetRect] = React.useState<DOMRect | null>(null);
  const [isFinishing, setIsFinishing] = React.useState(false);
  const [dismissedInSession, setDismissedInSession] = React.useState(false);
  const activeTargetElementRef = React.useRef<HTMLElement | null>(null);

  const tourCatalog = React.useMemo(() => createTourCatalog(resolvedTenantSlug), [resolvedTenantSlug]);
  const tour = tourCatalog[activeTourId] ?? tourCatalog[DEFAULT_TOUR_ID];
  const step = tour.steps[stepIndex];
  const isOnStepRoute = step ? matchesRoute(pathname, step.route) : false;

  React.useEffect(() => {
    setDismissedInSession(isTourDismissedForSession(resolvedTenantSlug));
  }, [resolvedTenantSlug]);

  React.useEffect(() => {
    const maybeAutoStart = () => {
      if (!resolvedTenantSlug || !tenant || tenant.onboardingCompletedAt || dismissedInSession) return;
      const storageKey = `tg:tour:auto-opened:${resolvedTenantSlug}`;
      if (window.sessionStorage.getItem(storageKey) === "1") return;
      window.sessionStorage.setItem(storageKey, "1");
      setActiveTourId(DEFAULT_TOUR_ID);
      setStepIndex(0);
      setIsOpen(true);
    };

    maybeAutoStart();
  }, [dismissedInSession, tenant, resolvedTenantSlug]);

  React.useEffect(() => {
    const onOpenTour = (event: Event) => {
      if (dismissedInSession) return;
      const customEvent = event as CustomEvent<TourOpenEventDetail>;
      const requestedTourId = customEvent.detail?.tourId ?? DEFAULT_TOUR_ID;
      setActiveTourId(tourCatalog[requestedTourId] ? requestedTourId : DEFAULT_TOUR_ID);
      setStepIndex(0);
      setIsOpen(true);
    };

    window.addEventListener(TOUR_OPEN_EVENT, onOpenTour as EventListener);
    return () => window.removeEventListener(TOUR_OPEN_EVENT, onOpenTour as EventListener);
  }, [dismissedInSession, tourCatalog]);

  React.useEffect(() => {
    if (!isOpen || !step || !isOnStepRoute) {
      if (activeTargetElementRef.current) {
        activeTargetElementRef.current.removeAttribute("data-tour-active");
        activeTargetElementRef.current = null;
      }
      setTargetRect(null);
      return;
    }

    const syncTarget = () => {
      const element = document.querySelector<HTMLElement>(`[data-tour-target="${step.target}"]`);
      if (!element) {
        if (activeTargetElementRef.current) {
          activeTargetElementRef.current.removeAttribute("data-tour-active");
          activeTargetElementRef.current = null;
        }
        setTargetRect(null);
        return;
      }

      if (activeTargetElementRef.current && activeTargetElementRef.current !== element) {
        activeTargetElementRef.current.removeAttribute("data-tour-active");
      }

      element.setAttribute("data-tour-active", "true");
      activeTargetElementRef.current = element;
      setTargetRect(element.getBoundingClientRect());
    };

    syncTarget();
    const raf = window.requestAnimationFrame(syncTarget);
    window.addEventListener("resize", syncTarget);
    window.addEventListener("scroll", syncTarget, true);

    return () => {
      if (activeTargetElementRef.current) {
        activeTargetElementRef.current.removeAttribute("data-tour-active");
        activeTargetElementRef.current = null;
      }
      window.cancelAnimationFrame(raf);
      window.removeEventListener("resize", syncTarget);
      window.removeEventListener("scroll", syncTarget, true);
    };
  }, [isOpen, isOnStepRoute, step]);

  const closeTour = () => {
    dismissTourForSession(resolvedTenantSlug);
    setDismissedInSession(true);
    setIsOpen(false);
    setStepIndex(0);
  };

  const nextStep = () => {
    if (stepIndex >= tour.steps.length - 1) return;
    setStepIndex((current) => current + 1);
  };

  const prevStep = () => {
    if (stepIndex <= 0) return;
    setStepIndex((current) => current - 1);
  };

  const goToStepRoute = () => {
    if (!step) return;
    router.push(step.route);
  };

  const finishOnboarding = React.useCallback(async () => {
    if (activeTourId !== "onboarding") {
      closeTour();
      return;
    }

    if (!token) {
      closeTour();
      return;
    }

    setIsFinishing(true);
    try {
      await updateTenant(token, { onboardingCompletedAt: new Date().toISOString() });
      await refresh();
      closeTour();
    } finally {
      setIsFinishing(false);
    }
  }, [activeTourId, refresh, token]);

  if (!isOpen || activeTourId !== tour.id || !step) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-0" style={{ zIndex: TOUR_LAYER_Z_INDEX }}>
      <style jsx global>{`
        [data-tour-active='true'] {
          position: relative;
          z-index: ${TOUR_TARGET_Z_INDEX};
          border-radius: 12px;
          outline: 2px solid rgba(34, 211, 238, 0.95);
          box-shadow: 0 0 0 3px rgba(34, 211, 238, 0.24), 0 12px 30px rgba(15, 23, 42, 0.38);
          transition: box-shadow 180ms ease, outline-color 180ms ease;
        }
      `}</style>

      {targetRect ? (
        <div
          className="pointer-events-none absolute text-cyan-300"
          style={{
            left: targetRect.left + targetRect.width / 2 - 14,
            top: Math.max(8, targetRect.top - 36),
          }}
        >
          <ArrowBigDownDash className="h-7 w-7 animate-bounce" />
        </div>
      ) : null}

      <aside
        className="pointer-events-auto absolute rounded-2xl border border-cyan-200/30 bg-slate-950/95 p-5 text-slate-100 shadow-[0_24px_70px_rgba(2,6,23,0.65)]"
        style={{
          right: 16,
          bottom: 16,
          width: "min(380px, calc(100vw - 24px))",
        }}
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-cyan-200">Tour guiado no sistema</p>
            <h3 className="mt-1 text-lg font-semibold leading-tight text-white">{step.title}</h3>
          </div>
          <button
            type="button"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.stopPropagation();
              closeTour();
            }}
            className="rounded-md p-1 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Fechar tour"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="text-sm leading-6 text-slate-200">{step.description}</p>

        {!isOnStepRoute ? (
          <div className="mt-4 rounded-lg border border-cyan-300/25 bg-cyan-400/10 p-3 text-xs text-cyan-100">
            Voce ainda nao esta na tela desta etapa. Use o botao abaixo para navegar automaticamente.
          </div>
        ) : null}

        {isOnStepRoute && !targetRect ? (
          <div className="mt-4 rounded-lg border border-amber-300/25 bg-amber-300/10 p-3 text-xs text-amber-100">
            O alvo desta etapa ainda nao apareceu na tela. Se a barra lateral estiver recolhida, abra-a e continue.
          </div>
        ) : null}

        <div className="mt-5 space-y-3 border-t border-white/10 pt-4">
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <MapPinned className="h-3.5 w-3.5" />
            Etapa {stepIndex + 1} de {tour.steps.length}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="ghost" size="sm" className="min-w-20" onClick={prevStep} disabled={stepIndex === 0}>
              <ChevronLeft className="mr-1 h-4 w-4" />
              Voltar
            </Button>

            {!isOnStepRoute ? (
              <Button size="sm" className="max-w-full whitespace-normal text-left leading-5" onClick={goToStepRoute}>
                {step.actionLabel}
              </Button>
            ) : stepIndex < tour.steps.length - 1 ? (
              <Button size="sm" className="min-w-24" onClick={nextStep}>
                Proximo
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            ) : (
              <Button
                size="sm"
                className="max-w-full whitespace-normal text-left leading-5"
                onClick={() => void finishOnboarding()}
                disabled={isFinishing}
              >
                {isFinishing
                  ? "Finalizando..."
                  : activeTourId === "onboarding"
                    ? "Concluir configuracao inicial"
                    : "Concluir tour"}
                {isFinishing ? null : <CheckCircle2 className="ml-1 h-4 w-4" />}
              </Button>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}
