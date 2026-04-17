// Server-side Query Parser & Filter
// Issue #60: Add server-side filtering, sorting, and pagination

export interface QueryParams {
  filters?: string;
  sort?: string;
  limit?: string;
  offset?: string;
}

export interface FilterCondition {
  column: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'startsWith' | 'endsWith' | 'in';
  value: string | number | boolean | string[];
}

export interface SortCondition {
  column: string;
  direction: 'asc' | 'desc';
}

export function parseFilters(filterStr: string): FilterCondition[] {
  if (!filterStr) return [];
  const filters: FilterCondition[] = [];
  const conditions = filterStr.split(',');

  for (const condition of conditions) {
    const match = condition.match(/^([^!><~^$=,]+)(!?|>=|<=|>|<|~|\^|\$|=)(.+)$/);
    if (match) {
      const [, column, operator, value] = match;
      let op: FilterCondition['operator'] = 'eq';
      let parsedValue: string | number | boolean | string[] = value;

      if (operator === '=') op = 'eq';
      else if (operator === '!=' || operator === '!') op = 'ne';
      else if (operator === '>=') op = 'gte';
      else if (operator === '<=') op = 'lte';
      else if (operator === '>') op = 'gt';
      else if (operator === '<') op = 'lt';
      else if (operator === '~') { op = 'contains'; }
      else if (operator === '^') { op = 'startsWith'; }
      else if (operator === '$') { op = 'endsWith'; }

      if (!isNaN(Number(value)) && value !== '') parsedValue = Number(value);
      if (value === 'true') parsedValue = true;
      if (value === 'false') parsedValue = false;

      filters.push({ column, operator: op, value: parsedValue });
    }
  }
  return filters;
}

export function parseSort(sortStr: string): SortCondition[] {
  if (!sortStr) return [];
  return sortStr.split(',').map(c => {
    const [column, direction] = c.split(':');
    return { column, direction: direction === 'desc' ? 'desc' : 'asc' };
  }).filter(s => s.column);
}

export function parsePagination(limit?: string, offset?: string) {
  return {
    limit: Math.min(parseInt(limit || '50') || 50, 100),
    offset: parseInt(offset || '0') || 0
  };
}

export function applyFilters<T extends Record<string, any>>(documents: T[], filters: FilterCondition[]): T[] {
  if (filters.length === 0) return documents;
  return documents.filter(doc => {
    return filters.every(f => {
      const val = doc[f.column];
      if (val === undefined) return false;
      switch (f.operator) {
        case 'eq': return val == f.value;
        case 'ne': return val != f.value;
        case 'gt': return Number(val) > Number(f.value);
        case 'gte': return Number(val) >= Number(f.value);
        case 'lt': return Number(val) < Number(f.value);
        case 'lte': return Number(val) <= Number(f.value);
        case 'contains': return String(val).toLowerCase().includes(String(f.value).toLowerCase());
        case 'startsWith': return String(val).toLowerCase().startsWith(String(f.value).toLowerCase());
        case 'endsWith': return String(val).toLowerCase().endsWith(String(f.value).toLowerCase());
        default: return true;
      }
    });
  });
}

export function applySort<T extends Record<string, any>>(documents: T[], sorts: SortCondition[]): T[] {
  if (sorts.length === 0) return documents;
  return [...documents].sort((a, b) => {
    for (const s of sorts) {
      const aVal = a[s.column], bVal = b[s.column];
      if (aVal === bVal) continue;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      const cmp = typeof aVal === 'number' ? aVal - bVal : String(aVal).localeCompare(String(bVal));
      if (cmp !== 0) return s.direction === 'desc' ? -cmp : cmp;
    }
    return 0;
  });
}

export function applyPagination<T>(docs: T[], limit: number, offset: number) {
  return {
    data: docs.slice(offset, offset + limit),
    total: docs.length,
    hasMore: offset + limit < docs.length
  };
}

export function processQuery<T extends Record<string, any>>(documents: T[], params: QueryParams) {
  let result = applyFilters(documents, parseFilters(params.filters || ''));
  result = applySort(result, parseSort(params.sort || ''));
  const { limit, offset } = parsePagination(params.limit, params.offset);
  return applyPagination(result, limit, offset);
}