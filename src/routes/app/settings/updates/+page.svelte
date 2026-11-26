<script lang="ts">
	import { onMount } from 'svelte';
	import { isNativeMobile } from '$lib/services/platform/platform';
	import { androidUpdater } from '$lib/stores/android-updater.svelte';
	import { localPath } from '$lib/config/links';
	let native = $state(false);
	onMount(() => {
		native = isNativeMobile();
		if (native) void androidUpdater.check();
	});
</script>

<section class="update-settings">
	<h2>Aggiornamenti Android</h2>
	{#if native}
		<p>Versione installata: {androidUpdater.build || 'debug precedente'}</p>
		<p>Canale: {androidUpdater.permanent ? 'Firma permanente' : 'Sviluppo (debug)'}</p>
		<button class="btn btn-secondary" disabled={androidUpdater.checking} onclick={() => androidUpdater.check(true)}>{androidUpdater.checking ? 'Controllo in corso…' : 'Cerca aggiornamenti'}</button>
		{#if androidUpdater.error}<p role="alert">{androidUpdater.error}</p>{/if}
		{#if androidUpdater.available}
			<h3>{androidUpdater.available.title}</h3>
			<p class="notes">{androidUpdater.available.notes}</p>
			{#if !androidUpdater.permanent}
				<p><strong>Migrazione iniziale:</strong> la firma di debug è diversa. Prima salva e verifica il backup dei dati, conserva i VRM e le chiavi API. Potrebbe essere necessario disinstallare la sola versione di debug.</p>
				<a href={localPath('app', '/settings/data')}>Apri backup dei dati</a>
			{:else}
				<p>Installa sopra la versione attuale, senza disinstallarla. Android conserva i dati e ti chiederà conferma.</p>
			{/if}
			<button class="btn btn-primary" onclick={() => androidUpdater.download()}>Scarica APK aggiornato</button>
			<p class="hint">Il download si apre nel browser di sistema. Apri l'APK scaricato e conferma l'aggiornamento. Non occorre estrarre ZIP.</p>
		{:else if androidUpdater.checked && !androidUpdater.checking}
			<p>Non risultano aggiornamenti pubblicati.</p>
		{/if}
		<p class="hint">Neliel cerca nuove versioni all'avvio e quando torni nell'app. I file provengono dal repository GitHub del progetto.</p>
	{:else}
		<p>Questa funzione è disponibile nella versione Android nativa.</p>
	{/if}
</section>
<style>
	.update-settings { display: flex; flex-direction: column; align-items: flex-start; gap: .8rem; overflow: auto; padding-bottom: 1rem; color: var(--text-primary); }
	h2 { font-size: 1.25rem; font-weight: 600; } h3 { font-weight: 600; }
	p { line-height: 1.5; } .hint { color: var(--text-secondary); font-size: .85rem; } .notes { white-space: pre-wrap; overflow-wrap: anywhere; } a { text-decoration: underline; }
</style>
