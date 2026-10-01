// Page d'envoi de Y Dropp : un PUT application/octet-stream par fichier,
// 2 envois simultanés, progression via XMLHttpRequest.upload.onprogress.

interface YDroppConfig {
  pinRequired: boolean;
  maxSize: number | null;
  hostname: string;
}

type ItemState = 'queued' | 'uploading' | 'done' | 'error' | 'canceled';

interface Item {
  id: number;
  file: File;
  state: ItemState;
  loaded: number;
  startedAt: number;
  xhr?: XMLHttpRequest;
  el: HTMLLIElement;
  savedAs?: string;
}

const CONFIG = (window as unknown as { YDROPP: YDroppConfig }).YDROPP;
const CONCURRENCY = 2;

const ICONS = {
  file: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/>',
  image: '<rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"/>',
  video: '<path d="m16 13 5.2 3.5a.5.5 0 0 0 .8-.4V7.9a.5.5 0 0 0-.8-.4L16 11"/><rect x="2" y="6" width="14" height="12" rx="2"/>',
  audio: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
  archive: '<rect width="20" height="5" x="2" y="3" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"/><path d="M10 12h4"/>',
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  retry: '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
};

function svg(paths: string, cls = 'h-5 w-5'): string {
  return `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;
}

function $(id: string): HTMLElement {
  const el = document.getElementById(id);
  if (!el) throw new Error(`#${id} introuvable`);
  return el;
}

function formatSize(bytes: number): string {
  const units = ['o', 'Ko', 'Mo', 'Go', 'To'];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  const digits = unit === 0 || value >= 100 ? 0 : 1;
  return `${value.toFixed(digits).replace('.', ',')} ${units[unit]}`;
}

function formatEta(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return '';
  if (seconds < 60) return `${Math.ceil(seconds)} s`;
  const m = Math.floor(seconds / 60);
  if (m < 60) return `${m} min ${String(Math.round(seconds % 60)).padStart(2, '0')} s`;
  return `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')}`;
}

function iconFor(file: File): string {
  const type = file.type;
  if (type.startsWith('image/')) return ICONS.image;
  if (type.startsWith('video/')) return ICONS.video;
  if (type.startsWith('audio/')) return ICONS.audio;
  if (/\.(zip|rar|7z|tar|gz|bz2|xz)$/i.test(file.name)) return ICONS.archive;
  return ICONS.file;
}

/** Vitesse lissée sur une fenêtre glissante de quelques secondes. */
class SpeedMeter {
  private samples: { t: number; bytes: number }[] = [];

  add(bytes: number): void {
    const t = performance.now();
    this.samples.push({ t, bytes });
    while (this.samples.length > 2 && t - this.samples[0].t > 3000) this.samples.shift();
  }

  get bytesPerSecond(): number {
    if (this.samples.length < 2) return 0;
    const first = this.samples[0];
    const last = this.samples[this.samples.length - 1];
    const dt = (last.t - first.t) / 1000;
    return dt > 0 ? (last.bytes - first.bytes) / dt : 0;
  }

  reset(): void {
    this.samples = [];
  }
}

const items: Item[] = [];
let nextId = 1;
let batchActive = false;
const globalSpeed = new SpeedMeter();

const fileInput = $('file-input') as HTMLInputElement;
const dropzone = $('dropzone');
const pinInput = $('pin-input') as HTMLInputElement;
const list = $('file-list');
const template = $('file-item') as HTMLTemplateElement;

function getPin(): string {
  const fromUrl = new URLSearchParams(location.search).get('k');
  return fromUrl ?? pinInput.value.trim();
}

function setConnection(ok: boolean): void {
  $('status-dot').className = `h-2 w-2 rounded-full ${ok ? 'bg-success' : 'bg-destructive'}`;
  $('status-text').textContent = ok ? 'Connecté' : 'Hors ligne';
}

function part<T extends HTMLElement>(item: Item, name: string): T {
  return item.el.querySelector(`[data-${name}]`) as T;
}

function render(item: Item): void {
  const bar = part<HTMLDivElement>(item, 'bar');
  const percentEl = part(item, 'percent');
  const status = part(item, 'status');
  const action = part<HTMLButtonElement>(item, 'action');
  const icon = part(item, 'icon');
  const size = item.file.size;
  const percent = size > 0 ? Math.min(100, Math.floor((item.loaded / size) * 100)) : item.state === 'done' ? 100 : 0;

  bar.style.width = `${item.state === 'done' ? 100 : percent}%`;
  bar.className = 'progress-bar';
  icon.className = 'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg';
  action.classList.remove('hidden');

  switch (item.state) {
    case 'queued':
      percentEl.textContent = '';
      status.textContent = `${formatSize(size)} · en attente`;
      icon.classList.add('bg-muted', 'text-muted-foreground');
      action.innerHTML = svg(ICONS.x, 'h-4 w-4');
      action.setAttribute('aria-label', 'Retirer');
      break;
    case 'uploading': {
      const elapsed = (performance.now() - item.startedAt) / 1000;
      const speed = elapsed > 0.3 ? item.loaded / elapsed : 0;
      percentEl.textContent = `${percent} %`;
      status.textContent =
        item.loaded >= size
          ? `${formatSize(size)} · finalisation…`
          : `${formatSize(item.loaded)} / ${formatSize(size)}${speed ? ` · ${formatSize(speed)}/s · reste ${formatEta((size - item.loaded) / speed)}` : ''}`;
      bar.classList.add('shimmer');
      icon.classList.add('bg-primary/10', 'text-primary');
      action.innerHTML = svg(ICONS.x, 'h-4 w-4');
      action.setAttribute('aria-label', 'Annuler');
      break;
    }
    case 'done':
      percentEl.textContent = '';
      status.textContent = `${formatSize(size)} · enregistré${item.savedAs && item.savedAs !== item.file.name ? ` sous « ${item.savedAs} »` : ''}`;
      status.className = 'truncate text-xs text-success';
      bar.classList.add('!bg-success');
      icon.classList.add('bg-success/15', 'text-success');
      icon.innerHTML = svg(ICONS.check);
      action.classList.add('hidden');
      return;
    case 'error':
    case 'canceled':
      percentEl.textContent = '';
      bar.classList.add('!bg-destructive');
      icon.classList.add('bg-destructive/10', 'text-destructive');
      action.innerHTML = svg(ICONS.retry, 'h-4 w-4');
      action.setAttribute('aria-label', 'Réessayer');
      break;
  }
  if (item.state !== 'error' && item.state !== 'canceled') status.className = 'truncate text-xs text-muted-foreground';
  else status.className = 'truncate text-xs text-destructive';
  icon.innerHTML = svg(iconFor(item.file));
}

function renderSummary(): void {
  const relevant = items.filter((i) => i.state !== 'canceled');
  const summary = $('summary');
  summary.classList.toggle('hidden', relevant.length === 0);
  $('list-card').classList.toggle('hidden', items.length === 0);
  if (relevant.length === 0) return;

  const total = relevant.reduce((s, i) => s + i.file.size, 0);
  const loaded = relevant.reduce((s, i) => s + (i.state === 'done' ? i.file.size : i.loaded), 0);
  const done = relevant.filter((i) => i.state === 'done').length;
  const errors = relevant.filter((i) => i.state === 'error').length;
  const running = relevant.some((i) => i.state === 'uploading' || i.state === 'queued');
  const percent = total > 0 ? Math.floor((loaded / total) * 100) : 100;
  const speed = globalSpeed.bytesPerSecond;

  $('summary-bar').style.width = `${percent}%`;
  $('summary-bar').className = `progress-bar ${running ? 'shimmer' : errors ? '!bg-destructive' : '!bg-success'}`;
  $('summary-percent').textContent = `${percent} %`;
  $('summary-title').textContent = running
    ? 'Envoi en cours…'
    : errors
      ? `${errors} envoi(s) en échec`
      : 'Tous les fichiers ont été envoyés 🎉';
  $('summary-count').textContent = `${done} / ${relevant.length} fichier${relevant.length > 1 ? 's' : ''}`;
  $('summary-bytes').textContent = `${formatSize(loaded)} / ${formatSize(total)}`;
  $('summary-speed').textContent = running && speed > 0 ? `${formatSize(speed)}/s · reste ${formatEta((total - loaded) / speed)}` : '—';
}

function totalLoaded(): number {
  return items.reduce((s, i) => s + (i.state === 'done' ? i.file.size : i.state === 'uploading' ? i.loaded : 0), 0);
}

function fail(item: Item, message: string): void {
  item.state = 'error';
  render(item);
  part(item, 'status').textContent = message;
}

function upload(item: Item): void {
  const xhr = new XMLHttpRequest();
  item.xhr = xhr;
  item.state = 'uploading';
  item.loaded = 0;
  item.startedAt = performance.now();
  render(item);

  xhr.open('PUT', '/upload');
  xhr.setRequestHeader('Content-Type', 'application/octet-stream');
  xhr.setRequestHeader('X-Filename', encodeURIComponent(item.file.name));
  const pin = getPin();
  if (pin) xhr.setRequestHeader('X-Ydropp-Key', pin);

  let lastRender = 0;
  xhr.upload.onprogress = (e) => {
    item.loaded = e.loaded;
    globalSpeed.add(totalLoaded());
    const now = performance.now();
    if (now - lastRender > 120) {
      lastRender = now;
      render(item);
      renderSummary();
    }
  };
  xhr.onload = () => {
    item.xhr = undefined;
    if (xhr.status === 201) {
      setConnection(true);
      item.state = 'done';
      item.loaded = item.file.size;
      try {
        item.savedAs = (JSON.parse(xhr.responseText) as { name: string }).name;
      } catch {
        // réponse inattendue : le fichier est tout de même enregistré
      }
      render(item);
    } else {
      let message = `Erreur ${xhr.status}`;
      try {
        message = (JSON.parse(xhr.responseText) as { error: string }).error || message;
      } catch {
        // pas de JSON
      }
      if (xhr.status === 403) {
        $('pin-card').classList.remove('hidden');
        pinInput.focus();
      }
      fail(item, message);
    }
    next();
  };
  xhr.onerror = () => {
    item.xhr = undefined;
    setConnection(false);
    fail(item, 'Connexion perdue avec l’ordinateur');
    next();
  };
  xhr.onabort = () => {
    item.xhr = undefined;
    item.state = 'canceled';
    render(item);
    part(item, 'status').textContent = 'Annulé';
    next();
  };
  xhr.send(item.file);
}

function next(): void {
  let uploading = items.filter((i) => i.state === 'uploading').length;
  for (const item of items) {
    if (uploading >= CONCURRENCY) break;
    if (item.state === 'queued') {
      upload(item);
      uploading++;
    }
  }
  renderSummary();
  const busy = items.some((i) => i.state === 'uploading' || i.state === 'queued');
  if (!busy && batchActive) {
    batchActive = false;
    globalSpeed.reset();
    // Indique au serveur que le lot est terminé (utile pour `ydropp listen --once`).
    const headers: Record<string, string> = {};
    const pin = getPin();
    if (pin) headers['X-Ydropp-Key'] = pin;
    fetch('/batch-done', { method: 'POST', headers }).catch(() => undefined);
  }
}

function addFiles(files: FileList | File[]): void {
  const accepted: Item[] = [];
  for (const file of Array.from(files)) {
    const el = template.content.firstElementChild!.cloneNode(true) as HTMLLIElement;
    const item: Item = { id: nextId++, file, state: 'queued', loaded: 0, startedAt: 0, el };
    part(item, 'name').textContent = file.name;
    part(item, 'name').title = file.name;
    part<HTMLButtonElement>(item, 'action').addEventListener('click', () => onAction(item));
    items.push(item);
    list.prepend(el);
    if (CONFIG.maxSize !== null && file.size > CONFIG.maxSize) {
      fail(item, `Trop volumineux (max ${formatSize(CONFIG.maxSize)})`);
      continue;
    }
    render(item);
    accepted.push(item);
  }
  if (accepted.length) batchActive = true;
  next();
}

function onAction(item: Item): void {
  if (item.state === 'uploading') {
    item.xhr?.abort();
  } else if (item.state === 'queued') {
    items.splice(items.indexOf(item), 1);
    item.el.remove();
    renderSummary();
  } else if (item.state === 'error' || item.state === 'canceled') {
    item.state = 'queued';
    item.loaded = 0;
    render(item);
    batchActive = true;
    next();
  }
}

// --- Initialisation ---------------------------------------------------------

$('hostname').textContent = CONFIG.hostname;
document.title = `Y Dropp · ${CONFIG.hostname}`;
if (CONFIG.maxSize !== null) {
  $('max-size').textContent = `Taille maximale : ${formatSize(CONFIG.maxSize)} par fichier`;
  $('max-size').classList.remove('hidden');
}
if (CONFIG.pinRequired && !new URLSearchParams(location.search).get('k')) {
  $('pin-card').classList.remove('hidden');
}
pinInput.addEventListener('input', () => {
  pinInput.value = pinInput.value.replace(/\D/g, '').slice(0, 6);
});

fileInput.addEventListener('change', () => {
  if (fileInput.files?.length) addFiles(fileInput.files);
  fileInput.value = '';
});

let dragDepth = 0;
document.addEventListener('dragenter', (e) => {
  e.preventDefault();
  dragDepth++;
  dropzone.classList.add('dropzone-active');
});
document.addEventListener('dragleave', () => {
  dragDepth = Math.max(0, dragDepth - 1);
  if (dragDepth === 0) dropzone.classList.remove('dropzone-active');
});
document.addEventListener('dragover', (e) => e.preventDefault());
document.addEventListener('drop', (e) => {
  e.preventDefault();
  dragDepth = 0;
  dropzone.classList.remove('dropzone-active');
  if (e.dataTransfer?.files.length) addFiles(e.dataTransfer.files);
});

$('clear-done').addEventListener('click', () => {
  for (const item of items.filter((i) => i.state === 'done' || i.state === 'canceled')) {
    items.splice(items.indexOf(item), 1);
    item.el.remove();
  }
  renderSummary();
});

window.addEventListener('beforeunload', (e) => {
  if (items.some((i) => i.state === 'uploading' || i.state === 'queued')) {
    e.preventDefault();
    e.returnValue = '';
  }
});

// Indicateur de connexion avec l'ordinateur.
setInterval(() => {
  fetch('/health', { cache: 'no-store' })
    .then((r) => setConnection(r.ok))
    .catch(() => setConnection(false));
}, 5000);

setInterval(() => {
  if (items.some((i) => i.state === 'uploading')) renderSummary();
}, 1000);
