import { createClient } from "@/lib/supabase/server";
import ConsultoriosClient from "./ConsultoriosClient";

export const revalidate = 30;

export default async function ConsultoriosPage() {
  const supabase = await createClient();
  const { data: consultorios } = await supabase
    .from("consultorios")
    .select("id, nombre, created_at, recordatorio_estudio_activo, recordatorio_entrega_activo")
    .order("nombre");

  return <ConsultoriosClient consultorios={consultorios ?? []} />;
}
