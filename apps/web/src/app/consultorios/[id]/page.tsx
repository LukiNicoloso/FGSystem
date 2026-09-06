import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import ConsultorioConfig from "./ConsultorioConfig";

export const dynamic = "force-dynamic";

export default async function ConsultorioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: consultorio } = await supabase
    .from("consultorios")
    .select(
      "id, nombre, direccion, recordatorio_estudio_activo, recordatorio_entrega_activo, recordatorio_firma, telefono_avisos"
    )
    .eq("id", id)
    .single();

  if (!consultorio) notFound();

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <Link href="/consultorios" className="text-sm text-blue-600 hover:underline">
          ← Volver a consultorios
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">{consultorio.nombre}</h1>
        <p className="text-sm text-gray-500 mt-0.5">Datos y recordatorios</p>
      </div>

      <ConsultorioConfig
        consultorio={consultorio as Parameters<typeof ConsultorioConfig>[0]["consultorio"]}
      />
    </div>
  );
}
