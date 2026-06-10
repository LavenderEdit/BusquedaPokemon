import {
  POKEMON_TYPE_ORDER,
  TYPE_EFFECTIVENESS,
  traducirTipo
} from "./tipos.js";
import { translate } from "./i18n.js";

export function calculatePokemonDefenses(types = []) {
  const normalizedTypes = types
    .map((type) => (typeof type === "string" ? type : type?.type?.name))
    .filter(Boolean);

  return Object.fromEntries(
    POKEMON_TYPE_ORDER.map((attackType) => {
      const multiplier = normalizedTypes.reduce((total, defendingType) => {
        const chart = TYPE_EFFECTIVENESS[attackType] ?? {};
        return total * (chart[defendingType] ?? 1);
      }, 1);

      return [attackType, multiplier];
    })
  );
}

export function getCoverageSummary(slots = []) {
  const summary = Object.fromEntries(POKEMON_TYPE_ORDER.map((type) => [type, 0]));

  slots.forEach((slot) => {
    slot?.moves?.forEach((move) => {
      const type = typeof move === "string" ? null : move?.type;
      if (type && summary[type] !== undefined) {
        summary[type] += 1;
      }
    });
  });

  return summary;
}

export function analyzeTeam(slots = [], language = "es") {
  const filledSlots = slots.filter((slot) => slot?.pokemonName).length;
  const emptySlots = Math.max(0, 6 - filledSlots);
  const typeProfile = Object.fromEntries(
    POKEMON_TYPE_ORDER.map((type) => [
      type,
      { type, weaknesses: 0, resistances: 0, immunities: 0, neutral: 0 }
    ])
  );
  const roleCounts = {};

  slots
    .filter((slot) => slot?.pokemonName)
    .forEach((slot) => {
      const defenses = calculatePokemonDefenses(slot.types);
      Object.entries(defenses).forEach(([type, multiplier]) => {
        if (multiplier === 0) {
          typeProfile[type].immunities += 1;
        } else if (multiplier > 1) {
          typeProfile[type].weaknesses += 1;
        } else if (multiplier < 1) {
          typeProfile[type].resistances += 1;
        } else {
          typeProfile[type].neutral += 1;
        }
      });

      if (slot.role) {
        roleCounts[slot.role] = (roleCounts[slot.role] ?? 0) + 1;
      }
    });

  const criticalWeaknesses = Object.values(typeProfile)
    .filter((entry) => entry.weaknesses >= 2 && entry.immunities === 0)
    .sort((a, b) => b.weaknesses - a.weaknesses);
  const repeatedRoles = Object.entries(roleCounts)
    .filter(([, count]) => count >= 3)
    .map(([role, count]) => ({ role, count }));
  const recommendations = [];

  if (emptySlots > 0) {
    recommendations.push(
      translate("team.recommendComplete", language, { count: emptySlots })
    );
  }

  criticalWeaknesses.slice(0, 3).forEach((entry) => {
    recommendations.push(
      language === "en"
        ? `Add a partner that resists ${traducirTipo(entry.type, "en")} or creates an immunity.`
        : `Agrega un compañero que resista ${traducirTipo(entry.type, "es")} o genere inmunidad.`
    );
  });

  if (repeatedRoles.length > 0) {
    recommendations.push(
      language === "en"
        ? "Several members share the same role; add support, speed control, or defensive utility."
        : "Varios miembros repiten rol; añade soporte, control de velocidad o utilidad defensiva."
    );
  }

  if (recommendations.length === 0) {
    recommendations.push(
      language === "en"
        ? "The team has a healthy first balance. Review moves for offensive coverage."
        : "El equipo tiene un primer balance saludable. Revisa movimientos para cobertura ofensiva."
    );
  }

  return {
    filledSlots,
    emptySlots,
    typeProfile,
    criticalWeaknesses,
    repeatedRoles,
    coverage: getCoverageSummary(slots),
    recommendations
  };
}
