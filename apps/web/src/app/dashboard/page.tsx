import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import AccionButton from "./AccionButton";
import { actualizarEstadoContacto } from "./actions";

export const dynamic = "force-dynamic";

const WA_ICON = (
  <svg viewBox="0 0 24 24" className="w-3 h-3 fill-current flex-shrink-0">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

export default async function DashboardPage() {
  const supabase = await createClient();

  const ahora = new Date();
  const hoy = ahora.toISOString().split("T")[0];
  const en15dias = new Date(ahora);
  en15dias.setDate(en15dias.getDate() + 15);
  const en15diasStr = en15dias.toISOString().split("T")[0];

  const [
    { data: porContactar },
    { data: contactados },
    { data: agendados },
  ] = await Promise.all([
    supabase
      .from("plantillas")
      .select("*, pacientes(id, nombre, celular, consultorios(nombre))")
      .lte("fecha_renovacion", en15diasStr)
      .is("estado_contacto", null)
      .order("fecha_renovacion", { ascending: true }),
    supabase
      .from("plantillas")
      .select("*, pacientes(id, nombre, celular, consultorios(nombre))")
      .eq("estado_contacto", "contactado")
      .order("fecha_renovacion", { ascending: true }),
    supabase
      .from("plantillas")
      .select("*, pacientes(id, nombre)")
      .eq("estado_contacto", "agendado")
      .eq("fecha_agendado", hoy)
      .order("fecha_renovacion", { ascending: true }),
  ]);

  function diasRestantes(fechaRenovacion: string) {
    return Math.round(
      (new Date(fechaRenovacion + "T00:00:00").getTime() - new Date(hoy + "T00:00:00").getTime()) /
      (1000 * 60 * 60 * 24)
    );
  }

  function buildWaLink(celular: string | null | undefined, consultorio: string | null | undefined) {
    const num = celular?.replace(/\D/g, "");
    if (!num) return null;
    const esKinest = consultorio?.toLowerCase().includes("kinest");
    const msg = esKinest
      ? `Estimado paciente, le informamos que sus plantillas ortopédicas están próximas a vencer ⚠️ . Le recomendamos solicitar un turno para la renovación y un chequeo anual. Puede gestionar su turno enviando un mensaje por WhatsApp al siguiente teléfono KINEST 👇\n+54 9 11 6567-1472\n\nLas renovaciones de FG plantillas tienen un 10%OFF sin importar el medio de pago`
      : `Estimado paciente, le informamos que sus plantillas ortopédicas están próximas a vencer ⚠️ . Le recomendamos solicitar un turno para la renovación y un chequeo anual. Puede gestionar su turno respondiendo a este WhatsApp.\n\nLas renovaciones de FG plantillas tienen un 10%OFF sin importar el medio de pago`;
    return `https://wa.me/${num}?text=${encodeURIComponent(msg)}`;
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">

        {/* Columna 1: Por contactar */}
        <div className="bg-gray-50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="font-semibold text-gray-700 text-sm">Por contactar</h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
              {porContactar?.length ?? 0}
            </span>
          </div>
          <div className="space-y-3">
            {!porContactar?.length ? (
              <p className="text-sm text-gray-400 text-center py-8">Sin pacientes pendientes ✅</p>
            ) : porContactar.map((p) => {
              const paciente = p.pacientes as { id: string; nombre: string; celular: string; consultorios: { nombre: string } | null } | null;
              const dias = diasRestantes(p.fecha_renovacion);
              const waLink = buildWaLink(paciente?.celular, paciente?.consultorios?.nombre);
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
                    {waLink ? (
                      <a href={waLink} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-white bg-green-500 hover:bg-green-600 rounded-lg transition-colors">
                        {WA_ICON} WhatsApp
                      </a>
                    ) : (
                      <span className="px-2.5 py-1 text-xs text-gray-400 bg-gray-100 rounded-lg">Sin celular</span>
                    )}
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
        </div>

        {/* Columna 2: Contactados */}
        <div className="bg-gray-50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="font-semibold text-gray-700 text-sm">Contactados</h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
              {contactados?.length ?? 0}
            </span>
          </div>
          <div className="space-y-3">
            {!contactados?.length ? (
              <p className="text-sm text-gray-400 text-center py-8">Sin pacientes contactados</p>
            ) : contactados.map((p) => {
              const paciente = p.pacientes as { id: string; nombre: string; celular: string; consultorios: { nombre: string } | null } | null;
              const dias = diasRestantes(p.fecha_renovacion);
              const waLink = buildWaLink(paciente?.celular, paciente?.consultorios?.nombre);
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
                    {waLink && (
                      <a href={waLink} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-white bg-green-500 hover:bg-green-600 rounded-lg transition-colors">
                        {WA_ICON} Reenviar
                      </a>
                    )}
                    <AccionButton
                      action={actualizarEstadoContacto.bind(null, p.id, "agendado")}
                      label="✓ Agendado"
                      className="px-2.5 py-1 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-lg"
                    />
                    <AccionButton
                      action={actualizarEstadoContacto.bind(null, p.id, "no_interesado")}
                      label="✗ No interesado"
                      className="px-2.5 py-1 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Columna 3: Agendados hoy */}
        <div className="bg-gray-50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="font-semibold text-gray-700 text-sm">Agendados hoy</h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
              {agendados?.length ?? 0}
            </span>
          </div>
          <div className="space-y-3">
            {!agendados?.length ? (
              <p className="text-sm text-gray-400 text-center py-8">Sin agendados hoy</p>
            ) : agendados.map((p) => {
              const paciente = p.pacientes as { id: string; nombre: string } | null;
              const dias = diasRestantes(p.fecha_renovacion);
              return (
                <div key={p.id} className="bg-white rounded-lg border border-green-200 p-3 space-y-1.5">
                  <Link href={`/pacientes/${paciente?.id}`} className="font-medium text-gray-900 text-sm hover:text-blue-600 hover:underline block">
                    {paciente?.nombre ?? "—"}
                  </Link>
                  <DiasTag dias={dias} />
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
