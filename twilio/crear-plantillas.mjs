#!/usr/bin/env node
/**
 * Crea en Twilio las plantillas definidas en plantillas.json y muestra el
 * ContentSid de cada una, que es lo que hay que cargar como variable de entorno.
 *
 * La Content API no permite editar una plantilla existente: si cambia el texto hay
 * que crear una nueva y actualizar el SID. Por eso el script lista primero las que
 * ya existen y no duplica nada sin avisar.
 *
 *   node twilio/crear-plantillas.mjs            # lista lo que hay y lo que falta
 *   node twilio/crear-plantillas.mjs --crear    # crea las que falten
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
const existentes = await listarExistentes();

console.log(crearFaltantes ? "Creando las que falten...\n" : "Estado actual (usá --crear para crear las que falten)\n");

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
  }

  if (sid) variables.push([`TWILIO_CONTENT_SID_${clave.toUpperCase()}`, sid]);
}

if (variables.length > 0) {
  console.log("\nVariables de entorno a cargar:\n");
  for (const [nombre, valor] of variables) console.log(`  ${nombre}=${valor}`);
}
