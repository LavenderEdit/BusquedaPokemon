import { calculatePokemonDefenses } from "./analysis.js";

const API_BASE = "https://pokeapi.co/api/v2";
const CACHE_PREFIX = "busqueda-pokemon.cache.";
const CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 7;
const REQUEST_TIMEOUT_MS = 12000;

export async function getPokemonGuide(identifier, versionGroup = "") {
  const pokemon = await fetchJson(`/pokemon/${encodeURIComponent(identifier)}`);
  const species = await fetchJson(`/pokemon-species/${pokemon.id}`);
  const [evolutionChain, forms, typeRelations, abilityDetails] = await Promise.all([
    species.evolution_chain?.url ? fetchJson(species.evolution_chain.url) : null,
    fetchResourceList(pokemon.forms?.map((form) => form.url) ?? []),
    fetchTypeRelations(pokemon.types),
    fetchResourceList(pokemon.abilities?.map(({ ability }) => ability.url) ?? [])
  ]);
  const selectedMoves = getRepresentativeMoves(pokemon.moves, versionGroup, 36);
  const moveDetails = await fetchResourceList(selectedMoves.map((move) => move.move.url));

  return {
    pokemon,
    species,
    evolutionChain,
    forms,
    typeRelations,
    abilityDetails,
    movesByVersion: groupMovesByVersion(pokemon.moves, versionGroup, moveDetails),
    defenses: calculatePokemonDefenses(pokemon.types),
    localizedNames: species.names ?? []
  };
}

export async function getVersionGroups() {
  const data = await fetchJson("/version-group?limit=200");
  return data.results ?? [];
}

export async function getPokemonIndex(limit = 1302) {
  const data = await fetchJson(`/pokemon?limit=${limit}`);
  return data.results ?? [];
}

export async function fetchJson(pathOrUrl) {
  const url = pathOrUrl.startsWith("http") ? pathOrUrl : `${API_BASE}${pathOrUrl}`;
  const cached = readCache(url);
  if (cached) {
    return cached;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const response = await fetch(url, { signal: controller.signal }).finally(() => {
    clearTimeout(timeout);
  });
  if (!response.ok) {
    throw new Error(`PokéAPI ${response.status}: ${url}`);
  }

  const data = await response.json();
  writeCache(url, data);
  return data;
}

export function groupMovesByVersion(moves = [], versionGroup = "", moveDetails = []) {
  const detailsByName = new Map(moveDetails.map((move) => [move.name, move]));
  const grouped = {
    "level-up": [],
    machine: [],
    tutor: [],
    egg: [],
    other: []
  };

  moves.forEach((moveEntry) => {
    const matchingDetails = moveEntry.version_group_details.filter((detail) => {
      return !versionGroup || detail.version_group.name === versionGroup;
    });

    matchingDetails.forEach((detail) => {
      const method = detail.move_learn_method.name;
      const key = grouped[method] ? method : "other";
      const fullMove = detailsByName.get(moveEntry.move.name);
      grouped[key].push({
        name: moveEntry.move.name,
        level: detail.level_learned_at,
        method,
        versionGroup: detail.version_group.name,
        type: fullMove?.type?.name ?? "",
        power: fullMove?.power ?? null,
        accuracy: fullMove?.accuracy ?? null,
        pp: fullMove?.pp ?? null,
        damageClass: fullMove?.damage_class?.name ?? ""
      });
    });
  });

  Object.values(grouped).forEach((list) => {
    list.sort((a, b) => {
      if (a.level !== b.level) {
        return a.level - b.level;
      }
      return a.name.localeCompare(b.name);
    });
  });

  return grouped;
}

export function flattenEvolutionChain(chain, stage = 1, trigger = "") {
  if (!chain?.species) {
    return [];
  }

  const current = {
    name: chain.species.name,
    url: chain.species.url,
    stage,
    trigger
  };

  return [
    current,
    ...(chain.evolves_to ?? []).flatMap((next) =>
      flattenEvolutionChain(next, stage + 1, describeEvolutionTrigger(next.evolution_details))
    )
  ];
}

export function describeEvolutionTrigger(details = []) {
  const detail = details[0];
  if (!detail) {
    return "";
  }

  if (detail.min_level) {
    return `Lv. ${detail.min_level}`;
  }
  if (detail.item?.name) {
    return detail.item.name;
  }
  if (detail.trigger?.name) {
    return detail.trigger.name;
  }

  return "";
}

function getRepresentativeMoves(moves = [], versionGroup = "", limit = 36) {
  const selected = moves.filter((move) =>
    move.version_group_details.some(
      (detail) => !versionGroup || detail.version_group.name === versionGroup
    )
  );

  return selected.slice(0, limit);
}

async function fetchTypeRelations(types = []) {
  const typeResources = await fetchResourceList(types.map(({ type }) => type.url));
  return typeResources.map((type) => ({
    name: type.name,
    damageRelations: type.damage_relations
  }));
}

async function fetchResourceList(urls = []) {
  return Promise.all(urls.filter(Boolean).map((url) => fetchJson(url)));
}

function readCache(url) {
  try {
    const raw = globalThis.localStorage?.getItem(`${CACHE_PREFIX}${url}`);
    if (!raw) {
      return null;
    }

    const cached = JSON.parse(raw);
    if (Date.now() - cached.timestamp > CACHE_TTL_MS) {
      globalThis.localStorage?.removeItem(`${CACHE_PREFIX}${url}`);
      return null;
    }

    return cached.data;
  } catch {
    return null;
  }
}

function writeCache(url, data) {
  try {
    globalThis.localStorage?.setItem(
      `${CACHE_PREFIX}${url}`,
      JSON.stringify({ timestamp: Date.now(), data })
    );
  } catch {
    // Cache is best-effort; private mode or quota limits should not break the app.
  }
}
