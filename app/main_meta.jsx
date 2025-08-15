import React, { useEffect, useMemo, useState } from "react";

const TABS = [
  { key: "interests", label: "Interests" },
  { key: "behaviors", label: "Behaviors" },
  { key: "job_titles", label: "Job Titles" },
  { key: "employers", label: "Employers" },
  { key: "demographics", label: "Demographics" },
  { key: "life_events", label: "Life Events" },
  { key: "industries", label: "Industries" },
  { key: "geos", label: "Geos" }
];

function ThemeToggle() {
  const [dark, setDark] = useState(true);
  useEffect(() => {
    const saved = localStorage.getItem("theme-dark");
    const d = saved ? saved === "1" : true;
    setDark(d);
    document.documentElement.style.background = d ? "#0a0a0a" : "#fafafa";
    document.body.style.background = d ? "#0a0a0a" : "#fafafa";
    document.body.style.color = d ? "#fafafa" : "#0a0a0a";
  }, []);
  return (
    <button onClick={() => {
      const v = !dark; setDark(v);
      localStorage.setItem("theme-dark", v ? "1" : "0");
      document.documentElement.style.background = v ? "#0a0a0a" : "#fafafa";
      document.body.style.background = v ? "#0a0a0a" : "#fafafa";
      document.body.style.color = v ? "#fafafa" : "#0a0a0a";
    }} style={{border:"1px solid #3a3a3a", borderRadius:12, padding:"8px 10px", background:"transparent", color:"inherit"}} aria-label="Toggle theme">
      {dark ? "🌙" : "☀️"}
    </button>
  );
}

export default function App() {
  const [token, setToken] = useState("");
  const [apiVersion, setApiVersion] = useState("v20.0");
  const [activeTab, setActiveTab] = useState("interests");
  const [q, setQ] = useState("");
  const [limit, setLimit] = useState(50);
  const [locale, setLocale] = useState("en_US");
  const [country, setCountry] = useState("IN");
  const [minAudience, setMinAudience] = useState<number | "">("");
  const [maxAudience, setMaxAudience] = useState<number | "">("");
  const [topic, setTopic] = useState("");
  const [pathContains, setPathContains] = useState("");
  const [minRelevance, setMinRelevance] = useState<number | "">("");
  const [availabilityCountry, setAvailabilityCountry] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [basket, setBasket] = useState<any[]>([]);
  const [appUsage, setAppUsage] = useState<any>(null);

  useEffect(() => {
    const stored = localStorage.getItem("mif_settings");
    if (stored) {
      try {
        const j = JSON.parse(stored);
        if (j.token) setToken(j.token);
        if (j.apiVersion) setApiVersion(j.apiVersion);
        if (j.locale) setLocale(j.locale);
        if (j.country) setCountry(j.country);
      } catch {}
    }
  }, []);
  useEffect(() => {
    localStorage.setItem("mif_settings", JSON.stringify({ token, apiVersion, locale, country }));
  }, [token, apiVersion, locale, country]);

  const base = useMemo(() => `https://graph.facebook.com/${apiVersion}`, [apiVersion]);

  async function call(url: string) {
    const u = new URL(url);
    u.searchParams.set("access_token", token);
    setError(null);
    const res = await fetch(u.toString());
    const usage = res.headers.get("x-app-usage");
    if (usage) try { setAppUsage(JSON.parse(usage)); } catch {}
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`${res.status} ${res.statusText}: ${txt}`);
    }
    return res.json();
  }

  function applyClientFilters(list: any[]) {
    let filtered = [...list];
    if (minAudience !== "") filtered = filtered.filter((x) => (x.audience_size ?? 0) >= Number(minAudience));
    if (maxAudience !== "") filtered = filtered.filter((x) => (x.audience_size ?? 0) <= Number(maxAudience));
    if (topic) filtered = filtered.filter((x) => (x.topic || x.type || "").toLowerCase().includes(topic.toLowerCase()));
    if (pathContains) filtered = filtered.filter((x) => (x.path?.join?.(" ") || "").toLowerCase().includes(pathContains.toLowerCase()));
    if (minRelevance !== "") filtered = filtered.filter((x) => (x.relevance_score?.score ?? 0) >= Number(minRelevance));
    if (availabilityCountry) filtered = filtered.filter((x) => {
      const c = (x.audience ? x.audience.countries : x.countries) || [];
      if (!Array.isArray(c)) return false;
      return c.includes(availabilityCountry.toUpperCase());
    });
    return filtered;
  }

  async function search() {
    if (!token) { setError("Add token"); return; }
    if (!q && activeTab !== "behaviors" && activeTab !== "demographics" && activeTab !== "life_events" && activeTab !== "industries") { setError("Add query"); return; }
    setLoading(true);
    setSuggestions([]);
    setSelected(null);
    try {
      let url = "";
      if (activeTab === "interests") url = `${base}/search?type=adinterest&q=${encodeURIComponent(q)}&limit=${limit}&locale=${locale}`;
      if (activeTab === "behaviors") url = `${base}/search?type=adtargetingcategory&class=behaviors&limit=${limit}&locale=${locale}`;
      if (activeTab === "job_titles") url = `${base}/search?type=adworkposition&q=${encodeURIComponent(q)}&limit=${limit}&locale=${locale}`;
      if (activeTab === "employers") url = `${base}/search?type=adworkemployer&q=${encodeURIComponent(q)}&limit=${limit}&locale=${locale}`;
      if (activeTab === "demographics") url = `${base}/search?type=adtargetingcategory&class=demographics&limit=${limit}&locale=${locale}`;
      if (activeTab === "life_events") url = `${base}/search?type=adtargetingcategory&class=life_events&limit=${limit}&locale=${locale}`;
      if (activeTab === "industries") url = `${base}/search?type=adtargetingcategory&class=industries&limit=${limit}&locale=${locale}`;
      if (activeTab === "geos") url = `${base}/search?type=adgeolocation&q=${encodeURIComponent(q)}&location_types=${encodeURIComponent(JSON.stringify(["country","region","city","zip"]))}&limit=${limit}&locale=${locale}`;
      const res = await call(url);
      const list = Array.isArray(res?.data) ? res.data : [];
      setResults(applyClientFilters(list));
    } catch (e: any) {
      setError(e?.message || "Error");
    } finally {
      setLoading(false);
    }
  }

  async function getSuggestions(seedNames: string[]) {
    if (!token) { setError("Add token"); return; }
    setLoading(true);
    try {
      const url = `${base}/search?type=adinterestsuggestion&interest_list=${encodeURIComponent(JSON.stringify(seedNames))}&limit=${limit}&locale=${locale}`;
      const res = await call(url);
      setSuggestions(applyClientFilters(res?.data || []));
    } catch (e: any) {
      setError(e?.message || "Error");
    } finally {
      setLoading(false);
    }
  }

  function addToBasket(item: any) {
    setBasket((prev) => prev.some((p) => p.id === item.id && p.name === item.name) ? prev : [...prev, item]);
  }
  function removeFromBasket(id: string) { setBasket((prev) => prev.filter((p) => p.id !== id)); }
  function clearBasket() { setBasket([]); }

  function toTargeting(items: any[]) {
    if (activeTab === "geos") {
      const countries = items.filter((x) => x.type === "country").map((x) => x.key || x.name || x.country_code);
      const regions = items.filter((x) => x.type === "region").map((x) => ({ key: x.key, name: x.name }));
      const cities = items.filter((x) => x.type === "city").map((x) => ({ key: x.key, name: x.name }));
      const zips = items.filter((x) => x.type === "zip").map((x) => ({ key: x.key, name: x.name }));
      return JSON.stringify({ geo_locations: { countries, regions, cities, zips } }, null, 2);
    }
    const map: any = { interests: "interests", behaviors: "behaviors", job_titles: "work_positions", employers: "work_employers", demographics: "life_events", life_events: "life_events", industries: "industries" };
    const bucket = map[activeTab] || "interests";
    return JSON.stringify({ geo_locations: { countries: [country] }, flexible_spec: [{ [bucket]: items.map((x) => ({ id: x.id, name: x.name })) }] }, null, 2);
  }

  function copy(text: string) { navigator.clipboard.writeText(text); }
  function exportJSON() {
    const blob = new Blob([JSON.stringify(results, null, 2)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `meta_${activeTab}.json`; a.click();
  }
  function exportCSV() {
    const cols = new Set<string>();
    results.forEach((r) => Object.keys(r).forEach((k) => cols.add(k)));
    const headers = Array.from(cols);
    const rows = results.map((r) => headers.map((h) => JSON.stringify((r as any)[h] ?? "")));
    const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `meta_${activeTab}.csv`; a.click();
  }

  const usageText = useMemo(() => {
    if (!appUsage) return "";
    const { call_count, total_cputime, total_time } = appUsage;
    return `Calls: ${call_count ?? "-"}% | CPU: ${total_cputime ?? "-"}% | Time: ${total_time ?? "-"}%`;
  }, [appUsage]);

  return (
    <div style={{maxWidth:960, margin:"0 auto", padding:"24px"}}>
      <div style={{display:"flex", gap:8, alignItems:"center", marginBottom:12}}>
        <div style={{fontWeight:700, fontSize:20}}>Meta Interest Finder</div>
        <div style={{marginLeft:"auto", display:"flex", gap:8}}>
          <select value={apiVersion} onChange={(e)=>setApiVersion(e.target.value)} style={inputStyle}>
            {['v21.0','v20.0','v19.0','v18.0'].map(v=> <option key={v}>{v}</option>)}
          </select>
          <ThemeToggle />
        </div>
      </div>

      <div style={{display:"flex", flexWrap:"wrap", gap:8, marginBottom:12}}>
        {TABS.map(t => (
          <button key={t.key} onClick={()=>{setActiveTab(t.key); setResults([]); setSelected(null); setSuggestions([]);}} style={{...btnStyle, background: activeTab===t.key?"#fff":"#121212", color: activeTab===t.key?"#000":"#fff", borderColor: activeTab===t.key?"#fff":"#3a3a3a"}}>{t.label}</button>
        ))}
      </div>

      <div style={cardStyle}>
        <div style={{display:"grid", gridTemplateColumns:"1fr 160px 120px 120px", gap:8}}>
          <input style={{...inputStyle, gridColumn:"1 / span 1"}} placeholder={activeTab==='behaviors'? 'Keyword (optional)': 'Seed keyword'} value={q} onChange={(e)=>setQ(e.target.value)} />
          <select style={inputStyle} value={locale} onChange={(e)=>setLocale(e.target.value)}>
            {['en_US','en_GB','hi_IN','mr_IN'].map(v => <option key={v}>{v}</option>)}
          </select>
          <input style={inputStyle} value={country} onChange={(e)=>setCountry(e.target.value.toUpperCase())} placeholder="Country" />
          <input style={inputStyle} type="number" min={1} max={200} value={limit} onChange={(e)=>setLimit(parseInt(e.target.value || '50'))} />
        </div>
        <div style={{display:"flex", flexWrap:"wrap", gap:8, marginTop:12, alignItems:"center"}}>
          <input style={{...inputStyle, width:120}} type="number" placeholder="Min audience" value={minAudience as any} onChange={(e)=>setMinAudience(e.target.value? Number(e.target.value):"")} />
          <input style={{...inputStyle, width:120}} type="number" placeholder="Max audience" value={maxAudience as any} onChange={(e)=>setMaxAudience(e.target.value? Number(e.target.value):"")} />
          <input style={{...inputStyle, width:180}} placeholder="Topic contains" value={topic} onChange={(e)=>setTopic(e.target.value)} />
          <input style={{...inputStyle, width:220}} placeholder="Path contains" value={pathContains} onChange={(e)=>setPathContains(e.target.value)} />
          <input style={{...inputStyle, width:140}} type="number" step="0.1" placeholder="Min relevance" value={minRelevance as any} onChange={(e)=>setMinRelevance(e.target.value? Number(e.target.value):"")} />
          <input style={{...inputStyle, width:120}} placeholder="Avail CC" value={availabilityCountry} onChange={(e)=>setAvailabilityCountry(e.target.value.toUpperCase())} />
          <button onClick={search} disabled={loading} style={{...btnStyle, marginLeft:"auto", opacity: loading? .7:1}}>{loading? "Loading…":"Search"}</button>
        </div>
      </div>

      {error && <div style={{marginTop:12, padding:12, border:"1px solid #7a2", background:"#331", borderRadius:12, whiteSpace:"pre-wrap"}}>{error}</div>}
      {usageText && <div style={{marginTop:8, fontSize:12, opacity:.7}}>{usageText}</div>}

      <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginTop:12}}>
        <div>
          <div style={{fontSize:13, opacity:.7, marginBottom:8}}>{results.length? `${results.length} results` : 'No results yet'}</div>
          <div style={{display:"grid", gap:8}}>
            {results.map((item) => (
              <div key={(item.id||item.key)+item.name} onClick={()=>setSelected(item)} style={{...cardStyle, cursor:"pointer", borderColor: selected?.id===item.id? "#fff":"#333"}}>
                <div style={{display:"flex", justifyContent:"space-between", gap:12}}>
                  <div>
                    <div style={{fontWeight:600}}>{item.name}</div>
                    <div style={{fontSize:12, opacity:.7}}>{item.id? `ID: ${item.id}` : item.key? `Key: ${item.key}`: ''}</div>
                  </div>
                  <div style={{textAlign:"right", fontSize:12, opacity:.7}}>
                    {typeof item?.audience_size === 'number' && <div>Audience: {item.audience_size.toLocaleString()}</div>}
                    {item?.path && <div style={{maxWidth:280, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>Path: {item.path.join(' › ')}</div>}
                  </div>
                </div>
                <div style={{marginTop:8, display:"flex", gap:8}}>
                  <button style={btnGhost} onClick={(e)=>{e.stopPropagation(); addToBasket(item);}}>Save</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={cardStyle}>
          {!selected ? (
            <div style={{opacity:.8, fontSize:14}}>Select an item to inspect</div>
          ) : (
            <div style={{display:"grid", gap:12}}>
              <div style={{fontWeight:700}}>{selected.name}</div>
              <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, fontSize:14}}>
                <Field label="ID" value={selected.id || selected.key || '—'} mono />
                <Field label="Audience" value={selected.audience_size?.toLocaleString?.() || '—'} />
                <Field label="Topic/Type" value={selected.topic || selected.type || '—'} />
                <Field label="Path" value={selected.path?.join?.(' › ') || '—'} />
              </div>
              {activeTab==='interests' && (
                <div style={{display:"grid", gap:8}}>
                  <div style={{opacity:.9, fontSize:14}}>Related interest suggestions</div>
                  <div style={{display:"flex", gap:8}}>
                    <button style={btnStyle} onClick={()=>getSuggestions([selected.name])}>Get Suggestions</button>
                    {suggestions.length>0 && <button style={btnGhost} onClick={()=>getSuggestions([selected.name, ...suggestions.slice(0,5).map(s=>s.name)])}>Expand Seeds</button>}
                  </div>
                  <div style={{display:"flex", flexWrap:"wrap", gap:6, fontSize:13}}>
                    {suggestions.map(s => <span key={s.id} style={{padding:"4px 8px", border:"1px solid #333", borderRadius:8}}>{s.name}</span>)}
                  </div>
                </div>
              )}
              <div style={{display:"grid", gap:8}}>
                <div style={{opacity:.9, fontSize:14}}>Targeting JSON</div>
                <pre style={{maxHeight:240, overflow:"auto", fontSize:12, padding:12, border:"1px solid #333", borderRadius:12}}>{toTargeting([selected, ...(activeTab==='interests'? suggestions.slice(0,10): [])])}</pre>
                <div style={{display:"flex", gap:8, flexWrap:"wrap"}}>
                  <button style={btnStyle} onClick={()=>copy(toTargeting([selected]))}>Copy Targeting</button>
                  {activeTab==='interests' && suggestions.length>0 && <button style={btnGhost} onClick={()=>copy(toTargeting([selected, ...suggestions.slice(0,20)]))}>Copy + Top Suggestions</button>}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{...cardStyle, marginTop:16}}>
        <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:8}}>
          <div style={{fontWeight:600}}>Saved List</div>
          <div style={{fontSize:12, opacity:.7}}>({basket.length} items)</div>
          <div style={{marginLeft:"auto", display:"flex", gap:8}}>
            <button style={btnGhost} onClick={()=>copy(toTargeting(basket))}>Copy Targeting</button>
            <button style={btnGhost} onClick={exportJSON}>Export JSON</button>
            <button style={btnGhost} onClick={exportCSV}>Export CSV</button>
            <button style={btnGhost} onClick={clearBasket}>Clear</button>
          </div>
        </div>
        <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(220px, 1fr))", gap:8}}>
          {basket.map(b => (
            <div key={b.id} style={{padding:12, border:"1px solid #333", borderRadius:12}}>
              <div style={{fontSize:14, fontWeight:600, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}}>{b.name}</div>
              <div style={{fontSize:11, opacity:.7, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}}>{b.id}</div>
              <div style={{textAlign:"right", marginTop:8}}>
                <button style={btnGhost} onClick={()=>removeFromBasket(b.id)}>Remove</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{marginTop:12, fontSize:12, opacity:.7}}>Enter a Marketing API token above. This client calls the Graph API directly.</div>

      <div style={{display:"none"}}>
        {JSON.stringify(filesMeta)}
      </div>
    </div>
  );
}

function Field({ label, value, mono = false }: { label: string; value: any; mono?: boolean }) {
  return (
    <div>
      <div style={{fontSize:12, opacity:.7, marginBottom:4}}>{label}</div>
      <div style={{fontSize:14, fontFamily: mono? "ui-monospace, SFMono-Regular, Menlo, monospace": undefined}}>{String(value ?? '—')}</div>
    </div>
  );
}

const inputStyle: React.CSSProperties = { padding:"10px 12px", borderRadius:12, border:"1px solid #3a3a3a", background:"transparent", color:"inherit" };
const btnStyle: React.CSSProperties = { padding:"10px 14px", borderRadius:12, border:"1px solid #fff", background:"#fff", color:"#000", fontWeight:600 };
const btnGhost: React.CSSProperties = { padding:"8px 12px", borderRadius:12, border:"1px solid #3a3a3a", background:"transparent", color:"inherit" };
const cardStyle: React.CSSProperties = { padding:16, borderRadius:16, border:"1px solid #333" };

const filesMeta = {
  "package.json": `{
  "name": "meta-interest-finder",
  "private": true,
  "version": "1.0.1",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest run"
  },
  "dependencies": {
    "framer-motion": "^11.0.0",
    "lucide-react": "^0.453.0",
    "next": "14.2.5",
    "react": "18.3.1",
    "react-dom": "18.3.1"
  },
  "devDependencies": {
    "@types/node": "20.11.30",
    "@types/react": "18.2.66",
    "@types/react-dom": "18.2.22",
    "autoprefixer": "10.4.19",
    "eslint": "8.57.0",
    "eslint-config-next": "14.2.5",
    "postcss": "8.4.38",
    "tailwindcss": "3.4.4",
    "typescript": "5.4.5",
    "vitest": "1.6.0"
  }
}`,
  "tsconfig.json": `{
  "compilerOptions": {
    "target": "ES2021",
    "lib": ["ES2021", "DOM", "DOM.Iterable"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": false,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "baseUrl": ".",
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}`,
  "vercel.json": `{
  "functions": { "app/api/**/*.ts": { "maxDuration": 10 } }
}`
};
