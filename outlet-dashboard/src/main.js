import "./style.css";
import { loadData } from "./data.js";

const THRESHOLD = 0.9;

let DATA = [];
let current = "All";

const fmtNum = (n) => n.toLocaleString("en-SG");
const fmtMoney = (n) => "S$" + fmtNum(n);
const fmtPct = (x, d = 1) => (x * 100).toFixed(d) + "%";
const fmtWeek = (s) =>
  new Date(s + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" });
const $ = (id) => document.getElementById(id);
const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

/* Filter buttons are built from the data, so new outlets appear automatically. */
const outletList = () => ["All", ...[...new Set(DATA.map((r) => r.outlet))].sort()];

function render() {
  const rows = current === "All" ? DATA : DATA.filter((r) => r.outlet === current);
  renderFilters();
  renderKpis(rows);
  renderChart(rows);
  renderAttention(rows);
  const weeks = rows.map((r) => r.week).sort();
  $("range").textContent = weeks.length
    ? `${current} · weeks of ${fmtWeek(weeks[0])} – ${fmtWeek(weeks[weeks.length - 1])} ${weeks[0].slice(0, 4)}`
    : "No data";
}

function renderFilters() {
  $("filters").innerHTML = outletList()
    .map((o) => `<button class="${o === current ? "active" : ""}" data-o="${esc(o)}">${esc(o)}</button>`)
    .join("");
  $("filters").querySelectorAll("button").forEach((b) => {
    b.onclick = () => {
      current = b.dataset.o;
      render();
    };
  });
}

function renderKpis(rows) {
  const sum = (k) => rows.reduce((a, r) => a + r[k], 0);
  const sales = sum("sales"), target = sum("target"), orders = sum("orders"), returns = sum("returns");
  const pct = target ? sales / target : 0;
  const retPct = orders ? returns / orders : 0;
  const cards = [
    { label: "Total sales", value: fmtMoney(sales), note: `Target ${fmtMoney(target)}` },
    {
      label: "% of target",
      value: fmtPct(pct),
      note: pct >= 1 ? "On or above target" : `${fmtMoney(target - sales)} short`,
      bad: pct < THRESHOLD,
    },
    { label: "Orders", value: fmtNum(orders), note: orders ? `${fmtMoney(Math.round(sales / orders))} avg order` : "" },
    { label: "Returns %", value: fmtPct(retPct, 2), note: `${fmtNum(returns)} returns` },
  ];
  $("kpis").innerHTML = cards
    .map(
      (c) => `
    <div class="card kpi">
      <div class="label">${c.label}</div>
      <div class="value ${c.bad ? "bad" : ""}">${c.value}</div>
      <div class="note">${c.note}</div>
    </div>`
    )
    .join("");
}

function renderChart(rows) {
  const sorted = [...rows].sort((a, b) => a.outlet.localeCompare(b.outlet) || a.week.localeCompare(b.week));
  const max = Math.max(1.2, ...sorted.map((r) => r.sales / r.target)) * 1.05;
  const y = (v) => (v / max) * 100;
  const lines = [0.5, 1]
    .map((v) => `<div class="gridline ${v === 1 ? "target" : ""}" style="bottom:${y(v)}%"><span>${v * 100}%</span></div>`)
    .join("");
  const bars = sorted
    .map((r) => {
      const p = r.sales / r.target;
      return `<div class="col" title="${esc(r.outlet)}, week of ${fmtWeek(r.week)}: ${fmtMoney(r.sales)} of ${fmtMoney(r.target)}">
      <div class="bar ${p < THRESHOLD ? "bad" : ""}" style="height:${y(p)}%"><b>${fmtPct(p, 0)}</b></div></div>`;
    })
    .join("");
  $("chart").innerHTML = lines + bars;
  $("xlabels").innerHTML = sorted
    .map((r) => `<div><strong>${esc(r.outlet)}</strong>${fmtWeek(r.week)}</div>`)
    .join("");
}

function renderAttention(rows) {
  const low = rows
    .map((r) => ({ ...r, p: r.sales / r.target }))
    .filter((r) => r.p < THRESHOLD)
    .sort((a, b) => a.p - b.p);
  $("attn").innerHTML = low.length
    ? low
        .map(
          (r) => `
      <li>
        <div><div class="who">${esc(r.outlet)}</div><div class="when">Week of ${fmtWeek(r.week)}</div></div>
        <div><div class="pct">${fmtPct(r.p)}</div><div class="gap">${fmtMoney(r.target - r.sales)} short</div></div>
      </li>`
        )
        .join("")
    : `<div class="empty">Nothing under 90% of target.</div>`;
}

loadData().then(({ rows, source }) => {
  DATA = rows;
  if (source === "csv") {
    const b = $("banner");
    b.textContent = "Showing bundled sample data. Live data from Supabase could not be loaded.";
    b.hidden = false;
  }
  render();
});
