<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import { Dialog } from 'bits-ui';
	import { goto } from '$app/navigation';
	import { page as routePage } from '$app/state';
	import { personaStore } from '$lib/stores/persona.svelte';
	import { characterStore } from '$lib/stores/character.svelte';
	import { getCompletedEvents } from '$lib/services/storage/events';
	import SettingsSection from '$lib/components/settings/SettingsSection.svelte';
	import Tabs from '$lib/components/ui/Tabs.svelte';
	import SegmentedControl from '$lib/components/ui/SegmentedControl.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { createPersonaPageState } from './persona-page.svelte';
	import AvatarGallery from './AvatarGallery.svelte';
	import StatsPanel from './StatsPanel.svelte';

	const page = createPersonaPageState();
	const view = $derived(routePage.url.searchParams.get('view') === 'state' ? 'state' : 'profile');
	function navigate(next: string) {
		const url = new URL(routePage.url);
		url.searchParams.set('view', next);
		void goto(url, { noScroll: true, keepFocus: true });
	}
	$effect(() => {
		if (page.isDatingSimMode) getCompletedEvents().then(records => { page.completedEventRecords = records; });
	});
	// Every turn replaces characterStore.state, so sync each field only when its
	// saved value changes. Otherwise a half-typed edit gets wiped before blur saves it.
	const savedName = $derived(personaStore.name);
	const savedSystemPrompt = $derived(personaStore.systemPrompt);
	const savedCustomSystemPrompt = $derived(personaStore.activeCard.customSystemPrompt ?? '');
	$effect(() => { if (characterStore.isReady) page.formName = savedName; });
	$effect(() => { if (characterStore.isReady) page.formSystemPrompt = savedSystemPrompt; });
	$effect(() => { if (characterStore.isReady) page.formCustomSystemPrompt = savedCustomSystemPrompt; });
	let customPromptField = $state<HTMLTextAreaElement>();
	function startFromDefault() {
		page.formCustomSystemPrompt = page.defaultRules;
		customPromptField?.focus();
	}
</script>

<div class="page character-screen">
	<header class="page-header"><h2>{m.app_nav_character()}</h2><p>{m.app_persona_intro()}</p></header>
	<Tabs bind:value={() => view, navigate} items={[{ value: 'profile', label: m.app_persona_tab_profile() }, { value: 'state', label: m.app_persona_tab_state() }]} label={m.app_persona_views()}>
		{#snippet children(tab)}
			{#if tab === 'profile'}
				<div class="profile-sections">
					<SettingsSection title={m.app_persona_identity()}>
						<div class="setting-row"><div class="setting-info"><label class="setting-label" for="character-name">{m.app_onboarding_name_label()}</label><span class="setting-desc">{m.app_persona_name_desc()}</span></div>
							<input id="character-name" class="settings-field name-field" bind:value={page.formName} placeholder="Utsuwa" aria-label={m.app_persona_name_aria()} onblur={page.saveName} />
						</div>
					</SettingsSection>
					<SettingsSection title={m.app_display_appearance()}><AvatarGallery {page} /></SettingsSection>
					<SettingsSection title={m.app_persona_personality()} description={m.app_persona_personality_desc()}>
						<label class="sr-only" for="character-personality">{m.app_onboarding_personality_label()}</label>
						<textarea id="character-personality" class="settings-field" bind:value={page.formSystemPrompt} rows="6" onblur={page.saveSystemPrompt} placeholder={m.app_persona_personality_placeholder()}></textarea>
					</SettingsSection>
					<SettingsSection title={m.app_persona_system_prompt()} description={m.app_persona_system_prompt_desc()}>
						{#snippet actions()}
							{#if page.formCustomSystemPrompt.trim()}<Button variant="ghost" size="sm" onclick={() => (page.resetPromptOpen = true)}>{m.app_persona_reset_default()}</Button>
							{:else}<Button variant="ghost" size="sm" onclick={startFromDefault}>{m.app_persona_start_default()}</Button>{/if}
						{/snippet}
						<div class="ai-fields">
							<label class="sr-only" for="character-system-prompt">{m.app_persona_system_prompt()}</label>
							<textarea id="character-system-prompt" class="settings-field" bind:this={customPromptField} bind:value={page.formCustomSystemPrompt} rows="8" onblur={page.saveCustomSystemPrompt} placeholder={page.defaultRules} aria-describedby="character-system-prompt-hint"></textarea>
							<p class="hint" id="character-system-prompt-hint">{m.app_persona_macros_hint({ char: '{{char}}', user: '{{user}}' })}</p>
						</div>
					</SettingsSection>
					<SettingsSection title={m.app_persona_experience()}>
						<div class="setting-row"><div class="setting-info"><span class="setting-label">{m.app_persona_mode()}</span><span class="setting-desc">{m.app_persona_mode_desc()}</span></div>
							<SegmentedControl label={m.app_persona_mode_label()} value={page.appMode} onchange={page.requestModeChange} options={[{ value: 'companion', label: m.app_onboarding_mode_companion(), icon: 'sparkles' }, { value: 'dating_sim', label: m.app_onboarding_mode_dating(), icon: 'heart' }]} compact />
						</div>
					</SettingsSection>
				</div>
			{:else}<StatsPanel {page} />{/if}
		{/snippet}
	</Tabs>
</div>

<Dialog.Root open={page.modeConfirmOpen} onOpenChange={(open) => { if (!open) page.cancelModeChange(); }}>
	<Dialog.Portal>
		<Dialog.Overlay class="confirm-modal" />
		<Dialog.Content class="confirm-content">
			<Dialog.Title class="confirm-title">{m.app_persona_mode_confirm_title()}</Dialog.Title>
			<Dialog.Description class="confirm-message">{m.app_persona_mode_confirm_desc()}</Dialog.Description>
			<div class="confirm-actions"><Dialog.Close class="btn btn-secondary">{m.app_common_cancel()}</Dialog.Close><button class="btn btn-primary" onclick={page.confirmModeChange}>{m.app_persona_mode_confirm()}</button></div>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>

<Dialog.Root open={page.resetPromptOpen} onOpenChange={(open) => (page.resetPromptOpen = open)}>
	<Dialog.Portal>
		<Dialog.Overlay class="confirm-modal" />
		<Dialog.Content class="confirm-content">
			<Dialog.Title class="confirm-title">{m.app_persona_reset_title()}</Dialog.Title>
			<Dialog.Description class="confirm-message">{m.app_persona_reset_desc()}</Dialog.Description>
			<div class="confirm-actions"><Dialog.Close class="btn btn-secondary">{m.app_common_cancel()}</Dialog.Close><button class="btn btn-danger" onclick={page.resetCustomSystemPrompt}>{m.app_common_reset()}</button></div>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>

<style>
	.profile-sections { display: flex; flex-direction: column; gap: 24px; }
	.name-field { width: min(100%, 260px); }
	textarea { line-height: 1.6; }
	:global(.confirm-modal) { position: fixed; inset: 0; z-index: 1100; }
	:global(.confirm-content) { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 1101; width: min(420px, calc(100vw - 32px)); padding: 24px; }
	:global(.confirm-title) { margin: 0; font-size: 18px; font-weight: 500; color: var(--text-primary); }
	:global(.confirm-message) { margin: 12px 0 24px; color: var(--text-secondary); font-size: 14px; line-height: 1.5; }
	.confirm-actions { display: flex; justify-content: flex-end; gap: 8px; }
</style>
