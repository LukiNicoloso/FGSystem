import { NextResponse } from "next/server";
import { enviarRecordatoriosDeManana } from "@/lib/envio-recordatorios";

/**
 * Cron diario de recordatorios. Vercel lo invoca a las 21:00 UTC, que son las
 * 18:00 en Argentina todo el año porque el pais no aplica horario de verano.
 *
 * Esta ruta queda fuera de la autenticacion de proxy.ts (Vercel no manda cookies
 * de sesion), asi que se protege sola con CRON_SECRET. Vercel lo envia como
 * "Authorization: Bearer <CRON_SECRET>".
 *
 * Con ?simulacion=1 devuelve los mensajes que mandaria sin mandar ninguno ni tocar
 * la base. Es la forma de revisar un envio antes de que salga.
 */

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function autorizado(request: Request): boolean {
  const esperado = process.env.CRON_SECRET;
  if (!esperado) return false;
  return request.headers.get("authorization") === `Bearer ${esperado}`;
}

export async function GET(request: Request) {
  if (!autorizado(request)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const simulacion = new URL(request.url).searchParams.get("simulacion") === "1";

  try {
    const r = await enviarRecordatoriosDeManana({ simulacion });

    console.log(
      `[recordatorios ${r.fecha}]${r.simulacion ? " SIMULACION" : ""} ` +
        `enviados: ${r.enviados.length}, salteados: ${r.salteados.length}, fallidos: ${r.fallidos.length}`
    );
    for (const f of r.fallidos) {
      console.error(`[recordatorios] falló ${f.paciente} (turno ${f.turnoId}): ${f.error}`);
    }

    return NextResponse.json(r);
  } catch (err) {
    const mensaje = err instanceof Error ? err.message : "error desconocido";
    console.error("[recordatorios] el envío no pudo ejecutarse:", mensaje);
    return NextResponse.json({ error: mensaje }, { status: 500 });
  }
}
