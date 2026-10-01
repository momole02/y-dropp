import fs from 'fs';
import { HISTORY_PATH, YDROPP_HOME } from './paths';

export interface HistoryEntry {
  name: string;
  path: string;
  size: number;
  date: string;
  durationMs: number;
  from: string;
}

const MAX_ENTRIES = 500;

export function readHistory(): HistoryEntry[] {
  try {
    const data = JSON.parse(fs.readFileSync(HISTORY_PATH, 'utf8'));
    return Array.isArray(data) ? (data as HistoryEntry[]) : [];
  } catch {
    return [];
  }
}

function writeHistory(entries: HistoryEntry[]): void {
  fs.mkdirSync(YDROPP_HOME, { recursive: true });
  fs.writeFileSync(HISTORY_PATH, JSON.stringify(entries, null, 2) + '\n', 'utf8');
}

export function addHistoryEntry(entry: HistoryEntry): void {
  const entries = readHistory();
  entries.push(entry);
  writeHistory(entries.slice(-MAX_ENTRIES));
}

export function clearHistory(): number {
  const count = readHistory().length;
  writeHistory([]);
  return count;
}
