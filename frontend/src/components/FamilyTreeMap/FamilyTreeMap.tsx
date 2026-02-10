"use client";

import * as React from "react";
import {
  HeartPulse,
  Pill,
  Minus,
  Plus,
  RefreshCcw,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  getAgeFromBirthDate,
  resolvePersonDisplayNames,
} from "@/app/[tenant]/(modules)/people/utils";
import { PersonIdentityAvatarTrigger } from "@/components/person-identity-card";

export type FamilyTreeMapNode = {
  id: string;
  fullName: string;
  socialName?: string | null;
  birthDate?: string | null;
  avatarUrl?: string | null;
  personType?: string | null;
  hasHealthCondition?: boolean | null;
  hasMedication?: boolean | null;
  depth?: number | null;
};

export type FamilyTreeMapEdge = {
  id: string;
  fromId: string;
  toId: string;
  type: string;
};

type FamilyTreeMapProps = {
  rootId: string;
  nodes: FamilyTreeMapNode[];
  edges: FamilyTreeMapEdge[];
  tenantSlug?: string | null;
  onNavigate?: (personId: string) => void;
  className?: string;
  allowFullscreen?: boolean;
  minScale?: number;
  maxScale?: number;
};

type Point = { x: number; y: number };

const DEFAULT_MIN_SCALE = 0.6;
const DEFAULT_MAX_SCALE = 2.4;
const BASE_RADIUS = 220;
const RING_SPACING = 220;
const CANVAS_PADDING = 320;
const NODE_CARD_WIDTH = 240;
const NODE_CARD_HEIGHT = 150;
const NODE_ARC_GAP = 32;
const NODE_RADIAL_GAP = 190;
const ROW_DISTANCE = 260;
const ROW_STACK_GAP = 180;
const COLUMN_SPACING = 320;
const VERTICAL_SPACING = 190;

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export function FamilyTreeMap({
  rootId,
  nodes,
  edges,
  tenantSlug,
  onNavigate,
  className,
  allowFullscreen = true,
  minScale = DEFAULT_MIN_SCALE,
  maxScale = DEFAULT_MAX_SCALE,
}: FamilyTreeMapProps) {
  const outerRef = React.useRef<HTMLDivElement | null>(null);
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = React.useState(1);
  const [offset, setOffset] = React.useState<Point>({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const isPanningRef = React.useRef(false);
  const panStartRef = React.useRef<Point>({ x: 0, y: 0 });
  const offsetStartRef = React.useRef<Point>({ x: 0, y: 0 });
  const initializedRef = React.useRef<string | null>(null);

  const normalizedNodes = React.useMemo(() => {
    return nodes.map((node) => ({
      ...node,
      depth:
        typeof node.depth === "number"
          ? node.depth
          : node.id === rootId
            ? 0
            : 1,
    }));
  }, [nodes, rootId]);


  const normalizeRelationKey = React.useCallback((value?: string | null) => {
    return (value ?? "")
      .toString()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z]/g, "");
  }, []);

  const resolveInverseRelation = React.useCallback(
    (value?: string | null) => {
      const key = normalizeRelationKey(value);
      if (key.startsWith("pai") || key.startsWith("mae") || key.startsWith("avo")) {
        return "Filho(a)";
      }
      if (key.startsWith("filho") || key.startsWith("filha") || key.startsWith("neto")) {
        return "Pai/Mae";
      }
      if (key.startsWith("irma")) {
        return "Irmao(a)";
      }
      if (key.startsWith("conjuge") || key.startsWith("espos")) {
        return "Conjuge";
      }
      if (key.startsWith("responsavel")) {
        return "Dependente";
      }
      if (key.startsWith("dependente")) {
        return "Responsavel";
      }
      return value ?? "Relacionado";
    },
    [normalizeRelationKey],
  );

  const rolePriority: Record<string, number> = {
    parent: 0,
    spouse: 1,
    child: 2,
    sibling: 3,
    other: 4,
  };

  const resolveRole = React.useCallback(
    (relationLabel?: string | null) => {
      const key = normalizeRelationKey(relationLabel);
      if (
        key.startsWith("pai") ||
        key.startsWith("mae") ||
        key.startsWith("responsavel") ||
        key.startsWith("avo")
      ) {
        return "parent";
      }
      if (
        key.startsWith("filho") ||
        key.startsWith("filha") ||
        key.startsWith("dependente") ||
        key.startsWith("neto")
      ) {
        return "child";
      }
      if (key.startsWith("irma")) {
        return "sibling";
      }
      if (key.startsWith("conjuge") || key.startsWith("espos")) {
        return "spouse";
      }
      return "other";
    },
    [normalizeRelationKey],
  );

  const rootRelationById = React.useMemo(() => {
    const map = new Map<string, string>();
    const roleMap = new Map<string, string>();
    edges.forEach((edge) => {
      const isFromRoot = edge.fromId === rootId;
      const isToRoot = edge.toId === rootId;
      if (!isFromRoot && !isToRoot) return;
      const otherId = isFromRoot ? edge.toId : edge.fromId;
      const relationLabel = isFromRoot
        ? edge.type
        : resolveInverseRelation(edge.type);
      const role = resolveRole(relationLabel);
      if (!map.has(otherId)) {
        map.set(otherId, relationLabel);
        roleMap.set(otherId, role);
        return;
      }
      const currentRole = roleMap.get(otherId) ?? "other";
      if (rolePriority[role] < rolePriority[currentRole]) {
        map.set(otherId, relationLabel);
        roleMap.set(otherId, role);
      }
    });
    return { relationMap: map, roleMap };
  }, [edges, rootId, resolveInverseRelation, resolveRole]);

  const resolveRelationLabel = React.useCallback(
    (nodeId: string) => {
      if (nodeId === rootId) return "Pessoa base";
      return rootRelationById.relationMap.get(nodeId) ?? "Relacionado";
    },
    [rootId, rootRelationById],
  );

  const positions = React.useMemo(() => {
    const map = new Map<string, Point>();
    map.set(rootId, { x: 0, y: 0 });

    const directIds = new Set(rootRelationById.relationMap.keys());
    const roleMap = rootRelationById.roleMap;
    const parents = Array.from(directIds).filter(
      (id) => roleMap.get(id) === "parent",
    );
    const spouses = Array.from(directIds).filter(
      (id) => roleMap.get(id) === "spouse",
    );
    const children = Array.from(directIds).filter(
      (id) => roleMap.get(id) === "child",
    );
    const siblings = Array.from(directIds).filter(
      (id) => roleMap.get(id) === "sibling",
    );
    const others = Array.from(directIds).filter(
      (id) => roleMap.get(id) === "other",
    );

    parents.sort((a, b) => {
      const aKey = normalizeRelationKey(rootRelationById.relationMap.get(a));
      const bKey = normalizeRelationKey(rootRelationById.relationMap.get(b));
      const aOrder = aKey.startsWith("pai") ? 0 : aKey.startsWith("mae") ? 1 : 2;
      const bOrder = bKey.startsWith("pai") ? 0 : bKey.startsWith("mae") ? 1 : 2;
      if (aOrder !== bOrder) return aOrder - bOrder;
      return aKey.localeCompare(bKey);
    });

    const placeRow = (
      ids: string[],
      baseY: number,
      direction: 1 | -1,
      maxPerRow = 4,
    ) => {
      const rows = Math.ceil(ids.length / maxPerRow);
      for (let row = 0; row < rows; row += 1) {
        const rowIds = ids.slice(row * maxPerRow, (row + 1) * maxPerRow);
        const rowY = baseY + direction * row * ROW_STACK_GAP;
        const rowWidth = (rowIds.length - 1) * COLUMN_SPACING;
        rowIds.forEach((id, index) => {
          map.set(id, {
            x: -rowWidth / 2 + index * COLUMN_SPACING,
            y: rowY,
          });
        });
      }
    };

    const placeColumn = (ids: string[], x: number) => {
      const total = ids.length;
      const startY = -((total - 1) * VERTICAL_SPACING) / 2;
      ids.forEach((id, index) => {
        map.set(id, {
          x,
          y: startY + index * VERTICAL_SPACING,
        });
      });
    };

    placeRow(parents, -ROW_DISTANCE, -1, 3);
    placeRow(children, ROW_DISTANCE, 1, 4);
    placeRow(others, ROW_DISTANCE + ROW_STACK_GAP, 1, 4);

    const leftSideX = -COLUMN_SPACING;
    const rightSideX = COLUMN_SPACING;
    placeColumn(siblings, leftSideX);
    placeColumn(spouses, rightSideX);

    const remaining = normalizedNodes.filter(
      (node) => !directIds.has(node.id) && node.id !== rootId,
    );
    const maxDepth = Math.max(0, ...remaining.map((n) => n.depth ?? 0));
    let lastRadius =
      Math.max(
        Math.abs(leftSideX),
        Math.abs(rightSideX),
        ROW_DISTANCE + ROW_STACK_GAP,
      ) + 120;
    for (let depth = 2; depth <= maxDepth; depth += 1) {
      const ringNodes = remaining.filter((node) => (node.depth ?? 0) === depth);
      if (!ringNodes.length) continue;
      const count = ringNodes.length;
      const minRadiusForSpacing =
        ((NODE_CARD_WIDTH + NODE_ARC_GAP) * count) / (2 * Math.PI);
      const baseRadius = BASE_RADIUS + (depth - 2) * RING_SPACING;
      const minRadiusForGap =
        lastRadius + Math.max(NODE_RADIAL_GAP, NODE_CARD_HEIGHT * 0.9);
      const radius = Math.max(baseRadius, minRadiusForSpacing, minRadiusForGap);
      lastRadius = radius;
      const step = (Math.PI * 2) / count;
      const start = -Math.PI / 2;
      ringNodes.forEach((node, index) => {
        if (map.has(node.id)) return;
        const angle = start + step * index;
        map.set(node.id, {
          x: Math.cos(angle) * radius,
          y: Math.sin(angle) * radius,
        });
      });
    }

    return map;
  }, [normalizedNodes, rootId, rootRelationById, normalizeRelationKey]);

  const canvasSize = React.useMemo(() => {
    const points = Array.from(positions.values());
    const radii = points.map((point) => Math.max(Math.abs(point.x), Math.abs(point.y)));
    const maxRadius = radii.length ? Math.max(...radii) : 0;
    const size = maxRadius * 2 + CANVAS_PADDING * 2;
    return Math.max(720, size);
  }, [positions]);

  const center = canvasSize / 2;

  const nodePoints = React.useMemo(() => {
    const map = new Map<string, Point>();
    positions.forEach((point, id) => {
      map.set(id, {
        x: center + point.x,
        y: center + point.y,
      });
    });
    return map;
  }, [positions, center]);

  React.useLayoutEffect(() => {
    if (!containerRef.current) return;
    if (initializedRef.current === rootId) return;
    const rect = containerRef.current.getBoundingClientRect();
    setOffset({
      x: rect.width / 2 - center,
      y: rect.height / 2 - center,
    });
    setScale(1);
    initializedRef.current = rootId;
  }, [center, rootId]);

  React.useEffect(() => {
    if (typeof document === "undefined") return;
    const handler = () => {
      const active = document.fullscreenElement === outerRef.current;
      setIsFullscreen(active);
    };
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (!containerRef.current) return;
    const delta = -event.deltaY;
    const rect = containerRef.current.getBoundingClientRect();
    const cursor = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    const nextScale = clamp(scale * (1 + delta * 0.0015), minScale, maxScale);
    const ratio = nextScale / scale;
    setOffset((prev) => ({
      x: cursor.x - ratio * (cursor.x - prev.x),
      y: cursor.y - ratio * (cursor.y - prev.y),
    }));
    setScale(nextScale);
  };

  const startPan = (event: React.PointerEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement | null;
    if (target?.closest("[data-map-node]")) return;
    isPanningRef.current = true;
    panStartRef.current = { x: event.clientX, y: event.clientY };
    offsetStartRef.current = { ...offset };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const movePan = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isPanningRef.current) return;
    const dx = event.clientX - panStartRef.current.x;
    const dy = event.clientY - panStartRef.current.y;
    setOffset({
      x: offsetStartRef.current.x + dx,
      y: offsetStartRef.current.y + dy,
    });
  };

  const endPan = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isPanningRef.current) return;
    isPanningRef.current = false;
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const handleReset = () => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setOffset({
      x: rect.width / 2 - center,
      y: rect.height / 2 - center,
    });
    setScale(1);
  };

  const zoomAtCenter = (nextScale: number) => {
    if (!containerRef.current) {
      setScale(nextScale);
      return;
    }
    const rect = containerRef.current.getBoundingClientRect();
    const centerPoint = { x: rect.width / 2, y: rect.height / 2 };
    const ratio = nextScale / scale;
    setOffset((prev) => ({
      x: centerPoint.x - ratio * (centerPoint.x - prev.x),
      y: centerPoint.y - ratio * (centerPoint.y - prev.y),
    }));
    setScale(nextScale);
  };

  const onZoomIn = () =>
    zoomAtCenter(clamp(scale + 0.1, minScale, maxScale));
  const onZoomOut = () =>
    zoomAtCenter(clamp(scale - 0.1, minScale, maxScale));

  const toggleFullscreen = async () => {
    if (!allowFullscreen) return;
    if (typeof document === "undefined") return;
    const element = outerRef.current;
    if (!element) return;
    try {
      if (document.fullscreenElement === element) {
        await document.exitFullscreen?.();
      } else {
        await element.requestFullscreen?.();
      }
    } catch {
      // ignore
    }
  };

  return (
    <div
      ref={outerRef}
      className={cn(
        "relative w-full overflow-hidden",
        isFullscreen ? "h-screen bg-background" : "h-[70vh]",
        className,
      )}
    >
      <div
        ref={containerRef}
        onWheel={handleWheel}
        onPointerDown={startPan}
        onPointerMove={movePan}
        onPointerUp={endPan}
        onPointerLeave={endPan}
        className="absolute inset-0 cursor-grab active:cursor-grabbing"
      >
        <div
          className="absolute left-0 top-0"
          style={{
            width: canvasSize,
            height: canvasSize,
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
            transformOrigin: "0 0",
          }}
        >
          <svg
            className="absolute inset-0 z-0 pointer-events-none"
            width={canvasSize}
            height={canvasSize}
          >
            {edges.map((edge) => {
              const from = nodePoints.get(edge.fromId);
              const to = nodePoints.get(edge.toId);
              if (!from || !to) return null;
              return (
                <line
                  key={edge.id}
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  stroke="hsl(var(--primary))"
                  strokeOpacity="0.35"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                />
              );
            })}
          </svg>

          {normalizedNodes.map((node) => {
            const point = nodePoints.get(node.id);
            if (!point) return null;
            const display = resolvePersonDisplayNames(
              node.fullName,
              node.socialName,
            );
            const ageValue = getAgeFromBirthDate(node.birthDate);
            const ageLabel =
              ageValue !== null ? `${ageValue} anos` : "Idade nao informada";
            const relationLabel = resolveRelationLabel(node.id);

            return (
              <div
                key={node.id}
                data-map-node
                className={cn(
                  "absolute z-10 w-[240px] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border/60 bg-background/90 p-3 shadow-sm",
                  node.id === rootId && "border-primary/40 bg-primary/5",
                )}
                style={{ left: point.x, top: point.y }}
              >
                <div className="flex items-start gap-3">
                  <div
                    onClick={(event) => event.stopPropagation()}
                    onPointerDown={(event) => event.stopPropagation()}
                  >
                    <PersonIdentityAvatarTrigger
                      personId={node.id}
                      tenantSlug={tenantSlug}
                      fullName={node.fullName}
                      socialName={node.socialName}
                      birthDate={node.birthDate}
                      avatarUrl={node.avatarUrl}
                      hasHealthCondition={node.hasHealthCondition}
                      hasMedication={node.hasMedication}
                      avatarClassName="h-11 w-11"
                      buttonClassName="shrink-0"
                      tooltipLabel="Ver perfil"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {display.primary}
                    </p>
                    {display.secondary ? (
                      <p className="truncate text-xs text-muted-foreground">
                        {display.secondary}
                      </p>
                    ) : null}
                    <p className="text-[11px] text-muted-foreground">
                      {ageLabel}
                    </p>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-1">
                  <Badge variant="secondary" className="text-[10px]">
                    {relationLabel}
                  </Badge>
                  {node.personType ? (
                    <Badge variant="outline" className="text-[10px]">
                      {node.personType}
                    </Badge>
                  ) : null}
                  {node.hasHealthCondition ? (
                    <Badge variant="outline" className="gap-1 text-[10px]">
                      <HeartPulse className="h-3 w-3 text-rose-500" />
                      Saude
                    </Badge>
                  ) : null}
                  {node.hasMedication ? (
                    <Badge variant="outline" className="gap-1 text-[10px]">
                      <Pill className="h-3 w-3 text-blue-500" />
                      Medicacao
                    </Badge>
                  ) : null}
                </div>
                {onNavigate ? (
                  <div className="mt-3 flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      onClick={(event) => {
                        event.stopPropagation();
                        onNavigate(node.id);
                      }}
                    >
                      Ver arvore
                    </Button>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      <div className="absolute bottom-4 right-4 flex flex-col gap-2 rounded-2xl border border-border/60 bg-background/90 p-2 shadow-sm">
        <Button variant="outline" size="icon-xs" onClick={onZoomIn}>
          <Plus className="h-3 w-3" />
        </Button>
        <Button variant="outline" size="icon-xs" onClick={onZoomOut}>
          <Minus className="h-3 w-3" />
        </Button>
        <Button variant="outline" size="icon-xs" onClick={handleReset}>
          <RefreshCcw className="h-3 w-3" />
        </Button>
      </div>
      {allowFullscreen ? (
        <div className="absolute right-4 top-4 rounded-2xl border border-border/60 bg-background/90 p-2 shadow-sm">
          <Button variant="outline" size="icon-xs" onClick={toggleFullscreen}>
            {isFullscreen ? (
              <Minimize2 className="h-3 w-3" />
            ) : (
              <Maximize2 className="h-3 w-3" />
            )}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
