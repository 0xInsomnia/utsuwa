import { browser } from '$app/environment';
import { STORAGE_INVENTORY } from '$lib/db/storage-inventory';
import {
	parseLanguagePreference,
	resolveAppLocale,
	type AppLocale,
	type LanguagePreference
} from './app-locale';

const LANGUAGE_STORAGE_KEY = STORAGE_INVENTORY.localStorage.language;

export function getLanguagePreference(): LanguagePreference {
	if (!browser) return 'auto';
	try {
		return parseLanguagePreference(localStorage.getItem(LANGUAGE_STORAGE_KEY));
	} catch {
		return 'auto';
	}
}

export function deviceLanguages(): readonly string[] {
	if (!browser) return [];
	return navigator.languages?.length ? navigator.languages : [navigator.language];
}

export function currentAppLocale(): AppLocale {
	return resolveAppLocale(getLanguagePreference(), deviceLanguages());
}

/** Saves the choice and reloads: every label is read once, at render time. */
export function setLanguagePreference(preference: LanguagePreference) {
	if (!browser || preference === getLanguagePreference()) return;
	try {
		if (preference === 'auto') localStorage.removeItem(LANGUAGE_STORAGE_KEY);
		else localStorage.setItem(LANGUAGE_STORAGE_KEY, preference);
	} catch {
		return;
	}
	location.reload();
}
