<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import { createTtsSettingsState } from '$lib/stores/ai-services-settings.svelte';
	import TtsSettings from '$lib/components/settings/TtsSettings.svelte';
	import '../settings-page.css';

	const state = createTtsSettingsState();
</script>

<div class="page">
	<header class="page-header">
		<h2>{m.app_tts_title()}</h2>
		<p>{m.app_tts_intro()}</p>
	</header>

	<TtsSettings {state} />
</div>
