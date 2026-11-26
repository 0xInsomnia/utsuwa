<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import { rangeProgress } from '$lib/utils/range-progress';
	import Switch from '$lib/components/ui/Switch.svelte';
	import { settingsStore } from '$lib/stores/settings.svelte';
	import { getLLMProvider } from '$lib/services/providers/registry';
	import type { VisionSource } from '$lib/services/providers/vision';
	import { Icon, ProviderDropdown, ModelDropdown, ContextSizeSlider } from '$lib/components/ui';
	import { DOCS_URL } from '$lib/config/site';
	import { isTauri } from '$lib/services/platform';
	import type { LlmSettingsState } from '$lib/stores/ai-services-settings.svelte';
	import SettingsSection from './SettingsSection.svelte';

	let { state }: { state: LlmSettingsState } = $props();

	// The same fields serve the chat model and the separate vision model
	const vision = $derived(state.moduleId === 'vision');
	const idp = $derived(vision ? 'vision' : 'llm');
	const title = $derived(vision ? m.app_llm_vision() : m.app_llm_chat());
	const switchLabel = $derived(vision ? m.app_llm_separate_vision() : m.app_llm_chat());

	const LOCAL_LLM_DOCS_URL = `${DOCS_URL}/guides/local-llm-setup#allowing-utsuwa-to-reach-ollama`;

	function openLocalLlmDocs(e: MouseEvent) {
		if (isTauri()) {
			e.preventDefault();
			import('@tauri-apps/plugin-opener').then(({ openUrl }) => openUrl(LOCAL_LLM_DOCS_URL));
		}
	}

	function handleContextSizeChange(value: number | undefined) {
		state.handleLLMNumberSetting('contextSize', value);
	}

	function visionNote(capable: boolean, source: VisionSource, providerName: string = m.app_llm_the_provider()) {
		if (source === 'you') return m.app_llm_set_by_you();
		if (source === 'provider') return m.app_llm_reported_by({ provider: providerName });
		return capable
			? m.app_llm_guessed_on()
			: m.app_llm_guessed_off();
	}
</script>

{#snippet troubleHelp()}
	<p class="hint">
		{m.app_services_trouble()} <a
			href={LOCAL_LLM_DOCS_URL}
			target="_blank"
			rel="noopener"
			onclick={openLocalLlmDocs}>{m.app_services_here()}</a
		>
	</p>
{/snippet}

<SettingsSection
	{title}
	description={vision ? m.app_llm_vision_desc() : undefined}
>
	{#snippet actions()}<Switch checked={state.isLLMEnabled} onchange={state.toggleLLM} label={switchLabel} />{/snippet}
	<div class="ai-fields">
		{#if state.isLLMEnabled}
			<div class="ai-field">
				<span class="settings-label">{m.app_llm_provider()}</span>
				<ProviderDropdown
					type="llm"
					value={state.activeProvider}
					onSelect={state.handleLLMProviderChange}
					placeholder={vision ? m.app_llm_select_vision() : m.app_services_select_llm()}
				/>
			</div>

			{#if state.activeProvider}
				{@const provider = getLLMProvider(state.activeProvider)}

				{#if provider?.requiresApiKey || provider?.custom}
					<div class="ai-field">
						<label class="settings-label" for="{idp}-api-key">{provider?.custom ? m.app_llm_api_key_optional() : m.app_llm_api_key()}</label>
						<input
							id="{idp}-api-key"
							type="password"
							class="settings-field"
							class:error={state.llmFetchError}
							placeholder={provider?.custom ? m.app_services_key_optional() : m.app_llm_api_key_placeholder()} aria-label={provider?.custom ? m.app_services_key_optional() : m.app_llm_api_key_placeholder()}
							value={settingsStore.getProviderConfig(provider.id).apiKey ?? ''}
							oninput={(e) => state.handleApiKeyChange(provider.id, e.currentTarget.value)}
							onblur={provider?.custom ? undefined : state.handleLLMApiKeyBlur}
						/>
					</div>
				{/if}

				{#if provider?.isLocal || provider?.custom}
					<div class="ai-field">
						<label class="settings-label" for="{idp}-base-url">{m.app_llm_base_url()}</label>
						<input
							id="{idp}-base-url"
							type="text"
							class="settings-field"
							placeholder={provider.custom
								? m.app_services_endpoint_placeholder()
								: provider.defaultBaseUrl || 'http://localhost:11434/v1/'}
							value={settingsStore.getProviderConfig(provider.id).baseUrl ?? ''}
							oninput={(e) => state.handleLLMBaseUrlChange(provider.id, e.currentTarget.value)}
							onblur={provider.custom ? undefined : () => state.debouncedFetchLLMModels()}
						/>
						{#if state.llmFetchError}
							<p class="hint error">
								<Icon name="alert-circle" size={14} />
								{state.llmFetchError}
							</p>
							{@render troubleHelp()}
						{/if}
						{#if provider?.isLocal && !state.llmFetchError}
							{@render troubleHelp()}
						{/if}
					</div>
				{/if}

				{#if provider?.custom}
					{@const customConfig = settingsStore.getProviderConfig(provider.id)}
					<div class="ai-field">
						<label class="settings-label" for="{idp}-custom-model">{m.app_llm_model()}</label>
						<input
							id="{idp}-custom-model"
							type="text"
							class="settings-field"
							placeholder={m.app_services_model_placeholder()} aria-label={m.app_services_model_placeholder()}
							value={state.activeModel ?? ''}
							oninput={(e) => state.handleLLMModelChange(e.currentTarget.value.trim())}
						/>
						{#if customConfig.baseUrl}
							<ModelDropdown
								models={state.llmModels}
								value={state.activeModel}
								onSelect={state.handleLLMModelChange}
								placeholder={m.app_services_pick_fetched()}
								isLoading={state.llmIsLoading}
								onRefresh={state.refreshLLMModels}
								disabled={false}
							/>
						{:else}
							<p class="hint">{m.app_services_base_url_hint()}</p>
						{/if}
					</div>

					{#if !vision}
					<details class="llm-advanced-params">
						<summary>{m.app_llm_advanced()}</summary>
						<div class="llm-param-grid">
							<div class="llm-param-row">
								<label class="llm-param-label" for="llm-temperature">
									{m.app_llm_temperature()}
									<span class="llm-param-value">{state.consciousnessSettings.temperature.toFixed(2)}</span>
								</label>
								<input
									id="llm-temperature"
									type="range" use:rangeProgress={state.consciousnessSettings.temperature}
									class="settings-range"
									min="0"
									max="2"
									step="0.05"
									value={state.consciousnessSettings.temperature}
									oninput={(e) => state.handleLLMNumberSetting('temperature', Number(e.currentTarget.value))}
								/>
								<p class="hint">{m.app_llm_temperature_hint()}</p>
							</div>

							<div class="llm-param-row">
								<label class="llm-param-label" for="llm-top-p">
									Top P
									<span class="llm-param-value">{state.consciousnessSettings.topP.toFixed(2)}</span>
								</label>
								<input
									id="llm-top-p"
									type="range" use:rangeProgress={state.consciousnessSettings.topP}
									class="settings-range"
									min="0"
									max="1"
									step="0.05"
									value={state.consciousnessSettings.topP}
									oninput={(e) => state.handleLLMNumberSetting('topP', Number(e.currentTarget.value))}
								/>
								<p class="hint">{m.app_llm_top_p_hint()}</p>
							</div>

							<div class="llm-param-row">
								<label class="llm-param-label" for="llm-max-tokens">
									{m.app_llm_max_tokens()}
									<span class="llm-param-value">{state.consciousnessSettings.maxTokens ?? m.app_common_default()}</span>
								</label>
								<input
									id="llm-max-tokens"
									type="number"
									class="settings-field"
									min="1"
									step="1"
									placeholder={m.app_llm_unlimited()} aria-label={m.app_llm_unlimited()}
									value={state.consciousnessSettings.maxTokens ?? ''}
									oninput={(e) => {
										const val = e.currentTarget.value;
										state.handleLLMNumberSetting('maxTokens', val ? parseInt(val, 10) : undefined);
									}}
								/>
								<p class="hint">{m.app_llm_max_tokens_hint()}</p>
							</div>

							<div class="llm-param-row">
								<label class="llm-param-label" for="llm-presence-penalty">
									{m.app_llm_presence()}
									<span class="llm-param-value">{state.consciousnessSettings.presencePenalty.toFixed(1)}</span>
								</label>
								<input
									id="llm-presence-penalty"
									type="range" use:rangeProgress={state.consciousnessSettings.presencePenalty}
									class="settings-range"
									min="-2"
									max="2"
									step="0.1"
									value={state.consciousnessSettings.presencePenalty}
									oninput={(e) => state.handleLLMNumberSetting('presencePenalty', Number(e.currentTarget.value))}
								/>
								<p class="hint">{m.app_llm_presence_hint()}</p>
							</div>

							<div class="llm-param-row">
								<label class="llm-param-label" for="llm-frequency-penalty">
									{m.app_llm_frequency()}
									<span class="llm-param-value">{state.consciousnessSettings.frequencyPenalty.toFixed(1)}</span>
								</label>
								<input
									id="llm-frequency-penalty"
									type="range" use:rangeProgress={state.consciousnessSettings.frequencyPenalty}
									class="settings-range"
									min="-2"
									max="2"
									step="0.1"
									value={state.consciousnessSettings.frequencyPenalty}
									oninput={(e) => state.handleLLMNumberSetting('frequencyPenalty', Number(e.currentTarget.value))}
								/>
								<p class="hint">{m.app_llm_frequency_hint()}</p>
							</div>
						</div>
					</details>
					{/if}
				{:else}
					<div class="ai-field">
						<span class="settings-label">{m.app_llm_model()}</span>
						<ModelDropdown
							models={state.llmModels}
							value={state.activeModel}
							onSelect={state.handleLLMModelChange}
							placeholder={m.app_services_select_model()}
							isLoading={state.llmIsLoading}
							onRefresh={state.llmHasApiKey ? state.refreshLLMModels : undefined}
							disabled={!state.llmHasApiKey}
							disabledMessage={m.app_services_key_first()}
						/>
					</div>
				{/if}

				{#if state.activeModel}
					{@const model = state.activeModel}
					{@const sight = settingsStore.resolveModelVision(state.activeProvider, model)}
					<div class="setting-row">
						<div class="setting-info">
							<span class="setting-label">{m.app_llm_sees_images()}</span>
							<span class="setting-desc">{visionNote(sight.capable, sight.source, provider?.name)}</span>
						</div>
						<Switch
							id="{idp}-sees-images"
							label={m.app_llm_sees_images_switch()}
							checked={sight.capable}
							onchange={(on) => settingsStore.setVisionOverride(state.activeProvider, model, on)}
						/>
					</div>
				{/if}

				{#if !vision}
					<ContextSizeSlider
						contextSize={state.consciousnessSettings.contextSize}
						onChange={handleContextSizeChange}
						id="llm-context-size-toggle"
					/>
				{/if}
			{/if}
		{:else}
			<p class="hint">
				{vision
					? m.app_llm_vision_off()
					: m.app_llm_chat_off()}
			</p>
		{/if}
	</div>
</SettingsSection>

<style>
	.hint.error {
		display: flex;
		align-items: flex-start;
		gap: 6px;
	}

	.hint.error {
		color: var(--color-error);
	}

	.hint :global(svg) {
		flex-shrink: 0;
		margin-top: 2px;
	}

	.hint a {
		color: inherit;
		text-decoration: underline;
		text-underline-offset: 2px;
	}

	.hint a:hover {
		color: var(--text-primary);
	}

	.llm-advanced-params {
		border-radius: var(--radius-lg);
		padding: 12px 16px;
		background: var(--bg-secondary);
	}

	.llm-advanced-params summary {
		font-size: 14px;
		font-weight: 500;
		color: var(--text-primary);
		cursor: pointer;
		user-select: none;
	}

	.llm-param-grid {
		margin-top: 12px;
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
		gap: 16px;
	}

	.llm-param-row {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.llm-param-label {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 14px;
		font-weight: 500;
		color: var(--text-primary);
	}

	.llm-param-value {
		font-size: 13px;
		color: var(--text-secondary);
		font-variant-numeric: tabular-nums;
	}

	@media (max-width: 640px) {
		.llm-advanced-params {
			padding: 12px;
		}
	}
</style>
