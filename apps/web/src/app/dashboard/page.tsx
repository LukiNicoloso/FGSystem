import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import AccionButton from "./AccionButton";
import WaButton from "./WaButton";
import { actualizarEstadoContacto } from "./actions";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();

  const ahora = new Date();
  const hoy = ahora.toISOString().split("T")[0];
  const en15dias = new Date(ahora);
  en15dias.setDate(en15dias.getDate() + 15);
  const en15diasStr = en15dias.toISOString().split("T")[0];

  const { data: porContactar } = await supabase
    .from("plantillas")
    .select("*, pacientes(id, nombre, celular, consultorios(nombre))")
    .lte("fecha_renovacion", en15diasStr)
    .or(`estado_contacto.is.null,and(fecha_renovacion.lt.${hoy},estado_contacto.neq.no_interesado)`)
    .order("fecha_renovacion", { ascending: true });

  function diasRestantes(fechaRenovacion: string) {
    return Math.round(
      (new Date(fechaRenovacion + "T00:00:00").getTime() - new Date(hoy + "T00:00:00").getTime()) /
      (1000 * 60 * 60 * 24)
    );
  }

  function DiasTag({ dias }: { dias: number }) {
    if (dias < 0)
      return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">Vencida hace {Math.abs(dias)} día{Math.abs(dias) !== 1 ? "s" : ""}</span>;
    if (dias === 0)
      return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">Vence hoy</span>;
    return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">Vence en {dias} día{dias !== 1 ? "s" : ""}</span>;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Seguimiento</h1>
        <p className="text-sm text-gray-500 mt-0.5">Seguimiento de renovaciones</p>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <h2 className="font-semibold text-gray-700 text-sm">Por contactar</h2>
        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
          {porContactar?.length ?? 0}
        </span>
      </div>

      {!porContactar?.length ? (
        <p className="text-sm text-gray-400 text-center py-16">Sin pacientes pendientes ✅</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {porContactar.map((p) => {
            const paciente = p.pacientes as { id: string; nombre: string; celular: string; consultorios: { nombre: string } | null } | null;
            const dias = diasRestantes(p.fecha_renovacion);
            return (
              <div key={p.id} className="bg-white rounded-lg border border-gray-200 p-3 space-y-2.5">
                <div>
                  <Link href={`/pacientes/${paciente?.id}`} className="font-medium text-gray-900 text-sm hover:text-blue-600 hover:underline">
                    {paciente?.nombre ?? "—"}
                  </Link>
                  <div className="mt-1.5">
                    <DiasTag dias={dias} />
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <WaButton celular={paciente?.celular} consultorio={paciente?.consultorios?.nombre} nombre={paciente?.nombre} fechaRenovacion={p.fecha_renovacion} />
                  <AccionButton
                    action={actualizarEstadoContacto.bind(null, p.id, "contactado")}
                    label="✓ Contactado"
                    className="px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg"
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
