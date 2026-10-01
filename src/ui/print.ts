import { padEnd, symbols, theme, visibleWidth } from './theme';

export function success(message: string): void {
  console.log(`${theme.success(symbols.success)} ${message}`);
}

export function error(message: string): void {
  console.error(`${theme.error(symbols.error)} ${theme.error(message)}`);
}

export function warn(message: string): void {
  console.log(`${theme.warn(symbols.warn)} ${message}`);
}

export function info(message: string): void {
  console.log(`${theme.info(symbols.info)} ${message}`);
}

export function hint(message: string): void {
  console.log(theme.dim(message));
}

export function title(message: string): void {
  console.log(`\n${theme.accent(message)}`);
}

/** Tableau aligné, compatible avec les chaînes colorées. */
export function table(headers: string[], rows: string[][]): void {
  const widths = headers.map((h, i) =>
    Math.max(h.length, ...rows.map((r) => visibleWidth(r[i] ?? ''))),
  );
  const line = (cells: string[]) => cells.map((c, i) => padEnd(c ?? '', widths[i])).join('  ').trimEnd();
  console.log(line(headers.map((h) => theme.label(h))));
  console.log(theme.dim(widths.map((w) => '─'.repeat(w)).join('  ')));
  for (const row of rows) console.log(line(row));
}
