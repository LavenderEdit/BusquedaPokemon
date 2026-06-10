import test from "node:test";
import assert from "node:assert/strict";

import {
  calculatePokemonDefenses,
  analyzeTeam,
  getCoverageSummary
} from "../JS/analysis.js";
import {
  createEmptyTeam,
  exportTeamJson,
  importTeamJson,
  importTeamText,
  exportShowdownText
} from "../JS/team.js";
import { translate, getBestLocalizedText } from "../JS/i18n.js";
import { createPokemonTheme, getThemeById } from "../JS/themes.js";
import { flattenEvolutionChain, groupMovesByVersion } from "../JS/pokeapi.js";

test("calculatePokemonDefenses combines dual type weaknesses, resistances, and immunities", () => {
  const defenses = calculatePokemonDefenses(["electric", "flying"]);

  assert.equal(defenses.ground, 0);
  assert.equal(defenses.electric, 1);
  assert.equal(defenses.ice, 2);
  assert.equal(defenses.fighting, 0.5);
});

test("analyzeTeam detects repeated weaknesses and missing team slots", () => {
  const team = createEmptyTeam("Equipo prueba");
  team.slots[0] = {
    pokemonId: 6,
    pokemonName: "charizard",
    formName: "",
    types: ["fire", "flying"],
    ability: "blaze",
    moves: ["flamethrower", "air-slash"],
    role: "sweeper",
    notes: ""
  };
  team.slots[1] = {
    pokemonId: 12,
    pokemonName: "butterfree",
    formName: "",
    types: ["bug", "flying"],
    ability: "compound-eyes",
    moves: ["bug-buzz", "sleep-powder"],
    role: "support",
    notes: ""
  };

  const analysis = analyzeTeam(team.slots);

  assert.equal(analysis.filledSlots, 2);
  assert.equal(analysis.emptySlots, 4);
  assert.ok(analysis.criticalWeaknesses.some((entry) => entry.type === "rock"));
  assert.ok(analysis.recommendations.some((entry) => entry.includes("4")));
});

test("getCoverageSummary counts offensive move coverage by type", () => {
  const summary = getCoverageSummary([
    { moves: [{ type: "fire" }, { type: "flying" }, { type: "fire" }] },
    { moves: [{ type: "water" }] }
  ]);

  assert.equal(summary.fire, 2);
  assert.equal(summary.flying, 1);
  assert.equal(summary.water, 1);
  assert.equal(summary.dragon, 0);
});

test("team JSON export and import preserves six slots", () => {
  const team = createEmptyTeam("Ruta Kanto");
  team.slots[0].pokemonName = "pikachu";
  team.slots[0].pokemonId = 25;
  team.slots[0].types = ["electric"];

  const imported = importTeamJson(exportTeamJson(team));

  assert.equal(imported.name, "Ruta Kanto");
  assert.equal(imported.slots.length, 6);
  assert.equal(imported.slots[0].pokemonName, "pikachu");
});

test("exportShowdownText creates a readable team text block", () => {
  const team = createEmptyTeam("Equipo final");
  team.slots[0] = {
    pokemonId: 25,
    pokemonName: "pikachu",
    formName: "",
    types: ["electric"],
    ability: "static",
    moves: ["thunderbolt", "quick-attack"],
    role: "lead",
    notes: ""
  };

  const text = exportShowdownText(team);

  assert.match(text, /Pikachu @/);
  assert.match(text, /Ability: Static/);
  assert.match(text, /- Thunderbolt/);
});

test("importTeamText accepts a basic Showdown-style team block", () => {
  const team = importTeamText(`Pikachu @ Light Ball
Ability: Static
- Thunderbolt
- Quick Attack`);

  assert.equal(team.slots[0].pokemonName, "pikachu");
  assert.equal(team.slots[0].ability, "static");
  assert.deepEqual(team.slots[0].moves, ["thunderbolt", "quick-attack"]);
});

test("translate falls back to English and returns the key as a final fallback", () => {
  assert.equal(translate("search.placeholder", "es"), "Busca Pokémon, movimiento, habilidad...");
  assert.equal(translate("search.placeholder", "en"), "Search Pokémon, move, ability...");
  assert.equal(translate("missing.key", "es"), "missing.key");
});

test("getBestLocalizedText prefers requested language and normalizes Pokédex text", () => {
  const value = getBestLocalizedText(
    [
      { language: { name: "en" }, flavor_text: "Stores electricity\ninside its cheeks." },
      { language: { name: "es" }, flavor_text: "Acumula electricidad\f en sus mejillas." }
    ],
    "es",
    "flavor_text"
  );

  assert.equal(value, "Acumula electricidad en sus mejillas.");
});

test("themes include curated and generated Pokémon variants", () => {
  assert.equal(getThemeById("pikachu").id, "pikachu");

  const generated = createPokemonTheme({
    id: 150,
    name: "mewtwo",
    types: [{ type: { name: "psychic" } }]
  });

  assert.equal(generated.id, "pokemon-150");
  assert.equal(generated.accent, "#F95587");
});

test("flattenEvolutionChain keeps branching evolution families readable", () => {
  const flattened = flattenEvolutionChain({
    species: { name: "eevee" },
    evolves_to: [
      { species: { name: "vaporeon" }, evolution_details: [{ trigger: { name: "use-item" } }], evolves_to: [] },
      { species: { name: "jolteon" }, evolution_details: [{ trigger: { name: "use-item" } }], evolves_to: [] }
    ]
  });

  assert.deepEqual(
    flattened.map((entry) => entry.name),
    ["eevee", "vaporeon", "jolteon"]
  );
  assert.equal(flattened[1].stage, 2);
});

test("groupMovesByVersion filters move learn data by selected version group", () => {
  const grouped = groupMovesByVersion(
    [
      {
        move: { name: "thunderbolt" },
        version_group_details: [
          {
            level_learned_at: 26,
            move_learn_method: { name: "level-up" },
            version_group: { name: "red-blue" }
          },
          {
            level_learned_at: 0,
            move_learn_method: { name: "machine" },
            version_group: { name: "scarlet-violet" }
          }
        ]
      }
    ],
    "scarlet-violet"
  );

  assert.equal(grouped.machine[0].name, "thunderbolt");
  assert.equal(grouped["level-up"].length, 0);
});
