<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import CompanionStateSummary from '$lib/components/ui/CompanionStateSummary.svelte';
	import SettingsSection from '$lib/components/settings/SettingsSection.svelte';
	import { Icon } from '$lib/components/ui';
	import type { PersonaPageState } from './persona-page.svelte';
	let { page }: { page: PersonaPageState } = $props();
</script>

<div class="state-panel">
	<SettingsSection title={m.app_stats_companion_state()} description={m.app_persona_state_desc()}>
		{#if page.isCharacterLoading}<p class="loading" role="status">{m.app_persona_loading()}</p>{/if}
		<CompanionStateSummary />
	</SettingsSection>
	{#if page.isDatingSimMode}
		<SettingsSection title={m.app_persona_achievements()} description={m.app_persona_achievements_desc()}>
			{#if page.achievements.length}
				<ul>{#each page.achievements as achievement}<li>
					<Icon name={page.achievementConfig[achievement.type].icon} size={16} />
					<div><strong>{achievement.name}</strong><span>{page.achievementConfig[achievement.type].label}</span></div>
					<time>{page.formatAchievementDate(achievement.completedAt)}</time>
				</li>{/each}</ul>
			{:else}<p class="empty">{m.app_persona_achievements_empty()}</p>{/if}
		</SettingsSection>
	{/if}
</div>
<style>
	.state-panel { display: flex; flex-direction: column; gap: 24px; }
	ul { margin: 0; padding: 0; list-style: none; }
	li { display: flex; align-items: center; gap: 12px; padding: 12px 0; color: var(--text-secondary); }
	li + li { border-top: 1px solid var(--border-light); }
	li div { flex: 1; min-width: 0; }
	strong { display: block; color: var(--text-primary); font-size: 14px; font-weight: 500; }
	span, time, .empty, .loading { font-size: 13px; color: var(--text-secondary); line-height: 1.5; }
	time { white-space: nowrap; }
	@media (max-width: 480px) { li { flex-wrap: wrap; } time { width: 100%; padding-left: 28px; } }
</style>
