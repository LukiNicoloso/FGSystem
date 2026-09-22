/**
 * Cuanto se cobra por un alta de plantillas.
 *
 * El precio vive en la ficha del consultorio y es el de UN par. Al cargar un alta
 * se sugiere un monto a partir de ese precio, pero lo que queda guardado es el
 * monto de esa alta y no una referencia al precio: si el año que viene Mariana
 * pasa a $120.000, los numeros de este año tienen que seguir dando lo mismo.
 */

/**
 * Al segundo par se le suele hacer un 10%. "Suele": por eso el monto sugerido es
 * editable y esto es solo el punto de partida.
 */
export const DESCUENTO_SEGUNDO_PAR = 0.1;

/** Lo mas comun es que un alta sean dos pares, asi que ese es el default. */
export const PARES_POR_DEFECTO = 2;

export const PARES_POSIBLES = [1, 2] as const;
export type Pares = (typeof PARES_POSIBLES)[number];

export function esPares(n: unknown): n is Pares {
  return n === 1 || n === 2;
}

/**
 * El monto que se propone para un alta. Devuelve null cuando el consultorio no
 * tiene precio cargado: preferimos dejar el campo vacio a inventar un numero que
 * despues se lea como si fuera real.
 */
export function montoSugerido(precioPorPar: number | null, pares: Pares): number | null {
  if (precioPorPar === null || !Number.isFinite(precioPorPar)) return null;
  const segundo = precioPorPar * (1 - DESCUENTO_SEGUNDO_PAR);
  return pares === 2 ? Math.round(precioPorPar + segundo) : Math.round(precioPorPar);
}

/** "$ 190.000". Sin centavos: los precios de plantillas son redondos. */
export function formatearPesos(monto: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(monto);
}

/**
 * Lee un monto escrito a mano. Acepta "190000", "190.000" y "$190.000", que es
 * como se escribe un precio en Argentina, donde el punto es separador de miles.
 * Devuelve null si no queda un numero valido, para no guardar un 0 silencioso.
 */
export function parsearPesos(valor: string): number | null {
  // El signo se descarta antes de limpiar: si se colara, "-5" terminaria leyendose
  // como $5 en vez de rechazarse.
  if (valor.includes("-")) return null;
  const limpio = valor.replace(/[^\d,]/g, "").replace(",", ".");
  if (limpio === "") return null;
  const n = Number(limpio);
  return Number.isFinite(n) ? Math.round(n) : null;
}

/**
 * Lee del formulario cuantos pares y cuanto se cobro.
 *
 * Los dos pueden quedar en null: son campos nuevos y las altas viejas no los
 * tienen, asi que null significa "no registrado" y no "fue un par" ni "salio
 * gratis". Lo usan el alta de plantillas y el alta de paciente, que crea una.
 */
export function paresYMontoDeForm(formData: FormData): {
  pares: Pares | null;
  monto_cobrado: number | null;
} {
  const paresCrudo = Number(formData.get("pares"));
  const montoCrudo = (formData.get("monto_cobrado") as string | null)?.trim();
  return {
    pares: esPares(paresCrudo) ? paresCrudo : null,
    monto_cobrado: montoCrudo ? parsearPesos(montoCrudo) : null,
  };
}
