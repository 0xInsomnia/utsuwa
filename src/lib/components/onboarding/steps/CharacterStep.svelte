<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import { Icon } from '$lib/components/ui';

	interface Props {
		name: string;
		systemPrompt: string;
		onNameChange: (name: string) => void;
		onSystemPromptChange: (prompt: string) => void;
		onNext: () => void;
		onBack: () => void;
	}

	let { name, systemPrompt, onNameChange, onSystemPromptChange, onNext, onBack }: Props = $props();

	const isValid = $derived(name.trim().length > 0);
</script>

<div class="ob-step">
	<div class="ob-head">
		<h2 class="ob-title">{m.app_onboarding_name_title()}</h2>
		<p class="ob-subtitle">{m.app_onboarding_name_subtitle()}</p>
	</div>

	<div class="ob-field">
		<label for="name" class="ob-label">{m.app_onboarding_name_label()}</label>
		<input
			id="name"
			type="text"
			class="ob-input"
			value={name}
			oninput={(e) => onNameChange(e.currentTarget.value)}
			placeholder={m.app_onboarding_name_placeholder()}
		/>
	</div>

	<details class="ob-advanced"><summary>{m.app_onboarding_personality_toggle()}</summary>
	<div class="ob-field">
		<label for="personality" class="ob-label">{m.app_onboarding_personality_label()}</label>
		<textarea
			id="personality"
			class="ob-textarea"
			value={systemPrompt}
			oninput={(e) => onSystemPromptChange(e.currentTarget.value)}
			placeholder={m.app_onboarding_personality_placeholder()}
			rows="5"
		></textarea>
		<span class="ob-hint">{m.app_onboarding_personality_hint()}</span>
	</div>
	</details>

	<div class="ob-actions ob-actions--split">
		<button class="btn btn-secondary" onclick={onBack}>
			<Icon name="chevron-left" size={16} />
			{m.app_common_back()}
		</button>
		<button class="btn btn-primary" onclick={onNext} disabled={!isValid}>
			{m.app_common_next()}
			<Icon name="chevron-right" size={16} />
		</button>
	</div>
</div>
