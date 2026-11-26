<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import { rangeProgress } from '$lib/utils/range-progress';
	import Select from '$lib/components/ui/Select.svelte';
	import { liveQuery } from 'dexie';
	import { db } from '$lib/db';
	import { memoryApi } from '$lib/engine/memory';
	import { getWorkingMemory } from '$lib/engine/memory-session';
	import { deleteFact } from '$lib/services/storage/memory';
	import { characterStore } from '$lib/stores/character.svelte';
	import { stageLabel } from '$lib/i18n/labels';
	import type { Fact, FactCategory, SessionSummary, ConversationTurn } from '$lib/types/memory';
	import { Button } from '$lib/components/ui';
	import SettingsSection from '$lib/components/settings/SettingsSection.svelte';
	import MemoryFactSummary from './MemoryFactSummary.svelte';
	import ParserTest from '$lib/components/memory/ParserTest.svelte';

	let {
		view,
		factId,
		onShowAll,
		content = $bindable(''),
		newCategory = $bindable<FactCategory>('user'),
		importance = $bindable(50),
		busy = $bindable(false)
	}: {
		view: 'facts' | 'session' | 'sessions' | 'state' | 'test';
		factId?: number;
		onShowAll?: () => void;
		content?: string;
		newCategory?: FactCategory;
		importance?: number;
		busy?: boolean;
	} = $props();
	const tab = $derived(view);
	const categories: { value: FactCategory; label: string }[] = [
		{ value: 'user', label: m.app_mem_cat_user() },
		{ value: 'relationship', label: m.app_stats_relationship() },
		{ value: 'shared_experience', label: m.app_mem_cat_shared() }
	];
	const PAGE_SIZE = 25;
	let query = $state('');
	let category = $state('all');
	let pageIndex = $state(0);
	let facts = $state<Fact[]>([]);
	let sessions = $state<SessionSummary[]>([]);
	let turns = $state<ConversationTurn[]>([]);
	let total = $state(0);
	let loading = $state(true);
	let loadError = $state('');
	let retry = $state(0);
	let confirmId = $state<number>();
	let notice = $state('');
	let actionError = $state('');
	const charState = $derived(characterStore.state);

	$effect(() => {
		void tab;
		void factId;
		void query;
		void category;
		pageIndex = 0;
		confirmId = undefined;
	});
	$effect(() => {
		const selectedId = factId;
		const selected = tab,
			search = query.trim().toLocaleLowerCase(),
			filter = category,
			offset = pageIndex * PAGE_SIZE;
		void retry;
		if (selected === 'state' || selected === 'test') return;
		loading = true;
		loadError = '';
		const subscription = liveQuery(async () => {
			if (selected === 'facts') {
				const collection = db.facts
					.orderBy('createdAt')
					.reverse()
					.filter(
						(fact) =>
							(selectedId === undefined || fact.id === selectedId) &&
							(filter === 'all' || fact.category === filter) &&
							fact.content.toLocaleLowerCase().includes(search)
					);
				return {
					facts: await collection.clone().offset(offset).limit(PAGE_SIZE).toArray(),
					total: await collection.count()
				};
			}
			if (selected === 'sessions') {
				return {
					sessions: await db.sessions
						.orderBy('startedAt')
						.reverse()
						.offset(offset)
						.limit(PAGE_SIZE)
						.toArray(),
					total: await db.sessions.count()
				};
			}
			const activeId =
				getWorkingMemory().currentSessionId ??
				(await db.sessions.orderBy('startedAt').reverse().first())?.id;
			if (activeId === undefined) return { turns: [], total: 0 };
			const collection = db.conversationTurns.where('sessionId').equals(activeId);
			return {
				turns: await collection.clone().offset(offset).limit(PAGE_SIZE).toArray(),
				total: await collection.count()
			};
		}).subscribe({
			next: (data) => {
				facts = 'facts' in data ? (data.facts ?? []) : [];
				sessions = 'sessions' in data ? (data.sessions ?? []) : [];
				turns = 'turns' in data ? (data.turns ?? []) : [];
				total = data.total;
				loading = false;
				if (offset >= total && pageIndex > 0)
					pageIndex = Math.max(0, Math.ceil(total / PAGE_SIZE) - 1);
			},
			error: () => {
				loadError = m.app_mem_load_error();
				loading = false;
			}
		});
		return () => subscription.unsubscribe();
	});

	async function addMemory(event: SubmitEvent) {
		event.preventDefault();
		const text = content.trim();
		if (!text || busy || text.length > 2000) return;
		busy = true;
		notice = '';
		actionError = '';
		try {
			await memoryApi.createFact({
				content: text,
				category: newCategory,
				importance,
				confidence: 1,
				source: 'manual'
			});
			content = '';
			pageIndex = 0;
			query = '';
			category = 'all';
			notice = m.app_mem_saved_notice();
			if (factId !== undefined) onShowAll?.();
		} catch {
			actionError = m.app_mem_save_error();
		} finally {
			busy = false;
		}
	}
	async function removeMemory(id: number) {
		if (busy) return;
		busy = true;
		notice = '';
		actionError = '';
		try {
			await deleteFact(id);
			confirmId = undefined;
			notice = m.app_mem_deleted_notice();
		} catch {
			actionError = m.app_mem_delete_error();
		} finally {
			busy = false;
		}
	}
	function date(value: Date | undefined) {
		return value ? new Date(value).toLocaleString() : m.app_mem_not_recorded();
	}
</script>

<div class="memory-inspector">
	{#if factId !== undefined && view === 'facts'}<div class="selection-notice">
			<span>{m.app_mem_from_graph()}</span><Button variant="secondary" size="sm" onclick={onShowAll}
				>{m.app_mem_show_all()}</Button
			>
		</div>{/if}
	{#if view === 'facts'}
		<SettingsSection
			title={m.app_mem_facts_title()}
			description={m.app_mem_facts_desc()}
		>
			<div class="filters">
				<label
					>{m.app_mem_search()}<input
						class="settings-field"
						type="search"
						bind:value={query}
						placeholder={m.app_mem_search_placeholder()}
					/></label
				>
				<label
					>{m.app_mem_category()}<Select label={m.app_mem_category()} bind:value={category} options={[{ value: 'all', label: m.app_mem_all_categories() }, ...categories]} /></label
				>
			</div>
			{#if !loading && !loadError && facts.length === 0}<p class="empty">
					{query || category !== 'all'
						? m.app_mem_no_match()
						: factId !== undefined
							? m.app_mem_gone()
							: m.app_mem_none()}
				</p>{/if}
			<ul class="records">
				{#each facts as fact (fact.id)}
					<li>
						<MemoryFactSummary {fact} />
						<div class="record-footer">
							<time>{date(fact.createdAt)}</time>
							{#if confirmId === fact.id}
								<div class="confirm" role="group" aria-label={m.app_mem_confirm_delete()}>
									<span>{m.app_mem_delete_question()}</span><Button
										size="sm"
										variant="secondary"
										disabled={busy}
										onclick={() => (confirmId = undefined)}>{m.app_common_cancel()}</Button
									><Button
										size="sm"
										variant="danger"
										disabled={busy}
										onclick={() => removeMemory(fact.id!)}>{m.app_mem_delete_memory()}</Button
									>
								</div>
							{:else}<Button
									size="sm"
									variant="ghost"
									disabled={busy}
									onclick={() => (confirmId = fact.id)}>{m.app_anim_delete()}</Button
								>{/if}
						</div>
					</li>
				{/each}
			</ul>
		</SettingsSection>
	{:else if view === 'session'}
		<SettingsSection
			title={m.app_mem_current_title()}
			description={m.app_mem_current_desc()}
		>
			{#if !loading && !turns.length}<p class="empty">
					{m.app_mem_no_turns()}
				</p>{/if}
			<ul class="records">
				{#each turns as turn (turn.id)}<li>
						<p class="metadata">
							{turn.role === 'user' ? m.app_mem_you() : characterStore.name} · {date(turn.createdAt)}
						</p>
						<p class="fact-content">{turn.content}</p>
					</li>{/each}
			</ul>
		</SettingsSection>
	{:else if view === 'sessions'}
		<SettingsSection
			title={m.app_mem_sessions_title()}
			description={m.app_mem_sessions_desc()}
		>
			{#if !loading && !sessions.length}<p class="empty">{m.app_mem_no_sessions()}</p>{/if}
			<ul class="records">
				{#each sessions as session (session.id)}<li>
						<h4>{date(session.startedAt)}</h4>
						<p class="fact-content">{session.summary || m.app_mem_no_summary()}</p>
						<p class="metadata">
							{m.app_mem_messages({ count: session.messageCount })} · {session.endedAt
								? m.app_mem_last_turn({ date: date(session.endedAt) })
								: m.app_mem_no_turns_recorded()}
						</p>
						{#if session.keyTopics.length}<p class="metadata">
								{m.app_mem_topics({ topics: session.keyTopics.join(', ') })}
							</p>{/if}{#if session.emotionalArc}<p>{session.emotionalArc}</p>{/if}
					</li>{/each}
			</ul>
		</SettingsSection>
	{:else if view === 'state'}
		<SettingsSection
			title={m.app_mem_state_title()}
			description={m.app_mem_state_desc()}
		>
			<dl>
				<dt>{m.app_onboarding_name_label()}</dt>
				<dd>{charState.name}</dd>
				<dt>{m.app_mem_mode()}</dt>
				<dd>{charState.appMode === 'companion' ? m.app_onboarding_mode_companion() : m.app_onboarding_mode_dating()}</dd>
				<dt>{m.app_mem_mood()}</dt>
				<dd>{charState.mood.primary} · {charState.mood.intensity}%</dd>
				<dt>{m.app_mem_stage()}</dt>
				<dd>{stageLabel(charState.relationshipStage).name}</dd>
				<dt>{m.app_stats_energy()}</dt>
				<dd>{charState.energy}</dd>
				<dt>{m.app_mem_conversations()}</dt>
				<dd>{charState.totalInteractions}</dd>
				{#if charState.appMode !== 'companion'}<dt>{m.app_stats_affection()}</dt>
					<dd>{charState.affection}</dd>
					<dt>{m.app_stats_trust()}</dt>
					<dd>{charState.trust}</dd>
					<dt>{m.app_stats_intimacy()}</dt>
					<dd>{charState.intimacy}</dd>
					<dt>{m.app_stats_comfort()}</dt>
					<dd>{charState.comfort}</dd>
					<dt>{m.app_stats_respect()}</dt>
					<dd>{charState.respect}</dd>{/if}
			</dl>
		</SettingsSection>
	{:else}<SettingsSection
			title={m.app_mem_parser_title()}
			description={m.app_mem_parser_desc()}
			><ParserTest /></SettingsSection
		>{/if}
	{#if !['state', 'test'].includes(tab)}
		{#if loadError}<div role="alert" class="error">
				{loadError}
				<Button size="sm" variant="secondary" onclick={() => retry++}>{m.app_mem_retry()}</Button>
			</div>
		{:else if loading}<p role="status">{m.app_mem_loading()}</p>
		{:else}<nav class="pagination" aria-label={m.app_mem_pages()}>
				<span
					>{(tab === 'facts' ? m.app_mem_page_facts : tab === 'sessions' ? m.app_mem_page_sessions : m.app_mem_page_turns)({ total, page: pageIndex + 1, pages: Math.max(1, Math.ceil(total / PAGE_SIZE)) })}</span
				><Button
					variant="secondary"
					size="sm"
					disabled={pageIndex === 0}
					onclick={() => pageIndex--}>{m.app_mem_previous()}</Button
				><Button
					variant="secondary"
					size="sm"
					disabled={(pageIndex + 1) * PAGE_SIZE >= total}
					onclick={() => pageIndex++}>{m.app_common_next()}</Button
				>
			</nav>{/if}
	{/if}
	{#if notice}<p class="notice" role="status">{notice}</p>{/if}
	{#if actionError}<p class="error" role="alert">{actionError}</p>{/if}
	{#if tab === 'facts'}
		<SettingsSection
			title={m.app_mem_add_title()}
			description={m.app_mem_add_desc()}
		>
			<form onsubmit={addMemory}>
				<label
					>{m.app_mem_memory()}<textarea
						class="settings-field"
						bind:value={content}
						required
						maxlength={2000}
						rows={3}
						placeholder={m.app_mem_add_placeholder()}
						disabled={busy}></textarea></label
				>
				<div class="filters">
					<label
						>{m.app_mem_add_category()}<Select label={m.app_mem_add_category()} bind:value={newCategory} disabled={busy} options={categories} /></label
					><label
						>{m.app_mem_importance_label()} <span>{importance}</span><input
							class="settings-range"
							type="range" use:rangeProgress={importance}
							min={0}
							max={100}
							step={5}
							bind:value={importance}
							disabled={busy}
						/></label
					>
				</div>
				<Button type="submit" disabled={busy || !content.trim()}
					>{busy ? m.app_mem_saving() : m.app_mem_add()}</Button
				>
			</form>
		</SettingsSection>
	{/if}
</div>

<style>
	.memory-inspector {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding-bottom: 1rem;
	}
	.memory-inspector > :global(*) {
		flex-shrink: 0;
	}
	.selection-notice {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		align-items: center;
		justify-content: space-between;
		font-size: 0.875rem;
		color: var(--text-secondary);
	}
	.filters {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
	}
	.filters > label {
		flex: 1 1 200px;
		min-width: 0;
	}
	label {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-bottom: 1rem;
		color: var(--text-secondary);
		font-size: 0.875rem;
		font-weight: 500;
	}
	input[type='range'] {
		width: 100%;
		accent-color: var(--accent);
		min-height: 32px;
	}
	.records {
		list-style: none;
		margin: 0;
		padding: 0;
	}
	.records li {
		padding: 1rem 0;
		border-bottom: 1px solid var(--border-subtle);
	}
	.records li:last-child {
		border-bottom: 0;
		padding-bottom: 0;
	}
	.records h4 {
		font-size: 0.875rem;
		margin: 0;
	}
	.fact-content {
		margin: 0 0 0.5rem;
		white-space: pre-wrap;
		overflow-wrap: anywhere;
	}
	.metadata,
	time {
		color: var(--text-secondary);
		font-size: 0.75rem;
	}
	.metadata {
		margin: 0.5rem 0;
	}
	.record-footer,
	.confirm,
	.pagination {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem;
	}
	.record-footer {
		justify-content: space-between;
	}
	.confirm {
		font-size: 0.8125rem;
	}
	.pagination {
		font-size: 0.8125rem;
	}
	.pagination > span {
		flex: 1 1 180px;
	}
	.empty {
		color: var(--text-secondary);
		font-size: 0.875rem;
		padding: 1rem 0;
	}
	.notice {
		color: var(--text-primary);
	}
	.error {
		color: var(--color-error);
	}
	dl {
		display: grid;
		grid-template-columns: minmax(100px, 1fr) 2fr;
		gap: 0.75rem;
		font-size: 0.875rem;
	}
	dt {
		color: var(--text-secondary);
	}
	dd {
		margin: 0;
		overflow-wrap: anywhere;
	}
</style>
