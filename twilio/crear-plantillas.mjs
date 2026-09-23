#!/usr/bin/env node
/**
 * Crea en Twilio las plantillas definidas en plantillas.json y muestra el
 * ContentSid de cada una, que es lo que hay que cargar como variable de entorno.
 *
 * La Content API no permite editar una plantilla existente: si cambia el texto hay
 * que crear una nueva y actualizar el SID. Por eso el script lista primero las que
 * ya existen y no duplica nada sin avisar.
 *
 *   node twilio/crear-plantillas.mjs             # lista lo que hay y su estado
 *   node twilio/crear-plantillas.mjs --crear     # crea las que falten
 *   node twilio/crear-plantillas.mjs --aprobar   # manda a revision de Meta las que
 *                                                # todavia no estan aprobadas
 *
 * Crear una plantilla en Twilio no alcanza para poder mandarla: ademas hay que
 * pedirle la aprobacion a Meta, que tarda dias. Sin eso, el envio falla con el
 * error 63016 fuera de la ventana de 24 h.
 *
 * Lee TWILIO_ACCOUNT_SID y TWILIO_AUTH_TOKEN de apps/web/.env.local.
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");

function cargarEnv() {
  const texto = readFileSync(join(raiz, "apps/web/.env.local"), "utf8");
  const env = {};
  for (const linea of texto.split("\n")) {
    const m = /^([A-Z_][A-Z0-9_]*)=(.*)$/.exec(linea.trim());
    if (m) env[m[1]] = m[2].replace(/^"(.*)"$/, "$1");
  }
  return env;
}

const env = cargarEnv();
const SID = env.TWILIO_ACCOUNT_SID;
const TOKEN = env.TWILIO_AUTH_TOKEN;
if (!SID || !TOKEN || SID === "[SENSITIVE]") {
  console.error("Faltan TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN en apps/web/.env.local");
  process.exit(1);
}
const auth = "Basic " + Buffer.from(`${SID}:${TOKEN}`).toString("base64");

const definiciones = JSON.parse(readFileSync(join(raiz, "twilio/plantillas.json"), "utf8"));
const plantillas = Object.entries(definiciones).filter(([clave]) => !clave.startsWith("_"));

async function listarExistentes() {
  const res = await fetch("https://content.twilio.com/v1/Content?PageSize=100", {
    headers: { Authorization: auth },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? `HTTP ${res.status}`);
  return new Map((data.contents ?? []).map((c) => [c.friendly_name, c.sid]));
}

/**
 * El estado en Meta: approved, pending, rejected o unsubmitted. Una recien creada
 * responde "unsubmitted", no null: null es solo cuando la consulta falla.
 */
async function estadoDeAprobacion(sid) {
  const res = await fetch(`https://content.twilio.com/v1/Content/${sid}/ApprovalRequests`, {
    headers: { Authorization: auth },
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data?.whatsapp?.status ?? null;
}

/**
 * Pide la aprobacion a Meta. La categoria es UTILITY porque son avisos sobre algo
 * que el paciente ya pidio, no promociones; allow_category_change deja que Meta la
 * corrija en vez de rechazar la plantilla entera si no esta de acuerdo.
 */
async function pedirAprobacion(sid, nombre) {
  const res = await fetch(
    `https://content.twilio.com/v1/Content/${sid}/ApprovalRequests/whatsapp`,
    {
      method: "POST",
      headers: { Authorization: auth, "Content-Type": "application/json" },
      body: JSON.stringify({ name: nombre, category: "UTILITY", allow_category_change: true }),
    }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? `HTTP ${res.status}`);
  return data?.whatsapp?.status ?? "pendiente";
}

async function crear(definicion) {
  const { _comentario, ...cuerpo } = definicion;
  void _comentario;
  const res = await fetch("https://content.twilio.com/v1/Content", {
    method: "POST",
    headers: { Authorization: auth, "Content-Type": "application/json" },
    body: JSON.stringify(cuerpo),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? `HTTP ${res.status}`);
  return data.sid;
}

const crearFaltantes = process.argv.includes("--crear");
const aprobar = process.argv.includes("--aprobar");
const existentes = await listarExistentes();

console.log(
  crearFaltantes || aprobar
    ? "Creando y/o mandando a revisión...\n"
    : "Estado actual (--crear para crear las que falten, --aprobar para mandarlas a revisión)\n"
);

const variables = [];
for (const [clave, definicion] of plantillas) {
  const nombre = definicion.friendly_name;
  let sid = existentes.get(nombre);

  if (sid) {
    console.log(`  ya existe  ${nombre.padEnd(26)} ${sid}`);
  } else if (crearFaltantes) {
    sid = await crear(definicion);
    console.log(`  creada     ${nombre.padEnd(26)} ${sid}`);
  } else {
    console.log(`  falta      ${nombre}`);
    continue;
  }

  // Una plantilla creada pero sin aprobar no sirve: el envio falla fuera de la
  // ventana de 24 h, que es justo cuando se usa.
  const estado = await estadoDeAprobacion(sid);
  if (estado === "approved") {
    console.log(`             aprobada por Meta`);
  } else if (aprobar && (estado === null || estado === "unsubmitted" || estado === "rejected")) {
    const nuevo = await pedirAprobacion(sid, nombre);
    console.log(`             enviada a revisión de Meta (${nuevo})`);
  } else {
    const falta = estado === "unsubmitted" || estado === "rejected" || estado === null;
    console.log(`             ${estado ?? "sin pedir aprobación"}${falta && !aprobar ? "  <- falta --aprobar" : ""}`);
  }

  variables.push([`TWILIO_CONTENT_SID_${clave.toUpperCase()}`, sid]);
}

if (variables.length > 0) {
  console.log("\nVariables de entorno a cargar:\n");
  for (const [nombre, valor] of variables) console.log(`  ${nombre}=${valor}`);
}
