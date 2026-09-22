import { useState, useRef, useEffect } from "react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, FunnelChart, Funnel
} from "recharts";

// ─── Data ───────────────────────────────────────────────────────────────────

const sparkData = (base: number, noise: number) =>
  Array.from({ length: 12 }, (_, i) => ({ v: base + Math.sin(i * 0.8) * noise + Math.random() * noise * 0.5 }));

// ─── Types ───────────────────────────────────────────────────────────────────

interface Deal {
  id: string; company: string; contact: string; budget: string;
  prob: number; days: number; owner: string; tag: string;
}

type NavView = "dashboard" | "contacts" | "kanban" | "activity" | "automation" | "analytics" | "settings";

interface DashboardData {
  kpis: {
    revenue: { value: string; change: string; spark: { v: number }[] };
    conversion: { value: string; change: string; spark: { v: number }[] };
    deals: { value: string; change: string; spark: { v: number }[] };
    clv: { value: string; change: string; spark: { v: number }[] };
  };
  revenueForecast: { d: string; v: number; f: number }[];
  recentActivity: { id: number; type: string; icon: string; title: string; sub: string; time: string; color: string }[];
  priorityFollowups: { contact: string; company: string; task: string; due: string; priority: string }[];
}

interface Activity {
  id: number;
  type: string;
  icon: string;
  title: string;
  sub: string;
  time: string;
  color: string;
}

// ─── API Setup ───────────────────────────────────────────────────────────────

const API_BASE = "https://divout-crm-api.onrender.com/api";

async function fetchApi(endpoint: string) {
  const response = await fetch(`${API_BASE}${endpoint}`);
  if (!response.ok) throw new Error("API Error");
  return response.json();
}

// ─── Components ──────────────────────────────────────────────────────────────

function Avatar({ initials, size = 28, gradient = false }: { initials: string; size?: number; gradient?: boolean }) {
  const colors = ["#00D9FF", "#8B5CF6", "#34d399", "#fbbf24", "#f472b6", "#818cf8"];
  const hash = initials.charCodeAt(0) + (initials.charCodeAt(1) || 0);
  const c = colors[hash % colors.length];
  return (
    <div
      style={{
        width: size, height: size, borderRadius: "50%", display: "flex",
        alignItems: "center", justifyContent: "center",
        background: gradient ? "linear-gradient(135deg,#00D9FF,#8B5CF6)" : `${c}22`,
        border: `1.5px solid ${c}44`, fontSize: size * 0.38, fontWeight: 700, color: c,
        fontFamily: "JetBrains Mono, monospace", flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
}

function SparkLine({ data, color = "#00D9FF" }: { data: { v: number }[]; color?: string }) {
  return (
    <ResponsiveContainer width="100%" height={40}>
      <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={`sg-${color.slice(1)}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.25} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5}
          fill={`url(#sg-${color.slice(1)})`} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function KpiCard({ label, value, change, color, sparkColor, sparkData }: {
  label: string; value: string; change: string; color: string; sparkColor: string; sparkData: { v: number }[];
}) {
  const positive = change.startsWith("+");
  return (
    <div className="glass glow-card rounded-2xl p-5 fade-up" style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
        {label}
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, color: "#fff", lineHeight: 1.1, marginBottom: 4, fontFamily: "JetBrains Mono, monospace" }}>
        {value}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: positive ? "#34d399" : "#f87171" }}>
          {change}
        </span>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>vs last month</span>
      </div>
      <SparkLine data={sparkData} color={sparkColor} />
    </div>
  );
}

function StageTag({ stage }: { stage: string }) {
  const map: Record<string, string> = {
    "Prospecting": "badge-cyan", "Discovery": "badge-violet",
    "Proposal": "badge-amber", "Negotiation": "badge-red", "Won": "badge-green",
  };
  return <span className={map[stage] || "badge-cyan"}>{stage}</span>;
}

// ─── Views ───────────────────────────────────────────────────────────────────

function DashboardView() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    fetchApi("/dashboard").then(setData);
  }, []);

  if (!data) return <div style={{ padding: 32, color: "rgba(255,255,255,0.5)" }}>Loading Executive Overview...</div>;

  return (
    <div style={{ padding: "28px 32px", overflowY: "auto", height: "100%" }} className="fade-up">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#fff", marginBottom: 4 }}>Executive Overview</h1>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>Revenue intelligence & pipeline health · Q4 2025</p>
      </div>

      <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
        <KpiCard label="Total Revenue" value={data.kpis.revenue.value} change={data.kpis.revenue.change} color="#00D9FF" sparkColor="#00D9FF" sparkData={data.kpis.revenue.spark} />
        <KpiCard label="Conversion Rate" value={data.kpis.conversion.value} change={data.kpis.conversion.change} color="#8B5CF6" sparkColor="#8B5CF6" sparkData={data.kpis.conversion.spark} />
        <KpiCard label="Active Deals" value={data.kpis.deals.value} change={data.kpis.deals.change} color="#34d399" sparkColor="#34d399" sparkData={data.kpis.deals.spark} />
        <KpiCard label="Avg CLV" value={data.kpis.clv.value} change={data.kpis.clv.change} color="#fbbf24" sparkColor="#fbbf24" sparkData={data.kpis.clv.spark} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 16, marginBottom: 16 }}>
        <div className="glass glow-card rounded-2xl p-5">
          <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 20 }}>Revenue Forecast (Actual vs Forecast)</div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data.revenueForecast} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="rev-grad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#00D9FF" stopOpacity={0.2} /><stop offset="95%" stopColor="#00D9FF" stopOpacity={0} /></linearGradient>
                <linearGradient id="fore-grad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.15} /><stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} /></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="d" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={v => `$${(v / 1000).toFixed(0)}K`} tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "#0D0E12", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, fontSize: 12 }} labelStyle={{ color: "#fff" }} formatter={(v) => [`$${(Number(v) / 1000).toFixed(0)}K`]} />
              <Area type="monotone" dataKey="v" stroke="#00D9FF" strokeWidth={2} fill="url(#rev-grad)" dot={false} name="Actual" />
              <Area type="monotone" dataKey="f" stroke="#8B5CF6" strokeWidth={1.5} fill="url(#fore-grad)" dot={false} strokeDasharray="4 3" name="Forecast" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="glass glow-card rounded-2xl p-5">
          <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 16 }}>Recent Activity</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, overflowY: "auto", maxHeight: 260 }}>
            {data.recentActivity.slice(0, 5).map(a => (
              <div key={a.id} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: `${a.color}18`, border: `1px solid ${a.color}33`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, flexShrink: 0 }}>{a.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: "#e8eaf0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.title}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.sub}</div>
                </div>
                <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.25)", flexShrink: 0 }}>{a.time}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="glass glow-card rounded-2xl p-5">
        <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 16 }}>Priority Follow-ups</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {data.priorityFollowups.map((t, i) => (
            <div key={i} className="table-row" style={{ display: "flex", alignItems: "center", gap: 16, padding: "8px 0" }}>
              <input type="checkbox" style={{ accentColor: "#00D9FF", width: 14, height: 14, flexShrink: 0 }} />
              <Avatar initials={t.contact.split(" ").map(x => x[0]).join("")} size={26} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#e8eaf0" }}>{t.task}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>{t.contact} · {t.company}</div>
              </div>
              <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.4)" }}>{t.due}</div>
              <span className={t.priority === "High" ? "badge-red" : "badge-amber"}>{t.priority}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function KanbanView() {
  const [deals, setDeals] = useState<Record<string, Deal[]>>({});
  const [dragging, setDragging] = useState<{ deal: Deal; from: string } | null>(null);
  const stages = [
    { key: "prospecting", label: "Prospecting", color: "#00D9FF" },
    { key: "discovery", label: "Discovery Call", color: "#818cf8" },
    { key: "proposal", label: "Proposal Sent", color: "#fbbf24" },
    { key: "negotiation", label: "Negotiation", color: "#f97316" },
    { key: "won", label: "Won / Closed", color: "#34d399" },
  ];

  useEffect(() => {
    fetchApi("/kanban").then(setDeals);
  }, []);

  const handleDrop = (toKey: string) => {
    if (!dragging) return;
    if (dragging.from === toKey) { setDragging(null); return; }
    setDeals(prev => {
      const next = { ...prev };
      next[dragging.from] = prev[dragging.from].filter(d => d.id !== dragging.deal.id);
      next[toKey] = [...(prev[toKey] || []), dragging.deal];
      return next;
    });
    setDragging(null);
  };

  if (!Object.keys(deals).length) return <div style={{ padding: 32, color: "rgba(255,255,255,0.5)" }}>Loading Kanban...</div>;

  return (
    <div style={{ padding: "28px 32px", height: "100%", display: "flex", flexDirection: "column" }} className="fade-up">
      <div style={{ marginBottom: 20 }}><h1 style={{ fontSize: 22, fontWeight: 800, color: "#fff" }}>Deal Pipeline</h1></div>
      <div style={{ display: "flex", gap: 14, flex: 1, overflowX: "auto", paddingBottom: 8 }}>
        {stages.map(stage => {
          const col = deals[stage.key] || [];
          const total = col.reduce((s, d) => s + parseInt(d.budget.replace(/[$K,]/g, "")) * (d.budget.includes("K") ? 1000 : 1), 0);
          return (
            <div key={stage.key} onDragOver={e => e.preventDefault()} onDrop={() => handleDrop(stage.key)} style={{ flex: "0 0 240px", display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}><div style={{ width: 6, height: 6, borderRadius: "50%", background: stage.color }} /><span style={{ fontSize: 12.5, fontWeight: 700, color: "rgba(255,255,255,0.7)" }}>{stage.label}</span></div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ fontSize: 11, fontFamily: "JetBrains Mono", color: "rgba(255,255,255,0.3)" }}>${(total / 1000).toFixed(0)}K</span><span className="badge-cyan" style={{ background: `${stage.color}18`, color: stage.color, borderColor: `${stage.color}33` }}>{col.length}</span></div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, overflowY: "auto", flex: 1 }}>
                {col.map(deal => (
                  <div key={deal.id} className="glass kanban-card glow-card rounded-xl" draggable onDragStart={() => setDragging({ deal, from: stage.key })} style={{ padding: "14px", opacity: dragging?.deal.id === deal.id ? 0.4 : 1 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}><span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{deal.company}</span><span className="badge-cyan" style={{ fontSize: 10, background: `${stage.color}14`, color: stage.color, borderColor: `${stage.color}28` }}>{deal.tag}</span></div>
                    <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.4)", marginBottom: 10 }}>{deal.contact}</div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}><span style={{ fontSize: 14, fontWeight: 700, fontFamily: "JetBrains Mono", color: "#e8eaf0" }}>{deal.budget}</span><Avatar initials={deal.owner} size={22} /></div>
                    <div className="progress-bar-bg"><div className="progress-bar-fill" style={{ width: `${deal.prob}%`, background: `linear-gradient(90deg, ${stage.color}, ${stage.color}88)` }} /></div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ContactsView() {
  const [contacts, setContacts] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<any | null>(null);

  useEffect(() => {
    fetchApi("/contacts").then(setContacts);
  }, []);

  const filtered = contacts.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.company.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ padding: "28px 32px", height: "100%", display: "flex", flexDirection: "column" }} className="fade-up">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div><h1 style={{ fontSize: 22, fontWeight: 800, color: "#fff" }}>Contacts</h1><p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>{contacts.length} total contacts</p></div>
        <input className="input-field" style={{ width: 220 }} placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      <div className="glass glow-card rounded-2xl" style={{ flex: 1, overflowY: "auto" }}>
        {filtered.map(c => (
          <div key={c.id} className="table-row" style={{ display: "flex", padding: "10px 16px", gap: 12, alignItems: "center", cursor: "pointer" }} onClick={() => setSelected(c)}>
            <Avatar initials={c.avatar} size={28} />
            <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 600, color: "#e8eaf0" }}>{c.company}</div><div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.7)" }}>{c.name}</div></div>
            <StageTag stage={c.stage} />
          </div>
        ))}
      </div>
    </div>
  );
}

function ActivityView() {
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    fetchApi("/activities").then(setActivities);
  }, []);

  return (
    <div style={{ padding: "28px 32px", height: "100%", display: "flex", flexDirection: "column" }} className="fade-up">
      <div style={{ marginBottom: 20 }}><h1 style={{ fontSize: 22, fontWeight: 800, color: "#fff" }}>Activity Feed</h1></div>
      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 3 }}>
        {activities.map(a => (
          <div key={a.id} className="glass glass-hover glow-card rounded-xl" style={{ padding: "14px 16px", display: "flex", gap: 14, alignItems: "center" }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: `${a.color}18`, border: `1px solid ${a.color}33`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>{a.icon}</div>
            <div style={{ flex: 1 }}><div style={{ fontSize: 13.5, fontWeight: 700, color: "#e8eaf0" }}>{a.title}</div><div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>{a.sub}</div></div>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)" }}>{a.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const NODES = [
  { id: "n1", type: "trigger", label: "Website Lead Webhook", sub: "POST /api/leads", x: 40, y: 140, color: "#00D9FF" },
  { id: "n2", type: "condition", label: "Lead Score Check", sub: "Score ≥ 70", x: 260, y: 80, color: "#818cf8" },
  { id: "n3", type: "condition", label: "Deal Size Filter", sub: "Budget ≥ $20K", x: 260, y: 220, color: "#818cf8" },
  { id: "n4", type: "action", label: "Assign to AE", sub: "Round-robin routing", x: 480, y: 60, color: "#fbbf24" },
  { id: "n5", type: "action", label: "Start Drip Sequence", sub: "5-email nurture flow", x: 480, y: 180, color: "#fbbf24" },
  { id: "n6", type: "action", label: "Slack Notification", sub: "#new-leads channel", x: 700, y: 60, color: "#34d399" },
  { id: "n7", type: "action", label: "WhatsApp Alert", sub: "Deal stage changed", x: 700, y: 200, color: "#34d399" },
];

const EDGES = [
  { from: "n1", to: "n2" }, { from: "n1", to: "n3" },
  { from: "n2", to: "n4" }, { from: "n3", to: "n5" },
  { from: "n4", to: "n6" }, { from: "n5", to: "n7" },
];

function AutomationView() {
  const nodeMap = Object.fromEntries(NODES.map(n => [n.id, n]));
  const typeIcon: Record<string, string> = { trigger: "⚡", condition: "◆", action: "▶" };
  const typeLabel: Record<string, string> = { trigger: "Trigger", condition: "Condition", action: "Action" };

  return (
    <div style={{ padding: "28px 32px", height: "100%", display: "flex", flexDirection: "column" }} className="fade-up">
      <div style={{ marginBottom: 20 }}><h1 style={{ fontSize: 22, fontWeight: 800, color: "#fff" }}>Automation</h1></div>
      <div className="glass glow-card rounded-2xl" style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
          {EDGES.map((e, i) => {
            const from = nodeMap[e.from], to = nodeMap[e.to];
            return <path key={i} d={`M${from.x + 175},${from.y + 36} C${(from.x + 175 + to.x + 12) / 2},${from.y + 36} ${(from.x + 175 + to.x + 12) / 2},${to.y + 36} ${to.x + 12},${to.y + 36}`} fill="none" stroke="rgba(0,217,255,0.2)" strokeWidth="1.5" strokeDasharray="5,4" />;
          })}
        </svg>
        {NODES.map(n => (
          <div key={n.id} className="glass-strong node-block" style={{ left: n.x, top: n.y, width: 175, position: "absolute", padding: 10, borderRadius: 8, border: `1px solid ${n.color}33` }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: n.color, textTransform: "uppercase" }}>{typeLabel[n.type]}</div>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: "#e8eaf0" }}>{n.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AnalyticsView() {
  return <div style={{ padding: 32, color: "#fff" }}>Analytics View</div>;
}

function SettingsView() {
  return <div style={{ padding: 32, color: "#fff" }}>Settings View</div>;
}

// ─── App Shell ───────────────────────────────────────────────────────────────

const NAV_ITEMS: { key: NavView; label: string; icon: string }[] = [
  { key: "dashboard", label: "Dashboard", icon: "◈" },
  { key: "contacts", label: "Contacts", icon: "◉" },
  { key: "kanban", label: "Deal Pipeline", icon: "⊟" },
  { key: "activity", label: "Activity Feed", icon: "◎" },
  { key: "automation", label: "Automation", icon: "⊕" },
  { key: "analytics", label: "Analytics", icon: "◇" },
  { key: "settings", label: "Settings", icon: "◌" },
];

export default function App() {
  const [view, setView] = useState<NavView>("dashboard");

  const renderView = () => {
    switch (view) {
      case "dashboard": return <DashboardView />;
      case "contacts": return <ContactsView />;
      case "kanban": return <KanbanView />;
      case "activity": return <ActivityView />;
      case "automation": return <AutomationView />;
      case "analytics": return <AnalyticsView />;
      case "settings": return <SettingsView />;
    }
  };

  return (
    <div style={{ display: "flex", height: "100vh", background: "#070709", overflow: "hidden" }}>
      <div className="glass" style={{ width: 220, borderRight: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: 20, fontSize: 18, fontWeight: 900, color: "#fff", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>Divout</div>
        <nav style={{ padding: 8, flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
          {NAV_ITEMS.map(item => (
            <div key={item.key} className={`nav-item${view === item.key ? " active" : ""}`} onClick={() => setView(item.key)} style={{ display: "flex", gap: 10, padding: 8, borderRadius: 8, cursor: "pointer", alignItems: "center", color: view === item.key ? "#fff" : "rgba(255,255,255,0.6)", background: view === item.key ? "rgba(255,255,255,0.05)" : undefined }}><span style={{ fontSize: 16 }}>{item.icon}</span><span>{item.label}</span></div>
          ))}
        </nav>
      </div>
      <div style={{ flex: 1, overflow: "hidden" }}>{renderView()}</div>
    </div>
  );
}