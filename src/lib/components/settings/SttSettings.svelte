<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import { settingsStore } from '$lib/stores/settings.svelte';
	import { DEFAULT_STT_TIMEOUT_MS, resolveSttTimeoutMs } from '$lib/services/stt/openai-stt';
	import SettingsSection from './SettingsSection.svelte';
</script>

<SettingsSection
	title={m.app_stt_cloud()}
	description={m.app_stt_cloud_desc()}
>
	<div class="ai-fields">
		<div class="ai-field">
			<label class="settings-label" for="stt-groq-key">{m.app_stt_groq_key()}</label>
			<input
				id="stt-groq-key"
				type="password"
				class="settings-field"
				placeholder={m.app_stt_groq_key_placeholder()} aria-label={m.app_stt_groq_key_placeholder()}
				value={settingsStore.getProviderConfig('groq-stt').apiKey ?? ''}
				oninput={(e) => {
					const v = e.currentTarget.value;
					settingsStore.setProviderConfig('groq-stt', { apiKey: v });
					if (v) settingsStore.markProviderAdded('groq-stt');
					else settingsStore.removeProvider('groq-stt');
				}}
			/>
		</div>
		<div class="ai-field">
			<label class="settings-label" for="stt-openai-key">{m.app_stt_openai_key()}</label>
			<input
				id="stt-openai-key"
				type="password"
				class="settings-field"
				placeholder={m.app_stt_openai_key_placeholder()} aria-label={m.app_stt_openai_key_placeholder()}
				value={settingsStore.getProviderConfig('openai-stt').apiKey ?? ''}
				oninput={(e) => {
					const v = e.currentTarget.value;
					settingsStore.setProviderConfig('openai-stt', { apiKey: v });
					if (v) settingsStore.markProviderAdded('openai-stt');
					else settingsStore.removeProvider('openai-stt');
				}}
			/>
		</div>
	</div>
</SettingsSection>

<SettingsSection
	title={m.app_stt_local()}
	description={m.app_stt_local_desc()}
>
	<div class="ai-fields">
		<div class="ai-field">
			<label class="settings-label" for="stt-local-url">{m.app_stt_server_url()}</label>
			<input
				id="stt-local-url"
				type="text"
				class="settings-field"
				placeholder="http://localhost:8000/v1/" aria-label="http://localhost:8000/v1/"
				value={settingsStore.getProviderConfig('local-stt').baseUrl ?? ''}
				oninput={(e) => {
					const v = e.currentTarget.value.trim();
					settingsStore.setProviderConfig('local-stt', { baseUrl: v });
					if (v) settingsStore.markProviderAdded('local-stt');
					else settingsStore.removeProvider('local-stt');
				}}
			/>
		</div>
		<div class="ai-field">
			<label class="settings-label" for="stt-local-model">{m.app_llm_model()}</label>
			<input
				id="stt-local-model"
				type="text"
				class="settings-field"
				placeholder={m.app_stt_model_placeholder()} aria-label={m.app_stt_model_placeholder()}
				value={settingsStore.getProviderConfig('local-stt').modelId ?? ''}
				oninput={(e) => {
					settingsStore.setProviderConfig('local-stt', { modelId: e.currentTarget.value.trim() });
				}}
			/>
		</div>
		<div class="ai-field">
			<label class="settings-label" for="stt-local-timeout">{m.app_stt_timeout()}</label>
			<input
				id="stt-local-timeout"
				type="number"
				class="settings-field"
				min="5"
				max="600"
				step="5"
				value={Math.round((settingsStore.getProviderConfig('local-stt').timeoutMs ?? DEFAULT_STT_TIMEOUT_MS) / 1000)}
				onchange={(e) => {
					// change, not input: clamping per keystroke would fight the user mid-typing
					const timeoutMs = resolveSttTimeoutMs(e.currentTarget.valueAsNumber);
					settingsStore.setProviderConfig('local-stt', { timeoutMs });
					e.currentTarget.value = String(timeoutMs / 1000);
				}}
			/>
			<p class="hint">{m.app_stt_timeout_hint()}</p>
		</div>
	</div>
</SettingsSection>
