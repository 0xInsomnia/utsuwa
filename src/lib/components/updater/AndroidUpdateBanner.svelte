<script lang="ts">
	import { onMount } from 'svelte';
	import { isNativeMobile } from '$lib/services/platform/platform';
	import { androidUpdater } from '$lib/stores/android-updater.svelte';
	import { localPath } from '$lib/config/links';

	let native = $state(false);
	onMount(() => {
		native = isNativeMobile();
		if (!native) return;
		void androidUpdater.check();
		const onVisible = () => { if (document.visibilityState === 'visible') void androidUpdater.check(); };
		document.addEventListener('visibilitychange', onVisible);
		return () => document.removeEventListener('visibilitychange', onVisible);
	});
</script>

{#if native && androidUpdater.available && !androidUpdater.dismissed}
	<section class="android-update" aria-label="Aggiornamento Android" role="status">
		<strong>Aggiornamento Neliel disponibile</strong>
		<span>Build {androidUpdater.available.code}</span>
		{#if !androidUpdater.permanent}<small>Prima versione con firma permanente: salva i dati prima della migrazione.</small>{/if}
		<div class="actions">
			<a href={localPath('app', '/settings/updates')} class="btn btn-primary">Aggiorna</a>
			<button class="btn btn-secondary" onclick={() => androidUpdater.dismiss()}>Dopo</button>
		</div>
	</section>
{/if}

<style>
	.android-update { position: fixed; top: calc(4.5rem + env(safe-area-inset-top, 0px)); left: 50%; transform: translateX(-50%); z-index: 900; width: min(390px, calc(100vw - 24px)); display: grid; gap: .45rem; padding: 1rem; border: 1px solid var(--border-light); border-radius: 12px; background: var(--bg-primary); color: var(--text-primary); box-shadow: 0 6px 24px #0005; }
	.android-update span, small { font-size: .85rem; color: var(--text-secondary); }
	.actions { display: flex; gap: .5rem; justify-content: flex-end; flex-wrap: wrap; }
</style>
