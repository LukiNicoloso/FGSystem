import { createClient } from "@/lib/supabase/server";
import SeguimientoGrid from "./SeguimientoGrid";

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

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Seguimiento</h1>
        <p className="text-sm text-gray-500 mt-0.5">Seguimiento de renovaciones</p>
      </div>
      <SeguimientoGrid plantillas={(porContactar ?? []) as Parameters<typeof SeguimientoGrid>[0]["plantillas"]} hoy={hoy} />
    </div>
  );
}
