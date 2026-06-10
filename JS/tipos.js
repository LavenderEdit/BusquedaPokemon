export const POKEMON_TYPE_ORDER = [
  "normal",
  "fire",
  "water",
  "electric",
  "grass",
  "ice",
  "fighting",
  "poison",
  "ground",
  "flying",
  "psychic",
  "bug",
  "rock",
  "ghost",
  "dragon",
  "dark",
  "steel",
  "fairy"
];

export const tiposPokemon = {
  normal: { en: "Normal", es: "Normal", color: "#A8A77A" },
  fire: { en: "Fire", es: "Fuego", color: "#EE8130" },
  water: { en: "Water", es: "Agua", color: "#6390F0" },
  electric: { en: "Electric", es: "Eléctrico", color: "#F7D02C" },
  grass: { en: "Grass", es: "Planta", color: "#7AC74C" },
  ice: { en: "Ice", es: "Hielo", color: "#96D9D6" },
  fighting: { en: "Fighting", es: "Lucha", color: "#C22E28" },
  poison: { en: "Poison", es: "Veneno", color: "#A33EA1" },
  ground: { en: "Ground", es: "Tierra", color: "#E2BF65" },
  flying: { en: "Flying", es: "Volador", color: "#A98FF3" },
  psychic: { en: "Psychic", es: "Psíquico", color: "#F95587" },
  bug: { en: "Bug", es: "Bicho", color: "#A6B91A" },
  rock: { en: "Rock", es: "Roca", color: "#B6A136" },
  ghost: { en: "Ghost", es: "Fantasma", color: "#735797" },
  dragon: { en: "Dragon", es: "Dragón", color: "#6F35FC" },
  dark: { en: "Dark", es: "Siniestro", color: "#705746" },
  steel: { en: "Steel", es: "Acero", color: "#B7B7CE" },
  fairy: { en: "Fairy", es: "Hada", color: "#D685AD" }
};

export const TYPE_EFFECTIVENESS = {
  normal: { rock: 0.5, ghost: 0, steel: 0.5 },
  fire: {
    fire: 0.5,
    water: 0.5,
    grass: 2,
    ice: 2,
    bug: 2,
    rock: 0.5,
    dragon: 0.5,
    steel: 2
  },
  water: {
    fire: 2,
    water: 0.5,
    grass: 0.5,
    ground: 2,
    rock: 2,
    dragon: 0.5
  },
  electric: {
    water: 2,
    electric: 0.5,
    grass: 0.5,
    ground: 0,
    flying: 2,
    dragon: 0.5
  },
  grass: {
    fire: 0.5,
    water: 2,
    grass: 0.5,
    poison: 0.5,
    ground: 2,
    flying: 0.5,
    bug: 0.5,
    rock: 2,
    dragon: 0.5,
    steel: 0.5
  },
  ice: {
    fire: 0.5,
    water: 0.5,
    grass: 2,
    ice: 0.5,
    ground: 2,
    flying: 2,
    dragon: 2,
    steel: 0.5
  },
  fighting: {
    normal: 2,
    ice: 2,
    poison: 0.5,
    flying: 0.5,
    psychic: 0.5,
    bug: 0.5,
    rock: 2,
    ghost: 0,
    dark: 2,
    steel: 2,
    fairy: 0.5
  },
  poison: {
    grass: 2,
    poison: 0.5,
    ground: 0.5,
    rock: 0.5,
    ghost: 0.5,
    steel: 0,
    fairy: 2
  },
  ground: {
    fire: 2,
    electric: 2,
    grass: 0.5,
    poison: 2,
    flying: 0,
    bug: 0.5,
    rock: 2,
    steel: 2
  },
  flying: {
    electric: 0.5,
    grass: 2,
    fighting: 2,
    bug: 2,
    rock: 0.5,
    steel: 0.5
  },
  psychic: {
    fighting: 2,
    poison: 2,
    psychic: 0.5,
    dark: 0,
    steel: 0.5
  },
  bug: {
    fire: 0.5,
    grass: 2,
    fighting: 0.5,
    poison: 0.5,
    flying: 0.5,
    psychic: 2,
    ghost: 0.5,
    dark: 2,
    steel: 0.5,
    fairy: 0.5
  },
  rock: {
    fire: 2,
    ice: 2,
    fighting: 0.5,
    ground: 0.5,
    flying: 2,
    bug: 2,
    steel: 0.5
  },
  ghost: { normal: 0, psychic: 2, ghost: 2, dark: 0.5 },
  dragon: { dragon: 2, steel: 0.5, fairy: 0 },
  dark: {
    fighting: 0.5,
    psychic: 2,
    ghost: 2,
    dark: 0.5,
    fairy: 0.5
  },
  steel: {
    fire: 0.5,
    water: 0.5,
    electric: 0.5,
    ice: 2,
    rock: 2,
    steel: 0.5,
    fairy: 2
  },
  fairy: {
    fire: 0.5,
    fighting: 2,
    poison: 0.5,
    dragon: 2,
    dark: 2,
    steel: 0.5
  }
};

export function obtenerColorTipo(tipo) {
  const tipoInfo = tiposPokemon[tipo?.toLowerCase?.() ?? ""];
  return tipoInfo?.color ?? "#6D6D6D";
}

export function traducirTipo(tipo, idioma = "es") {
  const clave = tipo?.toLowerCase?.();
  const tipoTraducido = clave ? tiposPokemon[clave] : null;
  return tipoTraducido?.[idioma] || tipoTraducido?.en || tipo || "";
}

export function formatText(value) {
  if (!value) {
    return "";
  }

  return String(value)
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
