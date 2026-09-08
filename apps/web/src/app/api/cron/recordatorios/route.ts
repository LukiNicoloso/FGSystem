import { NextResponse } from "next/server";
import { enviarRecordatorios } from "@/lib/envio-recordatorios";

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
 *
 * Con ?fecha=YYYY-MM-DD manda los de ese dia en vez de los de mañana, para poder
 * reenviar un dia puntual si el cron fallo.
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

  const params = new URL(request.url).searchParams;
  const simulacion = params.get("simulacion") === "1";

  const fecha = params.get("fecha") ?? undefined;
  if (fecha && !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    return NextResponse.json({ error: "fecha inválida, se espera YYYY-MM-DD" }, { status: 400 });
  }

  try {
    const r = await enviarRecordatorios({ simulacion, fecha });

    if (!r.configurado && !r.simulacion) {
      console.warn(
        `[recordatorios ${r.fecha}] Twilio no está configurado en este entorno: ` +
          `${r.enviados.length} turnos quedaron sin avisar`
      );
    }
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
