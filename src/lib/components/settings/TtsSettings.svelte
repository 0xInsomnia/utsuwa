<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import Switch from '$lib/components/ui/Switch.svelte';
	import { settingsStore } from '$lib/stores/settings.svelte';
	import { getTTSProvider } from '$lib/services/providers/registry';
	import { ProviderDropdown, ModelDropdown } from '$lib/components/ui';
	import OmniVoiceSettings from './OmniVoiceSettings.svelte';
	import SettingsSection from './SettingsSection.svelte';
	import { checkTTSProviderHealth } from '$lib/services/providers/health-check';
	import type { TtsSettingsState } from '$lib/stores/ai-services-settings.svelte';

	let { state }: { state: TtsSettingsState } = $props();
</script>

<SettingsSection title={m.app_tts_section()}>
	{#snippet actions()}<Switch checked={state.isTTSEnabled} onchange={state.toggleTTS} label={m.app_tts_section()} />{/snippet}
	<div class="ai-fields">
		{#if state.isTTSEnabled}
			<div class="ai-field">
				<span class="settings-label">{m.app_llm_provider()}</span>
				<ProviderDropdown
					type="tts"
					value={state.speechSettings.activeProvider}
					onSelect={state.handleTTSProviderChange}
					placeholder={m.app_services_select_tts()}
				/>
			</div>

			{#if state.speechSettings.activeProvider}
				{@const provider = getTTSProvider(state.speechSettings.activeProvider)}

				{#if provider?.requiresApiKey}
					<div class="ai-field">
						<label class="settings-label" for="tts-api-key">{m.app_llm_api_key()}</label>
						<input
							id="tts-api-key"
							type="password"
							class="settings-field"
							class:error={state.ttsFetchError}
							placeholder={m.app_llm_api_key_placeholder()} aria-label={m.app_llm_api_key_placeholder()}
							value={settingsStore.getProviderConfig(provider.id).apiKey ?? ''}
							oninput={(e) => state.handleApiKeyChange(provider.id, e.currentTarget.value)}
							onblur={state.handleTTSApiKeyBlur}
						/>
					</div>
				{/if}

				{#if !provider?.isLocal}
					<div class="ai-field">
						<span class="settings-label">{m.app_llm_model()}</span>
						<ModelDropdown
							models={state.ttsModels}
							value={state.speechSettings.activeModel}
							onSelect={(id) => state.setSpeech('activeModel', id)}
							placeholder={m.app_services_select_model()}
							isLoading={state.ttsIsLoading}
							onRefresh={state.ttsHasApiKey ? state.fetchTTSModels : undefined}
							disabled={!state.ttsHasApiKey}
							disabledMessage={m.app_services_key_first()}
						/>
					</div>
				{/if}

				{#if provider?.id === 'elevenlabs' || provider?.id === 'fish-audio'}
					<div class="ai-field">
						<label class="settings-label" for="tts-voice-id">{m.app_tts_voice_id()}</label>
						<input
							id="tts-voice-id"
							type="text"
							class="settings-field"
							list="{provider.id}-voices"
							placeholder={m.app_tts_voice_id()} aria-label={m.app_tts_voice_id()}
							value={state.speechSettings.activeVoiceId ?? ''}
							onchange={(e) => state.setSpeech('activeVoiceId', e.currentTarget.value.trim())}
						/>
						<datalist id="{provider.id}-voices">
							{#each provider?.voices ?? [] as voice}
								<option value={voice.id}>{voice.name}</option>
							{/each}
						</datalist>
					</div>
				{/if}

				{#if provider?.isLocal && state.speechSettings.activeProvider !== 'omnivoice'}
					<div class="ai-field">
						<label class="settings-label" for="tts-local-voice">{m.app_tts_voice()}</label>
						<input
							id="tts-local-voice"
							type="text"
							class="settings-field"
							list="local-tts-voices"
							placeholder={m.app_tts_voice_placeholder()} aria-label={m.app_tts_voice_placeholder()}
							value={state.speechSettings.activeVoiceId ?? ''}
							onchange={(e) => state.setSpeech('activeVoiceId', e.currentTarget.value.trim())}
						/>
						<datalist id="local-tts-voices">
							{#each provider.voices ?? [] as voice}
								<option value={voice.id}>{voice.name}</option>
							{/each}
						</datalist>
					</div>
					<div class="ai-field">
						<label class="settings-label" for="tts-local-model">{m.app_tts_model_optional()}</label>
						<input
							id="tts-local-model"
							type="text"
							class="settings-field"
							placeholder={m.app_tts_model_optional_placeholder()} aria-label={m.app_tts_model_optional_placeholder()}
							value={state.speechSettings.activeModel ?? ''}
							onchange={(e) => state.setSpeech('activeModel', e.currentTarget.value)}
						/>
					</div>
					<div class="ai-field">
						<label class="settings-label" for="tts-base-url">{m.app_llm_base_url()}</label>
						<input
							id="tts-base-url"
							type="text"
							class="settings-field"
							placeholder={provider.defaultBaseUrl || 'http://localhost:8880/v1/'} aria-label={provider.defaultBaseUrl || 'http://localhost:8880/v1/'}
							value={settingsStore.getProviderConfig(provider.id).baseUrl ?? ''}
							onchange={(e) => {
								settingsStore.setProviderConfig(provider.id, { baseUrl: e.currentTarget.value });
								checkTTSProviderHealth(provider.id, e.currentTarget.value);
							}}
						/>
					</div>
				{/if}

				{#if provider && state.speechSettings.activeProvider === 'omnivoice'}
					<OmniVoiceSettings {state} {provider} />
				{/if}
			{/if}
		{:else}
			<p class="hint">{m.app_tts_off()}</p>
		{/if}
	</div>
</SettingsSection>
