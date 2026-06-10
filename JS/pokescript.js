import { analyzeTeam, calculatePokemonDefenses } from "./analysis.js";
import { createChiptunePlayer } from "./audio.js";
import {
  flattenEvolutionChain,
  getPokemonGuide,
  getPokemonIndex,
  getVersionGroups
} from "./pokeapi.js";
import {
  clearSavedTeam,
  createEmptySlot,
  exportShowdownText,
  exportTeamJson,
  importTeamJson,
  importTeamText,
  loadTeam,
  saveTeam
} from "./team.js";
import { formatText, obtenerColorTipo, traducirTipo } from "./tipos.js";
import {
  getBestLocalizedText,
  getNamedResourceName,
  translate
} from "./i18n.js";
import {
  applyTheme,
  createPokemonTheme,
  CURATED_THEMES,
  getThemeById
} from "./themes.js";

const SETTINGS_KEY = "busqueda-pokemon.settings.v2";
const DEFAULT_SETTINGS = {
  language: "es",
  versionGroup: "scarlet-violet",
  themeId: "pikachu",
  musicEnabled: false,
  volume: 0.25
};

const dom = {
  languageSelect: document.getElementById("languageSelect"),
  versionGroupSelect: document.getElementById("versionGroupSelect"),
  themeSelect: document.getElementById("themeSelect"),
  musicToggle: document.getElementById("musicToggle"),
  volumeRange: document.getElementById("volumeRange"),
  searchForm: document.getElementById("searchForm"),
  pokemonSearch: document.getElementById("pokemonSearch"),
  searchButton: document.getElementById("searchButton"),
  statusMessage: document.getElementById("statusMessage"),
  loader: document.getElementById("loader"),
  pokemonIndex: document.getElementById("pokemonIndex"),
  indexCount: document.getElementById("indexCount"),
  guideEmpty: document.getElementById("guideEmpty"),
  pokemonGuide: document.getElementById("pokemonGuide"),
  pokemonImage: document.getElementById("pokemonImage"),
  pokemonNumber: document.getElementById("pokemonNumber"),
  pokemonTypes: document.getElementById("pokemonTypes"),
  pokemonName: document.getElementById("pokemonName"),
  pokemonDescription: document.getElementById("pokemonDescription"),
  addCurrentToTeam: document.getElementById("addCurrentToTeam"),
  applyPokemonTheme: document.getElementById("applyPokemonTheme"),
  summaryList: document.getElementById("summaryList"),
  trainingList: document.getElementById("trainingList"),
  breedingList: document.getElementById("breedingList"),
  statsTable: document.getElementById("statsTable"),
  defenseGrid: document.getElementById("defenseGrid"),
  evolutionChain: document.getElementById("evolutionChain"),
  moveVersionLabel: document.getElementById("moveVersionLabel"),
  movesTables: document.getElementById("movesTables"),
  spriteGallery: document.getElementById("spriteGallery"),
  teamName: document.getElementById("teamName"),
  teamSlots: document.getElementById("teamSlots"),
  teamScore: document.getElementById("teamScore"),
  teamAnalysis: document.getElementById("teamAnalysis"),
  exportJson: document.getElementById("exportJson"),
  exportShowdown: document.getElementById("exportShowdown"),
  importTeam: document.getElementById("importTeam"),
  clearTeam: document.getElementById("clearTeam"),
  teamTextArea: document.getElementById("teamTextArea")
};

let settings = loadSettings();
let team = loadTeam();
let currentGuide = null;
let currentPokemonTheme = null;
let pokemonIndex = [];

const musicPlayer = createChiptunePlayer({
  onStateChange(isPlaying) {
    settings.musicEnabled = isPlaying;
    saveSettings();
    renderMusicState();
  }
});

init();

async function init() {
  syncControlsFromSettings();
  applySelectedTheme();
  applyTranslations();
  bindEvents();
  renderTeam();
  renderAnalysis();
  musicPlayer.setVolume(settings.volume);
  renderMusicState();

  populateVersionGroups();
  populatePokemonIndex();
  searchPokemon("pikachu");
}

function bindEvents() {
  dom.searchForm.addEventListener("submit", (event) => {
    event.preventDefault();
    searchPokemon(dom.pokemonSearch.value);
  });

  document.querySelectorAll("[data-preset]").forEach((button) => {
    button.addEventListener("click", () => searchPokemon(button.dataset.preset));
  });

  dom.languageSelect.addEventListener("change", () => {
    settings.language = dom.languageSelect.value;
    team.language = settings.language;
    saveSettings();
    saveTeam(team);
    applyTranslations();
    renderCurrentGuide();
    renderTeam();
    renderAnalysis();
  });

  dom.versionGroupSelect.addEventListener("change", () => {
    settings.versionGroup = dom.versionGroupSelect.value;
    team.versionGroup = settings.versionGroup;
    saveSettings();
    saveTeam(team);
    if (currentGuide) {
      searchPokemon(currentGuide.pokemon.name);
    }
  });

  dom.themeSelect.addEventListener("change", () => {
    settings.themeId = dom.themeSelect.value;
    saveSettings();
    applySelectedTheme();
  });

  dom.musicToggle.addEventListener("click", () => musicPlayer.toggle());
  dom.volumeRange.addEventListener("input", () => {
    settings.volume = Number(dom.volumeRange.value);
    musicPlayer.setVolume(settings.volume);
    saveSettings();
  });

  dom.addCurrentToTeam.addEventListener("click", addCurrentPokemonToTeam);
  dom.applyPokemonTheme.addEventListener("click", () => {
    if (currentPokemonTheme) {
      settings.themeId = "auto";
      dom.themeSelect.value = "auto";
      saveSettings();
      applyTheme(currentPokemonTheme);
    }
  });

  dom.teamName.addEventListener("input", () => {
    team.name = dom.teamName.value.trim() || "Mi equipo competitivo";
    team.updatedAt = new Date().toISOString();
    saveTeam(team);
  });

  dom.teamSlots.addEventListener("input", updateTeamSlotFromInput);
  dom.teamSlots.addEventListener("click", handleTeamSlotAction);
  dom.exportJson.addEventListener("click", () => {
    dom.teamTextArea.value = exportTeamJson(team);
  });
  dom.exportShowdown.addEventListener("click", () => {
    dom.teamTextArea.value = exportShowdownText(team);
  });
  dom.importTeam.addEventListener("click", importTeamFromTextarea);
  dom.clearTeam.addEventListener("click", () => {
    team.slots = Array.from({ length: 6 }, createEmptySlot);
    clearSavedTeam();
    saveTeam(team);
    renderTeam();
    renderAnalysis();
  });
}

async function populateVersionGroups() {
  try {
    const groups = await getVersionGroups();
    const options = groups
      .slice()
      .reverse()
      .map((group) => {
        const option = document.createElement("option");
        option.value = group.name;
        option.textContent = formatText(group.name);
        return option;
      });

    dom.versionGroupSelect.append(...options);
    if (!groups.some((group) => group.name === settings.versionGroup)) {
      settings.versionGroup = groups.at(-1)?.name ?? "";
    }
    dom.versionGroupSelect.value = settings.versionGroup;
  } catch (error) {
    console.warn(error);
  }
}

async function populatePokemonIndex() {
  try {
    pokemonIndex = await getPokemonIndex();
    renderPokemonIndex(pokemonIndex.slice(0, 40));
  } catch (error) {
    console.warn(error);
  }
}

function renderPokemonIndex(list) {
  dom.indexCount.textContent = String(pokemonIndex.length || list.length);
  dom.pokemonIndex.innerHTML = list
    .map(
      (entry, index) => `
        <button type="button" data-index-pokemon="${entry.name}">
          <span>#${String(index + 1).padStart(3, "0")}</span>
          ${formatText(entry.name)}
        </button>
      `
    )
    .join("");

  dom.pokemonIndex.querySelectorAll("[data-index-pokemon]").forEach((button) => {
    button.addEventListener("click", () => searchPokemon(button.dataset.indexPokemon));
  });
}

async function searchPokemon(value) {
  const identifier = String(value ?? "").trim().toLowerCase();
  if (!identifier) {
    showStatus(translate("search.empty", settings.language), "error");
    return;
  }

  setLoading(true);
  hideStatus();
  dom.pokemonSearch.value = identifier;

  try {
    currentGuide = await getPokemonGuide(identifier, settings.versionGroup);
    currentPokemonTheme = createPokemonTheme(currentGuide.pokemon);
    renderCurrentGuide();
    if (settings.themeId === "auto") {
      applyTheme(currentPokemonTheme);
    }
  } catch (error) {
    console.error(error);
    showStatus(translate("search.error", settings.language), "error");
  } finally {
    setLoading(false);
  }
}

function renderCurrentGuide() {
  if (!currentGuide) {
    return;
  }

  const { pokemon, species, movesByVersion, defenses } = currentGuide;
  const language = settings.language;
  const localizedName = getNamedResourceName(species.names, formatText(pokemon.name), language);
  const genus = getBestLocalizedText(species.genera, language, "genus");
  const description =
    getBestLocalizedText(species.flavor_text_entries, language, "flavor_text") ||
    translate("common.unavailable", language);
  const primaryImage =
    pokemon.sprites.other?.["official-artwork"]?.front_default ??
    pokemon.sprites.other?.home?.front_default ??
    pokemon.sprites.front_default ??
    "";

  dom.guideEmpty.hidden = true;
  dom.pokemonGuide.hidden = false;
  dom.pokemonImage.src = primaryImage;
  dom.pokemonImage.alt = `${localizedName} artwork`;
  dom.pokemonNumber.textContent = `#${String(pokemon.id).padStart(4, "0")}`;
  dom.pokemonName.textContent = localizedName;
  dom.pokemonDescription.textContent = description;
  dom.pokemonTypes.innerHTML = pokemon.types.map(({ type }) => typeBadge(type.name)).join("");

  renderDataList(dom.summaryList, [
    ["ID", `#${pokemon.id}`],
    [language === "en" ? "Category" : "Categoría", genus],
    [language === "en" ? "Height" : "Altura", `${(pokemon.height / 10).toFixed(1)} m`],
    [language === "en" ? "Weight" : "Peso", `${(pokemon.weight / 10).toFixed(1)} kg`],
    [language === "en" ? "Habitat" : "Hábitat", formatText(species.habitat?.name) || translate("common.unavailable", language)],
    [language === "en" ? "Generation" : "Generación", formatText(species.generation?.name)]
  ]);

  renderDataList(dom.trainingList, [
    [language === "en" ? "Base EXP" : "Experiencia base", pokemon.base_experience ?? translate("common.unavailable", language)],
    [language === "en" ? "Capture rate" : "Ratio de captura", species.capture_rate],
    [language === "en" ? "Base friendship" : "Amistad base", species.base_happiness],
    [language === "en" ? "Growth rate" : "Crecimiento", formatText(species.growth_rate?.name)],
    [language === "en" ? "Abilities" : "Habilidades", renderAbilityText(pokemon.abilities, language)]
  ]);

  renderDataList(dom.breedingList, [
    [language === "en" ? "Egg groups" : "Grupos huevo", species.egg_groups?.map((group) => formatText(group.name)).join(", ")],
    [language === "en" ? "Hatch counter" : "Ciclos de eclosión", species.hatch_counter],
    [language === "en" ? "Gender rate" : "Ratio de género", formatGenderRate(species.gender_rate, language)],
    [language === "en" ? "Baby Pokémon" : "Pokémon bebé", species.is_baby ? translate("common.yes", language) : translate("common.no", language)]
  ]);

  renderStats(pokemon.stats);
  renderDefenses(defenses);
  renderEvolution(currentGuide.evolutionChain?.chain);
  renderMoves(movesByVersion);
  renderSprites(pokemon);
}

function renderDataList(target, rows) {
  target.innerHTML = rows
    .map(
      ([label, value]) => `
        <dt>${label}</dt>
        <dd>${value || translate("common.unavailable", settings.language)}</dd>
      `
    )
    .join("");
}

function renderStats(stats) {
  const total = stats.reduce((sum, stat) => sum + stat.base_stat, 0);
  dom.statsTable.innerHTML = `
    <div class="stats-row stats-row--head">
      <span>Stat</span><span>Base</span><span>Min</span><span>Max</span><span></span>
    </div>
    ${stats.map((stat) => statRow(stat)).join("")}
    <div class="stats-row stats-row--total">
      <span>Total</span><span>${total}</span><span></span><span></span><span></span>
    </div>
  `;
}

function statRow(stat) {
  const base = stat.base_stat;
  const isHp = stat.stat.name === "hp";
  const min = isHp ? base * 2 + 110 : Math.floor((base * 2 + 5) * 0.9);
  const max = isHp ? base * 2 + 204 : Math.floor((base * 2 + 99) * 1.1);
  const percent = Math.min(100, Math.round((base / 180) * 100));

  return `
    <div class="stats-row">
      <span>${formatText(stat.stat.name)}</span>
      <span>${base}</span>
      <span>${min}</span>
      <span>${max}</span>
      <div class="stat-bar"><span style="width:${percent}%"></span></div>
    </div>
  `;
}

function renderDefenses(defenses) {
  dom.defenseGrid.innerHTML = Object.entries(defenses)
    .map(([type, multiplier]) => {
      const tone = multiplier === 0 ? "immune" : multiplier > 1 ? "weak" : multiplier < 1 ? "resist" : "neutral";
      return `
        <div class="defense-cell defense-cell--${tone}">
          ${typeBadge(type)}
          <strong>${formatMultiplier(multiplier)}</strong>
        </div>
      `;
    })
    .join("");
}

function renderEvolution(chain) {
  const entries = flattenEvolutionChain(chain);
  dom.evolutionChain.innerHTML =
    entries.length > 0
      ? entries
          .map(
            (entry) => `
              <button type="button" data-evolution="${entry.name}" class="evolution-node">
                <span>${formatText(entry.name)}</span>
                <small>${entry.trigger || `Stage ${entry.stage}`}</small>
              </button>
            `
          )
          .join("")
      : `<p>${translate("common.unavailable", settings.language)}</p>`;

  dom.evolutionChain.querySelectorAll("[data-evolution]").forEach((button) => {
    button.addEventListener("click", () => searchPokemon(button.dataset.evolution));
  });
}

function renderMoves(groupedMoves) {
  const language = settings.language;
  const versionLabel = settings.versionGroup ? formatText(settings.versionGroup) : "All";
  dom.moveVersionLabel.textContent = versionLabel;
  dom.movesTables.innerHTML = Object.entries(groupedMoves)
    .map(([method, moves]) => {
      const visibleMoves = moves.slice(0, 14);
      return `
        <details class="moves-group" ${method === "level-up" ? "open" : ""}>
          <summary>${formatText(method)} <span>${moves.length}</span></summary>
          <div class="moves-table">
            <div class="moves-row moves-row--head">
              <span>${language === "en" ? "Move" : "Movimiento"}</span>
              <span>Type</span>
              <span>Pow</span>
              <span>Acc</span>
              <span>PP</span>
              <span>Lv</span>
            </div>
            ${
              visibleMoves.length
                ? visibleMoves.map((move) => moveRow(move)).join("")
                : `<p class="empty-line">${translate("common.unavailable", language)}</p>`
            }
          </div>
        </details>
      `;
    })
    .join("");
}

function moveRow(move) {
  return `
    <div class="moves-row">
      <span>${formatText(move.name)}</span>
      <span>${move.type ? typeBadge(move.type) : "-"}</span>
      <span>${move.power ?? "-"}</span>
      <span>${move.accuracy ?? "-"}</span>
      <span>${move.pp ?? "-"}</span>
      <span>${move.level || "-"}</span>
    </div>
  `;
}

function renderSprites(pokemon) {
  const sprites = [
    ["Default", pokemon.sprites.front_default],
    ["Shiny", pokemon.sprites.front_shiny],
    ["Home", pokemon.sprites.other?.home?.front_default],
    ["Official", pokemon.sprites.other?.["official-artwork"]?.front_default]
  ].filter(([, src]) => src);

  dom.spriteGallery.innerHTML = sprites
    .map(
      ([label, src]) => `
        <figure>
          <img src="${src}" alt="${label} ${pokemon.name}">
          <figcaption>${label}</figcaption>
        </figure>
      `
    )
    .join("");
}

function addCurrentPokemonToTeam() {
  if (!currentGuide) {
    return;
  }

  const index = team.slots.findIndex((slot) => !slot.pokemonName);
  const targetIndex = index === -1 ? 0 : index;
  const pokemon = currentGuide.pokemon;
  const moves = Object.values(currentGuide.movesByVersion)
    .flat()
    .filter((move) => move.type)
    .slice(0, 4)
    .map((move) => ({ name: move.name, type: move.type }));

  team.slots[targetIndex] = {
    ...createEmptySlot(),
    pokemonId: pokemon.id,
    pokemonName: pokemon.name,
    formName: pokemon.forms?.[0]?.name ?? "",
    types: pokemon.types.map(({ type }) => type.name),
    ability: pokemon.abilities?.[0]?.ability?.name ?? "",
    moves,
    role: targetIndex === 0 ? "lead" : "",
    notes: ""
  };

  persistTeamAndRender();
}

function renderTeam() {
  dom.teamName.value = team.name;
  dom.teamSlots.innerHTML = team.slots
    .map((slot, index) => renderTeamSlot(slot, index))
    .join("");
}

function renderTeamSlot(slot, index) {
  const filled = Boolean(slot.pokemonName);
  const types = slot.types?.map((type) => typeBadge(type)).join("") || "";
  const moves = (slot.moves ?? [])
    .map((move) => (typeof move === "string" ? move : move.name))
    .join(", ");

  return `
    <article class="team-slot ${filled ? "is-filled" : ""}">
      <div class="team-slot__top">
        <span class="slot-number">${index + 1}</span>
        <strong>${filled ? formatText(slot.pokemonName) : translate("team.emptySlot", settings.language)}</strong>
        <button type="button" data-slot-action="remove" data-index="${index}" aria-label="Remove">×</button>
      </div>
      <div class="type-list">${types}</div>
      <label>
        Ability
        <input data-slot-field="ability" data-index="${index}" value="${slot.ability ?? ""}" placeholder="static" autocomplete="off">
      </label>
      <label>
        Moves
        <input data-slot-field="moves" data-index="${index}" value="${moves}" placeholder="thunderbolt, quick-attack" autocomplete="off">
      </label>
      <label>
        Role
        <select data-slot-field="role" data-index="${index}">
          ${["", "lead", "sweeper", "wall", "support", "pivot", "hazards"].map(
            (role) => `<option value="${role}" ${slot.role === role ? "selected" : ""}>${role ? formatText(role) : "-"}</option>`
          ).join("")}
        </select>
      </label>
      <label>
        Notes
        <textarea data-slot-field="notes" data-index="${index}" rows="2">${slot.notes ?? ""}</textarea>
      </label>
    </article>
  `;
}

function updateTeamSlotFromInput(event) {
  const field = event.target.dataset.slotField;
  const index = Number(event.target.dataset.index);
  if (!field || Number.isNaN(index)) {
    return;
  }

  if (field === "moves") {
    team.slots[index].moves = event.target.value
      .split(",")
      .map((move) => move.trim())
      .filter(Boolean);
  } else {
    team.slots[index][field] = event.target.value;
  }

  persistTeamAndRender(false);
}

function handleTeamSlotAction(event) {
  const button = event.target.closest("[data-slot-action]");
  if (!button) {
    return;
  }

  const index = Number(button.dataset.index);
  team.slots[index] = createEmptySlot();
  persistTeamAndRender();
}

function importTeamFromTextarea() {
  try {
    team = importTeamText(dom.teamTextArea.value);
    settings.language = team.language || settings.language;
    settings.versionGroup = team.versionGroup || settings.versionGroup;
    syncControlsFromSettings();
    persistTeamAndRender();
    hideStatus();
  } catch (error) {
    console.error(error);
    showStatus("JSON inválido para importar equipo.", "error");
  }
}

function persistTeamAndRender(renderSlots = true) {
  team.language = settings.language;
  team.versionGroup = settings.versionGroup;
  team.themeId = settings.themeId;
  team.updatedAt = new Date().toISOString();
  saveTeam(team);
  if (renderSlots) {
    renderTeam();
  }
  renderAnalysis();
}

function renderAnalysis() {
  const analysis = analyzeTeam(team.slots, settings.language);
  dom.teamScore.textContent = `${analysis.filledSlots}/6`;
  const critical = analysis.criticalWeaknesses.slice(0, 6);
  const coverage = Object.entries(analysis.coverage).filter(([, count]) => count > 0);

  dom.teamAnalysis.innerHTML = `
    <div class="analysis-strip">
      <span>${analysis.filledSlots} filled</span>
      <span>${analysis.emptySlots} open</span>
      <span>${critical.length} alerts</span>
    </div>
    <h3>Weakness alerts</h3>
    <div class="mini-grid">
      ${
        critical.length
          ? critical.map((entry) => `<span>${typeBadge(entry.type)} ×${entry.weaknesses}</span>`).join("")
          : `<span>${translate("common.none", settings.language)}</span>`
      }
    </div>
    <h3>Move coverage</h3>
    <div class="mini-grid">
      ${
        coverage.length
          ? coverage.slice(0, 10).map(([type, count]) => `<span>${typeBadge(type)} ${count}</span>`).join("")
          : `<span>${translate("common.none", settings.language)}</span>`
      }
    </div>
    <h3>Recommendations</h3>
    <ul>${analysis.recommendations.map((item) => `<li>${item}</li>`).join("")}</ul>
  `;
}

function typeBadge(type) {
  const color = obtenerColorTipo(type);
  return `<span class="type-pill" style="--type-color:${color}">${traducirTipo(type, settings.language)}</span>`;
}

function renderAbilityText(abilities, language) {
  return abilities
    .map(({ ability, is_hidden }) => {
      const suffix = is_hidden ? ` (${translate("common.hidden", language)})` : "";
      return `${formatText(ability.name)}${suffix}`;
    })
    .join(", ");
}

function formatGenderRate(rate, language) {
  if (rate === -1) {
    return language === "en" ? "Genderless" : "Sin género";
  }

  const female = (rate / 8) * 100;
  const male = 100 - female;
  return `${male}% ♂ / ${female}% ♀`;
}

function formatMultiplier(multiplier) {
  if (multiplier === 0) {
    return "0";
  }
  if (multiplier === 0.25) {
    return "¼×";
  }
  if (multiplier === 0.5) {
    return "½×";
  }
  return `${multiplier}×`;
}

function applyTranslations() {
  document.documentElement.lang = settings.language;
  document.querySelectorAll("[data-i18n]").forEach((element) => {
    element.textContent = translate(element.dataset.i18n, settings.language);
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
    element.placeholder = translate(element.dataset.i18nPlaceholder, settings.language);
  });
}

function syncControlsFromSettings() {
  dom.languageSelect.value = settings.language;
  dom.versionGroupSelect.value = settings.versionGroup;
  dom.themeSelect.value = settings.themeId;
  dom.volumeRange.value = settings.volume;
}

function applySelectedTheme() {
  if (settings.themeId === "auto" && currentPokemonTheme) {
    applyTheme(currentPokemonTheme);
    return;
  }

  const theme = getThemeById(settings.themeId);
  applyTheme(theme);
}

function renderMusicState() {
  dom.musicToggle.setAttribute("aria-pressed", String(musicPlayer.isPlaying));
  dom.musicToggle.classList.toggle("is-active", musicPlayer.isPlaying);
}

function setLoading(isLoading) {
  dom.loader.hidden = !isLoading;
  dom.searchButton.disabled = isLoading;
  dom.pokemonSearch.disabled = isLoading;
}

function showStatus(message, type = "info") {
  dom.statusMessage.textContent = message;
  dom.statusMessage.dataset.type = type;
  dom.statusMessage.hidden = false;
}

function hideStatus() {
  dom.statusMessage.textContent = "";
  dom.statusMessage.hidden = true;
}

function loadSettings() {
  try {
    return {
      ...DEFAULT_SETTINGS,
      ...JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? "{}")
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

function saveSettings() {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
