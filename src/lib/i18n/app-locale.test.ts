import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
	detectDeviceLocale,
	isAppPage,
	parseLanguagePreference,
	resolveAppLocale
} from './app-locale.ts';

test('parseLanguagePreference keeps known choices and treats anything else as auto', () => {
	assert.equal(parseLanguagePreference('it'), 'it');
	assert.equal(parseLanguagePreference('en'), 'en');
	assert.equal(parseLanguagePreference('auto'), 'auto');
	assert.equal(parseLanguagePreference(null), 'auto');
	assert.equal(parseLanguagePreference(undefined), 'auto');
	assert.equal(parseLanguagePreference(''), 'auto');
	assert.equal(parseLanguagePreference('ja'), 'auto');
	assert.equal(parseLanguagePreference('IT'), 'auto');
});

test('detectDeviceLocale matches region and script variants to the base language', () => {
	assert.equal(detectDeviceLocale(['it-IT']), 'it');
	assert.equal(detectDeviceLocale(['it-CH', 'en-US']), 'it');
	assert.equal(detectDeviceLocale(['IT_it']), 'it');
	assert.equal(detectDeviceLocale(['en-GB']), 'en');
});

test('detectDeviceLocale takes the first supported language in the device order', () => {
	assert.equal(detectDeviceLocale(['de-DE', 'it-IT', 'en-US']), 'it');
	assert.equal(detectDeviceLocale(['en-US', 'it-IT']), 'en');
});

test('detectDeviceLocale falls back to English for unsupported or missing languages (edge)', () => {
	assert.equal(detectDeviceLocale([]), 'en');
	assert.equal(detectDeviceLocale(['ja-JP']), 'en');
	assert.equal(detectDeviceLocale(['']), 'en');
	assert.equal(detectDeviceLocale(['italian']), 'en');
});

test('resolveAppLocale lets an explicit choice win over the device language', () => {
	assert.equal(resolveAppLocale('en', ['it-IT']), 'en');
	assert.equal(resolveAppLocale('it', ['en-US']), 'it');
	assert.equal(resolveAppLocale('auto', ['it-IT']), 'it');
	assert.equal(resolveAppLocale('auto', ['fr-FR']), 'en');
});

test('isAppPage covers the app and overlay routes but not the marketing site', () => {
	assert.equal(isAppPage('/app', 'example.workers.dev'), true);
	assert.equal(isAppPage('/app/settings/display', 'example.workers.dev'), true);
	assert.equal(isAppPage('/overlay', 'localhost'), true);
	assert.equal(isAppPage('/', 'example.workers.dev'), false);
	assert.equal(isAppPage('/ja', 'example.workers.dev'), false);
	assert.equal(isAppPage('/docs/guides/mcp', 'example.workers.dev'), false);
	assert.equal(isAppPage('/blog/app-update', 'example.workers.dev'), false);
});

test('isAppPage does not match routes that merely start with app or overlay (edge)', () => {
	assert.equal(isAppPage('/apple', 'example.workers.dev'), false);
	assert.equal(isAppPage('/overlays', 'example.workers.dev'), false);
});

test('isAppPage treats every path on an app. subdomain as the app', () => {
	assert.equal(isAppPage('/', 'app.utsuwa.ai'), true);
	assert.equal(isAppPage('/settings', 'app.utsuwa.ai'), true);
	assert.equal(isAppPage('/', 'docs.utsuwa.ai'), false);
});
