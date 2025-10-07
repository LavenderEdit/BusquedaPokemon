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

export function obtenerColorTipo(tipo) {
  const tipoInfo = tiposPokemon[tipo?.toLowerCase?.() ?? ""];
  return tipoInfo?.color ?? "#6D6D6D";
}
