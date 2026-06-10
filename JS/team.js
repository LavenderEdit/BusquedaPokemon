import { formatText } from "./tipos.js";

const TEAM_STORAGE_KEY = "busqueda-pokemon.team.v2";

export function createEmptySlot() {
  return {
    pokemonId: null,
    pokemonName: "",
    formName: "",
    types: [],
    ability: "",
    moves: [],
    role: "",
    notes: ""
  };
}

export function createEmptyTeam(name = "Mi equipo competitivo") {
  const now = new Date().toISOString();

  return {
    id: cryptoSafeId(),
    name,
    language: "es",
    versionGroup: "",
    themeId: "pokedex",
    slots: Array.from({ length: 6 }, createEmptySlot),
    createdAt: now,
    updatedAt: now
  };
}

export function normalizeTeam(team = {}) {
  const base = createEmptyTeam(team.name || "Mi equipo competitivo");
  return {
    ...base,
    ...team,
    slots: Array.from({ length: 6 }, (_, index) => ({
      ...createEmptySlot(),
      ...(team.slots?.[index] ?? {})
    })),
    updatedAt: new Date().toISOString()
  };
}

export function exportTeamJson(team) {
  return JSON.stringify(normalizeTeam(team), null, 2);
}

export function importTeamJson(json) {
  const parsed = typeof json === "string" ? JSON.parse(json) : json;
  return normalizeTeam(parsed);
}

export function importTeamText(text) {
  const trimmed = String(text ?? "").trim();
  if (!trimmed) {
    return createEmptyTeam();
  }

  if (trimmed.startsWith("{")) {
    return importTeamJson(trimmed);
  }

  const team = createEmptyTeam("Equipo importado");
  const blocks = trimmed.split(/\n\s*\n/).slice(0, 6);

  blocks.forEach((block, index) => {
    const lines = block.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const header = lines[0] ?? "";
    const [namePart] = header.split("@");
    const abilityLine = lines.find((line) => line.toLowerCase().startsWith("ability:"));
    const moves = lines
      .filter((line) => line.startsWith("-"))
      .map((line) => slugify(line.replace(/^-+\s*/, "")));

    team.slots[index] = {
      ...createEmptySlot(),
      pokemonName: slugify(namePart),
      ability: abilityLine ? slugify(abilityLine.replace(/^ability:\s*/i, "")) : "",
      moves
    };
  });

  return normalizeTeam(team);
}

export function exportShowdownText(team) {
  return normalizeTeam(team)
    .slots.filter((slot) => slot.pokemonName)
    .map((slot) => {
      const name = formatText(slot.pokemonName);
      const ability = slot.ability ? formatText(slot.ability) : "No definida";
      const moves = (slot.moves ?? [])
        .filter(Boolean)
        .map((move) => `- ${formatText(typeof move === "string" ? move : move.name)}`)
        .join("\n");

      return `${name} @ Sin objeto\nAbility: ${ability}\n${moves || "- Sin movimientos"}`;
    })
    .join("\n\n");
}

export function saveTeam(team, storage = globalThis.localStorage) {
  storage?.setItem?.(TEAM_STORAGE_KEY, exportTeamJson(team));
}

export function loadTeam(storage = globalThis.localStorage) {
  const stored = storage?.getItem?.(TEAM_STORAGE_KEY);
  return stored ? importTeamJson(stored) : createEmptyTeam();
}

export function clearSavedTeam(storage = globalThis.localStorage) {
  storage?.removeItem?.(TEAM_STORAGE_KEY);
}

function cryptoSafeId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `team-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function slugify(value = "") {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
