// Server-side Query Parser & Filter
// Issue #60: Add server-side filtering, sorting, and pagination

export interface QueryParams {
  filters?: string;      // filter=status=active,age>20
  sort?: string;        // sort=createdAt:desc
  limit?: string;       // limit=10
  offset?: string;      // offset=0
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

/**
 * Parse query string to structured filters
 * Example: "status=active,age>20,name~john" 
 * 
 * Operators:
 * =   : equals
 * !=  : not equals
 * >   : greater than
 * >=  : greater or equal
 * <   : less than
 * <=  : less or equal
 * ~   : contains
 * ^   : starts with
 * $   : ends with
 * ,   : OR (for same column with multiple values)
 */
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

      // Map operator symbols
      if (operator === '=') op = 'eq';
      else if (operator === '!=' || operator === '!') op = 'ne';
      else if (operator === '>=') op = 'gte';
      else if (operator === '<=') op = 'lte';
      else if (operator === '>') op = 'gt';
      else if (operator === '<') op = 'lt';
      else if (operator === '~') { op = 'contains'; parsedValue = value; }
      else if (operator === '^') { op = 'startsWith'; parsedValue = value; }
      else if (operator === '$') { op = 'endsWith'; parsedValue = value; }
      else if (operator === ',') { op = 'in'; parsedValue = value.split('|'); }

      // Try to parse number
      if (!isNaN(Number(value)) && value !== '') {
        parsedValue = Number(value);
      }
      // Parse boolean
      if (value === 'true') parsedValue = true;
      if (value === 'false') parsedValue = false;

      filters.push({ column, operator: op, value: parsedValue });
    }
  }

  return filters;
}

/**
 * Parse sort string
 * Example: "createdAt:desc,name:asc"
 */
export function parseSort(sortStr: string): SortCondition[] {
  if (!sortStr) return [];

  const sorts: SortCondition[] = [];
  const conditions = sortStr.split(',');

  for (const condition of conditions) {
    const [column, direction] = condition.split(':');
    if (column) {
      sorts.push({
        column,
        direction: (direction === 'desc') ? 'desc' : 'asc'
      });
    }
  }

  return sorts;
}

/**
 * Parse limit and offset
 */
export function parsePagination(limit?: string, offset?: string): { limit: number; offset: number } {
  return {
    limit: Math.min(parseInt(limit || '50') || 50, 100), // Max 100
    offset: parseInt(offset || '0') || 0
  };
}

/**
 * Apply filters to documents
 */
export function applyFilters<T extends Record<string, any>>(documents: T[], filters: FilterCondition[]): T[] {
  if (filters.length === 0) return documents;

  return documents.filter(doc => {
    return filters.every(filter => {
      const value = doc[filter.column];
      if (value === undefined) return false;

      switch (filter.operator) {
        case 'eq': return value == filter.value;
        case 'ne': return value != filter.value;
        case 'gt': return Number(value) > Number(filter.value);
        case 'gte': return Number(value) >= Number(filter.value);
        case 'lt': return Number(value) < Number(filter.value);
        case 'lte': return Number(value) <= Number(filter.value);
        case 'contains': return String(value).toLowerCase().includes(String(filter.value).toLowerCase());
        case 'startsWith': return String(value).toLowerCase().startsWith(String(filter.value).toLowerCase());
        case 'endsWith': return String(value).toLowerCase().endsWith(String(filter.value).toLowerCase());
        case 'in': return Array.isArray(filter.value) && filter.value.includes(value);
        default: return true;
      }
    });
  });
}

/**
 * Apply sorting to documents
 */
export function applySort<T extends Record<string, any>>(documents: T[], sorts: SortCondition[]): T[] {
  if (sorts.length === 0) return documents;

  return [...documents].sort((a, b) => {
    for (const sort of sorts) {
      const aVal = a[sort.column];
      const bVal = b[sort.column];

      if (aVal === bVal) continue;
      if (aVal === undefined || aVal === null) return 1;
      if (bVal === undefined || bVal === null) return -1;

      let comparison = 0;
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        comparison = aVal - bVal;
      } else {
        comparison = String(aVal).localeCompare(String(bVal));
      }

      if (comparison !== 0) {
        return sort.direction === 'desc' ? -comparison : comparison;
      }
    }
    return 0;
  });
}

/**
 * Apply pagination to documents
 */
export function applyPagination<T>(documents: T[], limit: number, offset: number): { data: T[]; total: number; hasMore: boolean } {
  const total = documents.length;
  const data = documents.slice(offset, offset + limit);
  const hasMore = offset + limit < total;

  return { data, total, hasMore };
}

/**
 * Main function to process query
 */
export function processQuery<T extends Record<string, any>>(
  documents: T[],
  params: QueryParams
): { data: T[]; total: number; hasMore: boolean } {
  // 1. Parse query params
  const filters = parseFilters(params.filters || '');
  const sorts = parseSort(params.sort || '');
  const { limit, offset } = parsePagination(params.limit, params.offset);

  // 2. Apply filters
  let result = applyFilters(documents, filters);

  // 3. Apply sorting
  result = applySort(result, sorts);

  // 4. Apply pagination
  return applyPagination(result, limit, offset);
}