<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import { rangeProgress } from '$lib/utils/range-progress';
	import { Icon } from '$lib/components/ui';
	import { backgroundLabel } from '$lib/i18n/labels';
	import {
		displayStore,
		CAMERA_DEFAULTS,
		CAMERA_LIMITS,
		type CameraProfile
	} from '$lib/stores/display.svelte';
	import {
		PHYSICS_INTENSITY_MIN,
		PHYSICS_INTENSITY_MAX,
		PHYSICS_INTENSITY_DEFAULT
	} from '$lib/engine/spring-physics';
	import { BACKGROUND_PRESETS, presetSwatch } from '$lib/services/scene-backgrounds';

	// Transparent is a photo-capture concept; the scene picker skips it
	const SCENE_PRESETS = BACKGROUND_PRESETS.filter((p) => !p.photoOnly);

	interface Props {
		onclose: () => void;
		profile?: CameraProfile;
	}

	let { onclose, profile = 'main' }: Props = $props();

	const cam = $derived(profile === 'overlay' ? displayStore.overlayCamera : displayStore.camera);
	const isDefault = $derived(
		cam.fov === CAMERA_DEFAULTS.fov &&
			cam.zoom === CAMERA_DEFAULTS.zoom &&
			cam.height === CAMERA_DEFAULTS.height &&
			cam.panX === CAMERA_DEFAULTS.panX
	);

	let fileInput = $state<HTMLInputElement>();
	let uploadError = $state('');
	let uploadErrorTimer: ReturnType<typeof setTimeout> | undefined;

	// Hand focus back to the button that opened the panel, in the app and the overlay
	function close() {
		const trigger = document.querySelector<HTMLElement>('button[data-camera-trigger][aria-expanded="true"]');
		onclose();
		trigger?.focus();
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key !== 'Escape' || e.defaultPrevented || e.isComposing) return;
		e.preventDefault();
		close();
	}

	async function handleBackgroundFile(input: HTMLInputElement) {
		const file = input.files?.[0];
		// Reset so picking the same file again still fires change
		input.value = '';
		if (!file) return;
		try {
			await displayStore.setCustomBackgroundImage(file);
			uploadError = '';
		} catch (e) {
			uploadError = e instanceof Error ? e.message : m.app_camera_image_error();
			clearTimeout(uploadErrorTimer);
			uploadErrorTimer = setTimeout(() => (uploadError = ''), 4000);
		}
	}
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div class="camera-panel" role="dialog" aria-label={m.app_controls_camera_settings()} tabindex="-1" onkeydown={handleKeydown}>
	<div class="panel-header">
		<h2 class="panel-title">{m.app_controls_camera()}</h2>
		<button class="btn btn-ghost btn-icon" onclick={close} aria-label={m.app_camera_close()}>
			<Icon name="x" size={14} />
		</button>
	</div>

	<div class="group">
		<label class="control">
			<span class="control-label">
				{m.app_camera_zoom()}
				<span class="control-value">{cam.zoom.toFixed(2)}×</span>
			</span>
			<input
				type="range" use:rangeProgress={cam.zoom}
				min={CAMERA_LIMITS.zoom.min}
				max={CAMERA_LIMITS.zoom.max}
				step="0.05"
				value={cam.zoom}
				oninput={(e) => displayStore.setCamera({ zoom: parseFloat(e.currentTarget.value) }, profile)}
			/>
		</label>

		<label class="control">
			<span class="control-label">
				{m.app_camera_height()}
				<span class="control-value">{cam.height > 0 ? '+' : ''}{(cam.height * 100).toFixed(0)} cm</span>
			</span>
			<input
				type="range" use:rangeProgress={cam.height}
				min={CAMERA_LIMITS.height.min}
				max={CAMERA_LIMITS.height.max}
				step="0.01"
				value={cam.height}
				oninput={(e) => displayStore.setCamera({ height: parseFloat(e.currentTarget.value) }, profile)}
			/>
		</label>

		<label class="control">
			<span class="control-label">
				{m.app_camera_pan()}
				<span class="control-value">{cam.panX > 0 ? '+' : ''}{(cam.panX * 100).toFixed(0)} cm</span>
			</span>
			<input
				type="range" use:rangeProgress={cam.panX}
				min={CAMERA_LIMITS.panX.min}
				max={CAMERA_LIMITS.panX.max}
				step="0.05"
				value={cam.panX}
				oninput={(e) => displayStore.setCamera({ panX: Number(e.currentTarget.value) }, profile)}
			/>
		</label>

		<label class="control">
			<span class="control-label">
				{m.app_camera_fov()}
				<span class="control-value">{cam.fov.toFixed(0)}°</span>
			</span>
			<input
				type="range" use:rangeProgress={cam.fov}
				min={CAMERA_LIMITS.fov.min}
				max={CAMERA_LIMITS.fov.max}
				step="1"
				value={cam.fov}
				oninput={(e) => displayStore.setCamera({ fov: parseFloat(e.currentTarget.value) }, profile)}
			/>
		</label>

		<button class="btn btn-secondary" onclick={() => displayStore.resetCamera(profile)} disabled={isDefault}>
			{m.app_camera_reset()}
		</button>
	</div>

	{#if profile === 'main'}
		<div class="group" role="group" aria-labelledby="camera-bg-label">
			<h3 class="group-label" id="camera-bg-label">{m.app_camera_background()}</h3>
			<div class="swatches">
				{#each SCENE_PRESETS as preset (preset.id)}
					<button
						class="swatch"
						aria-pressed={displayStore.sceneBackground.type === preset.bg.type &&
							displayStore.sceneBackground.value === preset.bg.value}
						style:background={presetSwatch(preset)}
						title={backgroundLabel(preset)}
						aria-label={backgroundLabel(preset)}
						onclick={() => displayStore.setSceneBackground(preset.bg)}
					></button>
				{/each}
				{#if displayStore.sceneBackgroundImage}
					{@const image = displayStore.sceneBackgroundImage}
					<button
						class="swatch"
						aria-pressed={displayStore.activeBackgroundImage !== null}
						style:background={`url("${image.url}") center / cover`}
						title={m.app_camera_your_image()}
						aria-label={m.app_camera_your_image()}
						onclick={() => displayStore.setSceneBackground({ type: 'image', value: image.id })}
					></button>
					<button
						class="swatch swatch-action"
						title={m.app_chat_remove_image()}
						aria-label={m.app_camera_remove_background()}
						onclick={() => displayStore.clearCustomBackgroundImage()}
					>
						<Icon name="x" size={14} />
					</button>
				{/if}
				<button
					class="swatch swatch-action"
					title={m.app_camera_upload()}
					aria-label={m.app_camera_upload_background()}
					onclick={() => fileInput?.click()}
				>
					<Icon name="upload" size={14} />
				</button>
				<input
					bind:this={fileInput}
					type="file"
					accept="image/jpeg,image/png,image/webp"
					hidden
					onchange={(e) => handleBackgroundFile(e.currentTarget)}
				/>
			</div>
			{#if uploadError}
				<p class="error" role="alert">{uploadError}</p>
			{/if}
		</div>
	{/if}

	<div class="group">
		<h3 class="group-label">{m.app_camera_physics()}</h3>
		<label class="control">
			<span class="control-label">
				{m.app_camera_movement()}
				<span class="control-value">
					{displayStore.physicsIntensity === PHYSICS_INTENSITY_DEFAULT
						? m.app_camera_default()
						: `${displayStore.physicsIntensity.toFixed(2)}x`}
				</span>
			</span>
			<input
				type="range" use:rangeProgress={displayStore.physicsIntensity}
				min={PHYSICS_INTENSITY_MIN}
				max={PHYSICS_INTENSITY_MAX}
				step="0.05"
				value={displayStore.physicsIntensity}
				oninput={(e) => displayStore.setPhysicsIntensity(parseFloat(e.currentTarget.value))}
			/>
			<span class="range-ends" aria-hidden="true">
				<span>{m.app_camera_subtle()}</span>
				<span>{m.app_camera_lively()}</span>
			</span>
		</label>
	</div>
</div>

<style>
	.camera-panel {
		width: min(300px, calc(100vw - 32px));
		max-height: calc(100dvh - 96px);
		overflow-y: auto;
		padding: 1rem;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		animation: panelIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) both;
	}

	.camera-panel:focus {
		outline: none;
	}

	@keyframes panelIn {
		from {
			opacity: 0;
			transform: translateY(-6px) scale(0.97);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}

	.panel-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: -0.75rem;
	}

	.panel-title {
		margin: 0;
		font-size: 14px;
		font-weight: 600;
		color: var(--text-primary);
	}

	/* Group and row rhythm mirrors settings-page.css, which is scoped to the settings layout */
	.group {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.group-label {
		margin: 0;
		font-size: 14px;
		font-weight: 500;
		color: var(--text-secondary);
	}

	.control {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.control-label {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		font-size: 14px;
		font-weight: 500;
		color: var(--text-primary);
	}

	.control-value {
		font-size: 13px;
		font-weight: 400;
		color: var(--text-secondary);
		font-variant-numeric: tabular-nums;
	}

	.control input[type='range'] { width: 100%; }

	.range-ends {
		display: flex;
		justify-content: space-between;
		font-size: 13px;
		color: var(--text-secondary);
	}

	.swatches {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
	}

	/* Swatches are artwork, so they keep a faint ring even though control
	   borders are transparent; otherwise the white preset vanishes. */
	.swatch {
		width: 32px;
		height: 32px;
		padding: 0;
		border: 0;
		border-radius: var(--radius-control);
		box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--text-primary) 16%, transparent);
		cursor: pointer;
	}

	.swatch[aria-pressed='true'] {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
	}

	.swatch-action {
		display: grid;
		place-items: center;
		background: var(--control-bg);
		box-shadow: none;
		color: var(--text-secondary);
	}

	.swatch-action:hover {
		background: var(--control-hover);
		color: var(--text-primary);
	}

	@media (pointer: coarse) {
		.swatch {
			width: 44px;
			height: 44px;
		}
	}

	.error {
		margin: 0;
		padding: 0.5rem 0.75rem;
		border-radius: var(--radius-control);
		background: var(--color-error-bg);
		color: var(--color-error-text);
		font-size: 13px;
		line-height: 1.45;
	}
</style>
