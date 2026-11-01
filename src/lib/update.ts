/**
 * C-Cube — Verificação de atualizações via GitHub Releases.
 *
 * A app consulta `repos/carsaimz/c-cube/releases/latest` e compara com a
 * versão local. No Android (Capacitor) a descarga abre num Browser tab
 * in-app (Custom Tab); no Electron/web abre no navegador do sistema.
 */
import pkg from "../../package.json";

export const APP_VERSION: string = pkg.version;
export const REPO = "carsaimz/c-cube";

const LS_KEY = "ccube:v1:updatecheck";
export const CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000;

export interface ReleaseInfo {
  version: string; // "1.2.0" (tag sem o "v")
  tagName: string; // "v1.2.0"
  name: string | null;
  body: string | null;
  htmlUrl: string;
  apkUrl: string | null; // asset .apk de release (não debug), se existir
}

interface GithubAsset {
  name: string;
  browser_download_url: string;
}

interface GithubRelease {
  tag_name?: string;
  name?: string | null;
  body?: string | null;
  html_url?: string;
  assets?: GithubAsset[];
  draft?: boolean;
  prerelease?: boolean;
}

/** Comparação semântica simples "1.2.3" vs "1.10.0". Retorna >0 se a > b. */
export function compareVersions(a: string, b: string): number {
  const pa = a.replace(/^v/i, "").split(/[.+-]/).map((x) => parseInt(x, 10) || 0);
  const pb = b.replace(/^v/i, "").split(/[.+-]/).map((x) => parseInt(x, 10) || 0);
  for (let i = 0; i < 3; i++) {
    const d = (pa[i] || 0) - (pb[i] || 0);
    if (d !== 0) return d;
  }
  return 0;
}

function pickApkUrl(assets: GithubAsset[]): string | null {
  const apks = assets.filter((a) => /\.apk$/i.test(a.name) && !/-debug\.apk$/i.test(a.name));
  if (apks.length === 0) return null;
  const signed =
    apks.find((a) => /-release\.apk$/i.test(a.name)) ??
    apks.find((a) => /sign/i.test(a.name)) ??
    apks[0];
  return signed.browser_download_url;
}

/** Consulta a última release publicada no GitHub. Lança em erro de rede. */
export async function fetchLatestRelease(): Promise<ReleaseInfo | null> {
  const res = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`, {
    headers: { Accept: "application/vnd.github+json" },
    cache: "no-store",
  });
  if (res.status === 404) return null; // ainda não há releases
  if (!res.ok) throw new Error(`GitHub API ${res.status}`);
  const r = (await res.json()) as GithubRelease;
  const tagName = r.tag_name || "";
  if (!tagName) return null;
  return {
    version: tagName.replace(/^v/i, ""),
    tagName,
    name: r.name ?? null,
    body: r.body ?? null,
    htmlUrl: r.html_url || `https://github.com/${REPO}/releases/latest`,
    apkUrl: pickApkUrl(r.assets || []),
  };
}

export function getLastCheckTs(): number {
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (raw) return (JSON.parse(raw) as { ts?: number }).ts ?? 0;
  } catch {
    /* ignorar */
  }
  return 0;
}

export function setLastCheckTs(ts: number): void {
  try {
    window.localStorage.setItem(LS_KEY, JSON.stringify({ ts }));
  } catch {
    /* ignorar */
  }
}

/** Abre um URL: Custom Tab in-app no Android, navegador externo no resto. */
export async function openUpdateUrl(url: string): Promise<void> {
  try {
    const { Capacitor } = await import("@capacitor/core");
    if (Capacitor.isNativePlatform()) {
      const { Browser } = await import("@capacitor/browser");
      await Browser.open({ url });
      return;
    }
  } catch {
    /* web/electron: window.open */
  }
  window.open(url, "_blank", "noopener,noreferrer");
}
