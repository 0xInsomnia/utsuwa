<script lang="ts">
	import { goto } from '$app/navigation';
	import { Icon } from '$lib/components/ui';
	import CameraSettingsPanel from '$lib/components/ui/CameraSettingsPanel.svelte';
	import ArUnsupportedModal from '$lib/components/ui/ArUnsupportedModal.svelte';
	import { localPath } from '$lib/config/links';
	import { isDesktopTauri } from '$lib/services/platform/platform';
	import { arStore } from '$lib/stores/ar.svelte';
	import { getColorMode, cycleColorMode, type ColorMode } from '$lib/utils/color-mode';
	import { onMount } from 'svelte';
	import type { Reminder } from '$lib/types/memory';
	import { vrmStore } from '$lib/stores/vrm.svelte';

	interface Props {
		onInfoClick: () => void;
		upcomingReminders?: Reminder[];
		onDeleteReminder?: (id: number) => void;
		recentFired?: Reminder[];
		onDismissRecentFired?: (id: number) => void;
	}

	let {
		onInfoClick,
		upcomingReminders = [],
		onDeleteReminder,
		recentFired = [],
		onDismissRecentFired
	}: Props = $props();
	let showOverlayBtn = $state(false);
	let clusterOpen = $state(false);
	let remindersOpen = $state(false);
	let showCamera = $state(false);
	let showParts = $state(false);
	let partSearch = $state('');
	let avatarParts = $derived(vrmStore.avatarParts);
	let outfitSummary = $derived.by(() => { const parts = vrmStore.avatarParts; return parts.length ? vrmStore.getOutfitSummary() : null; });
	let filteredParts = $derived(avatarParts.filter(part => (part.label + ' ' + part.alias).toLowerCase().includes(partSearch.trim().toLowerCase())));
	$effect(() => {
		if (vrmStore.vrm) partSearch = '';
	});
	let colorMode = $state<ColorMode>('system');
	let rootEl = $state<HTMLDivElement | null>(null);
	let showArModal = $state(false);

	function handleArClick() {
		if (!arStore.supported) {
			rootEl?.querySelector<HTMLButtonElement>('.cluster-trigger')?.focus();
			showArModal = true;
			clusterOpen = false;
			return;
		}
		if (arStore.active) {
			arStore.exit();
		} else {
			arStore.enter();
		}
	}

	const themeIcon = $derived(
		colorMode === 'system' ? 'monitor' : colorMode === 'light' ? 'sun' : 'moon'
	);
	const themeLabel = $derived(
		colorMode === 'system' ? 'Theme: System' : colorMode === 'light' ? 'Theme: Light' : 'Theme: Dark'
	);

	onMount(() => {
		showOverlayBtn = isDesktopTauri();
		colorMode = getColorMode();

		// Close dropdowns when clicking anywhere outside the root element
		const onPointerDown = (e: PointerEvent) => {
			if (!rootEl || rootEl.contains(e.target as Node)) return;
			clusterOpen = false;
			remindersOpen = false;
			showCamera = false;
			showParts = false;
		};
		const onKeydown = (event: KeyboardEvent) => {
			if (event.key !== 'Escape' || event.defaultPrevented || event.isComposing) return;
			if (event.target instanceof Element && event.target.closest('[role="dialog"]:not(.camera-panel)')) return;
			let target: string;
			if (showParts) { showParts = false; target = '[aria-label="Elementi modello"]'; }
			else if (showCamera) { showCamera = false; target = '[aria-label="Camera settings"]'; }
			else if (remindersOpen) { remindersOpen = false; target = '.reminder-trigger'; }
			else if (clusterOpen) { clusterOpen = false; target = '.cluster-trigger'; }
			else return;
			event.preventDefault();
			rootEl?.querySelector<HTMLButtonElement>(target)?.focus();
		};
		document.addEventListener('pointerdown', onPointerDown);
		document.addEventListener('keydown', onKeydown);
		return () => {
			document.removeEventListener('pointerdown', onPointerDown);
			document.removeEventListener('keydown', onKeydown);
		};
	});

	function toggleCluster() {
		clusterOpen = !clusterOpen;
		remindersOpen = false;
		if (!clusterOpen) { showCamera = false; showParts = false; }
	}

	function formatTimeLabel(date: Date): string {
		const now = new Date();
		const diffMs = date.getTime() - now.getTime();
		const diffMin = Math.max(0, Math.ceil(diffMs / 60000));
		if (diffMin < 60) return `in ${diffMin} min`;
		const diffH = Math.ceil(diffMin / 60);
		return `in ${diffH} h`;
	}

	function deleteReminder(id?: number) {
		if (id === undefined) return;
		remindersOpen = false;
		onDeleteReminder?.(id);
	}

	function dismissRecentFired(id?: number) {
		if (id === undefined) return;
		onDismissRecentFired?.(id);
	}

	async function launchOverlay() {
		try {
			const { invoke } = await import('@tauri-apps/api/core');
			const { getCurrentWindow } = await import('@tauri-apps/api/window');

			// Show overlay and hide main window
			await invoke('show_overlay');
			const mainWindow = getCurrentWindow();
			await mainWindow.hide();
		} catch (e) {
			console.error('Failed to launch overlay:', e);
		}
	}
</script>

<div class="top-right-buttons" bind:this={rootEl}>
	<div class="button-row">
		<div class="reminder-wrapper">
			<button
				class="btn btn-secondary btn-icon reminder-trigger"
				aria-expanded={remindersOpen}
				onclick={() => (remindersOpen = !remindersOpen)}
				aria-label={upcomingReminders.length > 0 ? `Open reminders, ${upcomingReminders.length} open` : 'Open reminders'}
				title="Open reminders"
			>
				<Icon name="bell" size={16} />
				{#if upcomingReminders.length > 0}
					<span class="reminder-badge">{upcomingReminders.length}</span>
				{/if}
			</button>
			{#if remindersOpen}
				<div class="reminder-dropdown">
					<div class="reminder-header">Open tasks</div>
					{#if upcomingReminders.length === 0}
						<div class="reminder-empty">No open tasks or timers</div>
					{:else}
						<ul class="reminder-list">
							{#each upcomingReminders as reminder (reminder.id)}
								<li class="reminder-item">
									<div class="reminder-text">
										<span class="reminder-content">{reminder.content}</span>
										<span class="reminder-time">{formatTimeLabel(reminder.triggerAt)}</span>
									</div>
									<button
										class="reminder-delete"
										onclick={() => deleteReminder(reminder.id)}
										aria-label="Delete reminder"
										title="Delete reminder"
									>
										<Icon name="trash" size={14} />
									</button>
								</li>
							{/each}
						</ul>
					{/if}

					{#if recentFired.length > 0}
						<div class="reminder-header reminder-header--fired">Fired or missed</div>
						<ul class="reminder-list">
							{#each recentFired as reminder (reminder.id)}
								<li class="reminder-item reminder-item--fired">
									<div class="reminder-text">
										<span class="reminder-content">{reminder.content}</span>
										<span class="reminder-time">{formatTimeLabel(reminder.triggerAt)}</span>
									</div>
									<button
										class="reminder-delete"
										onclick={() => dismissRecentFired(reminder.id)}
										aria-label="Dismiss reminder"
										title="Dismiss reminder"
									>
										<Icon name="check" size={14} />
									</button>
								</li>
							{/each}
						</ul>
					{/if}
				</div>
			{/if}
		</div>
		{#if showOverlayBtn}
			<button class="btn btn-primary btn-icon" onclick={launchOverlay} aria-label="Launch overlay" title="Launch Overlay Mode">
				<Icon name="monitor" size={16} />
			</button>
		{/if}
		<button class="btn btn-secondary btn-icon" onclick={(event) => { event.currentTarget.focus(); onInfoClick(); }} aria-label="App info">
			<Icon name="info" size={16} />
		</button>
		<button
			class="btn btn-secondary btn-icon cluster-trigger"
			onclick={toggleCluster}
			aria-label="Controls"
			aria-expanded={clusterOpen}
			title="Controls"
		>
			<Icon name={clusterOpen ? 'x' : 'sliders'} size={16} />
		</button>
	</div>

	{#if clusterOpen}
		<div class="cluster">
			<button
				class="btn btn-secondary btn-icon cluster-item"
				style="--i: 0"
				onclick={() => goto(localPath('app', '/settings'))}
				aria-label="Settings"
				title="Settings"
			>
				<Icon name="settings" size={16} />
			</button>
			<button
				class="btn btn-secondary btn-icon cluster-item"
				aria-expanded={showCamera}
				style="--i: 1"
				onclick={() => { showCamera = !showCamera; showParts = false; }}
				aria-label="Camera settings"
				title="Camera"
			>
				<Icon name="video" size={16} />
			</button>
			<button
				class="btn btn-secondary btn-icon cluster-item"
				style="--i: 2"
				onclick={() => (colorMode = cycleColorMode())}
				aria-label={themeLabel}
				title={themeLabel}
			>
				<Icon name={themeIcon} size={16} />
			</button>
			<button
				class="btn btn-secondary btn-icon cluster-item"
				aria-pressed={arStore.active}
				style="--i: 3"
				onclick={handleArClick}
				aria-label={arStore.active ? 'Exit AR' : 'Enter AR'}
				title={arStore.active ? 'Exit AR' : 'View in AR'}
			>
				<Icon name="cube" size={16} />
			</button>
			<button
				class="btn btn-secondary btn-icon cluster-item"
				style="--i: 4"
				aria-label="Elementi modello"
				title="Vestiti e accessori"
				aria-expanded={showParts}
				onclick={() => { showParts = !showParts; showCamera = false; }}
			>
				<Icon name="layers" size={16} />
			</button>
		</div>

		{#if showParts}
			<section class="parts-panel" aria-label="Vestiti e accessori">
				<div class="parts-header">
					<strong>Vestiti e accessori</strong>
					<button class="btn btn-secondary btn-icon" aria-label="Chiudi pannello" onclick={() => (showParts = false)}><Icon name="x" size={16} /></button>
				</div>
				<p class="parts-note">Assegna nomi ai capi per farli riconoscere all’AI. Non serve autorizzarla a cambiarli per farle conoscere l’abbigliamento.</p>
				<input class="parts-search" aria-label="Cerca elemento" placeholder="Cerca mesh o materiale..." bind:value={partSearch} />
				<button class="btn btn-secondary parts-reset" onclick={() => vrmStore.restoreParts()} disabled={avatarParts.length === 0}>Ripristina originale</button>
				{#if outfitSummary}
					<div class="wardrobe-item">
						<strong>Stato comunicato all'AI</strong>
						<p class="parts-note">Indossati: {outfitSummary.worn.join(', ') || 'nessun capo identificato'}</p>
						<p class="parts-note">Nascosti: {outfitSummary.hidden.join(', ') || 'nessun capo identificato'}</p>
						{#if outfitSummary.partial.length}<p class="parts-note">Parziali: {outfitSummary.partial.join(', ')}</p>{/if}
						<p class="parts-note">Mesh non identificate come vestiti: {outfitSummary.unknown}. I nomi dedotti sono da verificare.</p>
					</div>
				{/if}
				<div class="wardrobe-settings">
					<p class="parts-note"><strong>Ultimo comando AI:</strong> {vrmStore.wardrobeActionStatus}</p>
					<p class="parts-note">Elementi autorizzati: {avatarParts.filter(part => part.allowed).length}. Per un comando diretto usa il nome esatto del capo, ad esempio “Togliti la giacca”.</p>
					<label class="part-row"><input type="checkbox" checked={vrmStore.wardrobeEnabled} onchange={(e) => vrmStore.setWardrobeEnabled(e.currentTarget.checked)} /> Controllo vestiti tramite AI</label>
					<label class="part-row"><input type="checkbox" checked={vrmStore.wardrobeAutonomous} disabled={!vrmStore.wardrobeEnabled} onchange={(e) => vrmStore.setWardrobeAutonomous(e.currentTarget.checked)} /> Cambi autonomi senza conferma</label>
					<label class="part-row"><input type="checkbox" checked={vrmStore.wardrobeVision} onchange={(e) => vrmStore.setWardrobeVision(e.currentTarget.checked)} /> Visione del proprio avatar</label>
					<p class="parts-note">Se attiva, invia un fotogramma 3D al modello visivo configurato (o al modello chat se supporta immagini) quando si parla di abbigliamento. Può consumare crediti API; le immagini non vengono salvate in chat. Stato: {vrmStore.wardrobeVisionStatus}</p>
					<label class="part-row"><input type="checkbox" checked={vrmStore.wardrobeReactions} onchange={(e) => vrmStore.setWardrobeReactions(e.currentTarget.checked)} /> Reazioni ai cambi manuali</label>
					<p class="parts-note">Abilita solo capi e accessori separati. Non autorizzare corpo, viso o capelli. I permessi si azzerano quando cambi o ricarichi il modello.</p>
				</div>
				<div class="parts-list">
					{#each filteredParts as part (part.id)}
						<div class="wardrobe-item">
							<label class="part-row">
								<input type="checkbox" checked={part.visible} onchange={(e) => vrmStore.setPartVisible(part.id, e.currentTarget.checked)} />
								<span title={part.label}>{part.label}</span>
							</label>
							<label class="part-row wardrobe-allow"><input type="checkbox" checked={part.allowed} onchange={(e) => vrmStore.setPartAllowed(part.id, e.currentTarget.checked)} /> Consenti all'AI di gestire</label>
							<input class="parts-search" aria-label="Nome del capo" placeholder="Nome del capo, es. giacca (facoltativo)" value={part.alias} onchange={(e) => vrmStore.setPartAlias(part.id, e.currentTarget.value)} />
						</div>
					{:else}
						<p class="parts-note">{avatarParts.length ? 'Nessun elemento trovato.' : 'Carica un modello VRM.'}</p>
					{/each}
				</div>
			</section>
		{/if}

		{#if showCamera}
			<div class="camera-anchor">
				<CameraSettingsPanel onclose={() => (showCamera = false)} />
			</div>
		{/if}
	{/if}
</div>

{#if showArModal}
	<ArUnsupportedModal onclose={() => (showArModal = false)} />
{/if}

<style>
	.parts-panel {
		position: absolute;
		top: 3.25rem;
		right: 3.25rem;
		width: min(280px, calc(100vw - 5.5rem));
		max-height: min(65dvh, 480px);
		overflow-y: auto;
		background: var(--bg-primary, #202020);
		color: var(--text-primary, #fff);
		border: 1px solid var(--border-light, #777);
		border-radius: var(--radius-md, 12px);
		box-shadow: 0 8px 24px #0005;
		padding: 0.75rem;
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
		z-index: 60;
	}
	.parts-header { display: flex; justify-content: space-between; align-items: center; gap: 0.5rem; }
	.parts-note { margin: 0; font-size: 0.8rem; color: var(--text-secondary, #aaa); }
	.parts-search { width: 100%; min-width: 0; padding: 0.55rem; background: var(--bg-secondary, #303030); color: inherit; border: 1px solid var(--border-light, #777); border-radius: 6px; font-size: 0.85rem; }
	.parts-reset { width: 100%; font-size: 0.8rem; }
	.wardrobe-item { padding: 0.4rem; border: 1px solid var(--border-light); border-radius: 6px; }
	.wardrobe-settings { border-bottom: 1px solid var(--border-light); padding-bottom: 0.5rem; }
	.wardrobe-allow { color: var(--text-secondary); font-size: 0.75rem; }
	.parts-list { display: flex; flex-direction: column; gap: 0.25rem; }
	.part-row { display: flex; align-items: center; gap: 0.5rem; min-height: 36px; padding: 0.3rem; cursor: pointer; font-size: 0.82rem; overflow-wrap: anywhere; }
	.part-row input { flex-shrink: 0; width: 18px; height: 18px; accent-color: #00b2ff; }
	.top-right-buttons {
		position: fixed;
		top: 1rem;
		right: 1rem;
		z-index: 50;
		display: flex;
		flex-direction: column;
		align-items: flex-end;
	}

	.button-row {
		display: flex;
		gap: 0.5rem;
	}

	/* Expanded column hangs below the trigger */
	.cluster {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-top: 0.5rem;
	}

	.cluster-item {
		animation: clusterIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) both;
		animation-delay: calc(var(--i) * 45ms);
	}

	@keyframes clusterIn {
		from {
			opacity: 0;
			transform: translateY(-8px) scale(0.9);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}

	.camera-anchor {
		position: absolute;
		top: 3.25rem;
		right: 3.25rem;
	}


	.reminder-wrapper {
		position: relative;
	}

	.reminder-badge {
		position: absolute;
		top: -2px;
		right: -2px;
		min-width: 18px;
		height: 18px;
		padding: 0 5px;
		background: var(--color-error-fill);
		color: var(--color-error-contrast);
		font-size: 10px;
		font-weight: 700;
		border-radius: 9px;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
	}

	.reminder-dropdown {
		position: absolute;
		top: calc(100% + 8px);
		right: 0;
		width: 280px;
		max-height: 320px;
		overflow-y: auto;
		padding: 0.75rem;
		z-index: 60;
	}

	.reminder-header { font-size: 12px; font-weight: 500; color: var(--text-secondary); margin-bottom: 8px; padding: 0 4px; }

	.reminder-header--fired {
		margin-top: 0.75rem;
		color: var(--color-error);
	}

	.reminder-empty {
		font-size: 0.85rem;
		color: var(--text-secondary);
		padding: 0.75rem 0.25rem;
		text-align: center;
	}

	.reminder-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	.reminder-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		padding: 0.5rem;
		background: var(--bg-secondary);
		border-radius: var(--radius-md);
		transition: background 0.15s ease;
	}

	.reminder-item:hover {
		background: var(--bg-primary);
	}

	.reminder-text {
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
		min-width: 0;
		flex: 1;
	}

	.reminder-content {
		font-size: 0.85rem;
		color: var(--text-primary);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.reminder-time {
		font-size: 0.75rem;
		color: var(--text-secondary);
	}

	.reminder-delete {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		padding: 0;
		background: transparent;
		border: 1px solid var(--border-light);
		border-radius: var(--control-radius);
		color: var(--text-secondary);
		cursor: pointer;
		transition: color 0.15s ease, background 0.15s ease;
		flex-shrink: 0;
	}

	.reminder-delete:hover {
		color: var(--color-error);
		background: color-mix(in srgb, var(--color-error) 10%, transparent);
	}
</style>
