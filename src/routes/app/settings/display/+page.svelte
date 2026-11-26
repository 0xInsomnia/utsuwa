<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import { onMount } from 'svelte';
	import { getColorMode, setColorMode, type ColorMode } from '$lib/utils/color-mode';
	import { getLanguagePreference, setLanguagePreference } from '$lib/i18n/language';
	import type { LanguagePreference } from '$lib/i18n/app-locale';
	let colorMode = $state<ColorMode>('system');
	let language = $state<LanguagePreference>('auto');
	// Language names stay in their own language so anyone can find theirs
	const languages: { value: LanguagePreference; label: string }[] = [
		{ value: 'auto', label: m.app_language_auto() },
		{ value: 'it', label: 'Italiano' },
		{ value: 'en', label: 'English' }
	];
	const colorModes: { value: ColorMode; label: string; icon: string }[] = [
		{ value: 'system', label: m.app_display_theme_system(), icon: 'monitor' },
		{ value: 'light', label: m.app_display_theme_light(), icon: 'sun' },
		{ value: 'dark', label: m.app_display_theme_dark(), icon: 'moon' }
	];
	onMount(() => { colorMode = getColorMode(); language = getLanguagePreference(); });

	import SegmentedControl from '$lib/components/ui/SegmentedControl.svelte';
	import Switch from '$lib/components/ui/Switch.svelte';
	import SettingsSection from '$lib/components/settings/SettingsSection.svelte';
	import { Button } from '$lib/components/ui';
	import { wakeLockStore } from '$lib/stores/wake-lock.svelte';
	import { rangeProgress } from '$lib/utils/range-progress';
	import {
		LIPSYNC_INTENSITY_DEFAULT,
		LIPSYNC_INTENSITY_MAX,
		LIPSYNC_INTENSITY_MIN
	} from '$lib/services/lipsync/analyzer';
	import {
		displayStore,
		type ChatDisplayMode,
		type SidebarPosition,
		type ChatBarAlignment,
		type TextRevealSpeed
	} from '$lib/stores/display.svelte';

	// Stored values keep their original names; only the labels changed
	const modes: { value: ChatDisplayMode; label: string }[] = [
		{ value: 'bubble', label: m.app_display_immersive() },
		{ value: 'sidebar', label: m.app_chat_window() }
	];

	const positions: { value: SidebarPosition; label: string }[] = [
		{ value: 'left', label: m.app_display_left() },
		{ value: 'right', label: m.app_display_right() }
	];

	const alignments: { value: ChatBarAlignment; label: string }[] = [
		{ value: 'left', label: m.app_display_left() },
		{ value: 'center', label: m.app_display_center() },
		{ value: 'right', label: m.app_display_right() }
	];

	const revealSpeeds: { value: TextRevealSpeed; label: string }[] = [
		{ value: 'off', label: m.app_display_reveal_off() },
		{ value: 'slow', label: m.app_display_reveal_slow() },
		{ value: 'normal', label: m.app_display_reveal_normal() },
		{ value: 'fast', label: m.app_display_reveal_fast() }
	];

	const sidebarActive = $derived(displayStore.chatDisplayMode === 'sidebar');

	function stepDelay(delta: number) {
		const current = displayStore.typingIndicatorDelayMs / 1000;
		const next = Math.round((current + delta) * 10) / 10;
		displayStore.setTypingIndicatorDelayMs(next * 1000);
	}

	const mouthLabel = $derived(
		displayStore.lipSyncIntensity === LIPSYNC_INTENSITY_DEFAULT
			? m.app_common_default()
			: `${displayStore.lipSyncIntensity.toFixed(2)}x`
	);
</script>

<div class="display-page">
	<header class="page-header"><h2>{m.app_nav_display()}</h2><p>{m.app_display_intro()}</p></header>
	<SettingsSection title={m.app_display_appearance()}>
		<div class="setting-row">
			<div class="setting-info"><span class="setting-label">{m.app_display_color_theme()}</span><span class="setting-desc">{m.app_display_color_theme_desc()}</span></div>
			<SegmentedControl label={m.app_display_color_theme()} options={colorModes} value={colorMode} onchange={(value) => { colorMode = value; setColorMode(value); }} compact />
		</div>
		<div class="setting-row">
			<div class="setting-info"><span class="setting-label">{m.app_language_label()}</span><span class="setting-desc">{m.app_language_desc()}</span></div>
			<SegmentedControl label={m.app_language_label()} options={languages} value={language} onchange={(value) => { language = value; setLanguagePreference(value); }} compact />
		</div>
	</SettingsSection>
	<SettingsSection title={m.app_display_chat()}>
		{#snippet actions()}<Button variant="ghost" size="sm" onclick={() => displayStore.resetChatDisplay()}>{m.app_display_reset()}</Button>{/snippet}
		<div class="setting-row">
			<div class="setting-info"><span class="setting-label">{m.app_display_layout()}</span><span class="setting-desc">{m.app_display_layout_desc()}</span></div>
			<SegmentedControl label={m.app_display_layout_label()} options={modes} value={displayStore.chatDisplayMode} onchange={displayStore.setChatDisplayMode} compact />
		</div>
		{#if sidebarActive}
			<div class="setting-row">
				<div class="setting-info"><span class="setting-label">{m.app_display_dock()}</span><span class="setting-desc">{m.app_display_dock_desc()}</span></div>
				<SegmentedControl label={m.app_display_dock_label()} options={positions} value={displayStore.sidebarPosition} onchange={displayStore.setSidebarPosition} compact />
			</div>
		{:else}
			<div class="setting-row">
				<div class="setting-info"><span class="setting-label">{m.app_display_bar()}</span><span class="setting-desc">{m.app_display_bar_desc()}</span></div>
				<SegmentedControl label={m.app_display_bar_label()} options={alignments} value={displayStore.chatBarAlignment} onchange={displayStore.setChatBarAlignment} compact />
			</div>
		{/if}
		<div class="setting-row">
			<div class="setting-info"><span class="setting-label">{m.app_display_reveal()}</span><span class="setting-desc">{m.app_display_reveal_desc()}</span></div>
			<SegmentedControl label={m.app_display_reveal_label()} options={revealSpeeds} value={displayStore.textRevealSpeed} onchange={displayStore.setTextRevealSpeed} compact />
		</div>
	</SettingsSection>
	<SettingsSection title={m.app_display_typing()}>
		<div class="setting-row">
			<div class="setting-info"><span class="setting-label">{m.app_display_wait_tone()}</span><span class="setting-desc">{m.app_display_wait_tone_desc()}</span></div>
			<Switch label={m.app_display_wait_tone()} checked={displayStore.waitToneEnabled} onchange={displayStore.setWaitToneEnabled} />
		</div>
		<div class="setting-row">
			<div class="setting-info"><span class="setting-label">{m.app_display_delay()}</span><span class="setting-desc">{m.app_display_delay_desc()}</span></div>
			<div class="delay-input-container">
				<button class="btn btn-secondary btn-icon" aria-label={m.app_display_delay_decrease()} onclick={() => stepDelay(-0.1)} disabled={displayStore.typingIndicatorDelayMs <= 0}>−</button>
				<input type="number" class="delay-input settings-field" aria-label={m.app_display_delay_input()} min="0" max="10" step="0.1" value={(displayStore.typingIndicatorDelayMs / 1000).toFixed(1)} oninput={(e) => { const v = parseFloat(e.currentTarget.value); if (!Number.isNaN(v)) displayStore.setTypingIndicatorDelayMs(v * 1000); }} />
				<span class="delay-unit">s</span>
				<button class="btn btn-secondary btn-icon" aria-label={m.app_display_delay_increase()} onclick={() => stepDelay(0.1)} disabled={displayStore.typingIndicatorDelayMs >= 10000}>+</button>
			</div>
		</div>
	</SettingsSection>
	<SettingsSection title={m.app_display_behavior()}>
		<div class="setting-row">
			<div class="setting-info">
				<span class="setting-label">{m.app_display_awake()}</span>
				<span class="setting-desc">{m.app_display_awake_desc()}</span>
				<span class="setting-desc" role="status">
					{#if wakeLockStore.status === 'unsupported'}{m.app_display_awake_unsupported()}
					{:else if wakeLockStore.status === 'active'}{m.app_display_awake_active()}
					{:else if wakeLockStore.status === 'requesting'}{m.app_display_awake_requesting()}
					{:else if displayStore.keepScreenAwake}{m.app_display_awake_inactive()}
					{:else}{m.app_display_awake_off()}{/if}
				</span>
			</div>
			<Switch label={m.app_display_awake()} checked={displayStore.keepScreenAwake} onchange={displayStore.setKeepScreenAwake} disabled={wakeLockStore.status === 'unsupported' && !displayStore.keepScreenAwake} />
		</div>
		{#if displayStore.keepScreenAwake && wakeLockStore.status === 'inactive'}<Button variant="secondary" size="sm" onclick={() => wakeLockStore.retry()}>{m.app_display_try_again()}</Button>{/if}
		<div class="setting-row">
			<div class="setting-info">
				<span class="setting-label">{m.app_display_mood()}</span>
				<span class="setting-desc">{m.app_display_mood_desc()}</span>
			</div>
			<Switch label={m.app_display_mood()} checked={displayStore.moodExpressions} onchange={displayStore.setMoodExpressions} />
		</div>
		<div class="setting-row">
			<div class="setting-info">
				<label class="setting-label" for="mouth-movement">{m.app_display_mouth()}</label>
				<span class="setting-desc">{m.app_display_mouth_desc()}</span>
			</div>
			<div class="range-control">
				<input
					id="mouth-movement"
					type="range" use:rangeProgress={displayStore.lipSyncIntensity}
					class="settings-range"
					min={LIPSYNC_INTENSITY_MIN}
					max={LIPSYNC_INTENSITY_MAX}
					step="0.05"
					value={displayStore.lipSyncIntensity}
					aria-valuetext={mouthLabel}
					oninput={(e) => displayStore.setLipSyncIntensity(parseFloat(e.currentTarget.value))}
				/>
				<span class="range-value" aria-hidden="true">{mouthLabel}</span>
			</div>
		</div>
		<div class="setting-row">
			<div class="setting-info">
				<span class="setting-label">{m.app_display_moments()}</span>
				<span class="setting-desc">{m.app_display_moments_desc()}</span>
			</div>
			<Switch label={m.app_display_moments()} checked={displayStore.generatedMoments} onchange={displayStore.setGeneratedMoments} />
		</div>
	</SettingsSection>
</div>

<style>
	.delay-input-container {
		display: flex;
		align-items: center;
		gap: 0.4rem;
	}

	.delay-input {
		width: 3.5rem;
		padding: 0.35rem 0.5rem;

		text-align: center;
		appearance: textfield;
		-moz-appearance: textfield;
	}

	.delay-input::-webkit-outer-spin-button,
	.delay-input::-webkit-inner-spin-button {
		-webkit-appearance: none;
	}

	.range-control {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		width: 240px;
		max-width: 100%;
	}

	@media (max-width: 640px) {
		.range-control { width: 100%; }
	}

	.range-value {
		min-width: 3.5rem;
		font-size: 0.8rem;
		font-variant-numeric: tabular-nums;
		text-align: right;
		color: var(--text-secondary);
	}

	.delay-unit {
		font-size: 0.8rem;
		color: var(--text-secondary);
	}
</style>
