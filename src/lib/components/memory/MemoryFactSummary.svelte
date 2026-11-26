<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import type { Fact } from '$lib/types/memory';
	let {
		fact
	}: {
		fact: Pick<Fact, 'content' | 'category' | 'importance'> & Partial<Pick<Fact, 'confidence'>>;
	} = $props();
	const labels = {
		user: m.app_mem_cat_user(),
		relationship: m.app_stats_relationship(),
		shared_experience: m.app_mem_cat_shared()
	};
</script>

<p class="fact-content">{fact.content}</p>
<p class="metadata">
	{labels[fact.category]} · {m.app_fact_importance({ value: fact.importance })}{#if fact.confidence !== undefined}
		· {m.app_fact_confidence({ value: Math.round(fact.confidence * 100) })}{/if}
</p>

<style>
	.fact-content {
		margin: 0 0 0.5rem;
		white-space: pre-wrap;
		overflow-wrap: anywhere;
	}
	.metadata {
		margin: 0.5rem 0;
		color: var(--text-secondary);
		font-size: 0.75rem;
	}
</style>
