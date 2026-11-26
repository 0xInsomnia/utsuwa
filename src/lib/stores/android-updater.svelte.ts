// Android-only updater. No API credentials are used for GitHub requests.
// The system package installer validates the permanent signing certificate.
import { isNativeMobile } from '$lib/services/platform/platform';
import { providerFetch } from '$lib/services/platform/provider-fetch';
import { openUrl } from '@tauri-apps/plugin-opener';

const repository = '0xInsomnia/utsuwa';
const releaseApi = 'https://api.github.com/repos/' + repository + '/releases?per_page=30';
const build = Number(import.meta.env.VITE_NELIEL_ANDROID_BUILD || 0);
const permanent = import.meta.env.VITE_NELIEL_ANDROID_SIGNED === 'true';
type Update = { code: number; title: string; url: string; notes: string };
type Release = { tag_name?: string; draft?: boolean; name?: string; body?: string; assets?: {name?: string; browser_download_url?: string}[] };

let available = $state<Update | null>(null);
let checking = $state(false);
let error = $state('');
let checked = $state(false);
let dismissed = $state(false);
let lastCheck = 0;

export function selectAndroidUpdate(releases: Release[], installed: number): Update | null {
	let newest: Update | null = null;
	for (const r of releases) {
		const match = /^neliel-android-(\d+)$/.exec(r.tag_name || '');
		if (r.draft || !match) continue;
		const code = Number(match[1]);
		if (!Number.isSafeInteger(code) || code <= installed || (newest && code <= newest.code)) continue;
		const exact = 'https://github.com/' + repository + '/releases/download/' + r.tag_name + '/Neliel-Android.apk';
		const asset = r.assets?.find(a => a.name === 'Neliel-Android.apk' && a.browser_download_url === exact);
		if (!asset) continue;
		newest = { code, url: exact, title: r.name || 'Neliel Android ' + code, notes: (r.body || '').slice(0, 1000) };
	}
	return newest;
}

async function check(manual = false) {
	if (!isNativeMobile() || checking) return;
	if (!manual && Date.now() - lastCheck < 10 * 60 * 1000) return;
	checking = true;
	error = '';
	const previousCode = available?.code;
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), 12000);
	try {
		const res = await providerFetch(releaseApi, { headers: { Accept: 'application/vnd.github+json' }, signal: controller.signal });
		if (!res.ok) throw new Error('GitHub HTTP ' + res.status);
		const data = await res.json();
		if (!Array.isArray(data)) throw new Error('Risposta GitHub non valida.');
		available = selectAndroidUpdate(data, build);
		if (available?.code !== previousCode || manual) dismissed = false;
		checked = true;
		lastCheck = Date.now();
	} catch (e) {
		error = 'Controllo aggiornamenti non riuscito: ' + (e instanceof Error ? e.message : 'connessione non disponibile');
	} finally {
		clearTimeout(timer);
		checking = false;
	}
}

async function download() {
	if (!isNativeMobile() || !available) return;
	try {
		// Browser downloads the direct APK, not a ZIP or authenticated Actions artifact.
		// Android handles approval and in-place installation; never uninstall automatically.
		await openUrl(available.url);
	} catch {
		error = 'Impossibile aprire il download. Apri GitHub Releases nel browser.';
	}
}

export const androidUpdater = {
	get build() { return build; },
	get permanent() { return permanent; },
	get available() { return available; },
	get checking() { return checking; },
	get error() { return error; },
	get checked() { return checked; },
	get dismissed() { return dismissed; },
	check, download,
	dismiss() { dismissed = true; }
};
