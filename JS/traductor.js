import { tiposPokemon } from "./tipos.js";

export function traducirTipo(tipo, idioma = "es") {
  const clave = tipo?.toLowerCase?.();
  const tipoTraducido = clave ? tiposPokemon[clave] : null;

  if (tipoTraducido) {
    return tipoTraducido[idioma] || tipoTraducido["es"];
  }
  return tipo;
}
