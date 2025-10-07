import { traducirTipo } from "./traductor.js";
import { obtenerColorTipo } from "./tipos.js";

const formulario = document.getElementById("formulario");
const inputBusqueda = document.getElementById("iddelpokemonaallamar");
const botonBusqueda = document.getElementById("buscarPokemon");
const mensajeEstado = document.getElementById("estadoBusqueda");
const loader = document.getElementById("loader");
const tarjetaPokemon = document.getElementById("pokedex_box");
const imagenPokemon = document.getElementById("image");
const nombrePokemon = document.getElementById("namepokemon");
const tiposPokemonElemento = document.getElementById("tipes");
const descripcionPokemon = document.getElementById("description");
const datosBasicos = document.getElementById("basicData");
const estadisticas = document.getElementById("statsList");
const habilidades = document.getElementById("abilitiesList");
const movimientos = document.getElementById("movimientos");

formulario.addEventListener("submit", manejarBusquedaPokemon);

async function manejarBusquedaPokemon(evento) {
  evento.preventDefault();
  const identificador = inputBusqueda.value.trim().toLowerCase();

  if (!identificador) {
    mostrarError("Por favor, ingresa el nombre o número de Pokédex.");
    return;
  }
  limpiarMensaje();
  toggleCarga(true);

  try {
    const datosPokemon = await obtenerDatosPokemon(identificador);
    const datosEspecie = await obtenerDatosEspeciePokemon(datosPokemon.id);

    actualizarInterfaz(datosPokemon, datosEspecie);
  } catch (error) {
    console.error(error);
    mostrarError(
      "No pudimos encontrar ese Pokémon. Intenta con otro nombre o número."
    );
    reiniciarTarjeta();
  } finally {
    toggleCarga(false);
  }
}

async function obtenerDatosPokemon(identificador) {
  const respuesta = await fetch(
    `https://pokeapi.co/api/v2/pokemon/${identificador}`
  );

  if (!respuesta.ok) {
    throw new Error(`HTTP Error: ${respuesta.status}`);
  }

  return respuesta.json();
}

async function obtenerDatosEspeciePokemon(id) {
  const respuesta = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${id}`);

  if (!respuesta.ok) {
    throw new Error(`HTTP Error: ${respuesta.status}`);
  }

  return respuesta.json();
}

function actualizarInterfaz(datosPokemon, datosEspecie) {
  actualizarImagenPokemon(datosPokemon);
  actualizarNombrePokemon(datosPokemon);
  renderizarTiposPokemon(datosPokemon);
  renderizarDescripcionPokemon(datosEspecie);
  renderizarDatosBasicos(datosPokemon);
  renderizarEstadisticas(datosPokemon);
  renderizarHabilidades(datosPokemon);
  renderizarMovimientosPokemon(datosPokemon);
  aplicarColorDeTipoPrincipal(datosPokemon);
  tarjetaPokemon.classList.remove("is-hidden");
}

function actualizarImagenPokemon(data) {
  const spriteOficial =
    data.sprites.other["official-artwork"].front_default ||
    data.sprites.front_default;

  imagenPokemon.src = spriteOficial ?? "";
  imagenPokemon.alt = spriteOficial
    ? `Imagen oficial de ${formatearTexto(data.name)}`
    : "Ilustración no disponible";
}

function actualizarNombrePokemon(data) {
  nombrePokemon.textContent = `#${String(data.id).padStart(3, "0")} ${formatearTexto(
    data.name
  )}`;
}

function renderizarTiposPokemon(data) {
  tiposPokemonElemento.innerHTML = "";

  data.types.forEach(({ type }) => {
    const tipoTraducido = traducirTipo(type.name, "es");
    const badge = document.createElement("span");
    badge.className = "type-pill";
    badge.style.setProperty("--type-color", obtenerColorTipo(type.name));
    badge.textContent = tipoTraducido.toUpperCase();
    tiposPokemonElemento.appendChild(badge);
  });
}

function renderizarDescripcionPokemon(speciesData) {
  const entradaEs = speciesData.flavor_text_entries.find(
    (entry) => entry.language.name === "es"
  );
  const entradaEn = speciesData.flavor_text_entries.find(
    (entry) => entry.language.name === "en"
  );

  const texto = entradaEs?.flavor_text ?? entradaEn?.flavor_text ??
    "No contamos con una descripción en la Pokédex para este Pokémon.";

  descripcionPokemon.textContent = normalizarTextoPokedex(texto);
}

function renderizarDatosBasicos(data) {
  const alturaMetros = data.height / 10;
  const pesoKilogramos = data.weight / 10;
  const experienciaBase = data.base_experience;

  datosBasicos.innerHTML = `
    <li><span class="data-label">Altura</span><span>${alturaMetros.toFixed(
    1
  )} m</span></li>
    <li><span class="data-label">Peso</span><span>${pesoKilogramos.toFixed(
    1
  )} kg</span></li>
    <li><span class="data-label">Experiencia base</span><span>${experienciaBase}</span></li>
  `;
}

function renderizarEstadisticas(data) {
  estadisticas.innerHTML = "";

  data.stats.forEach((stat) => {
    const item = document.createElement("li");
    item.className = "stat-item";

    const nombreStat = formatearTexto(stat.stat.name);
    const valor = stat.base_stat;
    const porcentaje = (Math.min(valor, 180) / 180) * 100;

    item.innerHTML = `
      <span class="stat-name">${nombreStat}</span>
      <div class="stat-bar">
        <div class="stat-bar__value" style="width: ${porcentaje}%"></div>
        <span class="stat-bar__label">${valor}</span>
      </div>
    `;

    estadisticas.appendChild(item);
  });
}

function renderizarHabilidades(data) {
  habilidades.innerHTML = "";

  data.abilities.forEach(({ ability, is_hidden }) => {
    const habilidadItem = document.createElement("li");
    habilidadItem.textContent = `${formatearTexto(ability.name)}${is_hidden ? " (Oculta)" : ""
      }`;
    habilidades.appendChild(habilidadItem);
  });
}

function renderizarMovimientosPokemon(data) {
  movimientos.innerHTML = "";
  data.moves.slice(0, 8).forEach((move) => {
    const movimientoItem = document.createElement("li");
    movimientoItem.textContent = formatearTexto(move.move.name);
    movimientos.appendChild(movimientoItem);
  });
}

function aplicarColorDeTipoPrincipal(data) {
  const tipoPrincipal = data.types[0]?.type.name;
  const colorPrincipal = obtenerColorTipo(tipoPrincipal);

  document.documentElement.style.setProperty(
    "--accent-color",
    colorPrincipal
  );
}

function mostrarError(mensaje) {
  mensajeEstado.textContent = mensaje;
  mensajeEstado.classList.add("is-error");
  mensajeEstado.removeAttribute("hidden");
}

function limpiarMensaje() {
  mensajeEstado.textContent = "";
  mensajeEstado.classList.remove("is-error");
  mensajeEstado.setAttribute("hidden", "true");
}

function reiniciarTarjeta() {
  tarjetaPokemon.classList.add("is-hidden");
  imagenPokemon.src = "";
  nombrePokemon.textContent = "Tu Pokédex digital";
  tiposPokemonElemento.innerHTML = "";
  descripcionPokemon.textContent =
    "Busca un Pokémon para ver sus estadísticas y habilidades.";
  datosBasicos.innerHTML = "";
  estadisticas.innerHTML = "";
  habilidades.innerHTML = "";
  movimientos.innerHTML = "";
}

function toggleCarga(estaCargando) {
  loader.toggleAttribute("hidden", !estaCargando);

  if (estaCargando) {
    formulario.setAttribute("aria-busy", "true");
  } else {
    formulario.removeAttribute("aria-busy");
  }

  inputBusqueda.toggleAttribute("disabled", estaCargando);
  botonBusqueda.toggleAttribute("disabled", estaCargando);
  botonBusqueda.textContent = estaCargando ? "Consultando…" : "Buscar Pokémon";
}

function formatearTexto(texto) {
  return texto
    .split("-")
    .map((palabra) => palabra.charAt(0).toUpperCase() + palabra.slice(1))
    .join(" ");
}

function normalizarTextoPokedex(texto) {
  return texto
    .replace(/\f/g, " ")
    .replace(/\n|\r/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

reiniciarTarjeta();