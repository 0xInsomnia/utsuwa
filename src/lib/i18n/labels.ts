import { m } from '$lib/paraglide/messages';
import { getLocale } from '$lib/paraglide/runtime';
import type { ThinkingPhase } from '$lib/services/chat/chat-phase';
import type { Emotion, RelationshipStage } from '$lib/types/character';

// Display names for engine data. The engine keeps its English originals, which
// also reach the model; only what the user reads is translated here.

type Label = { name: string; description: string };
type LabelFns = [name: () => string, description: () => string];

const MOODS: Record<Emotion, LabelFns> = {
	happy: [m.app_mood_happy, m.app_mood_happy_desc],
	sad: [m.app_mood_sad, m.app_mood_sad_desc],
	excited: [m.app_mood_excited, m.app_mood_excited_desc],
	anxious: [m.app_mood_anxious, m.app_mood_anxious_desc],
	content: [m.app_mood_content, m.app_mood_content_desc],
	frustrated: [m.app_mood_frustrated, m.app_mood_frustrated_desc],
	curious: [m.app_mood_curious, m.app_mood_curious_desc],
	affectionate: [m.app_mood_affectionate, m.app_mood_affectionate_desc],
	playful: [m.app_mood_playful, m.app_mood_playful_desc],
	melancholy: [m.app_mood_melancholy, m.app_mood_melancholy_desc],
	flustered: [m.app_mood_flustered, m.app_mood_flustered_desc],
	neutral: [m.app_mood_neutral, m.app_mood_neutral_desc]
};

const STAGES: Record<RelationshipStage, LabelFns> = {
	companion: [m.app_stage_companion, m.app_stage_companion_desc],
	stranger: [m.app_stage_stranger, m.app_stage_stranger_desc],
	acquaintance: [m.app_stage_acquaintance, m.app_stage_acquaintance_desc],
	friend: [m.app_stage_friend, m.app_stage_friend_desc],
	close_friend: [m.app_stage_close_friend, m.app_stage_close_friend_desc],
	romantic_interest: [m.app_stage_romantic_interest, m.app_stage_romantic_interest_desc],
	dating: [m.app_stage_dating, m.app_stage_dating_desc],
	committed: [m.app_stage_committed, m.app_stage_committed_desc],
	soulmate: [m.app_stage_soulmate, m.app_stage_soulmate_desc]
};

const BACKGROUNDS: Record<string, () => string> = {
	default: m.app_bg_default,
	transparent: m.app_bg_transparent,
	white: m.app_bg_white,
	black: m.app_bg_black,
	mist: m.app_bg_mist,
	blossom: m.app_bg_blossom,
	lagoon: m.app_bg_lagoon,
	sakura: m.app_bg_sakura,
	peach: m.app_bg_peach,
	lavender: m.app_bg_lavender,
	dots: m.app_bg_dots,
	hearts: m.app_bg_hearts,
	sparkles: m.app_bg_sparkles,
	stripes: m.app_bg_stripes,
	gingham: m.app_bg_gingham
};

function toLabel([name, description]: LabelFns): Label {
	return { name: name(), description: description() };
}

/** Mood name and blurb; unknown moods read as neutral, like characterStore.moodInfo. */
export function moodLabel(emotion: Emotion | undefined): Label {
	return toLabel(MOODS[emotion as Emotion] ?? MOODS.neutral);
}

/** Relationship stage name and blurb; unknown stages read as stranger, like characterStore.stageInfo. */
export function stageLabel(stage: RelationshipStage | undefined): Label {
	return toLabel(STAGES[stage as RelationshipStage] ?? STAGES.stranger);
}

/** Scene background name; presets added later keep their English label. */
export function backgroundLabel(preset: { id: string; label: string }): string {
	return BACKGROUNDS[preset.id]?.() ?? preset.label;
}

/** On-screen text for a thinking phase, in the app language. */
export function phaseText(phase: ThinkingPhase): string {
	switch (phase) {
		case 'remembering':
			return m.app_phase_remembering();
		case 'seeing':
			return m.app_phase_seeing();
		case 'thinking':
			return m.app_phase_thinking();
	}
}

/** BCP 47 tag for formatting dates in the app language. */
export function dateLocaleTag(): string {
	return getLocale() === 'it' ? 'it-IT' : 'en-US';
}
