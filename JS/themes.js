import { obtenerColorTipo } from "./tipos.js";

export const CURATED_THEMES = [
  {
    id: "pokedex",
    name: "Pokédex Pro",
    accent: "#E3350D",
    accent2: "#30A7D7",
    background: "#0E172B",
    surface: "#FFFFFF",
    surfaceAlt: "#F4F7FB",
    text: "#162033",
    muted: "#667085"
  },
  {
    id: "pikachu",
    name: "Pikachu",
    accent: "#F7D02C",
    accent2: "#3B4CCA",
    background: "#151515",
    surface: "#FFF8D8",
    surfaceAlt: "#FFE97A",
    text: "#241D12",
    muted: "#6E5F29"
  },
  {
    id: "gengar",
    name: "Gengar",
    accent: "#735797",
    accent2: "#F95587",
    background: "#120D1F",
    surface: "#F7F1FF",
    surfaceAlt: "#E8D9FF",
    text: "#211629",
    muted: "#685879"
  },
  {
    id: "eevee",
    name: "Eevee",
    accent: "#C27A42",
    accent2: "#6BAE75",
    background: "#17201A",
    surface: "#FFF7EC",
    surfaceAlt: "#F0DEC6",
    text: "#2D2016",
    muted: "#776655"
  }
];

export function getThemeById(id = "pokedex") {
  return CURATED_THEMES.find((theme) => theme.id === id) ?? CURATED_THEMES[0];
}

export function createPokemonTheme(pokemon) {
  const typeName =
    pokemon?.types?.[0]?.type?.name ??
    pokemon?.types?.[0] ??
    "normal";
  const accent = obtenerColorTipo(typeName);
  const id = pokemon?.id ? `pokemon-${pokemon.id}` : `pokemon-${pokemon?.name ?? "custom"}`;

  return {
    id,
    name: `${pokemon?.name ?? "Pokémon"} Theme`,
    accent,
    accent2: "#30A7D7",
    background: "#111827",
    surface: "#FFFFFF",
    surfaceAlt: "#F6F8FC",
    text: "#172033",
    muted: "#667085"
  };
}

export function applyTheme(theme) {
  const selectedTheme = theme ?? CURATED_THEMES[0];
  const root = document.documentElement;

  Object.entries({
    "--theme-accent": selectedTheme.accent,
    "--theme-accent-2": selectedTheme.accent2,
    "--theme-bg": selectedTheme.background,
    "--theme-surface": selectedTheme.surface,
    "--theme-surface-alt": selectedTheme.surfaceAlt,
    "--theme-text": selectedTheme.text,
    "--theme-muted": selectedTheme.muted
  }).forEach(([property, value]) => root.style.setProperty(property, value));

  root.dataset.theme = selectedTheme.id;
}
