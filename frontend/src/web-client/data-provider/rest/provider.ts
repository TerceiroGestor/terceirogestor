"use client";

import type { DataProvider, SearchArgs, SearchResult } from "@/web-client/data-provider/types";
import { listAuditLogs } from "@/web-client/data-provider/rest/audit";
import { searchPantryDonors } from "@/web-client/data-provider/rest/pantry-donors";
import { searchPantryHistory } from "@/web-client/data-provider/rest/pantry-history";
import {
  createPersonRecord,
  deletePersonRecord,
  readPerson,
  searchPeople,
  updatePersonRecord,
} from "@/web-client/data-provider/rest/people";
import {
  createTaskRecordRemote,
  deleteTaskRecordRemote,
  readTask,
  searchTaskAudit,
  searchTasks,
  updateTaskRecordRemote,
} from "@/web-client/data-provider/rest/tasks";
import { searchPantryStock } from "@/web-client/data-provider/rest/pantry-stock";
import {
  createPantryItem,
  createPantryDonor,
  createPantryEntry,
  createPantryExit,
  deletePantryItem,
  deletePantryDonor,
  deletePantryEntry,
  deletePantryExit,
  getPantryItem,
  getPantryDonor,
  getPantryEntry,
  getPantryExit,
  listPantryDonorAuditLogs,
  listPantryEntryAuditLogs,
  listPantryItemAuditLogs,
  listPantryExitAuditLogs,
  updatePantryItem,
  updatePantryDonor,
  updatePantryEntry,
  updatePantryExit,
} from "@/modules/pantry/api";

const inflightReadRequests = new Map<string, Promise<unknown>>();
const inflightSearchRequests = new Map<string, Promise<unknown>>();

function withInFlightRequest<T>(
  store: Map<string, Promise<unknown>>,
  key: string,
  load: () => Promise<T>,
) {
  const existing = store.get(key);
  if (existing) {
    return existing as Promise<T>;
  }

  const request = load().finally(() => {
    store.delete(key);
  });
  store.set(key, request as Promise<unknown>);
  return request;
}

export function createRestDataProvider({ token }: { token: string | null }): DataProvider {
  async function assertToken() {
    if (!token) {
      throw new Error("Token ausente.");
    }
    return token;
  }

  function normalizeAuditSourceContext(
    value: unknown,
  ): Array<{ entity?: string; ids: string[] }> {
    if (!Array.isArray(value)) return [];

    return value
      .map((item) => {
        if (!item || typeof item !== "object") {
          return null;
        }

        const entity =
          typeof (item as { entity?: unknown }).entity === "string"
            ? (item as { entity: string }).entity
            : undefined;
        const ids = Array.isArray((item as { ids?: unknown }).ids)
          ? (item as { ids: unknown[] }).ids
              .map((entry) => String(entry ?? "").trim())
              .filter(Boolean)
          : [];

        if (!entity && !ids.length) {
          return null;
        }

        return { entity, ids };
      })
      .filter(Boolean) as Array<{ entity?: string; ids: string[] }>;
  }

  return {
    async search<T>(model: string, args: SearchArgs) {
      const authToken = await assertToken();
      const requestKey = JSON.stringify(["search", authToken, model, args]);
      return withInFlightRequest(inflightSearchRequests, requestKey, async () => {
        switch (model) {
          case "pantry.history":
            return (await searchPantryHistory(authToken, args)) as unknown as SearchResult<T>;
          case "pantry.donors":
            return (await searchPantryDonors(authToken, args)) as unknown as SearchResult<T>;
          case "pantry.items.audit": {
            const entityId =
              typeof args.context?.entityId === "string" ? args.context.entityId : "";
            if (!entityId) {
              throw new Error("entityId ausente para auditoria do item.");
            }
            return (await listPantryItemAuditLogs(authToken, entityId, {
              page:
                typeof args.pagination?.pageIndex === "number"
                  ? args.pagination.pageIndex + 1
                  : undefined,
              limit: args.pagination?.pageSize,
            })) as unknown as SearchResult<T>;
          }
          case "pantry.donors.audit": {
            const entityId =
              typeof args.context?.entityId === "string" ? args.context.entityId : "";
            if (!entityId) {
              throw new Error("entityId ausente para auditoria do doador.");
            }
            return (await listPantryDonorAuditLogs(authToken, entityId, {
              page:
                typeof args.pagination?.pageIndex === "number"
                  ? args.pagination.pageIndex + 1
                  : undefined,
              limit: args.pagination?.pageSize,
            })) as unknown as SearchResult<T>;
          }
          case "pantry.entries.audit": {
            const entityId =
              typeof args.context?.entityId === "string" ? args.context.entityId : "";
            if (!entityId) {
              throw new Error("entityId ausente para auditoria da entrada.");
            }
            return (await listPantryEntryAuditLogs(authToken, entityId, {
              page:
                typeof args.pagination?.pageIndex === "number"
                  ? args.pagination.pageIndex + 1
                  : undefined,
              limit: args.pagination?.pageSize,
            })) as unknown as SearchResult<T>;
          }
          case "pantry.exits.audit": {
            const entityId =
              typeof args.context?.entityId === "string" ? args.context.entityId : "";
            if (!entityId) {
              throw new Error("entityId ausente para auditoria da saida.");
            }
            return (await listPantryExitAuditLogs(authToken, entityId, {
              page:
                typeof args.pagination?.pageIndex === "number"
                  ? args.pagination.pageIndex + 1
                  : undefined,
              limit: args.pagination?.pageSize,
            })) as unknown as SearchResult<T>;
          }
          case "pantry.stock":
            return (await searchPantryStock(authToken, args)) as unknown as SearchResult<T>;
          case "people.list":
            return (await searchPeople(authToken, args)) as unknown as SearchResult<T>;
          case "tasks.list":
            return (await searchTasks(authToken, args)) as unknown as SearchResult<T>;
          case "tasks.audit":
            return (await searchTaskAudit(authToken, args)) as unknown as SearchResult<T>;
          case "audit.logs":
          {
            const page =
              typeof args.pagination?.pageIndex === "number"
                ? args.pagination.pageIndex + 1
                : undefined;
            const limit = args.pagination?.pageSize;
            const action =
              typeof args.context?.action === "string" ? args.context.action : undefined;
            const entity =
              typeof args.context?.entity === "string" ? args.context.entity : undefined;
            const entityId =
              typeof args.context?.entityId === "string" ? args.context.entityId : undefined;
            const userId =
              typeof args.context?.userId === "string" ? args.context.userId : undefined;
            const from = typeof args.context?.from === "string" ? args.context.from : undefined;
            const to = typeof args.context?.to === "string" ? args.context.to : undefined;
            const search =
              typeof args.context?.search === "string" ? args.context.search : undefined;
            const sourceContext = normalizeAuditSourceContext(args.context?.sourceContext);

            if (sourceContext.length) {
              const requests = sourceContext.flatMap((source) => {
                const requestEntity = source.entity ?? entity;

                if (!source.ids.length) {
                  return [
                    listAuditLogs(authToken, {
                      page,
                      limit,
                      action,
                      entity: requestEntity,
                      userId,
                      from,
                      to,
                      search,
                    }),
                  ];
                }

                return source.ids.map((sourceId) =>
                  listAuditLogs(authToken, {
                    page,
                    limit,
                    action,
                    entity: requestEntity,
                    entityId: sourceId,
                    userId,
                    from,
                    to,
                    search,
                  }),
                );
              });

              const responses = await Promise.all(requests);
              const uniqueLogs = new Map<string, T>();

              responses.forEach((response) => {
                response.data.forEach((log) => {
                  const key =
                    log && typeof log === "object" && "id" in log
                      ? String((log as { id?: unknown }).id ?? "")
                      : "";
                  uniqueLogs.set(key || JSON.stringify(log), log as T);
                });
              });

              const combinedData = Array.from(uniqueLogs.values());
              const total = responses.reduce(
                (sum, response) => sum + (response.pagination?.total ?? response.data.length),
                0,
              );

              return {
                data: combinedData,
                pagination: {
                  page: page ?? 1,
                  limit: limit ?? Math.max(combinedData.length, 1),
                  total,
                  pages:
                    limit && limit > 0 ? Math.max(Math.ceil(total / limit), 1) : 1,
                },
              } as SearchResult<T>;
            }

            return (await listAuditLogs(authToken, {
              page,
              limit,
              action,
              entity,
              entityId,
              userId,
              from,
              to,
              search,
            })) as unknown as SearchResult<T>;
          }
          default:
            throw new Error(`Model nao suportado: ${model}`);
        }
      });
    },
    async read<T>(model: string, id: string) {
      const authToken = await assertToken();
      const requestKey = JSON.stringify(["read", authToken, model, id]);
      return withInFlightRequest(inflightReadRequests, requestKey, async () => {
        switch (model) {
          case "pantry.items":
            return (await getPantryItem(authToken, id)) as unknown as T;
          case "pantry.donors":
            return (await getPantryDonor(authToken, id)) as unknown as T;
          case "pantry.entries":
            return (await getPantryEntry(authToken, id)) as unknown as T;
          case "pantry.exits":
            return (await getPantryExit(authToken, id)) as unknown as T;
          case "people.detail":
            return (await readPerson(authToken, id)) as unknown as T;
          case "tasks.detail":
            return (await readTask(authToken, id)) as unknown as T;
          default:
            throw new Error(`read() nao implementado para ${model}`);
        }
      });
    },
    async create<T>(model: string, payload: unknown) {
      const authToken = await assertToken();
      switch (model) {
        case "pantry.items":
          return (await createPantryItem(authToken, payload as never)) as unknown as T;
        case "pantry.donors":
          return (await createPantryDonor(authToken, payload as never)) as unknown as T;
        case "pantry.entries":
          return (await createPantryEntry(authToken, payload as never)) as unknown as T;
        case "pantry.exits":
          return (await createPantryExit(authToken, payload as never)) as unknown as T;
        case "people.detail":
          return (await createPersonRecord(authToken, payload as never)) as unknown as T;
        case "tasks.detail":
          return (await createTaskRecordRemote(authToken, payload as never)) as unknown as T;
        default:
          throw new Error(`create() nao implementado para ${model}`);
      }
    },
    async update<T>(model: string, id: string, payload: unknown) {
      const authToken = await assertToken();
      switch (model) {
        case "pantry.items":
          return (await updatePantryItem(authToken, id, payload as never)) as unknown as T;
        case "pantry.donors":
          return (await updatePantryDonor(authToken, id, payload as never)) as unknown as T;
        case "pantry.entries":
          return (await updatePantryEntry(authToken, id, payload as never)) as unknown as T;
        case "pantry.exits":
          return (await updatePantryExit(authToken, id, payload as never)) as unknown as T;
        case "people.detail":
          return (await updatePersonRecord(authToken, id, payload as never)) as unknown as T;
        case "tasks.detail":
          return (await updateTaskRecordRemote(authToken, id, payload as never)) as unknown as T;
        default:
          throw new Error(`update() nao implementado para ${model}`);
      }
    },
    async delete(model: string, id: string) {
      const authToken = await assertToken();
      switch (model) {
        case "pantry.items":
          await deletePantryItem(authToken, id);
          return;
        case "pantry.donors":
          await deletePantryDonor(authToken, id);
          return;
        case "pantry.entries":
          await deletePantryEntry(authToken, id);
          return;
        case "pantry.exits":
          await deletePantryExit(authToken, id);
          return;
        case "people.detail":
          await deletePersonRecord(authToken, id);
          return;
        case "tasks.detail":
          await deleteTaskRecordRemote(authToken, id);
          return;
        default:
          throw new Error(`delete() nao implementado para ${model}`);
      }
    },
  };
}
