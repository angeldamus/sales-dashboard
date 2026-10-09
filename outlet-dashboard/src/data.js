import { createClient } from "@supabase/supabase-js";

/* ------------------------------------------------------------------
   DATA LOADING — the only place data comes from.
   loadData() reads public.outlet_weeks from Supabase and falls back to
   the bundled CSV if Supabase is not configured or the request fails.
   Returns { rows, source } where source is "supabase" or "csv".
   Every row is { outlet, week, sales, target, orders, returns }.
------------------------------------------------------------------- */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY;

const supabase =
  SUPABASE_URL && SUPABASE_KEY ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;

export async function loadData() {
  if (!supabase) {
    console.warn("VITE_SUPABASE_URL / VITE_SUPABASE_KEY not set, using bundled CSV.");
    return { rows: loadFromCsv(), source: "csv" };
  }
  try {
    const { data, error } = await supabase
      .from("outlet_weeks")
      .select("outlet, week, sales, target, orders, returns")
      .order("outlet")
      .order("week");
    if (error) throw error;
    if (!data.length) throw new Error("outlet_weeks returned no rows");
    const rows = data.map((r) => ({
      outlet: r.outlet,
      week: r.week,
      sales: Number(r.sales),
      target: Number(r.target),
      orders: Number(r.orders),
      returns: Number(r.returns),
    }));
    return { rows, source: "supabase" };
  } catch (err) {
    console.warn("Supabase load failed, using bundled CSV fallback:", err);
    return { rows: loadFromCsv(), source: "csv" };
  }
}

const CSV = `outlet,week,sales,target,orders,returns
Tampines,2026-09-07,18400,18000,612,9
Tampines,2026-09-14,16100,18000,540,14
Tampines,2026-09-21,19200,18000,640,8
Jurong,2026-09-07,14200,15000,488,11
Jurong,2026-09-14,12600,15000,430,19
Jurong,2026-09-21,15300,15000,512,10
Orchard,2026-09-07,22500,24000,690,12
Orchard,2026-09-14,20100,24000,612,21
Orchard,2026-09-21,24800,24000,742,9`;

function loadFromCsv() {
  const [head, ...lines] = CSV.trim().split("\n");
  const cols = head.split(",");
  return lines.map((l) => {
    const v = l.split(",");
    const r = Object.fromEntries(cols.map((c, i) => [c, v[i]]));
    ["sales", "target", "orders", "returns"].forEach((k) => (r[k] = Number(r[k])));
    return r;
  });
}
