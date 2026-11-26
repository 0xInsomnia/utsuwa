<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import { Icon } from '$lib/components/ui';
	import SettingsSection from './SettingsSection.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { pop, slideOpen } from '$lib/utils/motion';
	import {
		exportSave,
		importSave,
		validateSaveFile,
		getSaveFilePreview,
		downloadSaveFile,
		clearAllData,
		type SaveFile,
		type SaveFilePreview,
		type LegacySaveFile
	} from '$lib/db/export';

	let isExporting = $state(false);
	let isImporting = $state(false);
	let isClearing = $state(false);
	let showClearConfirm = $state(false);

	let importFile = $state<File | null>(null);
	let importPreview = $state<SaveFilePreview | null>(null);
	let importMode = $state<'merge' | 'replace'>('replace');
	let importError = $state<string | null>(null);
	let importSuccess = $state<{ imported: number; skipped: number } | null>(null);
	let exportMessage = $state<{ kind: 'success' | 'error'; text: string } | null>(null);

	let fileInput: HTMLInputElement;

	async function handleExport() {
		isExporting = true;
		exportMessage = null;
		try {
			const saveFile = await exportSave();
			const { filename, savedToDownloads } = await downloadSaveFile(saveFile);
			// The browser shows its own download UI; the desktop app writes silently,
			// so tell the user where the file went.
			if (savedToDownloads) {
				exportMessage = { kind: 'success', text: m.app_data_saved_downloads({ filename }) };
			}
		} catch (e) {
			console.error('Export failed:', e);
			exportMessage = { kind: 'error', text: m.app_data_export_failed({ error: e instanceof Error ? e.message : String(e) }) };
		} finally {
			isExporting = false;
		}
	}

	function handleFileSelect(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];

		if (!file) return;

		importFile = file;
		importError = null;
		importSuccess = null;
		importPreview = null;

		const reader = new FileReader();
		reader.onload = (e) => {
			try {
				const json = JSON.parse(e.target?.result as string);
				const validated = validateSaveFile(json);

				if (!validated) {
					importError = m.app_data_invalid_format();
					importFile = null;
					return;
				}

				importPreview = getSaveFilePreview(validated);
			} catch {
				importError = m.app_data_parse_json_failed();
				importFile = null;
			}
		};
		reader.readAsText(file);
	}

	async function handleImport() {
		if (!importFile || !importPreview) return;

		isImporting = true;
		importError = null;

		try {
			const reader = new FileReader();
			const saveFile = await new Promise<SaveFile | LegacySaveFile>((resolve, reject) => {
				reader.onload = (e) => {
					try {
						const json = JSON.parse(e.target?.result as string);
						const validated = validateSaveFile(json);
						if (!validated) reject(new Error(m.app_data_invalid_file()));
						else resolve(validated);
					} catch {
						reject(new Error(m.app_data_parse_failed()));
					}
				};
				reader.onerror = () => reject(new Error(m.app_data_read_failed()));
				reader.readAsText(importFile!);
			});

			const result = await importSave(saveFile, importMode);
			importSuccess = result;
			importFile = null;
			importPreview = null;

			// Refresh the page after a short delay to reload stores
			setTimeout(() => {
				window.location.reload();
			}, 1500);
		} catch (e) {
			importError = e instanceof Error ? e.message : m.app_data_import_failed();
		} finally {
			isImporting = false;
		}
	}

	function cancelImport() {
		importFile = null;
		importPreview = null;
		importError = null;
		importSuccess = null;
		if (fileInput) fileInput.value = '';
	}

	async function handleClear() {
		if (!showClearConfirm) {
			showClearConfirm = true;
			return;
		}

		isClearing = true;
		try {
			// Reloads the page when it finishes
			await clearAllData();
		} catch (e) {
			console.error('Clear failed:', e);
		} finally {
			isClearing = false;
		}
	}

	function formatDate(date: Date): string {
		return date.toLocaleDateString(undefined, {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}
</script>

<div class="data-management">
	<header class="page-header"><h2>{m.app_data_title()}</h2>
	<p>
		{m.app_data_intro()}
	</p></header>

	<div class="actions">
		<!-- Export -->
		<SettingsSection title={m.app_data_export_title()} description={m.app_data_export_desc()}>
			<Button variant="secondary" onclick={handleExport} disabled={isExporting}>
				{#snippet children()}
					{#if isExporting}
						{m.app_data_exporting()}
					{:else}
						<Icon name="download" size={16} />
						{m.app_data_download()}
					{/if}
				{/snippet}
			</Button>
			{#if exportMessage}
				<div
					class={exportMessage.kind === 'error' ? 'error-message' : 'success-message'}
					transition:pop={{ duration: 200, y: 6 }}
				>
					<Icon name={exportMessage.kind === 'error' ? 'alert' : 'check-circle'} size={16} />
					<span>{exportMessage.text}</span>
				</div>
			{/if}
		</SettingsSection>

		<!-- Import -->
		<SettingsSection title={m.app_data_import_title()} description={m.app_data_import_desc()}>

			<input
				type="file"
				accept=".json"
				onchange={handleFileSelect}
				bind:this={fileInput}
				class="settings-field settings-file" aria-label={m.app_data_import_file()}
			/>

			{#if importError}
				<div class="error-message" transition:pop={{ duration: 200, y: 6 }}>
					<Icon name="warning" size={16} />
					{importError}
				</div>
			{/if}

			{#if importSuccess}
				<div class="success-message" transition:pop={{ duration: 200, y: 6 }}>
					<Icon name="check" size={16} />
					{m.app_data_imported({ count: importSuccess.imported })}
					{#if importSuccess.skipped > 0}
						{m.app_data_skipped({ count: importSuccess.skipped })}
					{/if}
					{m.app_data_reloading()}
				</div>
			{/if}

			{#if importPreview && !importSuccess}
				<div class="import-preview" transition:slideOpen>
					<div class="preview-header">
						<Icon name="file" size={16} />
						<span>{m.app_data_preview()}</span>
					</div>
					<div class="preview-details">
						<div class="preview-row">
							<span class="label">{m.app_data_exported()}</span>
							<span class="value">{formatDate(importPreview.exportedAt)}</span>
						</div>
						<div class="preview-row">
							<span class="label">{m.app_data_character()}</span>
							<span class="value">{importPreview.characterName || m.app_data_unknown()}</span>
						</div>
						<div class="preview-row">
							<span class="label">{m.app_data_records()}</span>
							<span class="value">
								{m.app_data_counts({ facts: importPreview.counts.facts, messages: importPreview.counts.conversationTurns })}
							</span>
						</div>
					</div>

					<div class="import-mode">
						<label class="mode-option">
							<input type="radio" bind:group={importMode} value="replace" />
							<span class="mode-label">{m.app_data_replace()}</span>
							<span class="mode-description">{m.app_data_replace_desc()}</span>
						</label>
						<label class="mode-option">
							<input type="radio" bind:group={importMode} value="merge" />
							<span class="mode-label">{m.app_data_merge()}</span>
							<span class="mode-description">{m.app_data_merge_desc()}</span>
						</label>
					</div>

					<div class="import-actions">
						<Button variant="secondary" onclick={cancelImport}>
							{#snippet children()}{m.app_common_cancel()}{/snippet}
						</Button>
						<Button onclick={handleImport} disabled={isImporting}>
							{#snippet children()}
								{#if isImporting}
									{m.app_data_importing()}
								{:else}
									<Icon name="upload" size={16} />
									{m.app_data_import()}
								{/if}
							{/snippet}
						</Button>
					</div>
				</div>
			{/if}
		</SettingsSection>

		<!-- Clear Data -->
		<SettingsSection title={m.app_data_clear_title()} description={m.app_data_clear_desc()}>

			{#if showClearConfirm}
				<div class="confirm-message" transition:pop={{ duration: 200, y: 6 }}>
					<Icon name="warning" size={16} />
					{m.app_data_clear_confirm()}
				</div>
				<div class="confirm-actions">
					<Button variant="secondary" onclick={() => (showClearConfirm = false)}>
						{#snippet children()}{m.app_common_cancel()}{/snippet}
					</Button>
					<Button variant="danger" onclick={handleClear} disabled={isClearing}>
						{#snippet children()}
							{#if isClearing}
								{m.app_data_clearing()}
							{:else}
								{m.app_data_clear_yes()}
							{/if}
						{/snippet}
					</Button>
				</div>
			{:else}
				<Button variant="danger" onclick={handleClear}>
					{#snippet children()}
						<Icon name="trash" size={16} />
						{m.app_data_clear_title()}
					{/snippet}
				</Button>
			{/if}
		</SettingsSection>
	</div>
</div>

<style>
	.data-management { display: flex; flex-direction: column; gap: 28px; }

	.actions { display: flex; flex-direction: column; gap: 24px; }

	.error-message {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.875rem 1rem;
		background: var(--color-error-bg);
		border-radius: var(--radius-md);
		color: var(--text-primary);
		font-size: 0.875rem;
		margin-bottom: 1rem;
	}

	.error-message :global(svg) {
		color: var(--color-error);
		flex-shrink: 0;
	}

	.success-message {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.875rem 1rem;
		background: color-mix(in srgb, var(--color-success) 10%, transparent);
		border-radius: var(--radius-md);
		color: var(--text-primary);
		font-size: 0.875rem;
		margin-bottom: 1rem;
	}

	.success-message :global(svg) {
		color: var(--color-success);
		flex-shrink: 0;
	}

	.import-preview {
		background: var(--bg-secondary);
		border-radius: var(--radius-md);
		padding: 1rem;
		margin-bottom: 1rem;
	}

	.preview-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-weight: 600;
		color: var(--accent-text);
		margin-bottom: 0.75rem;
	}

	.preview-details {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-bottom: 1rem;
	}

	.preview-row {
		display: flex;
		gap: 0.5rem;
		font-size: 0.875rem;
	}

	.preview-row .label {
		color: var(--text-tertiary);
		min-width: 80px;
	}

	.preview-row .value {
		color: var(--text-secondary);
	}

	.import-mode {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		margin-bottom: 1rem;
	}

	.mode-option {
		display: grid;
		grid-template-columns: auto 1fr;
		grid-template-rows: auto auto;
		gap: 0.25rem 0.75rem;
		cursor: pointer;
		padding: 0.75rem;
		border: 1px solid var(--border-light);
		background: var(--bg-primary);
		border-radius: var(--radius-md);
		transition: background 0.15s ease, border-color 0.15s ease;
	}

	.mode-option:hover {
		background: color-mix(in srgb, var(--bg-primary), var(--text-primary) 4%);
	}

	.mode-option:has(input:checked) {
		background: var(--control-selected);
		border-color: transparent;
	}

	.mode-option input {
		grid-row: span 2;
		margin: 0;
		margin-top: 0.25rem;
		accent-color: var(--accent);
	}

	.mode-label {
		font-weight: 500;
		color: var(--text-primary);
	}

	.mode-description {
		font-size: 0.8rem;
		color: var(--text-tertiary);
	}

	.import-actions {
		flex-wrap: wrap;
		display: flex;
		gap: 0.75rem;
		justify-content: flex-end;
	}

	.confirm-message {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.875rem 1rem;
		background: color-mix(in srgb, var(--color-warning) 12%, transparent);
		border-radius: var(--radius-md);
		color: var(--text-primary);
		font-size: 0.875rem;
		margin-bottom: 1rem;
	}

	.confirm-message :global(svg) {
		color: var(--color-warning);
		flex-shrink: 0;
	}

	.confirm-actions {
		flex-wrap: wrap;
		display: flex;
		gap: 0.75rem;
	}

</style>
