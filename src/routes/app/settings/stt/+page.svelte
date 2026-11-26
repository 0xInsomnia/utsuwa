<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import SttSettings from '$lib/components/settings/SttSettings.svelte';
	import '../settings-page.css';
</script>

<div class="page">
	<header class="page-header">
		<h2>{m.app_stt_title()}</h2>
		<p>{m.app_stt_intro()}</p>
	</header>

	<SttSettings />
</div>
