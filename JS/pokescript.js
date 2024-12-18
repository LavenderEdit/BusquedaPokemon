import { traducirTipo } from "./traductor.js";

function buscarPokemon() {
  const pokemonId = document.getElementById("iddelpokemonaallamar").value;
  if (!pokemonId) {
    mostrarError("Por favor, ingresa un número válido.");
    return;
  }

  obtenerDatosPokemon(pokemonId)
    .then((data) => {
      actualizarImagenPokemon(data);
      actualizarNombrePokemon(data);
      renderizarTiposPokemon(data);
      renderizarMovimientosPokemon(data);
    })
    .catch((error) => mostrarError("No se pudo encontrar el Pokémon.", error));
}

function obtenerDatosPokemon(id) {
  return fetch(`https://pokeapi.co/api/v2/pokemon/${id}`).then((response) => {
    if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
    return response.json();
  });
}

function actualizarImagenPokemon(data) {
  const image = document.getElementById("image");
  image.src = data.sprites.other["official-artwork"].front_default;
  image.alt = `Imagen de ${data.name}`;
}

function actualizarNombrePokemon(data) {
  const namepokemon = document.getElementById("namepokemon");
  namepokemon.textContent = data.name.toUpperCase();
}

function renderizarTiposPokemon(data) {
  const tipesContainer = document.getElementById("tipes");
  tipesContainer.innerHTML = "";

  data.types.forEach((type) => {
    const tipoTraducido = traducirTipo(type.type.name, "es");
    const tipoDiv = document.createElement("div");
    tipoDiv.classList.add("elemento_estilo");
    tipoDiv.innerHTML = `<p class="elemento_texto">${tipoTraducido.toUpperCase()}</p>`;
    tipesContainer.appendChild(tipoDiv);
  });
}

function renderizarMovimientosPokemon(data) {
  const pokemovimientos = document.getElementById("movimientos");
  pokemovimientos.innerHTML = "";

  data.moves.slice(0, 5).forEach((move) => {
    const movimientoItem = document.createElement("li");
    movimientoItem.textContent = move.move.name;
    pokemovimientos.appendChild(movimientoItem);
  });
}

function mostrarError(mensaje, error = null) {
  console.error(mensaje, error);
  alert(mensaje);
}

document
  .getElementById("buscarPokemon")
  .addEventListener("click", buscarPokemon);
