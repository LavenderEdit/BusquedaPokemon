export const SUPPORTED_LANGUAGES = ["es", "en"];

const DICTIONARY = {
  es: {
    "app.title": "BusquedaPokemon",
    "app.subtitle": "Pokédex avanzada y laboratorio de equipos",
    "search.placeholder": "Busca Pokémon, movimiento, habilidad...",
    "search.button": "Buscar",
    "search.loading": "Consultando PokéAPI...",
    "search.error": "No pudimos encontrar ese Pokémon. Revisa el nombre o número.",
    "search.empty": "Escribe un nombre o número de Pokédex.",
    "guide.emptyTitle": "Elige un Pokémon para abrir su guía",
    "guide.emptyText": "Verás datos completos, defensas, evolución, sprites y movimientos por juego.",
    "guide.about": "Resumen Pokédex",
    "guide.training": "Entrenamiento",
    "guide.breeding": "Crianza",
    "guide.stats": "Estadísticas base",
    "guide.defenses": "Defensas de tipo",
    "guide.evolution": "Evolución",
    "guide.moves": "Movimientos por juego",
    "guide.forms": "Formas y sprites",
    "team.title": "Laboratorio de equipo",
    "team.add": "Agregar al equipo",
    "team.export": "Exportar",
    "team.import": "Importar",
    "team.clear": "Vaciar equipo",
    "team.analysis": "Análisis competitivo",
    "team.emptySlot": "Slot vacío",
    "team.recommendComplete": "Completa los {count} slots vacíos para analizar mejor el equipo.",
    "settings.language": "Idioma",
    "settings.version": "Juego",
    "settings.theme": "Tema",
    "settings.music": "Música",
    "settings.volume": "Volumen",
    "common.unavailable": "No disponible",
    "common.hidden": "Oculta",
    "common.none": "Ninguno",
    "common.yes": "Sí",
    "common.no": "No"
  },
  en: {
    "app.title": "BusquedaPokemon",
    "app.subtitle": "Advanced Pokédex and team laboratory",
    "search.placeholder": "Search Pokémon, move, ability...",
    "search.button": "Search",
    "search.loading": "Querying PokéAPI...",
    "search.error": "We could not find that Pokémon. Check the name or number.",
    "search.empty": "Enter a Pokédex name or number.",
    "guide.emptyTitle": "Choose a Pokémon to open its guide",
    "guide.emptyText": "You will see full data, defenses, evolution, sprites, and game-filtered moves.",
    "guide.about": "Pokédex summary",
    "guide.training": "Training",
    "guide.breeding": "Breeding",
    "guide.stats": "Base stats",
    "guide.defenses": "Type defenses",
    "guide.evolution": "Evolution",
    "guide.moves": "Moves by game",
    "guide.forms": "Forms and sprites",
    "team.title": "Team laboratory",
    "team.add": "Add to team",
    "team.export": "Export",
    "team.import": "Import",
    "team.clear": "Clear team",
    "team.analysis": "Competitive analysis",
    "team.emptySlot": "Empty slot",
    "team.recommendComplete": "Fill the {count} empty slots for a better team analysis.",
    "settings.language": "Language",
    "settings.version": "Game",
    "settings.theme": "Theme",
    "settings.music": "Music",
    "settings.volume": "Volume",
    "common.unavailable": "Unavailable",
    "common.hidden": "Hidden",
    "common.none": "None",
    "common.yes": "Yes",
    "common.no": "No"
  }
};

export function normalizeLanguage(language) {
  return SUPPORTED_LANGUAGES.includes(language) ? language : "es";
}

export function translate(key, language = "es", params = {}) {
  const locale = normalizeLanguage(language);
  const template = DICTIONARY[locale][key] ?? DICTIONARY.en[key] ?? key;

  return Object.entries(params).reduce(
    (text, [param, value]) => text.replaceAll(`{${param}}`, String(value)),
    template
  );
}

export function normalizePokedexText(text = "") {
  return String(text)
    .replace(/\f/g, " ")
    .replace(/\n|\r/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function getBestLocalizedText(entries = [], language = "es", field = "name") {
  const locale = normalizeLanguage(language);
  const preferred =
    entries.find((entry) => entry.language?.name === locale) ??
    entries.find((entry) => entry.language?.name === "en") ??
    entries[0];

  return normalizePokedexText(preferred?.[field] ?? "");
}

export function getNamedResourceName(names = [], fallback = "", language = "es") {
  return getBestLocalizedText(names, language, "name") || fallback;
}
