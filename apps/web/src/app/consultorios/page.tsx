import { createClient } from "@/lib/supabase/server";
import ConsultoriosClient from "./ConsultoriosClient";

export default async function ConsultoriosPage() {
  const supabase = await createClient();
  const { data: consultorios } = await supabase
    .from("consultorios")
    .select("id, nombre, created_at")
    .order("nombre");

  return <ConsultoriosClient consultorios={consultorios ?? []} />;
}
