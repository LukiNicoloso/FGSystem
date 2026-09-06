import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { normalizarCelular, mostrarE164, FORMATO_ESPERADO } from "@/lib/telefono";
import NormalizarClient from "./NormalizarClient";

export const dynamic = "force-dynamic";

export default async function NormalizarPage() {
  const supabase = await createClient();

  const { data: pacientes } = await supabase
    .from("pacientes")
    .select("id, nombre, celular, celular_e164")
    .order("nombre");

  // La normalizacion se calcula acá solo para mostrarla: al aplicar, el servidor
  // la vuelve a calcular sobre los datos de la base.
  const filas = (pacientes ?? []).map((p) => {
    const yaEsta = Boolean(p.celular_e164);
    const r = normalizarCelular(p.celular as string);
    return {
      id: p.id as string,
      nombre: p.nombre as string,
      celular: (p.celular as string) ?? "",
      guardado: (p.celular_e164 as string | null) ?? null,
      resultado: r.ok ? mostrarE164(r.e164) : null,
      motivo: r.ok ? null : r.motivo,
      yaEsta,
    };
  });

  const listos = filas.filter((f) => f.yaEsta).length;
  const porNormalizar = filas.filter((f) => !f.yaEsta && f.resultado).length;
  const conProblema = filas.filter((f) => !f.yaEsta && !f.resultado).length;

  return (
    <div>
      <div className="mb-6">
        <Link href="/pacientes" className="text-sm text-blue-600 hover:underline">
          ← Volver a pacientes
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">Celulares para WhatsApp</h1>
        <p className="text-sm text-gray-500 mt-0.5 max-w-2xl">
          Para poder saber de qué paciente viene cada respuesta, el celular tiene que estar
          guardado en formato internacional. Acá podés ver cómo queda cada uno antes de
          aplicar el cambio.
        </p>
      </div>

      <NormalizarClient
        filas={filas}
        listos={listos}
        porNormalizar={porNormalizar}
        conProblema={conProblema}
        formatoEsperado={FORMATO_ESPERADO}
      />
    </div>
  );
}
