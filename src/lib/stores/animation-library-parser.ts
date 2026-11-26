// Pure half of the animation library: built-in defaults plus the parser for the
// metadata saved in localStorage. Blobs live in localforage, not here.

export interface AnimationEntry {
	id: string;
	name: string;
	url: string;
	description: string;
	llmEnabled: boolean;
	// Idle clips loop and are never offered to the model
	kind: 'emote' | 'idle' | 'custom';
	createdAt?: number;
	durationSec?: number;
}

export type BuiltinOverride = { description?: string; llmEnabled?: boolean };
export type StoredCustomAnimation = Omit<AnimationEntry, 'url' | 'kind'>;

// Ids are checked against the library at read time, so a deleted clip just
// drops out of the pool
export interface BaseBehavior {
	idlePool: string[];
	thinkingId: string | null;
}

export interface StoredAnimationMetadata {
	overrides: Record<string, BuiltinOverride>;
	custom: StoredCustomAnimation[];
	base: BaseBehavior;
}

// Same rule the response parser applies to "action", so every stored id is one
// the model can actually address
export const ANIMATION_ID_PATTERN = /^[a-z0-9_-]{1,64}$/i;
export const MAX_NAME_LENGTH = 60;
export const MAX_DESCRIPTION_LENGTH = 300;

// Names and descriptions by dezihh (dezihh/utsuwa#5)
export const BUILTIN_ANIMATIONS: readonly AnimationEntry[] = [
	['vrma_01', 'Show Full Body', 'Step back and present the full avatar body'],
	['vrma_02', 'Greeting', 'Greet with a polite bowing motion'],
	['vrma_03', 'Peace Sign', 'Make a peace sign with the fingers'],
	['vrma_04', 'Shoot', 'Point finger forward like shooting'],
	['vrma_05', 'Spin', 'Spin around once'],
	['vrma_06', 'Model Pose', 'Strike a confident model pose'],
	['vrma_07', 'Squat', 'Squat down briefly']
].map(([id, name, description]) => ({
	id,
	name,
	description,
	url: `/animations/${id.toUpperCase()}.vrma`,
	llmEnabled: true,
	kind: 'emote' as const
}));

export const BUILTIN_IDLES: readonly AnimationEntry[] = ['idle', 'idle_2', 'idle_3', 'idle_4', 'idle_5'].map(
	(file, i) => ({
		id: `idle_${i + 1}`,
		name: `Idle ${i + 1}`,
		description: 'Built-in idle loop',
		url: `/animations/${file}.vrma`,
		llmEnabled: false,
		kind: 'idle' as const
	})
);


// Curated, pre-retargeted VRM Animation 1.0 clips. Provenance: static/animations/neliel/CREDITS.md.
export const NELIEL_ANIMATIONS: readonly AnimationEntry[] = [
  {
    "id": "neliel_o_idle_2",
    "name": "Riposo naturale 1",
    "description": "Posizione di riposo con piccoli movimenti.",
    "kind": "idle",
    "llmEnabled": false,
    "url": "/animations/neliel/neliel_o_idle_2.vrma"
  },
  {
    "id": "neliel_o_idle_3",
    "name": "Riposo naturale 2",
    "description": "Variante di riposo in piedi.",
    "kind": "idle",
    "llmEnabled": false,
    "url": "/animations/neliel/neliel_o_idle_3.vrma"
  },
  {
    "id": "neliel_o_idle_4",
    "name": "Riposo naturale 3",
    "description": "Variante di riposo rilassata.",
    "kind": "idle",
    "llmEnabled": false,
    "url": "/animations/neliel/neliel_o_idle_4.vrma"
  },
  {
    "id": "neliel_o_happy",
    "name": "Gioia",
    "description": "Esprimi gioia con un gesto del corpo.",
    "kind": "emote",
    "llmEnabled": true,
    "url": "/animations/neliel/neliel_o_happy.vrma"
  },
  {
    "id": "neliel_o_happy_2",
    "name": "Gioia vivace",
    "description": "Reazione felice ed energica.",
    "kind": "emote",
    "llmEnabled": true,
    "url": "/animations/neliel/neliel_o_happy_2.vrma"
  },
  {
    "id": "neliel_o_happy_3",
    "name": "Entusiasmo",
    "description": "Mostra entusiasmo per una buona notizia.",
    "kind": "emote",
    "llmEnabled": true,
    "url": "/animations/neliel/neliel_o_happy_3.vrma"
  },
  {
    "id": "neliel_o_sad",
    "name": "Dispiacere",
    "description": "Mostra tristezza o dispiacere con delicatezza.",
    "kind": "emote",
    "llmEnabled": true,
    "url": "/animations/neliel/neliel_o_sad.vrma"
  },
  {
    "id": "neliel_o_angry",
    "name": "Irritazione",
    "description": "Gesto di irritazione quando il contesto lo giustifica.",
    "kind": "emote",
    "llmEnabled": true,
    "url": "/animations/neliel/neliel_o_angry.vrma"
  },
  {
    "id": "neliel_o_relaxed",
    "name": "Rilassata",
    "description": "Gesto rilassato durante una conversazione informale.",
    "kind": "emote",
    "llmEnabled": true,
    "url": "/animations/neliel/neliel_o_relaxed.vrma"
  },
  {
    "id": "neliel_o_relaxed_2",
    "name": "Rilassata 2",
    "description": "Una seconda variante rilassata.",
    "kind": "emote",
    "llmEnabled": true,
    "url": "/animations/neliel/neliel_o_relaxed_2.vrma"
  },
  {
    "id": "neliel_o_nod",
    "name": "Annuire",
    "description": "Annuisci per confermare o mostrare ascolto.",
    "kind": "emote",
    "llmEnabled": true,
    "url": "/animations/neliel/neliel_o_nod.vrma"
  },
  {
    "id": "neliel_o_nod_2",
    "name": "Annuire 2",
    "description": "Seconda variante di assenso.",
    "kind": "emote",
    "llmEnabled": true,
    "url": "/animations/neliel/neliel_o_nod_2.vrma"
  },
  {
    "id": "neliel_o_shake",
    "name": "Scuotere la testa",
    "description": "Scuoti la testa per esprimere disaccordo.",
    "kind": "emote",
    "llmEnabled": true,
    "url": "/animations/neliel/neliel_o_shake.vrma"
  },
  {
    "id": "neliel_o_think",
    "name": "Pensierosa",
    "description": "Gesto di riflessione quando stai valutando qualcosa.",
    "kind": "emote",
    "llmEnabled": true,
    "url": "/animations/neliel/neliel_o_think.vrma"
  },
  {
    "id": "neliel_o_raise_hand",
    "name": "Alzare la mano",
    "description": "Alza una mano per attirare l'attenzione.",
    "kind": "emote",
    "llmEnabled": true,
    "url": "/animations/neliel/neliel_o_raise_hand.vrma"
  },
  {
    "id": "neliel_o_neutral",
    "name": "Gesto conversazione",
    "description": "Gesto neutro durante una conversazione.",
    "kind": "emote",
    "llmEnabled": true,
    "url": "/animations/neliel/neliel_o_neutral.vrma"
  },
  {
    "id": "neliel_o_world_walk",
    "name": "Camminata",
    "description": "Ciclo di camminata; anteprima sul posto, non navigazione.",
    "kind": "emote",
    "llmEnabled": false,
    "url": "/animations/neliel/neliel_o_world_walk.vrma"
  },
  {
    "id": "neliel_o_world_walk_slow",
    "name": "Camminata lenta",
    "description": "Ciclo di camminata lenta; anteprima manuale.",
    "kind": "emote",
    "llmEnabled": false,
    "url": "/animations/neliel/neliel_o_world_walk_slow.vrma"
  },
  {
    "id": "neliel_o_world_jog",
    "name": "Corsetta",
    "description": "Ciclo di corsetta; anteprima manuale.",
    "kind": "emote",
    "llmEnabled": false,
    "url": "/animations/neliel/neliel_o_world_jog.vrma"
  },
  {
    "id": "neliel_q_dance",
    "name": "Ballo",
    "description": "Breve ciclo di ballo giocoso, quando richiesto.",
    "kind": "emote",
    "llmEnabled": true,
    "url": "/animations/neliel/neliel_q_dance.vrma"
  }
];

const BUILTIN_IDS = new Set([...BUILTIN_ANIMATIONS, ...BUILTIN_IDLES, ...NELIEL_ANIMATIONS].map((a) => a.id));

const isRecord = (v: unknown): v is Record<string, unknown> =>
	typeof v === 'object' && v !== null && !Array.isArray(v);

const finite = (v: unknown): number | undefined =>
	typeof v === 'number' && Number.isFinite(v) ? v : undefined;

function parseOverride(raw: unknown): BuiltinOverride | null {
	if (!isRecord(raw)) return null;
	const out: BuiltinOverride = {};
	if (typeof raw.description === 'string') out.description = raw.description.slice(0, MAX_DESCRIPTION_LENGTH);
	if (typeof raw.llmEnabled === 'boolean') out.llmEnabled = raw.llmEnabled;
	return out;
}

function parseCustom(raw: unknown): StoredCustomAnimation | null {
	if (!isRecord(raw)) return null;
	const { id, name } = raw;
	if (typeof id !== 'string' || !ANIMATION_ID_PATTERN.test(id) || BUILTIN_IDS.has(id)) return null;
	if (typeof name !== 'string' || !name.trim()) return null;
	const entry: StoredCustomAnimation = {
		id,
		name: name.slice(0, MAX_NAME_LENGTH),
		description: typeof raw.description === 'string' ? raw.description.slice(0, MAX_DESCRIPTION_LENGTH) : '',
		llmEnabled: raw.llmEnabled === true
	};
	const createdAt = finite(raw.createdAt);
	const durationSec = finite(raw.durationSec);
	if (createdAt !== undefined) entry.createdAt = createdAt;
	if (durationSec !== undefined) entry.durationSec = durationSec;
	return entry;
}

function parseBase(raw: unknown): BaseBehavior {
	if (!isRecord(raw)) return { idlePool: [], thinkingId: null };
	const pool = Array.isArray(raw.idlePool) ? raw.idlePool.filter((id): id is string => typeof id === 'string') : [];
	return {
		idlePool: [...new Set(pool)],
		thinkingId: typeof raw.thinkingId === 'string' ? raw.thinkingId : null
	};
}

export function parseAnimationMetadata(raw: string | null): StoredAnimationMetadata {
	const empty: StoredAnimationMetadata = { overrides: {}, custom: [], base: parseBase(null) };
	if (!raw) return empty;
	let data: unknown;
	try {
		data = JSON.parse(raw);
	} catch {
		console.warn('Ignoring unreadable animation library settings');
		return empty;
	}
	if (!isRecord(data)) return empty;

	const overrides: Record<string, BuiltinOverride> = {};
	if (isRecord(data.overrides)) {
		for (const [id, value] of Object.entries(data.overrides)) {
			const parsed = BUILTIN_IDS.has(id) ? parseOverride(value) : null;
			if (parsed) overrides[id] = parsed;
		}
	}

	const custom: StoredCustomAnimation[] = [];
	if (Array.isArray(data.custom)) {
		for (const value of data.custom) {
			const parsed = parseCustom(value);
			if (parsed && !custom.some((c) => c.id === parsed.id)) custom.push(parsed);
		}
	}
	return { overrides, custom, base: parseBase(data.base) };
}

export function applyBuiltinOverrides(overrides: Record<string, BuiltinOverride>): AnimationEntry[] {
	return [...BUILTIN_ANIMATIONS, ...BUILTIN_IDLES, ...NELIEL_ANIMATIONS].map((a) => ({ ...a, ...overrides[a.id] }));
}

/** URLs the idle cycle picks from: the chosen clips that still exist, else the fallback. */
export function resolveIdlePool(
	base: BaseBehavior,
	candidates: readonly AnimationEntry[],
	fallbackUrls: readonly string[]
): string[] {
	const urls = base.idlePool.flatMap((id) => candidates.find((c) => c.id === id)?.url ?? []);
	return urls.length > 0 ? urls : [...fallbackUrls];
}

/** Motions as the prompts list them. An undescribed upload still gets its
 *  name, so the id means something. */
export function toPromptActions(entries: readonly AnimationEntry[]): { id: string; description: string }[] {
	return entries.map((a) => ({ id: a.id, description: a.description.trim() || a.name }));
}
