import { tiposPokemon } from "./tipos.js";

export function traducirTipo(tipo, idioma = "es") {
  const tipoTraducido = tiposPokemon[tipo.toLowerCase()];

  if (tipoTraducido) {
    return tipoTraducido[idioma] || tipoTraducido["es"];
  } else {
    throw new Error("Tipo de Pokémon no encontrado");
  }
}
