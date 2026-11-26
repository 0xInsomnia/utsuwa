// Language of the app pages (/app, /overlay and every page of the desktop
// build). The marketing pages keep Paraglide's URL strategy (/ and /ja); the
// app has no localized URLs, so its language is the user's choice in
// Settings > Display, or else the device language, or else English.
// Pure on purpose: hooks.client.ts wires it to the browser.

export const APP_LOCALES = ['en', 'it'] as const;
export type AppLocale = (typeof APP_LOCALES)[number];
export type LanguagePreference = 'auto' | AppLocale;

export function parseLanguagePreference(value: string | null | undefined): LanguagePreference {
	return value === 'en' || value === 'it' ? value : 'auto';
}

/** First supported language in the device's list (it-IT counts as it), else English. */
export function detectDeviceLocale(languages: readonly string[]): AppLocale {
	for (const tag of languages) {
		const base = tag.trim().toLowerCase().split(/[-_]/)[0];
		if ((APP_LOCALES as readonly string[]).includes(base)) return base as AppLocale;
	}
	return 'en';
}

export function resolveAppLocale(preference: LanguagePreference, languages: readonly string[]): AppLocale {
	return preference === 'auto' ? detectDeviceLocale(languages) : preference;
}

/** /app and /overlay on any host, and every page of an app. subdomain. */
export function isAppPage(pathname: string, hostname: string): boolean {
	return hostname.startsWith('app.') || /^\/(app|overlay)(\/|$)/.test(pathname);
}
