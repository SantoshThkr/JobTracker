import { isStatus, isWorkMode, type Status, type WorkMode } from "./constants";

export type ApplicationFilters = {
  q?: string;
  status?: Status;
  workMode?: WorkMode;
};

type SearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

/** Turns untrusted query-string values into filters; unknown values are ignored. */
export function parseFilters(searchParams: SearchParams): ApplicationFilters {
  const filters: ApplicationFilters = {};
  const q = first(searchParams.q)?.trim().slice(0, 100);
  if (q) filters.q = q;
  const status = first(searchParams.status);
  if (isStatus(status)) filters.status = status;
  const workMode = first(searchParams.mode);
  if (isWorkMode(workMode)) filters.workMode = workMode;
  return filters;
}

export function hasFilters(filters: ApplicationFilters) {
  return Boolean(filters.q || filters.status || filters.workMode);
}

/** Escapes text so it matches literally inside a RegExp. */
export function escapeRegExp(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
