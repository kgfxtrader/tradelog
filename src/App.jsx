import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from "recharts";

// ─── FONTS ────────────────────────────────────────────────────────────────────
const FONT_URL = "https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap";
const FONT_BODY = "'Outfit', sans-serif";
const FONT_MONO = "'JetBrains Mono', monospace";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const ACCOUNTS = { FX: "FX", INDICES: "Indices" };
const FX_PAIRS = ["EURUSD","GBPUSD","USDJPY","USDCHF","AUDUSD","NZDUSD","USDCAD","EURGBP","EURJPY","GBPJPY","XAUUSD","GBPCHF","EURCAD","AUDCAD"];
const INDEX_PAIRS = ["DAX40","NAS100","SP500","DOW30","FTSE100","NIKKEI225","CAC40","ASX200","VIX","RUSSELL2000"];
const ALL_PAIRS = [...FX_PAIRS, ...INDEX_PAIRS];
const PAIRS = ALL_PAIRS; // keep backward compat
const SESSIONS = ["Asian","London","New York","London/NY Overlap"];
const SETUPS = ["Fair Value Gap (FVG)","Order Block (OB)","Breaker Block","MSS","CHoCH","Liquidity Sweep","Power of 3 (AMD)","OTE","Killzone Entry","Judas Swing","Silver Bullet","Unicorn Model","Turtle Soup","NWOG/NDOG","PD Array"];
const EMOTIONS = ["Confident","Calm","Focused","Anxious","FOMO","Revenge","Bored","Distracted","Euphoric"];
const EMO_COLORS = {Confident:"#00e676",Calm:"#64b5f6",Focused:"#69f0ae",Anxious:"#ffc400",FOMO:"#ff6d00",Revenge:"#e040fb",Bored:"#6b7494",Distracted:"#ff5252",Euphoric:"#f48fb1"};
const CHECKLIST = ["HTF bias aligned","Killzone active","Confluence present","Risk calculated"];
const CHART_TFS = ["Daily","H4","H1","5min"];

const TEMPLATES = [
  {id:"classic_bull",name:"Classic Bullish",bias:"Bullish",pts:[20,15,40,75,85],desc:"Monday sweeps prior lows. Tuesday liquidity grab. Wednesday impulse up. Thursday–Friday expansion to weekly highs.",tags:["Low of Week Mon/Tue","High of Week Thu/Fri"]},
  {id:"classic_bear",name:"Classic Bearish",bias:"Bearish",pts:[80,85,60,25,15],desc:"Monday sweeps prior highs. Tuesday false push. Wednesday impulse down. Thursday–Friday expansion to weekly lows.",tags:["High of Week Mon/Tue","Low of Week Thu/Fri"]},
  {id:"wed_rev_bull",name:"Wednesday Reversal — Bull",bias:"Bullish",pts:[55,35,10,65,80],desc:"Monday–Tuesday decline. Wednesday forms Low of Week. Thursday–Friday bullish expansion.",tags:["Low of Week Wednesday","Mid-week Reversal"]},
  {id:"wed_rev_bear",name:"Wednesday Reversal — Bear",bias:"Bearish",pts:[45,65,90,35,20],desc:"Monday–Tuesday rally. Wednesday forms High of Week. Thursday–Friday bearish expansion.",tags:["High of Week Wednesday","Mid-week Reversal"]},
  {id:"pow3_bull",name:"Power of 3 — Bull AMD",bias:"Bullish",pts:[50,35,30,70,85],desc:"Accumulation Mon–Tue. Manipulation (stop hunt below) Wed. Distribution mark-up Thu–Fri.",tags:["AMD","Accumulation","Manipulation Wed"]},
  {id:"pow3_bear",name:"Power of 3 — Bear AMD",bias:"Bearish",pts:[50,65,70,30,15],desc:"Accumulation Mon–Tue. Manipulation (stop hunt above) Wed. Distribution mark-down Thu–Fri.",tags:["AMD","Accumulation","Manipulation Wed"]},
  {id:"seek_bull",name:"Seek & Destroy — Bull",bias:"Bullish",pts:[60,25,20,70,80],desc:"Early week aggressive move down to seek buy-side stops. Mid-week reversal. Strong expansion up.",tags:["False Breakdown","Buy-side Hunt"]},
  {id:"seek_bear",name:"Seek & Destroy — Bear",bias:"Bearish",pts:[40,75,80,30,20],desc:"Early week aggressive move up to seek sell-side stops. Mid-week reversal. Strong expansion down.",tags:["False Breakout","Sell-side Hunt"]},
  {id:"outside_bull",name:"Outside Week — Bull",bias:"Bullish",pts:[50,20,45,90,88],desc:"Week trades below prior low then above prior high. Bearish start then bullish expansion.",tags:["Engulfing Week","Prior Week High Taken"]},
  {id:"outside_bear",name:"Outside Week — Bear",bias:"Bearish",pts:[50,80,55,10,12],desc:"Week trades above prior high then below prior low. Bullish start then bearish expansion.",tags:["Engulfing Week","Prior Week Low Taken"]},
  {id:"inside_week",name:"Inside / Consolidation",bias:"Neutral",pts:[50,55,45,52,48],desc:"Price stays within prior week range. No new highs or lows. Avoid directional bias.",tags:["Ranging","Pre-expansion Coil"]},
  {id:"expansion_bull",name:"Expansion Week — Bull",bias:"Bullish",pts:[30,45,60,75,90],desc:"Relentless bullish expansion all week. Monday low holds, higher highs every session.",tags:["Trending Week","Higher Highs Daily"]},
  {id:"expansion_bear",name:"Expansion Week — Bear",bias:"Bearish",pts:[70,55,40,25,10],desc:"Relentless bearish expansion all week. Monday high holds, lower lows every session.",tags:["Trending Week","Lower Lows Daily"]},
  {id:"open_drive_bull",name:"Open Drive Monday — Bull",bias:"Bullish",pts:[40,70,65,78,85],desc:"Monday opens and drives immediately higher. Do not fade Monday's direction.",tags:["Open Drive","Monday Directional"]},
  {id:"open_drive_bear",name:"Open Drive Monday — Bear",bias:"Bearish",pts:[60,30,35,22,15],desc:"Monday opens and drives immediately lower. Do not fade Monday's direction.",tags:["Open Drive","Monday Directional"]},
];

// ─── THEME ────────────────────────────────────────────────────────────────────
const G = "#22c55e";        // green — wins
const R = "#ef4444";        // red — losses
const A = "#d97706";        // amber
const GOLD = "#d4a017";     // primary gold accent (like screenshot)
const GOLD_L = "#f0b429";   // lighter gold
const GOLD_BG = "#d4a01712"; // gold tint background
const BG = "#0a0a0a";       // near-black background
const CARD = "#111111";     // card background
const CARD2 = "#1a1a1a";    // inner card / secondary
const CARD3 = "#222222";    // table row hover
const BORDER = "#2a2a2a";   // subtle border
const BORDER2 = "#333333";  // slightly more visible border
const TEXT = "#ffffff";     // pure white
const TEXT2 = "#a3a3a3";    // secondary text
const M2 = "#737373";       // muted text
const MUTED = "#525252";    // more muted
const ACCENT = GOLD;        // primary accent is gold
const ACCENT2 = GOLD_L;
const BC = { Bullish: G, Bearish: R, Neutral: A };
const SHADOW = "0 1px 3px rgba(0,0,0,0.6)";
const SUPABASE_URL = "https://yppvcrlwxgxswruaadkf.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlwcHZjcmx3eGd4c3dydWFhZGtmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyMzY3MjQsImV4cCI6MjA5MjgxMjcyNH0.T4Bx0iqW9Ae_hMFXrScjXtBZS8tczc8-1Lpv-SjaBRI";
const ANTHROPIC_KEY_STORE = "tradelog_anthropic_key";

function getAnthropicKey() { return localStorage.getItem(ANTHROPIC_KEY_STORE) || ""; }

// ── PASSWORD — change this to whatever you want ───────────────────────────────
const APP_PASSWORD = "Tradingjournal@2026";

// ── DB helpers ────────────────────────────────────────────────────────────────
function getUserId() {
  // Use a fixed ID derived from the password so ALL devices share the same data
  return "user_" + APP_PASSWORD.split("").reduce((a, c) => ((a << 5) - a + c.charCodeAt(0)) | 0, 0).toString(36).replace("-","n");
}
async function dbLoad() {
  const uid = getUserId();
  const res = await fetch(SUPABASE_URL + "/rest/v1/user_data?user_id=eq." + uid + "&select=data", { headers: { apikey: SUPABASE_KEY, Authorization: "Bearer " + SUPABASE_KEY } });
  const rows = await res.json();
  return rows && rows[0] ? rows[0].data : null;
}
async function dbSave(payload) {
  const uid = getUserId();
  await fetch(SUPABASE_URL + "/rest/v1/user_data", { method: "POST", headers: { apikey: SUPABASE_KEY, Authorization: "Bearer " + SUPABASE_KEY, "Content-Type": "application/json", Prefer: "resolution=merge-duplicates" }, body: JSON.stringify({ user_id: uid, data: payload, updated_at: new Date().toISOString() }) });
}

// ── LOGIN SCREEN ──────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [pw, setPw] = useState("");
  const [error, setError] = useState(false);
  const [show, setShow] = useState(false);
  const submit = () => {
    if (pw === APP_PASSWORD) { localStorage.setItem("tradelog_auth", "1"); onLogin(); }
    else { setError(true); setTimeout(() => setError(false), 1500); }
  };
  return (
    <div style={{ position: "fixed", inset: 0, background: BG, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 40 }}>
      <style>{`@import url('${FONT_URL}'); *{box-sizing:border-box;margin:0;padding:0} body{font-family:${FONT_BODY};-webkit-font-smoothing:antialiased;background:${BG}}`}</style>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 44, fontWeight: 700, background: "linear-gradient(135deg, #d4a017, #f0b429)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: "-0.04em", marginBottom: 12, fontFamily: FONT_BODY }}>TradeLog</div>
        <div style={{ fontSize: 15, color: M2, fontWeight: 400 }}>Your ICT Trading Journal</div>
      </div>
      <div style={{ background: CARD, border: "1px solid " + BORDER, borderRadius: 20, padding: "36px 40px", width: "100%", maxWidth: 400, display: "flex", flexDirection: "column", gap: 20, boxShadow: "0 24px 64px rgba(0,0,0,0.6)" }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 600, color: TEXT, marginBottom: 4 }}>Welcome back</div>
          <div style={{ fontSize: 14, color: M2 }}>Enter your password to continue</div>
        </div>
        <div style={{ position: "relative" }}>
          <input
            type={show ? "text" : "password"}
            value={pw}
            onChange={e => setPw(e.target.value)}
            onKeyDown={e => e.key === "Enter" && submit()}
            placeholder="Password"
            autoFocus
            style={{ width: "100%", padding: "14px 48px 14px 16px", borderRadius: 10, border: "1.5px solid " + (error ? "#ef4444" : pw ? ACCENT : BORDER), background: CARD2, color: TEXT, fontSize: 16, outline: "none", transition: "border-color 0.2s" }}
          />
          <button onClick={() => setShow(s => !s)} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: M2, cursor: "pointer", fontSize: 18, padding: 0 }}>{show ? "🙈" : "👁"}</button>
        </div>
        {error && <div style={{ fontSize: 13, color: "#f87171", fontWeight: 500, marginTop: -10 }}>Incorrect password. Try again.</div>}
        <button onClick={submit} style={{ padding: "14px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #d4a017, #f0b429)", color: "#fff", fontSize: 15, fontWeight: 600, cursor: "pointer", boxShadow: "0 8px 24px #d4a01740", letterSpacing: "0.02em" }}>
          Enter Journal →
        </button>
      </div>
      <div style={{ fontSize: 12, color: MUTED, letterSpacing: "0.02em" }}>Data stored securely in Supabase</div>
    </div>
  );
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const toR = v => parseFloat(v) || 0;

function calcStats(trades) {
  const cl = trades.filter(t => t.result !== "Open");
  const wins = cl.filter(t => t.result === "Win");
  const losses = cl.filter(t => t.result === "Loss");
  const wr = cl.length ? (wins.length / cl.length) * 100 : 0;
  const totalR = cl.reduce((s, t) => s + toR(t.rrActual), 0);
  const gw = wins.reduce((s, t) => s + toR(t.rrActual), 0);
  const gl = Math.abs(losses.reduce((s, t) => s + toR(t.rrActual), 0));
  const pf = gl ? gw / gl : gw > 0 ? Infinity : 0;
  const exp = cl.length ? (wr / 100) * (gw / (wins.length || 1)) - (1 - wr / 100) * (gl / (losses.length || 1)) : 0;
  let mws = 0, mls = 0, cws = 0, cls = 0;
  cl.forEach(t => {
    if (t.result === "Win") { cws++; cls = 0; mws = Math.max(mws, cws); }
    else if (t.result === "Loss") { cls++; cws = 0; mls = Math.max(mls, cls); }
    else { cws = 0; cls = 0; }
  });
  const dArr = cl.filter(t => t.discipline);
  const avgDisc = dArr.length ? dArr.reduce((s, t) => s + t.discipline, 0) / dArr.length : 0;
  return { total: trades.length, closed: cl.length, wins: wins.length, losses: losses.length, be: cl.filter(t => t.result === "BE").length, winRate: wr, totalR, avgR: cl.length ? totalR / cl.length : 0, profitFactor: pf, expectancy: exp, maxWS: mws, maxLS: mls, avgDisc };
}

function groupBy(trades, keyFn, keys) {
  const m = {};
  keys.forEach(k => { m[k] = { wins: 0, losses: 0, r: 0 }; });
  trades.filter(t => t.result !== "Open").forEach(t => {
    const k = keyFn(t);
    if (!m[k]) return;
    if (t.result === "Win") m[k].wins++;
    else if (t.result === "Loss") m[k].losses++;
    m[k].r += toR(t.rrActual);
  });
  return keys.map(k => ({
    key: k, ...m[k],
    total: m[k].wins + m[k].losses,
    winRate: m[k].wins + m[k].losses > 0 ? Math.round(m[k].wins / (m[k].wins + m[k].losses) * 100) : 0,
    r: +m[k].r.toFixed(2)
  }));
}

// ─── SCREENSHOT UPLOAD PANEL ──────────────────────────────────────────────────
function TradeCharts({ trade, onUpdateScreenshots }) {
  const [activeTf, setActiveTf] = useState("Daily");
  const [zoomed, setZoomed] = useState(false);
  const screenshots = trade.screenshots || {};
  const current = screenshots[activeTf];

  const handleUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const updated = { ...screenshots, [activeTf]: ev.target.result };
      onUpdateScreenshots(trade.id, updated);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleRemove = () => {
    const updated = { ...screenshots };
    delete updated[activeTf];
    onUpdateScreenshots(trade.id, updated);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files && e.dataTransfer.files[0];
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const updated = { ...screenshots, [activeTf]: ev.target.result };
      onUpdateScreenshots(trade.id, updated);
    };
    reader.readAsDataURL(file);
  };

  const uploadedCount = Object.keys(screenshots).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* TF tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid " + BORDER, flexShrink: 0 }}>
        {CHART_TFS.map(tf => {
          const hasImg = !!(screenshots[tf]);
          return (
            <button key={tf} onClick={() => setActiveTf(tf)}
              style={{ flex: 1, padding: "9px 0", border: "none", borderBottom: "2px solid " + (activeTf === tf ? GOLD : "transparent"), background: "transparent", color: activeTf === tf ? GOLD : hasImg ? TEXT : M2, cursor: "pointer", fontFamily: FONT_BODY, fontSize: 13, fontWeight: activeTf === tf ? 600 : 400, position: "relative" }}>
              {tf}
              {hasImg && <span style={{ display: "inline-block", width: 5, height: 5, borderRadius: "50%", background: G, marginLeft: 5, verticalAlign: "middle", marginTop: -2 }} />}
            </button>
          );
        })}
      </div>

      {/* Info bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 12px", fontSize: 12, color: M2, fontFamily: FONT_MONO, borderBottom: "1px solid " + BORDER, flexShrink: 0 }}>
        <span style={{ color: GOLD, fontWeight: 700 }}>{trade.pair}</span>
        <span>{trade.date}{trade.time ? " " + trade.time + " UTC" : ""}</span>
        <span style={{ color: trade.direction === "Long" ? "#4ade80" : "#f87171" }}>{trade.direction === "Long" ? "▲ LONG" : "▼ SHORT"}</span>
        <span style={{ marginLeft: "auto" }}>{uploadedCount}/4 uploaded</span>
      </div>

      {/* Chart area */}
      <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
        {current ? (
          <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
            {/* Clickable image — opens lightbox */}
            <div style={{ flex: 1, position: "relative", overflow: "hidden", cursor: "zoom-in" }} onClick={() => setZoomed(true)}>
              <img src={current} alt={activeTf + " chart"} style={{ width: "100%", height: "100%", objectFit: "contain", background: "#000" }} />
              <div style={{ position: "absolute", top: 8, right: 8, background: "rgba(0,0,0,0.6)", borderRadius: 6, padding: "4px 8px", fontSize: 11, color: TEXT, fontFamily: FONT_MONO, pointerEvents: "none" }}>
                🔍 Click to expand
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", borderTop: "1px solid " + BORDER, flexShrink: 0 }}>
              <span style={{ fontSize: 12, color: M2, fontFamily: FONT_MONO }}>{activeTf} · {trade.pair}</span>
              <div style={{ display: "flex", gap: 8 }}>
                <label style={{ padding: "5px 12px", borderRadius: 6, border: "1px solid " + BORDER2, color: M2, cursor: "pointer", fontFamily: FONT_BODY, fontSize: 12 }}>
                  Replace
                  <input type="file" accept="image/*" onChange={handleUpload} style={{ display: "none" }} />
                </label>
                <button onClick={handleRemove} style={{ padding: "5px 12px", borderRadius: 6, border: "1px solid " + R + "40", background: "transparent", color: "#f87171", cursor: "pointer", fontFamily: FONT_BODY, fontSize: 12 }}>Remove</button>
              </div>
            </div>
          </div>
        ) : (
          <label onDrop={handleDrop} onDragOver={e => e.preventDefault()}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", cursor: "pointer", gap: 14 }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: CARD2, border: "1px solid " + BORDER2, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>📈</div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 15, color: TEXT, fontWeight: 600, marginBottom: 6 }}>{activeTf} Chart</div>
              <div style={{ fontSize: 13, color: M2, lineHeight: 1.6 }}>Click to upload or drag & drop</div>
            </div>
            <div style={{ padding: "8px 20px", borderRadius: 8, border: "1px solid " + GOLD + "50", background: GOLD + "10", color: GOLD, fontSize: 13, fontWeight: 600 }}>Choose Screenshot</div>
            <input type="file" accept="image/*" onChange={handleUpload} style={{ display: "none" }} />
          </label>
        )}
      </div>

      {/* LIGHTBOX */}
      {zoomed && current && (
        <div onClick={() => setZoomed(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.95)", zIndex: 9999, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "zoom-out" }}>
          {/* Header bar */}
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", background: "linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", gap: 8 }}>
              {CHART_TFS.map(tf => (
                <button key={tf} onClick={() => setActiveTf(tf)} style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid " + (activeTf === tf ? GOLD : BORDER2), background: activeTf === tf ? GOLD + "20" : "transparent", color: activeTf === tf ? GOLD : screenshots[tf] ? TEXT : MUTED, cursor: screenshots[tf] ? "pointer" : "default", fontFamily: FONT_BODY, fontSize: 13, fontWeight: activeTf === tf ? 600 : 400 }}>
                  {tf} {screenshots[tf] && activeTf !== tf && <span style={{ width: 5, height: 5, borderRadius: "50%", background: G, display: "inline-block", marginLeft: 4 }} />}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ color: GOLD, fontFamily: FONT_MONO, fontWeight: 700, fontSize: 14 }}>{trade.pair}</span>
              <span style={{ color: M2, fontSize: 13 }}>{activeTf} · {trade.date}</span>
              <button onClick={() => setZoomed(false)} style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid " + BORDER2, background: CARD2, color: TEXT, cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
            </div>
          </div>
          {/* Full image */}
          {screenshots[activeTf] ? (
            <img src={screenshots[activeTf]} alt={activeTf} onClick={e => e.stopPropagation()} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", userSelect: "none" }} />
          ) : (
            <div style={{ color: M2, fontSize: 14, textAlign: "center" }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>📈</div>
              No screenshot uploaded for {activeTf}
            </div>
          )}
          <div style={{ position: "absolute", bottom: 16, color: MUTED, fontSize: 12, fontFamily: FONT_MONO }}>Click anywhere to close · Switch timeframes above</div>
        </div>
      )}
    </div>
  );
}


// ─── SPARKLINE ────────────────────────────────────────────────────────────────
function Sparkline({ pts, color, w, h }) {
  const pad = 4, pw = w - pad * 2, ph = h - pad * 2;
  const xs = pts.map((_, i) => pad + (i / (pts.length - 1)) * pw);
  const ys = pts.map(p => pad + ph - (p / 100) * ph);
  const d = "M " + xs.map((x, i) => x.toFixed(1) + "," + ys[i].toFixed(1)).join(" L ");
  const area = d + " L " + xs[xs.length - 1].toFixed(1) + "," + (pad + ph).toFixed(1) + " L " + xs[0].toFixed(1) + "," + (pad + ph).toFixed(1) + " Z";
  return (
    <svg width={w} height={h} style={{ flexShrink: 0 }}>
      <path d={area} fill={color} fillOpacity={0.1} />
      <path d={d} stroke={color} strokeWidth={1.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {xs.map((x, i) => <circle key={i} cx={x} cy={ys[i]} r={i === 0 || i === pts.length - 1 ? 2.5 : 1.5} fill={color} />)}
      {["M","T","W","T","F"].map((lbl, i) => <text key={i} x={xs[i]} y={h - 1} textAnchor="middle" fontSize="7" fill={M2}>{lbl}</text>)}
    </svg>
  );
}

// ─── TEMPLATE PICKER ──────────────────────────────────────────────────────────
function TemplatePicker({ value, onChange, direction }) {
  const [biasF, setBiasF] = useState("All");
  const filtered = biasF === "All" ? TEMPLATES : TEMPLATES.filter(t => t.bias === biasF);
  const sel = TEMPLATES.find(t => t.id === value);
  const selCol = sel ? BC[sel.bias] : null;
  const aligned = sel && ((sel.bias === "Bullish" && direction === "Long") || (sel.bias === "Bearish" && direction === "Short"));
  const neutral = sel && sel.bias === "Neutral";
  const alignCol = !sel ? null : neutral ? A : aligned ? G : R;
  const alignMsg = !sel ? "" : neutral ? "Neutral week — trade cautiously" : aligned ? ("✓ " + direction + " aligns with template") : ("✗ " + direction + " is AGAINST the template");
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      <div style={{ display: "flex", borderBottom: "1px solid " + BORDER, flexShrink: 0 }}>
        {["All","Bullish","Bearish","Neutral"].map(b => (
          <button key={b} onClick={() => setBiasF(b)}
            style={{ flex: 1, padding: "8px 0", border: "none", borderBottom: "2px solid " + (biasF === b ? G : "transparent"), background: "transparent", color: biasF === b ? G : M2, fontSize: 16, cursor: "pointer", fontFamily: FONT_MONO }}>
            {b}
          </button>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", flex: 1, overflow: "hidden" }}>
        <div style={{ overflowY: "auto", padding: 8, borderRight: "1px solid " + BORDER, display: "flex", flexDirection: "column", gap: 5 }}>
          <div onClick={() => onChange("")}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 9px", borderRadius: 6, border: "1px solid " + (!value ? G : BORDER), background: !value ? G + "10" : CARD2, cursor: "pointer" }}>
            <div style={{ width: 50, height: 24, background: MUTED + "30", borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 16, color: M2 }}>—</span>
            </div>
            <span style={{ fontSize: 16, color: M2, fontStyle: "italic" }}>Not identified</span>
          </div>
          {filtered.map(t => {
            const c = BC[t.bias], isSel = value === t.id;
            return (
              <div key={t.id} onClick={() => onChange(t.id)}
                style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 9px", borderRadius: 6, border: "1px solid " + (isSel ? c : BORDER), background: isSel ? c + "12" : CARD2, cursor: "pointer" }}>
                <Sparkline pts={t.pts} color={c} w={50} h={24} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 16, color: isSel ? TEXT : M2, fontWeight: isSel ? 700 : 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.name}</div>
                  <div style={{ fontSize: 13, color: c, letterSpacing: 1, marginTop: 1 }}>{t.bias.toUpperCase()}</div>
                </div>
                {isSel && <span style={{ color: c, fontSize: 17 }}>✓</span>}
              </div>
            );
          })}
        </div>
        <div style={{ overflowY: "auto", padding: 12 }}>
          {sel ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <Sparkline pts={sel.pts} color={selCol} w={88} h={44} />
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: TEXT, lineHeight: 1.3, marginBottom: 4 }}>{sel.name}</div>
                  <span style={{ background: selCol + "20", color: selCol, padding: "2px 7px", borderRadius: 20, fontSize: 16, fontFamily: FONT_MONO }}>{sel.bias.toUpperCase()}</span>
                </div>
              </div>
              <div style={{ fontSize: 16, color: TEXT, lineHeight: 1.7 }}>{sel.desc}</div>
              <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
                {sel.tags.map(tag => <span key={tag} style={{ fontSize: 13, padding: "2px 6px", borderRadius: 10, background: selCol + "15", color: selCol }}>{tag}</span>)}
              </div>
              {alignCol && (
                <div style={{ padding: "8px 10px", background: BG, borderRadius: 6, border: "1px solid " + BORDER }}>
                  <div style={{ fontSize: 16, color: M2, letterSpacing: 2, fontFamily: FONT_MONO, marginBottom: 4 }}>ALIGNMENT CHECK</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <div style={{ width: 7, height: 7, borderRadius: "50%", background: alignCol }} />
                    <span style={{ fontSize: 16, color: alignCol }}>{alignMsg}</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: M2, fontSize: 16, textAlign: "center", lineHeight: 1.7 }}>
              ← Select a template<br />to see details and<br />alignment check
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── SMALL COMPONENTS ────────────────────────────────────────────────────────
function Pill({ result }) {
  const colors = {
    Win:  { bg: "#16a34a20", border: "#22c55e50", text: "#4ade80" },
    Loss: { bg: "#dc262620", border: "#ef444450", text: "#f87171" },
    BE:   { bg: "#d9770620", border: "#f59e0b50", text: "#fbbf24" },
    Open: { bg: "#33333340", border: "#52525b50", text: "#a3a3a3" }
  };
  const c = colors[result] || colors.Open;
  return (
    <span style={{ background: c.bg, color: c.text, border: "1px solid " + c.border, padding: "3px 10px", borderRadius: 6, fontSize: 12, fontWeight: 600, letterSpacing: "0.04em" }}>
      {result}
    </span>
  );
}

function Rr({ v }) {
  const n = parseFloat(v);
  const c = isNaN(n) ? M2 : n > 0 ? "#4ade80" : n < 0 ? "#f87171" : "#fbbf24";
  return <span style={{ color: c, fontFamily: FONT_MONO, fontWeight: 600, fontSize: 14 }}>{isNaN(n) ? "—" : (n > 0 ? "+" : "") + n.toFixed(2) + "R"}</span>;
}

function PnlText({ v, prefix = "" }) {
  const n = parseFloat(v);
  const pos = n >= 0;
  return <span style={{ color: pos ? "#4ade80" : "#f87171", fontFamily: FONT_MONO, fontWeight: 700 }}>{pos ? "+" : ""}{prefix}{isNaN(n) ? "—" : n.toFixed(2)}</span>;
}

function StatBox({ label, value, color, sub, badge, icon }) {
  return (
    <div style={{ background: CARD, border: "1px solid " + BORDER2, borderRadius: 12, padding: "20px 24px", flex: "1 1 180px", display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: M2 }}>{label}</div>
        {badge && <span style={{ fontSize: 11, fontWeight: 600, color: GOLD, background: GOLD_BG, border: "1px solid " + GOLD + "40", padding: "2px 8px", borderRadius: 20 }}>{badge}</span>}
      </div>
      <div style={{ fontSize: 32, fontWeight: 700, color: color || TEXT, fontFamily: FONT_MONO, letterSpacing: "-0.03em", lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: M2 }}>{sub}</div>}
    </div>
  );
}

function WBar({ wr, total }) {
  const col = wr >= 50 ? "#4ade80" : "#f87171";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ flex: 1, height: 4, background: CARD2, borderRadius: 4, overflow: "hidden" }}>
        <div style={{ width: Math.min(wr, 100) + "%", height: "100%", background: col, borderRadius: 4 }} />
      </div>
      <span style={{ fontSize: 13, fontWeight: 600, color: col, fontFamily: FONT_MONO, minWidth: 40, textAlign: "right" }}>{total ? wr + "%" : "—"}</span>
    </div>
  );
}

function SH({ children, color }) {
  return <div style={{ fontSize: 12, fontWeight: 600, color: color || M2, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16 }}>{children}</div>;
}

function ChartTip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div style={{ background: CARD2, border: "1px solid " + BORDER2, borderRadius: 8, padding: "10px 14px" }}>
      <div style={{ color: M2, fontSize: 12, marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || TEXT, fontSize: 13, fontFamily: FONT_MONO, fontWeight: 600 }}>{p.name}: {typeof p.value === "number" ? p.value.toFixed(2) : p.value}</div>
      ))}
    </div>
  );
}

function Stars({ value, onChange }) {
  return (
    <div style={{ display: "flex", gap: 4 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <span key={n} onClick={() => onChange && onChange(n)}
          style={{ fontSize: 18, cursor: onChange ? "pointer" : "default", color: n <= (value || 0) ? GOLD : MUTED }}>★</span>
      ))}
    </div>
  );
}

function TplBadge({ id }) {
  const t = TEMPLATES.find(x => x.id === id);
  if (!t) return null;
  const c = BC[t.bias];
  return <span style={{ background: c + "15", color: c, padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600, border: "1px solid " + c + "30" }}>{t.name}</span>;
}

function EmoBadge({ emotion }) {
  const col = EMO_COLORS[emotion] || M2;
  return <span style={{ background: col + "15", color: col, padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 500, border: "1px solid " + col + "30" }}>{emotion}</span>;
}

// Direction badge — matches screenshot style
function DirBadge({ dir }) {
  const isLong = dir === "Long";
  return (
    <span style={{ background: "transparent", color: isLong ? "#4ade80" : "#f87171", border: "1px solid " + (isLong ? "#4ade8060" : "#f8717160"), padding: "3px 10px", borderRadius: 6, fontSize: 12, fontWeight: 600 }}>
      {dir.toUpperCase()}
    </span>
  );
}

// Market/session badge
function MarketBadge({ pair }) {
  const isCrypto = pair?.includes("BTC") || pair?.includes("ETH");
  const isGold = pair?.includes("XAU");
  const bg = isCrypto ? "#7c3aed" : isGold ? "#d97706" : "#0e7490";
  const label = isCrypto ? "CRYPTO" : isGold ? "METALS" : "FOREX";
  return <span style={{ background: bg + "20", color: bg === "#0e7490" ? "#22d3ee" : bg === "#d97706" ? "#fbbf24" : "#c084fc", border: "1px solid " + bg + "40", padding: "3px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600 }}>{label}</span>;
}

// ─── AI FUNCTIONS ─────────────────────────────────────────────────────────────
async function runReview(trade) {
  const tpl = TEMPLATES.find(t => t.id === trade.weeklyTemplate);
  const ref = trade.reflection || {};
  const refLines = REFLECTION_QUESTIONS.map(q => {
    const ans = ref[q.id];
    if (ans === undefined || ans === "") return null;
    return "  • " + q.q + " → " + (q.type === "yn" ? (ans === true ? "YES" : "NO") : ans);
  }).filter(Boolean).join("\n");
  const body = {
    model: "claude-sonnet-4-20250514",
    max_tokens: 1200,
    messages: [{
      role: "user",
      content: "You are an elite ICT trading coach. Review this trade and return ONLY valid JSON (no markdown).\n" +
        "Trade: " + trade.pair + " " + trade.direction + " | " + trade.date + " " + (trade.time || "") + " UTC\n" +
        "Session: " + trade.session + " | Setup: " + trade.setup + "\n" +
        "Template: " + (tpl ? tpl.name + " (" + tpl.bias + ")" : "none") + "\n" +
        "Entry: " + (trade.entryPrice || "—") + " | RR: " + trade.rrPlanned + "R planned / " + trade.rrActual + "R actual\n" +
        "Result: " + trade.result + " | Emotion: " + (trade.emotion || "—") + " | Discipline: " + (trade.discipline || "—") + "/5\n" +
        "Notes: " + (trade.notes || "—") + "\n" +
        (refLines ? "Post-trade reflection:\n" + refLines + "\n" : "") +
        'Return: {"score":<1-10>,"verdict":"<one line>","execution":"<2 sentences>","timing":"<2 sentences>","templateAlignment":"<2 sentences>","riskMgmt":"<2 sentences>","psychology":"<2 sentences using the reflection answers>","reflection":"<2-3 sentences specifically addressing patterns revealed by the trader\'s self-reflection answers>","strengths":["<s1>","<s2>"],"improvements":["<i1>","<i2>","<i3>"],"keyLesson":"<one takeaway specifically tied to the reflection>"}'
    }]
  };
  const res = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "Content-Type": "application/json", "x-api-key": getAnthropicKey(), "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" }, body: JSON.stringify(body) });
  const data = await res.json();
  const text = (data.content && data.content.find(b => b.type === "text") && data.content.find(b => b.type === "text").text) || "{}";
  return JSON.parse(text.replace(/```json|```/g, "").trim());
}

async function runCoach(trades) {
  const cl = trades.filter(t => t.result !== "Open");
  if (cl.length < 3) return null;
  const st = calcStats(trades);
  const summary = cl.map(t => ({ pair: t.pair, dir: t.direction, setup: t.setup, session: t.session, template: t.weeklyTemplate || null, rr: t.rrActual, result: t.result, emo: t.emotion || null, disc: t.discipline || null }));
  const body = {
    model: "claude-sonnet-4-20250514",
    max_tokens: 1500,
    messages: [{
      role: "user",
      content: "Elite ICT trading coach analysis. Return ONLY valid JSON (no markdown).\n" +
        "Stats: " + st.wins + "W/" + st.losses + "L (" + st.winRate.toFixed(0) + "% WR), AvgRR:" + st.avgR.toFixed(2) + ", PF:" + (isFinite(st.profitFactor) ? st.profitFactor.toFixed(2) : "∞") + "\n" +
        "Trades(" + cl.length + "): " + JSON.stringify(summary) + "\n" +
        'Return: {"profile":"<archetype>","overallScore":<1-10>,"summary":"<3 sentences>","strengths":[{"title":"","detail":""},{"title":"","detail":""},{"title":"","detail":""}],"weaknesses":[{"title":"","detail":"","severity":"High|Medium|Low"},{"title":"","detail":"","severity":""},{"title":"","detail":"","severity":""}],"emotionalPattern":"","setupPattern":"","templatePattern":"","sessionPattern":"","riskPattern":"","actionPlan":["","","","",""],"focusSetup":"","avoidSetup":"","focusTemplate":"","weeklyGoal":""}'
    }]
  };
  const res = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "Content-Type": "application/json", "x-api-key": getAnthropicKey(), "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" }, body: JSON.stringify(body) });
  const data = await res.json();
  const text = (data.content && data.content.find(b => b.type === "text") && data.content.find(b => b.type === "text").text) || "{}";
  return JSON.parse(text.replace(/```json|```/g, "").trim());
}

async function runChat(messages, trades) {
  const st = calcStats(trades);
  const cl = trades.filter(t => t.result !== "Open");
  const body = {
    model: "claude-sonnet-4-20250514",
    max_tokens: 600,
    system: "You are an elite ICT forex trading coach. Be direct and reference actual data.\nDATA: " + st.wins + "W/" + st.losses + "L (" + st.winRate.toFixed(0) + "%WR) | AvgRR:" + st.avgR.toFixed(2) + "\nRECENT: " + JSON.stringify(cl.slice(-8).map(t => ({ pair: t.pair, setup: t.setup, template: t.weeklyTemplate || null, result: t.result, rr: t.rrActual, emo: t.emotion }))),
    messages
  };
  const res = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "Content-Type": "application/json", "x-api-key": getAnthropicKey(), "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" }, body: JSON.stringify(body) });
  const data = await res.json();
  return (data.content && data.content.find(b => b.type === "text") && data.content.find(b => b.type === "text").text) || "Error.";
}

// ─── REVIEW PANEL ────────────────────────────────────────────────────────────
function ReviewPanel({ review, loading }) {
  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, padding: 44, color: M2 }}>
        <div style={{ width: 24, height: 24, border: "2px solid " + MUTED, borderTopColor: G, borderRadius: "50%", animation: "spin 1s linear infinite" }} />
        <span style={{ fontFamily: FONT_MONO, fontSize: 17 }}>Generating AI review…</span>
      </div>
    );
  }
  if (!review) return <div style={{ padding: 32, textAlign: "center", color: M2, fontFamily: FONT_MONO, fontSize: 17 }}>No review yet.</div>;
  const sc = review.score >= 8 ? G : review.score >= 5 ? A : R;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
      <div style={{ display: "flex", gap: 11, alignItems: "flex-start" }}>
        <div style={{ background: sc + "15", border: "1px solid " + sc + "40", borderRadius: 9, padding: "11px 14px", textAlign: "center", flexShrink: 0 }}>
          <div style={{ fontSize: 16, color: M2, letterSpacing: 2, fontFamily: FONT_MONO }}>SCORE</div>
          <div style={{ fontSize: 36, fontWeight: 900, color: sc, fontFamily: FONT_MONO }}>{review.score}</div>
          <div style={{ fontSize: 16, color: M2, fontFamily: FONT_MONO }}>/10</div>
        </div>
        <div style={{ background: CARD2, borderRadius: 7, padding: 10, flex: 1, border: "1px solid " + BORDER }}>
          <div style={{ fontSize: 16, color: M2, letterSpacing: 2, fontFamily: FONT_MONO, marginBottom: 4 }}>VERDICT</div>
          <div style={{ color: TEXT, fontSize: 16, lineHeight: 1.5 }}>{review.verdict}</div>
        </div>
      </div>
      {[["Execution", review.execution, G], ["Timing", review.timing, "#64b5f6"], ["Template Alignment", review.templateAlignment, "#ce93d8"], ["Risk Mgmt", review.riskMgmt, A], ["Psychology", review.psychology, "#e040fb"], ["Self-Reflection Analysis", review.reflection, "#69f0ae"]].map(([l, t, c]) => t ? (
        <div key={l} style={{ background: CARD2, border: "1px solid " + BORDER, borderRadius: 6, padding: 10 }}>
          <div style={{ fontSize: 16, color: c, letterSpacing: 2, fontFamily: FONT_MONO, marginBottom: 4 }}>{l.toUpperCase()}</div>
          <div style={{ color: TEXT, fontSize: 17, lineHeight: 1.6 }}>{t}</div>
        </div>
      ) : null)}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <div style={{ background: G + "08", border: "1px solid " + G + "20", borderRadius: 6, padding: 10 }}>
          <div style={{ fontSize: 16, color: G, letterSpacing: 2, fontFamily: FONT_MONO, marginBottom: 6 }}>STRENGTHS</div>
          {review.strengths && review.strengths.map((s, i) => <div key={i} style={{ display: "flex", gap: 5, marginBottom: 4 }}><span style={{ color: G }}>✓</span><span style={{ color: TEXT, fontSize: 16 }}>{s}</span></div>)}
        </div>
        <div style={{ background: R + "08", border: "1px solid " + R + "20", borderRadius: 6, padding: 10 }}>
          <div style={{ fontSize: 16, color: R, letterSpacing: 2, fontFamily: FONT_MONO, marginBottom: 6 }}>IMPROVE</div>
          {review.improvements && review.improvements.map((s, i) => <div key={i} style={{ display: "flex", gap: 5, marginBottom: 4 }}><span style={{ color: R }}>→</span><span style={{ color: TEXT, fontSize: 16 }}>{s}</span></div>)}
        </div>
      </div>
      <div style={{ background: A + "08", border: "1px solid " + A + "30", borderRadius: 6, padding: 10 }}>
        <div style={{ fontSize: 16, color: A, letterSpacing: 2, fontFamily: FONT_MONO, marginBottom: 4 }}>KEY LESSON</div>
        <div style={{ color: TEXT, fontSize: 17, lineHeight: 1.6, fontStyle: "italic" }}>{review.keyLesson}</div>
      </div>
    </div>
  );
}

// ─── TRADE MODAL ─────────────────────────────────────────────────────────────
const EMPTY_TRADE = { date: "", time: "", account: "FX", pair: "EURUSD", direction: "Long", session: "London", setup: "Fair Value Gap (FVG)", weeklyTemplate: "", entryPrice: "", riskR: 1, rrPlanned: 2, rrActual: "", result: "Win", notes: "", emotion: "", discipline: 0, checklist: {}, mindset: "", reflection: {} };

// Reflection questions — answered after the trade
const REFLECTION_QUESTIONS = [
  { id: "bias",       q: "Did you follow your initial HTF bias?",                  type: "yn" },
  { id: "plan",       q: "Did you stick to your trading plan?",                    type: "yn" },
  { id: "entry",      q: "Was your entry at the right price level?",               type: "yn" },
  { id: "sl",         q: "Was your stop loss at a proper ICT level?",              type: "yn" },
  { id: "overtrade",  q: "Did you overtrade or revenge trade?",                    type: "yn" },
  { id: "fomo",       q: "Did FOMO influence your entry?",                         type: "yn" },
  { id: "early",      q: "Did you exit early (cut winners short)?",                type: "yn" },
  { id: "late",       q: "Did you move your stop loss / widen risk?",              type: "yn" },
  { id: "session",    q: "Were you trading in the right killzone session?",        type: "yn" },
  { id: "confluences",q: "Did you have at least 2+ confluences before entering?",  type: "yn" },
  { id: "patience",   q: "Did you wait for confirmation or did you predict?",      type: "choice", options: ["Waited for confirmation", "Predicted / anticipated"] },
  { id: "size",       q: "Was your position size within your risk rules?",         type: "yn" },
  { id: "bestTrade",  q: "Was this your A+ setup or did you force it?",            type: "choice", options: ["A+ setup", "B setup", "Forced / C setup"] },
  { id: "learned",    q: "What is the single most important thing you learned?",   type: "text" },
];

function TradeModal({ trade, onSave, onClose, onDelete }) {
  const init = trade ? { ...EMPTY_TRADE, ...trade } : { ...EMPTY_TRADE, date: new Date().toISOString().split("T")[0] };
  const [form, setForm] = useState(init);
  const [tab, setTab] = useState("details");
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const toggleCheck = item => setForm(f => ({ ...f, checklist: { ...f.checklist, [item]: !f.checklist[item] } }));
  const doSave = () => onSave({ ...form, id: (trade && trade.id) || Date.now(), rrActual: parseFloat(form.rrActual) || 0 });

  // Shared input style — matches the dark fintech look
  const inp = {
    background: CARD2, border: "1px solid " + BORDER2, borderRadius: 10,
    color: TEXT, padding: "11px 14px", width: "100%", fontSize: 14,
    fontFamily: FONT_BODY, outline: "none", boxSizing: "border-box",
    transition: "border-color 0.15s"
  };
  const lbl = { fontSize: 11, fontWeight: 600, color: M2, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6, display: "block" };

  // Option button (session, result, direction etc.)
  const OptBtn = ({ active, onClick, color, children, small }) => (
    <button onClick={onClick} style={{
      padding: small ? "6px 12px" : "9px 16px",
      borderRadius: 8,
      border: "1px solid " + (active ? (color || GOLD) : BORDER2),
      background: active ? (color || GOLD) + "18" : "transparent",
      color: active ? (color || GOLD) : M2,
      cursor: "pointer", fontFamily: FONT_BODY,
      fontSize: 13, fontWeight: active ? 600 : 400,
      transition: "all 0.15s"
    }}>{children}</button>
  );

  const TABS = [["details","Trade Details"],["template","Weekly Template"],["psycho","Psychology"],["reflect","Self-Assessment"]];
  const isTpl = tab === "template";

  const Footer = () => (
    <div className="modal-footer" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 28px", borderTop: "1px solid " + BORDER, flexShrink: 0, background: CARD }}>
      <div style={{ display: "flex", gap: 8 }}>
        {trade && (
          <button onClick={() => onDelete(trade.id)} style={{ padding: "9px 16px", borderRadius: 8, border: "1px solid " + R + "40", background: "transparent", color: R, cursor: "pointer", fontSize: 13, fontWeight: 500 }}>
            Delete Trade
          </button>
        )}
        <button onClick={onClose} style={{ padding: "9px 16px", borderRadius: 8, border: "1px solid " + BORDER2, background: "transparent", color: M2, cursor: "pointer", fontSize: 13 }}>
          Cancel
        </button>
      </div>
      <button onClick={doSave} style={{ padding: "10px 28px", borderRadius: 8, border: "none", background: GOLD, color: "#000", cursor: "pointer", fontSize: 14, fontWeight: 700, boxShadow: "0 4px 20px " + GOLD + "40", letterSpacing: "0.01em" }}>
        {trade ? "Update Trade" : "Log + AI Review →"}
      </button>
    </div>
  );

  return (
    <div className="modal-outer" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 900, display: "flex", alignItems: "flex-end", justifyContent: "center", padding: "0", backdropFilter: "blur(4px)" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-inner" style={{ background: CARD, border: "1px solid " + BORDER2, borderRadius: "16px 16px 0 0", width: "100%", maxWidth: isTpl ? 780 : 640, maxHeight: "96vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 -8px 64px rgba(0,0,0,0.7)", margin: "auto" }}>

        {/* Header */}
        <div className="modal-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 28px", borderBottom: "1px solid " + BORDER, flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: TEXT, letterSpacing: "-0.01em" }}>{trade ? "Edit Trade" : "Log New Trade"}</div>
            <div style={{ fontSize: 13, color: M2, marginTop: 2 }}>Fill in the details below and get an instant AI review</div>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid " + BORDER2, background: CARD2, color: M2, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
        </div>

        {/* Tab bar */}
        <div className="modal-header" style={{ display: "flex", borderBottom: "1px solid " + BORDER, flexShrink: 0, padding: "0 28px" }}>
          {TABS.map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)} style={{
              padding: "12px 16px", border: "none",
              borderBottom: "2px solid " + (tab === id ? GOLD : "transparent"),
              background: "transparent",
              color: tab === id ? GOLD : M2,
              cursor: "pointer", fontFamily: FONT_BODY,
              fontSize: 13, fontWeight: tab === id ? 600 : 400,
              transition: "all 0.15s", marginRight: 4
            }}>{label}</button>
          ))}
        </div>

        {/* DETAILS TAB */}
        {tab === "details" && (
          <>
            <div style={{ overflowY: "auto", padding: "24px 28px", display: "flex", flexDirection: "column", gap: 20 }}>

              {/* Account + Symbol row */}
              <div className="modal-grid-3" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                <div>
                  <label style={lbl}>Account</label>
                  <div style={{ display: "flex", background: CARD, borderRadius: 10, border: "1px solid " + BORDER2, overflow: "hidden" }}>
                    {Object.values(ACCOUNTS).map(acc => (
                      <button key={acc} onClick={() => { set("account", acc); set("pair", acc === "FX" ? "EURUSD" : "DAX40"); }} style={{ flex: 1, padding: "11px 8px", border: "none", background: form.account === acc ? GOLD : "transparent", color: form.account === acc ? "#000" : M2, cursor: "pointer", fontFamily: FONT_BODY, fontSize: 13, fontWeight: form.account === acc ? 700 : 400, transition: "all 0.15s" }}>
                        {acc === "FX" ? "💱 FX" : "📊 Indices"}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={lbl}>Symbol</label>
                  <select value={form.pair} onChange={e => set("pair", e.target.value)} style={{ ...inp, cursor: "pointer" }}>
                    {(form.account === "Indices" ? INDEX_PAIRS : FX_PAIRS).map(p => <option key={p} style={{ background: CARD2 }}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Time (UTC)</label>
                  <input type="time" value={form.time} onChange={e => set("time", e.target.value)} style={inp} />
                </div>
              </div>

              {/* Date row */}
              <div>
                <label style={lbl}>Date</label>
                <input type="date" value={form.date} onChange={e => set("date", e.target.value)} style={{ ...inp, maxWidth: 200 }} />
              </div>

              {/* Direction */}
              <div>
                <label style={lbl}>Direction</label>
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={() => set("direction", "Long")} style={{ flex: 1, padding: "12px", borderRadius: 10, border: "1px solid " + (form.direction === "Long" ? "#22c55e" : BORDER2), background: form.direction === "Long" ? "#22c55e15" : "transparent", color: form.direction === "Long" ? "#4ade80" : M2, cursor: "pointer", fontSize: 14, fontWeight: 600, transition: "all 0.15s" }}>▲ Long</button>
                  <button onClick={() => set("direction", "Short")} style={{ flex: 1, padding: "12px", borderRadius: 10, border: "1px solid " + (form.direction === "Short" ? "#ef4444" : BORDER2), background: form.direction === "Short" ? "#ef444415" : "transparent", color: form.direction === "Short" ? "#f87171" : M2, cursor: "pointer", fontSize: 14, fontWeight: 600, transition: "all 0.15s" }}>▼ Short</button>
                </div>
              </div>

              {/* Entry, Risk, Planned RR, Actual RR */}
              <div className="modal-grid-4" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 16 }}>
                <div>
                  <label style={lbl}>Entry Price</label>
                  <input type="number" step="0.00001" value={form.entryPrice} onChange={e => set("entryPrice", e.target.value)} style={inp} placeholder="1.08500" />
                </div>
                <div>
                  <label style={lbl}>Risk (R)</label>
                  <input type="number" step="0.1" value={form.riskR} onChange={e => set("riskR", e.target.value)} style={inp} />
                </div>
                <div>
                  <label style={lbl}>Planned RR</label>
                  <input type="number" step="0.1" value={form.rrPlanned} onChange={e => set("rrPlanned", e.target.value)} style={inp} />
                </div>
                <div>
                  <label style={lbl}>Actual RR</label>
                  <input type="number" step="0.1" value={form.rrActual} onChange={e => set("rrActual", e.target.value)} style={inp} placeholder="2.5 or -1" />
                </div>
              </div>

              {/* Result */}
              <div>
                <label style={lbl}>Result</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10 }}>
                  {[["Win","#22c55e","#4ade80"],["Loss","#ef4444","#f87171"],["BE","#d97706","#fbbf24"],["Open","#52525b","#a3a3a3"]].map(([o, border, text]) => (
                    <button key={o} onClick={() => set("result", o)} style={{ padding: "11px", borderRadius: 10, border: "1px solid " + (form.result === o ? border : BORDER2), background: form.result === o ? border + "15" : "transparent", color: form.result === o ? text : M2, cursor: "pointer", fontSize: 14, fontWeight: form.result === o ? 700 : 400, transition: "all 0.15s" }}>{o}</button>
                  ))}
                </div>
              </div>

              {/* Session */}
              <div>
                <label style={lbl}>Session</label>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {SESSIONS.map(o => <OptBtn key={o} active={form.session === o} onClick={() => set("session", o)} color={GOLD}>{o}</OptBtn>)}
                </div>
              </div>

              {/* ICT Setup */}
              <div>
                <label style={lbl}>ICT Setup</label>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {SETUPS.map(o => <OptBtn key={o} active={form.setup === o} onClick={() => set("setup", o)} color={GOLD} small>{o}</OptBtn>)}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label style={lbl}>Notes</label>
                <textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={3}
                  style={{ ...inp, resize: "vertical", lineHeight: 1.6 }}
                  placeholder="Setup rationale, confluences, market context…" />
              </div>
            </div>
            <Footer />
          </>
        )}

        {/* TEMPLATE TAB */}
        {tab === "template" && (
          <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
            <TemplatePicker value={form.weeklyTemplate} onChange={v => set("weeklyTemplate", v)} direction={form.direction} />
            <Footer />
          </div>
        )}

        {/* PSYCHOLOGY TAB */}
        {tab === "psycho" && (
          <>
            <div style={{ overflowY: "auto", padding: "24px 28px", display: "flex", flexDirection: "column", gap: 24 }}>

              {/* Emotional State */}
              <div>
                <label style={lbl}>Emotional State Before Trade</label>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {EMOTIONS.map(e => {
                    const col = EMO_COLORS[e] || M2;
                    return (
                      <button key={e} onClick={() => set("emotion", form.emotion === e ? "" : e)} style={{ padding: "8px 14px", borderRadius: 20, border: "1px solid " + (form.emotion === e ? col : BORDER2), background: form.emotion === e ? col + "18" : "transparent", color: form.emotion === e ? col : M2, cursor: "pointer", fontSize: 13, fontWeight: form.emotion === e ? 600 : 400, transition: "all 0.15s" }}>{e}</button>
                    );
                  })}
                </div>
              </div>

              {/* Discipline */}
              <div>
                <label style={lbl}>Discipline Score</label>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <Stars value={form.discipline} onChange={v => set("discipline", v)} />
                  <span style={{ fontSize: 13, color: M2 }}>{["Select…","Off-plan","Major breaks","Some breaks","Minor deviation","Perfect execution"][form.discipline] || "Select…"}</span>
                </div>
              </div>

              {/* Checklist */}
              <div>
                <label style={lbl}>Pre-Trade Checklist</label>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {CHECKLIST.map(item => (
                    <div key={item} onClick={() => toggleCheck(item)} style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer", padding: "12px 16px", borderRadius: 10, background: form.checklist[item] ? "#22c55e08" : CARD2, border: "1px solid " + (form.checklist[item] ? "#22c55e40" : BORDER), transition: "all 0.15s" }}>
                      <div style={{ width: 18, height: 18, borderRadius: 5, border: "1.5px solid " + (form.checklist[item] ? "#22c55e" : MUTED), background: form.checklist[item] ? "#22c55e" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.15s" }}>
                        {form.checklist[item] && <span style={{ color: "#000", fontSize: 11, fontWeight: 900, lineHeight: 1 }}>✓</span>}
                      </div>
                      <span style={{ fontSize: 14, color: form.checklist[item] ? TEXT : TEXT2 }}>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mindset */}
              <div>
                <label style={lbl}>Mindset Note</label>
                <textarea value={form.mindset} onChange={e => set("mindset", e.target.value)} rows={3} style={{ ...inp, resize: "vertical", lineHeight: 1.6 }} placeholder="Describe your mental state, confidence level, any hesitation…" />
              </div>
            </div>
            <Footer />
          </>
        )}

        {/* SELF-ASSESSMENT TAB */}
        {tab === "reflect" && (
          <>
            <div style={{ overflowY: "auto", padding: "24px 28px", flex: 1 }}>
              <div style={{ marginBottom: 20, padding: "14px 18px", background: GOLD + "10", border: "1px solid " + GOLD + "30", borderRadius: 10, display: "flex", gap: 12, alignItems: "flex-start" }}>
                <span style={{ fontSize: 20, flexShrink: 0 }}>💡</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: GOLD, marginBottom: 4 }}>Post-Trade Self-Assessment</div>
                  <div style={{ fontSize: 13, color: TEXT2, lineHeight: 1.6 }}>Answer honestly — the AI coach uses these to identify patterns and give you targeted feedback on how to improve faster.</div>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {REFLECTION_QUESTIONS.map((q, i) => {
                  const ans = (form.reflection || {})[q.id];
                  const setAns = v => setForm(f => ({ ...f, reflection: { ...(f.reflection || {}), [q.id]: v } }));
                  return (
                    <div key={q.id} style={{ background: CARD2, border: "1px solid " + BORDER, borderRadius: 12, padding: "16px 18px" }}>
                      <div style={{ fontSize: 14, color: TEXT, fontWeight: 500, marginBottom: 12, lineHeight: 1.5 }}>
                        <span style={{ color: MUTED, fontFamily: FONT_MONO, fontSize: 11, marginRight: 8 }}>{String(i + 1).padStart(2, "0")}</span>
                        {q.q}
                      </div>
                      {q.type === "yn" && (
                        <div style={{ display: "flex", gap: 8 }}>
                          {[["Yes", true, "#22c55e","#4ade80"], ["No", false, "#ef4444","#f87171"], ["N/A", "na", MUTED, M2]].map(([label, val, border, text]) => (
                            <button key={label} onClick={() => setAns(ans === val ? undefined : val)} style={{ padding: "7px 20px", borderRadius: 8, border: "1px solid " + (ans === val ? border : BORDER2), background: ans === val ? border + "15" : "transparent", color: ans === val ? text : M2, cursor: "pointer", fontSize: 13, fontWeight: ans === val ? 600 : 400, transition: "all .12s" }}>{label}</button>
                          ))}
                        </div>
                      )}
                      {q.type === "choice" && (
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          {q.options.map((opt, oi) => {
                            const col = oi === 0 ? "#22c55e" : oi === 1 ? GOLD : "#ef4444";
                            const txt = oi === 0 ? "#4ade80" : oi === 1 ? GOLD_L : "#f87171";
                            return <button key={opt} onClick={() => setAns(ans === opt ? undefined : opt)} style={{ padding: "7px 16px", borderRadius: 8, border: "1px solid " + (ans === opt ? col : BORDER2), background: ans === opt ? col + "15" : "transparent", color: ans === opt ? txt : M2, cursor: "pointer", fontSize: 13, fontWeight: ans === opt ? 600 : 400, transition: "all .12s" }}>{opt}</button>;
                          })}
                        </div>
                      )}
                      {q.type === "text" && (
                        <textarea value={ans || ""} onChange={e => setAns(e.target.value)} rows={2} placeholder="Write your honest answer…" style={{ ...inp, resize: "vertical", lineHeight: 1.6 }} />
                      )}
                    </div>
                  );
                })}
              </div>
              <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end" }}>
                <span style={{ fontSize: 13, color: M2, fontFamily: FONT_MONO }}>{Object.keys(form.reflection || {}).length}/{REFLECTION_QUESTIONS.length} answered</span>
              </div>
            </div>
            <Footer />
          </>
        )}
      </div>
    </div>
  );
}

// ─── TRADE DETAIL ────────────────────────────────────────────────────────────
function TradeDetail({ trade, onClose, onEdit, onUpdateScreenshots }) {
  const [panelTab, setPanelTab] = useState("review");
  const tpl = TEMPLATES.find(t => t.id === trade.weeklyTemplate);
  return (
    <div style={{ position: "fixed", inset: 0, background: "#000000e0", zIndex: 1000, display: "flex" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ marginLeft: "auto", width: "100%", maxWidth: 1140, background: BG, display: "flex", flexDirection: "column", animation: "slideIn .25s ease" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 14px", borderBottom: "1px solid " + BORDER, flexShrink: 0, flexWrap: "wrap" }}>
          <span style={{ fontSize: 16, fontWeight: 800, color: A, fontFamily: FONT_MONO }}>{trade.pair}</span>
          <span style={{ color: trade.direction === "Long" ? G : R, fontFamily: FONT_MONO, fontSize: 16 }}>{trade.direction === "Long" ? "▲ LONG" : "▼ SHORT"}</span>
          <Pill result={trade.result} />
          {tpl && <TplBadge id={trade.weeklyTemplate} />}
          {trade.emotion && <EmoBadge emotion={trade.emotion} />}
          {trade.discipline > 0 && <Stars value={trade.discipline} />}
          <span style={{ color: M2, fontSize: 16, fontFamily: FONT_MONO }}>{trade.date} {trade.time} UTC · {trade.session}</span>
          <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
            <button onClick={onEdit} style={{ padding: "4px 9px", borderRadius: 5, border: "1px solid " + BORDER, background: "transparent", color: M2, cursor: "pointer", fontFamily: FONT_MONO, fontSize: 16 }}>Edit</button>
            <button onClick={onClose} style={{ padding: "4px 9px", borderRadius: 5, border: "none", background: CARD, color: TEXT, cursor: "pointer", fontFamily: FONT_MONO, fontSize: 16 }}>×</button>
          </div>
        </div>
        <div className="detail-panel" style={{ display: "grid", gridTemplateColumns: "1fr 360px", flex: 1, overflow: "hidden" }}>
          <div style={{ borderRight: "1px solid " + BORDER, overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <TradeCharts trade={trade} onUpdateScreenshots={onUpdateScreenshots} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ display: "flex", borderBottom: "1px solid " + BORDER, flexShrink: 0 }}>
              {[["review","Review"],["info","Info"],["psycho","Psyche"],["reflect","Reflect"]].map(([id, label]) => (
                <button key={id} onClick={() => setPanelTab(id)}
                  style={{ flex: 1, padding: "10px 0", border: "none", borderBottom: "2px solid " + (panelTab === id ? ACCENT : "transparent"), background: "transparent", color: panelTab === id ? GOLD : M2, cursor: "pointer", fontFamily: FONT_BODY, fontSize: 17, fontWeight: panelTab === id ? 600 : 400 }}>
                  {label}
                </button>
              ))}
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: 12 }}>
              {panelTab === "review" && <ReviewPanel review={trade.review} loading={trade.reviewLoading} />}
              {panelTab === "info" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {[["Pair",trade.pair],["Direction",trade.direction],["Entry",trade.entryPrice||"—"],["Session",trade.session],["Setup",trade.setup],["Template",tpl?tpl.name:"—"],["Date",trade.date],["Time UTC",trade.time||"—"],["Risk",trade.riskR+"R"],["Planned RR",trade.rrPlanned+"R"],["Actual RR",trade.rrActual?(toR(trade.rrActual)>0?"+":"")+toR(trade.rrActual).toFixed(2)+"R":"—"],["Result",trade.result]].map(([k, v]) => (
                    <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "6px 9px", background: CARD2, borderRadius: 5 }}>
                      <span style={{ fontSize: 16, color: M2, fontFamily: FONT_MONO, textTransform: "uppercase" }}>{k}</span>
                      <span style={{ fontSize: 16, color: TEXT, fontFamily: FONT_MONO }}>{v}</span>
                    </div>
                  ))}
                  {tpl && (
                    <div style={{ background: CARD2, border: "1px solid " + BC[tpl.bias] + "30", borderRadius: 6, padding: 10 }}>
                      <div style={{ fontSize: 16, color: BC[tpl.bias], letterSpacing: 2, fontFamily: FONT_MONO, marginBottom: 6 }}>TEMPLATE</div>
                      <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                        <Sparkline pts={tpl.pts} color={BC[tpl.bias]} w={80} h={38} />
                        <div style={{ fontSize: 16, color: TEXT, lineHeight: 1.6 }}>{tpl.desc}</div>
                      </div>
                      <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
                        {tpl.tags.map(tag => <span key={tag} style={{ fontSize: 16, padding: "1px 5px", borderRadius: 10, background: BC[tpl.bias] + "15", color: BC[tpl.bias] }}>{tag}</span>)}
                      </div>
                    </div>
                  )}
                  {trade.notes && (
                    <div style={{ background: CARD2, borderRadius: 5, padding: 9 }}>
                      <div style={{ fontSize: 16, color: M2, letterSpacing: 2, fontFamily: FONT_MONO, marginBottom: 4 }}>NOTES</div>
                      <div style={{ fontSize: 16, color: TEXT, lineHeight: 1.6 }}>{trade.notes}</div>
                    </div>
                  )}
                </div>
              )}
              {panelTab === "psycho" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ background: CARD2, border: "1px solid " + BORDER, borderRadius: 6, padding: 10 }}>
                    <div style={{ fontSize: 16, color: M2, letterSpacing: 2, fontFamily: FONT_MONO, marginBottom: 6 }}>EMOTION</div>
                    {trade.emotion ? <EmoBadge emotion={trade.emotion} /> : <span style={{ color: M2, fontSize: 16 }}>Not tracked</span>}
                  </div>
                  <div style={{ background: CARD2, border: "1px solid " + BORDER, borderRadius: 6, padding: 10 }}>
                    <div style={{ fontSize: 16, color: M2, letterSpacing: 2, fontFamily: FONT_MONO, marginBottom: 6 }}>DISCIPLINE</div>
                    {trade.discipline ? <Stars value={trade.discipline} /> : <span style={{ color: M2, fontSize: 16 }}>Not tracked</span>}
                  </div>
                  <div style={{ background: CARD2, border: "1px solid " + BORDER, borderRadius: 6, padding: 10 }}>
                    <div style={{ fontSize: 16, color: M2, letterSpacing: 2, fontFamily: FONT_MONO, marginBottom: 6 }}>CHECKLIST</div>
                    {trade.checklist ? CHECKLIST.map(item => (
                      <div key={item} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
                        <span style={{ color: trade.checklist[item] ? G : R, fontSize: 17 }}>{trade.checklist[item] ? "✓" : "✗"}</span>
                        <span style={{ fontSize: 16, color: trade.checklist[item] ? TEXT : M2 }}>{item}</span>
                      </div>
                    )) : <span style={{ color: M2, fontSize: 16 }}>Not tracked</span>}
                  </div>
                  {trade.mindset && (
                    <div style={{ background: CARD2, border: "1px solid " + BORDER, borderRadius: 6, padding: 10 }}>
                      <div style={{ fontSize: 16, color: M2, letterSpacing: 2, fontFamily: FONT_MONO, marginBottom: 4 }}>MINDSET</div>
                      <div style={{ fontSize: 16, color: TEXT, lineHeight: 1.6, fontStyle: "italic" }}>{trade.mindset}</div>
                    </div>
                  )}
                </div>
              )}
              {panelTab === "reflect" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                  {!trade.reflection || Object.keys(trade.reflection).length === 0 ? (
                    <div style={{ padding: 24, textAlign: "center", color: M2, fontSize: 17, lineHeight: 1.7 }}>No reflection data.<br />Edit the trade and fill in the Reflect tab.</div>
                  ) : REFLECTION_QUESTIONS.map((q, i) => {
                    const ans = trade.reflection[q.id];
                    if (ans === undefined) return null;
                    const col = q.type === "yn" ? (ans === true ? G : ans === false ? R : M2) : q.type === "choice" ? (q.options.indexOf(ans) === 0 ? G : q.options.indexOf(ans) === 1 ? A : R) : TEXT;
                    const display = q.type === "yn" ? (ans === true ? "✓ Yes" : ans === false ? "✗ No" : "— N/A") : ans;
                    return (
                      <div key={q.id} style={{ background: CARD2, border: "1px solid " + BORDER, borderRadius: 6, padding: "8px 11px" }}>
                        <div style={{ fontSize: 16, color: M2, marginBottom: 4, lineHeight: 1.4 }}>
                          <span style={{ fontFamily: FONT_MONO, color: MUTED, marginRight: 5 }}>{String(i + 1).padStart(2, "0")}.</span>
                          {q.q}
                        </div>
                        <div style={{ fontSize: 17, color: col, fontWeight: 600 }}>{display}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── CALENDAR LOG ────────────────────────────────────────────────────────────
const DAYS_SHORT = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function dayR(trades) {
  // sum R for a day's trades
  return trades.reduce((s,t) => s + toR(t.rrActual), 0);
}

function TradeDot({ trade, onClick }) {
  const col = trade.result === "Win" ? G : trade.result === "Loss" ? R : trade.result === "BE" ? A : M2;
  return (
    <div onClick={e => { e.stopPropagation(); onClick(trade); }}
      style={{ display: "flex", alignItems: "center", gap: 4, padding: "2px 5px", borderRadius: 4, background: col + "15", border: "1px solid " + col + "30", cursor: "pointer", marginBottom: 2 }}
      title={trade.pair + " " + (toR(trade.rrActual) > 0 ? "+" : "") + toR(trade.rrActual).toFixed(2) + "R"}>
      <div style={{ width: 5, height: 5, borderRadius: "50%", background: col, flexShrink: 0 }} />
      <span style={{ fontSize: 16, color: col, fontFamily: FONT_MONO, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 70 }}>{trade.pair}</span>
    </div>
  );
}

function CalendarLog({ trades, onSelectTrade, onNewTrade }) {
  const today = new Date();
  const [view, setView] = useState("monthly");
  const [curYear, setCurYear] = useState(today.getFullYear());
  const [curMonth, setCurMonth] = useState(today.getMonth());
  const [curWeek, setCurWeek] = useState(() => {
    // Monday of current week
    const d = new Date(today);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    d.setHours(0,0,0,0);
    return d;
  });

  // index trades by date string YYYY-MM-DD
  const byDate = useMemo(() => {
    const m = {};
    trades.forEach(t => {
      if (!m[t.date]) m[t.date] = [];
      m[t.date].push(t);
    });
    return m;
  }, [trades]);

  const fmtDate = d => {
    const y = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2,"0");
    const day = String(d.getDate()).padStart(2,"0");
    return y + "-" + mo + "-" + day;
  };

  const btnStyle = active => ({ padding: "6px 16px", borderRadius: 6, border: "1px solid " + (active ? GOLD : BORDER), background: active ? GOLD + "15" : "transparent", color: active ? GOLD : M2, cursor: "pointer", fontFamily: FONT_BODY, fontSize: 16, fontWeight: active ? 600 : 400 });
  const navBtn = onClick => ({ background: "none", border: "none", color: M2, cursor: "pointer", fontSize: 18, padding: "0 6px", lineHeight: 1 });

  // ── MONTHLY ──
  const monthlyGrid = () => {
    const firstDay = new Date(curYear, curMonth, 1);
    const lastDay = new Date(curYear, curMonth + 1, 0);
    const startPad = firstDay.getDay(); // 0=Sun
    const totalCells = Math.ceil((startPad + lastDay.getDate()) / 7) * 7;
    const cells = [];
    for (let i = 0; i < totalCells; i++) {
      const dayNum = i - startPad + 1;
      if (dayNum < 1 || dayNum > lastDay.getDate()) { cells.push(null); continue; }
      const d = new Date(curYear, curMonth, dayNum);
      cells.push(d);
    }
    return cells;
  };

  // ── WEEKLY ──
  const weekDays = () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(curWeek);
      d.setDate(curWeek.getDate() + i);
      days.push(d);
    }
    return days;
  };

  const prevMonth = () => { if (curMonth === 0) { setCurMonth(11); setCurYear(y => y - 1); } else setCurMonth(m => m - 1); };
  const nextMonth = () => { if (curMonth === 11) { setCurMonth(0); setCurYear(y => y + 1); } else setCurMonth(m => m + 1); };
  const prevWeek = () => { const d = new Date(curWeek); d.setDate(d.getDate() - 7); setCurWeek(d); };
  const nextWeek = () => { const d = new Date(curWeek); d.setDate(d.getDate() + 7); setCurWeek(d); };

  const isToday = d => d && d.toDateString() === today.toDateString();
  const isWeekend = d => d && (d.getDay() === 0 || d.getDay() === 6);

  const DayCell = ({ date, tall }) => {
    if (!date) return <div style={{ background: BG, borderRadius: 6 }} />;
    const key = fmtDate(date);
    const dayTrades = byDate[key] || [];
    const totalR = dayR(dayTrades);
    const wins = dayTrades.filter(t => t.result === "Win").length;
    const losses = dayTrades.filter(t => t.result === "Loss").length;
    const weekend = isWeekend(date);
    const rCol = totalR > 0 ? G : totalR < 0 ? R : M2;
    return (
      <div onClick={() => onNewTrade(key)}
        style={{ background: isToday(date) ? G + "08" : weekend ? BG + "80" : CARD, border: "1px solid " + (isToday(date) ? G + "40" : BORDER), borderRadius: 6, padding: "6px 7px", minHeight: tall ? 110 : 80, cursor: "pointer", display: "flex", flexDirection: "column", gap: 2, transition: "border-color .15s" }}
        onMouseEnter={e => !isToday(date) && (e.currentTarget.style.borderColor = MUTED)}
        onMouseLeave={e => !isToday(date) && (e.currentTarget.style.borderColor = BORDER)}>
        {/* Day number */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
          <span style={{ fontSize: 16, fontWeight: isToday(date) ? 700 : 400, color: isToday(date) ? G : weekend ? M2 : TEXT }}>{date.getDate()}</span>
          {dayTrades.length > 0 && (
            <span style={{ fontSize: 16, color: rCol, fontFamily: FONT_MONO, fontWeight: 600 }}>{totalR > 0 ? "+" : ""}{totalR.toFixed(1)}R</span>
          )}
        </div>
        {/* Trade dots */}
        <div style={{ flex: 1, overflow: "hidden" }}>
          {dayTrades.slice(0, tall ? 6 : 3).map(t => <TradeDot key={t.id} trade={t} onClick={onSelectTrade} />)}
          {dayTrades.length > (tall ? 6 : 3) && <div style={{ fontSize: 16, color: M2, marginTop: 2 }}>+{dayTrades.length - (tall ? 6 : 3)} more</div>}
        </div>
        {/* W/L summary */}
        {dayTrades.length > 0 && (
          <div style={{ display: "flex", gap: 5, marginTop: 2 }}>
            {wins > 0 && <span style={{ fontSize: 16, color: G, fontFamily: FONT_MONO }}>{wins}W</span>}
            {losses > 0 && <span style={{ fontSize: 16, color: R, fontFamily: FONT_MONO }}>{losses}L</span>}
          </div>
        )}
      </div>
    );
  };

  // Month summary stats
  const monthTrades = useMemo(() => {
    return trades.filter(t => {
      const d = new Date(t.date + "T12:00:00");
      return d.getFullYear() === curYear && d.getMonth() === curMonth;
    });
  }, [trades, curYear, curMonth]);

  const weekTrades = useMemo(() => {
    const days = weekDays();
    const start = fmtDate(days[0]);
    const end = fmtDate(days[6]);
    return trades.filter(t => t.date >= start && t.date <= end);
  }, [trades, curWeek]);

  const Summary = ({ tradeSet }) => {
    const cl = tradeSet.filter(t => t.result !== "Open");
    const wins = cl.filter(t => t.result === "Win").length;
    const losses = cl.filter(t => t.result === "Loss").length;
    const totalR = cl.reduce((s,t) => s + toR(t.rrActual), 0);
    const wr = cl.length ? Math.round(wins / cl.length * 100) : 0;
    if (!cl.length) return null;
    return (
      <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
        {[
          [tradeSet.length + " trades", TEXT],
          [wins + "W / " + losses + "L", M2],
          [wr + "% WR", wr >= 50 ? G : R],
          [(totalR >= 0 ? "+" : "") + totalR.toFixed(2) + "R", totalR >= 0 ? G : R],
        ].map(([label, color]) => (
          <span key={label} style={{ fontSize: 17, color, fontFamily: FONT_MONO }}>{label}</span>
        ))}
      </div>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Toolbar */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        {/* View toggle */}
        <div style={{ display: "flex", gap: 4, background: CARD, border: "1px solid " + BORDER, borderRadius: 8, padding: 3 }}>
          <button onClick={() => setView("monthly")} style={btnStyle(view === "monthly")}>Monthly</button>
          <button onClick={() => setView("weekly")} style={btnStyle(view === "weekly")}>Weekly</button>
        </div>

        {/* Navigation */}
        {view === "monthly" ? (
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <button onClick={prevMonth} style={navBtn()}>‹</button>
            <span style={{ fontSize: 17, fontWeight: 700, color: TEXT, minWidth: 160, textAlign: "center" }}>{MONTHS[curMonth]} {curYear}</span>
            <button onClick={nextMonth} style={navBtn()}>›</button>
            <button onClick={() => { setCurYear(today.getFullYear()); setCurMonth(today.getMonth()); }}
              style={{ marginLeft: 4, padding: "3px 10px", borderRadius: 5, border: "1px solid " + BORDER, background: "transparent", color: M2, cursor: "pointer", fontSize: 17 }}>Today</button>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <button onClick={prevWeek} style={navBtn()}>‹</button>
            <span style={{ fontSize: 16, fontWeight: 700, color: TEXT, minWidth: 220, textAlign: "center" }}>
              {fmtDate(weekDays()[0])} – {fmtDate(weekDays()[6])}
            </span>
            <button onClick={nextWeek} style={navBtn()}>›</button>
            <button onClick={() => {
              const d = new Date(today);
              const day = d.getDay();
              const diff = day === 0 ? -6 : 1 - day;
              d.setDate(d.getDate() + diff);
              d.setHours(0,0,0,0);
              setCurWeek(d);
            }} style={{ marginLeft: 4, padding: "3px 10px", borderRadius: 5, border: "1px solid " + BORDER, background: "transparent", color: M2, cursor: "pointer", fontSize: 17 }}>This Week</button>
          </div>
        )}

        {/* Summary */}
        <div style={{ marginLeft: "auto" }}>
          <Summary tradeSet={view === "monthly" ? monthTrades : weekTrades} />
        </div>
      </div>

      {/* MONTHLY CALENDAR */}
      {view === "monthly" && (
        <div style={{ background: CARD, border: "1px solid " + BORDER, borderRadius: 10, overflow: "hidden" }}>
          {/* Day headers */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", borderBottom: "1px solid " + BORDER }}>
            {DAYS_SHORT.map(d => (
              <div key={d} style={{ padding: "8px 0", textAlign: "center", fontSize: 17, fontWeight: 600, color: d === "Sun" || d === "Sat" ? M2 : TEXT, borderRight: "1px solid " + BORDER + "80" }}>{d}</div>
            ))}
          </div>
          {/* Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 1, padding: 1, background: BORDER }}>
            {monthlyGrid().map((date, i) => (
              <div key={i} style={{ background: BG }}>
                <DayCell date={date} tall />
              </div>
            ))}
          </div>
          {/* Legend */}
          <div style={{ display: "flex", gap: 16, padding: "10px 14px", borderTop: "1px solid " + BORDER }}>
            <span style={{ fontSize: 16, color: M2 }}>Click a day to log a trade · Click a trade pill to open it</span>
            <div style={{ display: "flex", gap: 10, marginLeft: "auto" }}>
              {[[G,"Win"],[R,"Loss"],[A,"BE"],[M2,"Open"]].map(([c,l]) => (
                <div key={l} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: c }} />
                  <span style={{ fontSize: 16, color: M2 }}>{l}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* WEEKLY CALENDAR */}
      {view === "weekly" && (
        <div style={{ background: CARD, border: "1px solid " + BORDER, borderRadius: 10, overflow: "hidden" }}>
          {/* Day columns */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 1, background: BORDER }}>
            {weekDays().map((date, i) => {
              const key = fmtDate(date);
              const dayTrades = byDate[key] || [];
              const totalR = dayR(dayTrades);
              const wins = dayTrades.filter(t => t.result === "Win").length;
              const losses = dayTrades.filter(t => t.result === "Loss").length;
              const weekend = isWeekend(date);
              const rCol = totalR > 0 ? G : totalR < 0 ? R : M2;
              return (
                <div key={i} style={{ background: BG, display: "flex", flexDirection: "column" }}>
                  {/* Header */}
                  <div onClick={() => onNewTrade(key)} style={{ padding: "10px 10px 8px", borderBottom: "1px solid " + BORDER, cursor: "pointer", background: isToday(date) ? G + "08" : weekend ? CARD2 + "80" : CARD }}>
                    <div style={{ fontSize: 17, fontWeight: 600, color: weekend ? M2 : TEXT }}>{DAYS_SHORT[date.getDay()]}</div>
                    <div style={{ fontSize: 26, fontWeight: 800, color: isToday(date) ? G : weekend ? M2 : TEXT, lineHeight: 1.1 }}>{date.getDate()}</div>
                    {dayTrades.length > 0 && (
                      <div style={{ marginTop: 4, fontSize: 16, color: rCol, fontFamily: FONT_MONO, fontWeight: 600 }}>
                        {totalR > 0 ? "+" : ""}{totalR.toFixed(2)}R
                      </div>
                    )}
                    {dayTrades.length > 0 && (
                      <div style={{ display: "flex", gap: 5, marginTop: 2 }}>
                        {wins > 0 && <span style={{ fontSize: 16, color: G, fontFamily: FONT_MONO }}>{wins}W</span>}
                        {losses > 0 && <span style={{ fontSize: 16, color: R, fontFamily: FONT_MONO }}>{losses}L</span>}
                      </div>
                    )}
                  </div>
                  {/* Trades */}
                  <div style={{ flex: 1, padding: 6, minHeight: 300, display: "flex", flexDirection: "column", gap: 4 }}>
                    {dayTrades.length === 0 ? (
                      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: BORDER, fontSize: 26 }}>+</div>
                    ) : dayTrades.map(t => {
                      const col = t.result === "Win" ? G : t.result === "Loss" ? R : t.result === "BE" ? A : M2;
                      return (
                        <div key={t.id} onClick={() => onSelectTrade(t)}
                          style={{ padding: "6px 8px", borderRadius: 6, background: col + "12", border: "1px solid " + col + "30", cursor: "pointer" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
                            <span style={{ fontSize: 17, fontWeight: 700, color: col, fontFamily: FONT_MONO }}>{t.pair}</span>
                            <Pill result={t.result} />
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span style={{ fontSize: 16, color: M2 }}>{t.session}</span>
                            <Rr v={t.rrActual} />
                          </div>
                          {t.time && <div style={{ fontSize: 16, color: MUTED, marginTop: 1, fontFamily: FONT_MONO }}>{t.time} UTC</div>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
          {/* Legend */}
          <div style={{ display: "flex", gap: 16, padding: "10px 14px", borderTop: "1px solid " + BORDER }}>
            <span style={{ fontSize: 16, color: M2 }}>Click a day header to log a trade · Click a trade card to open it</span>
            <div style={{ display: "flex", gap: 10, marginLeft: "auto" }}>
              {[[G,"Win"],[R,"Loss"],[A,"BE"],[M2,"Open"]].map(([c,l]) => (
                <div key={l} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: c }} />
                  <span style={{ fontSize: 16, color: M2 }}>{l}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── SETTINGS MODAL ──────────────────────────────────────────────────────────
function SettingsModal({ onClose }) {
  const [key, setKey] = useState(getAnthropicKey());
  const [status, setStatus] = useState("");

  const test = async () => {
    if (!key.trim()) return;
    setStatus("Testing…");
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": key.trim(), "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 10, messages: [{ role: "user", content: "Hi" }] })
      });
      const data = await res.json();
      setStatus(data.content ? "✓ API key valid!" : "✗ Invalid key — " + (data.error?.message || "check key"));
    } catch (e) {
      setStatus("✗ Network error");
    }
  };

  const save = () => {
    localStorage.setItem(ANTHROPIC_KEY_STORE, key.trim());
    onClose();
  };

  const inp = { background: CARD2, border: "1px solid " + BORDER2, borderRadius: 10, color: TEXT, padding: "12px 14px", width: "100%", fontSize: 14, fontFamily: FONT_MONO, outline: "none", boxSizing: "border-box" };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: CARD, border: "1px solid " + BORDER2, borderRadius: 16, width: "100%", maxWidth: 480, padding: 28, boxShadow: "0 24px 64px rgba(0,0,0,0.6)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: TEXT }}>Settings</div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: M2, fontSize: 20, cursor: "pointer" }}>×</button>
        </div>

        {/* Anthropic API Key */}
        <div style={{ background: CARD2, border: "1px solid " + BORDER2, borderRadius: 12, padding: 20, marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: GOLD, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Anthropic API Key</div>
          <div style={{ fontSize: 13, color: M2, lineHeight: 1.6, marginBottom: 16 }}>
            Required for AI Reviews, Coach Analysis and Chat. Get a free key at{" "}
            <a href="https://console.anthropic.com" target="_blank" rel="noreferrer" style={{ color: GOLD }}>console.anthropic.com</a>
          </div>
          <input value={key} onChange={e => setKey(e.target.value)} placeholder="sk-ant-..." style={inp} />
          <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 12 }}>
            <button onClick={test} disabled={!key.trim()} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid " + BORDER2, background: "transparent", color: M2, cursor: "pointer", fontSize: 13 }}>Test Key</button>
            {status && <span style={{ fontSize: 13, color: status.startsWith("✓") ? "#4ade80" : status === "Testing…" ? GOLD : "#f87171", fontWeight: 600 }}>{status}</span>}
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "10px 18px", borderRadius: 8, border: "1px solid " + BORDER2, background: "transparent", color: M2, cursor: "pointer", fontSize: 14 }}>Cancel</button>
          <button onClick={save} style={{ padding: "10px 24px", borderRadius: 8, border: "none", background: GOLD, color: "#000", cursor: "pointer", fontSize: 14, fontWeight: 700 }}>Save</button>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [authed, setAuthed] = useState(() => localStorage.getItem("tradelog_auth") === "1");
  if (!authed) return <LoginScreen onLogin={() => setAuthed(true)} />;
  return <TradingJournal />;
}

function TradingJournal() {
  const [trades, setTrades] = useState([]);
  const [tab, setTab] = useState("dashboard");
  const [activeAccount, setActiveAccount] = useState("FX");
  const [modal, setModal] = useState(null);
  const [detail, setDetail] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [coachReport, setCoachReport] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [coachLoading, setCoachLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [filterPair, setFilterPair] = useState("All");
  const [filterResult, setFilterResult] = useState("All");
  const chatEndRef = useRef(null);

  // Load from Supabase on mount
  useEffect(() => {
    (async () => {
      try {
        const d = await dbLoad();
        if (d) {
          setTrades(d.trades || []);
          setCoachReport(d.coachReport || null);
          setChatHistory(d.chatHistory || []);
        }
      } catch (e) { setSyncError(true); }
      setLoaded(true);
    })();
  }, []);

  // Auto-save to Supabase whenever data changes (debounced 1.5s)
  useEffect(() => {
    if (!loaded) return;
    setSyncing(true);
    setSyncError(false);
    const t = setTimeout(async () => {
      try {
        await dbSave({ trades, coachReport, chatHistory });
        setSyncError(false);
      } catch (e) { setSyncError(true); }
      setSyncing(false);
    }, 1500);
    return () => clearTimeout(t);
  }, [trades, coachReport, chatHistory, loaded]);

  const saveTrade = useCallback(async (t) => {
    const isEdit = !!trades.find(x => x.id === t.id);
    const tw = { ...t, reviewLoading: true, review: null };
    setTrades(prev => isEdit ? prev.map(x => x.id === t.id ? tw : x) : [...prev, tw]);
    setModal(null);
    if (t.result !== "Open") {
      try {
        const review = await runReview(t);
        setTrades(prev => prev.map(x => x.id === t.id ? { ...x, review, reviewLoading: false } : x));
        setDetail(prev => (prev && prev.id === t.id) ? { ...prev, review, reviewLoading: false } : prev);
      } catch (e) {
        setTrades(prev => prev.map(x => x.id === t.id ? { ...x, reviewLoading: false } : x));
      }
    } else {
      setTrades(prev => prev.map(x => x.id === t.id ? { ...x, reviewLoading: false } : x));
    }
  }, [trades]);

  const deleteTrade = (id) => { setTrades(prev => prev.filter(t => t.id !== id)); setModal(null); setDetail(null); };

  const updateScreenshots = useCallback((id, screenshots) => {
    setTrades(prev => prev.map(t => t.id === id ? { ...t, screenshots } : t));
    setDetail(prev => prev && prev.id === id ? { ...prev, screenshots } : prev);
  }, []);

  const doCoach = async () => {
    setCoachLoading(true);
    try { setCoachReport(await runCoach(trades)); } catch (e) {}
    setCoachLoading(false);
  };

  const sendChat = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const msg = { role: "user", content: chatInput.trim() };
    const hist = [...chatHistory, msg];
    setChatHistory(hist); setChatInput(""); setChatLoading(true);
    try {
      const reply = await runChat(hist, trades);
      setChatHistory(h => [...h, { role: "assistant", content: reply }]);
    } catch (e) {
      setChatHistory(h => [...h, { role: "assistant", content: "Error. Try again." }]);
    }
    setChatLoading(false);
  };

  useEffect(() => { chatEndRef.current && chatEndRef.current.scrollIntoView({ behavior: "smooth" }); }, [chatHistory]);
  useEffect(() => {
    if (detail) {
      const u = trades.find(t => t.id === detail.id);
      if (u) setDetail(u);
    }
  }, [trades]);

  // Filter trades by active account
  const accountTrades = useMemo(() => trades.filter(t => (t.account || "FX") === activeAccount), [trades, activeAccount]);

  const stats = useMemo(() => calcStats(accountTrades), [accountTrades]);

  const curve = useMemo(() => {
    let r = 0;
    return accountTrades.filter(t => t.result !== "Open")
      .sort((a, b) => (a.date + (a.time || "")) > (b.date + (b.time || "")) ? 1 : -1)
      .map((t, i) => { r += toR(t.rrActual); return { i: i + 1, r: +r.toFixed(2) }; });
  }, [accountTrades]);

  const dayData = useMemo(() => {
    return groupBy(accountTrades, t => ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][new Date(t.date + "T12:00:00").getDay()], ["Mon","Tue","Wed","Thu","Fri"]);
  }, [accountTrades]);

  const sessionData = useMemo(() => groupBy(accountTrades, t => t.session, SESSIONS), [accountTrades]);
  const setupData = useMemo(() => groupBy(accountTrades, t => t.setup, SETUPS).filter(x => x.total > 0).sort((a, b) => b.r - a.r), [accountTrades]);
  const pairData = useMemo(() => groupBy(accountTrades, t => t.pair, activeAccount === "FX" ? FX_PAIRS : INDEX_PAIRS).filter(x => x.total > 0).sort((a, b) => b.r - a.r), [accountTrades, activeAccount]);

  const tplData = useMemo(() => {
    const m = {};
    accountTrades.filter(t => t.result !== "Open" && t.weeklyTemplate).forEach(t => {
      if (!m[t.weeklyTemplate]) m[t.weeklyTemplate] = { wins: 0, losses: 0, r: 0 };
      if (t.result === "Win") m[t.weeklyTemplate].wins++;
      else if (t.result === "Loss") m[t.weeklyTemplate].losses++;
      m[t.weeklyTemplate].r += toR(t.rrActual);
    });
    return Object.entries(m).map(([id, v]) => {
      const tpl = TEMPLATES.find(t => t.id === id);
      const tot = v.wins + v.losses;
      return { id, name: tpl ? tpl.name : id, bias: tpl ? tpl.bias : "Neutral", ...v, total: tot, winRate: tot > 0 ? Math.round(v.wins / tot * 100) : 0, r: +v.r.toFixed(2) };
    }).sort((a, b) => b.total - a.total);
  }, [accountTrades]);

  const rrCompare = useMemo(() => {
    return accountTrades.filter(t => t.result !== "Open" && t.rrPlanned && t.rrActual !== "")
      .sort((a, b) => (a.date + (a.time || "")) > (b.date + (b.time || "")) ? 1 : -1)
      .map((t, i) => ({ i: i + 1, planned: +parseFloat(t.rrPlanned).toFixed(2), actual: +parseFloat(t.rrActual).toFixed(2) }));
  }, [accountTrades]);

  const filteredTrades = useMemo(() => {
    let t = accountTrades.filter(x => {
      if (filterPair !== "All" && x.pair !== filterPair) return false;
      if (filterResult !== "All" && x.result !== filterResult) return false;
      return true;
    });
    return t.sort((a, b) => (a.date + (a.time || "")) < (b.date + (b.time || "")) ? 1 : -1);
  }, [accountTrades, filterPair, filterResult]);

  const closedCount = trades.filter(t => t.result !== "Open").length;

  const navStyle = t => ({
    padding: "7px 16px",
    borderRadius: 8,
    border: "none",
    background: tab === t ? CARD2 : "transparent",
    color: tab === t ? TEXT : M2,
    cursor: "pointer",
    fontFamily: FONT_BODY,
    fontSize: 14,
    fontWeight: tab === t ? 600 : 400,
    transition: "all 0.15s",
  });
  const thS = { padding: "12px 20px", fontSize: 11, fontWeight: 700, color: M2, textTransform: "uppercase", letterSpacing: "0.08em", textAlign: "left", borderBottom: "1px solid " + BORDER2, whiteSpace: "nowrap", background: CARD };
  const tdS = { padding: "12px 14px", fontSize: 13, color: TEXT, borderBottom: "1px solid " + BORDER, verticalAlign: "middle" };

  // Greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
    <div style={{ background: BG, minHeight: "100vh", color: TEXT, fontFamily: FONT_BODY }}>
      <style>{`
        @import url('${FONT_URL}');
        html, body, #root { margin:0; padding:0; width:100%; min-height:100vh; background:${BG}; -webkit-font-smoothing:antialiased; overflow-x:hidden; }
        * { box-sizing:border-box; }
        body { font-family:${FONT_BODY}; color:${TEXT}; font-size:15px; }
        button, input, select, textarea { font-family:${FONT_BODY}; font-size:16px; }
        input, select, textarea { font-size:16px !important; } /* prevent iOS zoom */
        ::-webkit-scrollbar { width:4px; height:4px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:${MUTED}; border-radius:4px; }
        @keyframes spin { to { transform:rotate(360deg); } }
        @keyframes slideIn { from { transform:translateX(100%); opacity:0; } to { transform:translateX(0); opacity:1; } }
        @keyframes slideUp { from { transform:translateY(100%); opacity:0; } to { transform:translateY(0); opacity:1; } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        tr:hover td { background:${CARD3} !important; }

        /* ── DESKTOP ── */
        @media (min-width: 769px) {
          .modal-outer { align-items: center !important; padding: 20px !important; }
          .modal-inner { border-radius: 16px !important; }
          .nav-mobile-tabs { display: none !important; }
          .page-pb { padding-bottom: 32px !important; }
        }

        /* ── TABLET / MOBILE ── */
        @media (max-width: 768px) {
          .nav-links { display: none !important; }
          .nav-mobile-tabs { display: flex !important; }
          .hide-mobile { display: none !important; }
          .nav-pad { padding: 0 16px !important; }
          .page-pad { padding: 16px 14px !important; padding-bottom: 90px !important; }

          /* Grids collapse */
          .stat-grid { grid-template-columns: 1fr 1fr !important; gap: 10px !important; }
          .chart-grid { grid-template-columns: 1fr !important; }
          .modal-grid-3 { grid-template-columns: 1fr 1fr !important; gap: 10px !important; }
          .modal-grid-4 { grid-template-columns: 1fr 1fr !important; gap: 10px !important; }

          /* Detail panel */
          .detail-panel { grid-template-columns: 1fr !important; height: auto !important; }
          .detail-right { display: none !important; }

          /* Calendar */
          .calendar-weekly { grid-template-columns: repeat(4, 1fr) !important; }
          .cal-monthly-header span:nth-child(1), .cal-monthly-header span:nth-child(7) { display: none; }

          /* Tables */
          .table-wrap { overflow-x: auto !important; -webkit-overflow-scrolling: touch; }
          .table-wrap table { min-width: 600px !important; }

          /* Modal bottom sheet */
          .modal-inner { max-height: 95vh !important; border-radius: 20px 20px 0 0 !important; }
          .modal-header { padding: 16px 20px !important; }
          .modal-body { padding: 16px 20px !important; }
          .modal-footer { padding: 12px 20px !important; }

          /* Cards */
          .card-pad { padding: 16px !important; }
          .greeting-h1 { font-size: 22px !important; }

          /* Stat numbers */
          .stat-num { font-size: 22px !important; }

          /* Chart heights */
          .chart-h { height: 160px !important; }

          /* Equity curve */
          .equity-h { height: 180px !important; }

          /* Option button wrap */
          .opt-wrap { gap: 6px !important; }
          .opt-btn { padding: 7px 10px !important; font-size: 12px !important; }

          /* Setup buttons smaller on mobile */
          .setup-btn { padding: 5px 8px !important; font-size: 11px !important; }
        }

        /* ── SMALL PHONES ── */
        @media (max-width: 390px) {
          .stat-grid { grid-template-columns: 1fr 1fr !important; }
          .modal-grid-3 { grid-template-columns: 1fr !important; }
          .account-switcher { font-size: 11px !important; padding: 4px 8px !important; }
          .nav-logo { font-size: 16px !important; }
          .greeting-h1 { font-size: 20px !important; }
          .stat-num { font-size: 20px !important; }
        }
      `}</style>

      {!loaded && (
        <div style={{ position: "fixed", inset: 0, background: BG, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 24, zIndex: 9999 }}>
          <div style={{ fontSize: 32, fontWeight: 700, color: GOLD, letterSpacing: "-0.03em" }}>TradeLog</div>
          <div style={{ width: 36, height: 36, border: "3px solid " + MUTED, borderTopColor: GOLD, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          <span style={{ fontSize: 14, color: M2 }}>Loading your trades…</span>
        </div>
      )}

      {/* NAV — matches screenshot top bar */}
      <div className="nav-pad" style={{ borderBottom: "1px solid " + BORDER, padding: "0 28px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, position: "sticky", top: 0, background: CARD + "f8", backdropFilter: "blur(16px)", zIndex: 50, height: 56 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 18, fontWeight: 700, color: GOLD, letterSpacing: "-0.02em" }}>TradeLog</span>
          <span className="hide-mobile" style={{ color: MUTED, fontSize: 14 }}>›</span>
          <span className="hide-mobile" style={{ fontSize: 14, color: TEXT2, fontWeight: 500 }}>{tab.charAt(0).toUpperCase() + tab.slice(1)}</span>
          {/* Account switcher */}
          <div style={{ display: "flex", background: CARD2, borderRadius: 8, border: "1px solid " + BORDER2, overflow: "hidden", marginLeft: 8 }}>
            {Object.values(ACCOUNTS).map(acc => (
              <button key={acc} onClick={() => setActiveAccount(acc)} style={{ padding: "5px 14px", border: "none", background: activeAccount === acc ? GOLD : "transparent", color: activeAccount === acc ? "#000" : M2, cursor: "pointer", fontFamily: FONT_BODY, fontSize: 12, fontWeight: activeAccount === acc ? 700 : 400, transition: "all 0.15s" }}>
                {acc === "FX" ? "💱 FX" : "📊 Indices"}
              </button>
            ))}
          </div>
        </div>
        {/* Desktop nav links */}
        <div className="nav-links" style={{ display: "flex", alignItems: "center", gap: 2 }}>
          {["dashboard","log","psychology","coach","analytics"].map(t => (
            <button key={t} onClick={() => setTab(t)} style={navStyle(t)}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {loaded && (
            <span className="hide-mobile" style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 5, color: syncError ? "#f87171" : syncing ? GOLD : "#4ade80" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "currentColor", display: "inline-block", animation: syncing ? "pulse 1.2s infinite" : "none" }} />
              {syncError ? "Sync error" : syncing ? "Saving…" : "Saved"}
            </span>
          )}
          <button onClick={() => setModal("new")} style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: GOLD, color: "#000", cursor: "pointer", fontSize: 13, fontWeight: 700, boxShadow: "0 0 20px " + GOLD + "40", whiteSpace: "nowrap" }}>+ Log</button>
          <button onClick={() => setShowSettings(true)} style={{ width: 34, height: 34, borderRadius: 8, border: "1px solid " + (getAnthropicKey() ? BORDER2 : "#f87171"), background: "transparent", color: getAnthropicKey() ? M2 : "#f87171", cursor: "pointer", fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center" }} title="Settings">⚙</button>
          <button onClick={() => { localStorage.removeItem("tradelog_auth"); window.location.reload(); }} className="hide-mobile" style={{ width: 34, height: 34, borderRadius: 8, border: "1px solid " + BORDER2, background: "transparent", color: M2, cursor: "pointer", fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center" }} title="Logout">🔒</button>
        </div>
      </div>

      {/* MOBILE BOTTOM TAB BAR */}
      <div style={{ display: "none", position: "fixed", bottom: 0, left: 0, right: 0, background: CARD, borderTop: "1px solid " + BORDER, zIndex: 100, padding: "8px 0 calc(8px + env(safe-area-inset-bottom))" }} className="nav-mobile-tabs">
        {[["dashboard","📊","Home"],["log","📅","Log"],["psychology","🧠","Psyche"],["coach","💬","Coach"],["analytics","📈","Stats"]].map(([t, icon, label]) => (
          <button key={t} onClick={() => setTab(t)} style={{ flex: 1, border: "none", background: "transparent", color: tab === t ? GOLD : M2, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "4px 0", fontSize: 9, fontFamily: FONT_BODY, fontWeight: tab === t ? 600 : 400 }}>
            <span style={{ fontSize: 20 }}>{icon}</span>
            <span>{label}</span>
          </button>
        ))}
      </div>

      <div className="page-pad" style={{ padding: "24px 28px", maxWidth: 1280, margin: "0 auto", paddingBottom: 90 }}>

        {/* DASHBOARD */}
        {tab === "dashboard" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 28, animation: "fadeIn 0.3s ease" }}>
            {/* Greeting — like screenshot */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <h1 className="greeting-h1" style={{ fontSize: 28, fontWeight: 700, color: TEXT, margin: 0, letterSpacing: "-0.02em" }}>{greeting}, Kg!</h1>
                <div style={{ fontSize: 14, color: M2, marginTop: 4 }}>{today}</div>
                {stats.total > 0 && <div style={{ fontSize: 13, color: M2, marginTop: 6 }}>{stats.total} trades recorded · <span style={{ color: (stats.totalR || 0) >= 0 ? "#4ade80" : "#f87171", fontFamily: FONT_MONO, fontWeight: 600 }}>{(stats.totalR || 0) >= 0 ? "+" : ""}{(stats.totalR || 0).toFixed(2)}R total</span></div>}
              </div>
              <button onClick={() => setModal("new")} style={{ padding: "10px 22px", borderRadius: 10, border: "none", background: GOLD, color: "#000", cursor: "pointer", fontSize: 14, fontWeight: 700, boxShadow: "0 4px 20px " + GOLD + "50", display: "flex", alignItems: "center", gap: 6 }}>
                + Log Trade
              </button>
            </div>

            {/* Stat cards — matching screenshot layout */}
            <div className="stat-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
              <StatBox label="Total P&L" value={stats.totalR ? (stats.totalR > 0 ? "+" : "") + stats.totalR.toFixed(2) + "R" : "—"} color={(stats.totalR || 0) >= 0 ? "#4ade80" : "#f87171"} sub={"Avg " + (stats.avgR >= 0 ? "+" : "") + (stats.avgR || 0).toFixed(2) + "R per trade"} badge={(stats.totalR >= 0 ? "▲" : "▼") + " " + Math.abs(stats.winRate - 50).toFixed(0) + "%"} />
              <StatBox label="Win Rate" value={stats.winRate ? stats.winRate.toFixed(1) + "%" : "—"} color={stats.winRate >= 50 ? "#4ade80" : "#f87171"} sub={stats.wins + "W · " + stats.losses + "L · " + stats.be + " BE"} badge={stats.wins + "W / " + stats.losses + "L"} />
              <StatBox label="Total Trades" value={stats.total || 0} color={TEXT} sub={stats.wins + " winners · " + stats.losses + " losers"} badge={stats.total + " total"} />
              <StatBox label="Profit Factor" value={stats.profitFactor ? (isFinite(stats.profitFactor) ? stats.profitFactor.toFixed(2) + "x" : "∞") : "—"} color={stats.profitFactor >= 1.5 ? "#4ade80" : stats.profitFactor >= 1 ? GOLD : "#f87171"} sub={"Expectancy: " + ((stats.expectancy || 0) >= 0 ? "+" : "") + (stats.expectancy || 0).toFixed(2) + "R"} badge={stats.profitFactor >= 1.5 ? "Excellent" : stats.profitFactor >= 1 ? "Good" : "Improve"} />
            </div>

            {/* Equity Curve — styled like screenshot with gold fill */}
            <div className="card-pad" style={{ background: CARD, border: "1px solid " + BORDER2, borderRadius: 16, padding: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 8 }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: TEXT }}>Equity Curve</div>
                  <div style={{ fontSize: 12, color: M2, marginTop: 2 }}>Your trading performance over time</div>
                </div>
                {curve.length > 1 && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ color: curve[curve.length-1]?.r >= 0 ? "#4ade80" : "#f87171", fontSize: 13, fontWeight: 600 }}>{curve[curve.length-1]?.r >= 0 ? "▲ up" : "▼ down"}</span>
                    <span style={{ fontSize: 13, color: GOLD, fontFamily: FONT_MONO, fontWeight: 700 }}>{(stats.totalR || 0) >= 0 ? "+" : ""}{(stats.totalR || 0).toFixed(2)}R</span>
                    <span style={{ fontSize: 12, color: M2 }}>· {stats.closed} trades</span>
                  </div>
                )}
              </div>
              {curve.length < 2 ? (
                <div style={{ color: M2, textAlign: "center", padding: "48px 0", fontSize: 14 }}>Log 2+ closed trades to see your equity curve</div>
              ) : (
                <div className="equity-h" style={{ height: 220 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={curve} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                      <defs>
                        <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={GOLD} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={GOLD} stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="i" stroke="transparent" tick={{ fill: M2, fontSize: 10 }} />
                      <YAxis stroke="transparent" tick={{ fill: M2, fontSize: 10 }} width={35} />
                      <Tooltip content={<ChartTip />} />
                      <ReferenceLine y={0} stroke={BORDER2} strokeDasharray="4 4" />
                      <Line type="monotone" dataKey="r" name="R" stroke={GOLD} strokeWidth={2.5} dot={false} fill="url(#goldGrad)" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div className="chart-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div className="card-pad" style={{ background: CARD, border: "1px solid " + BORDER2, borderRadius: 16, padding: "24px" }}>
                <SH>P&L by Day</SH>
                <div className="chart-h" style={{ height: 160 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dayData} barCategoryGap="35%">
                      <XAxis dataKey="key" stroke="transparent" tick={{ fill: M2, fontSize: 12 }} />
                      <YAxis stroke="transparent" tick={{ fill: M2, fontSize: 11 }} width={30} />
                      <Tooltip content={<ChartTip />} />
                      <ReferenceLine y={0} stroke={BORDER2} />
                      <Bar dataKey="r" name="R" radius={[4,4,0,0]}>
                        {dayData.map((d, i) => <Cell key={i} fill={d.r >= 0 ? GOLD : R} fillOpacity={0.9} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="card-pad" style={{ background: CARD, border: "1px solid " + BORDER2, borderRadius: 16, padding: "24px" }}>
                <SH>Session Performance</SH>
                <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 8 }}>
                  {sessionData.map(s => (
                    <div key={s.key} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ width: 110, fontSize: 12, color: TEXT2, fontWeight: 500, flexShrink: 0 }}>{s.key}</span>
                      <WBar wr={s.winRate} total={s.total} />
                      <span style={{ fontSize: 12, color: M2, fontFamily: FONT_MONO, minWidth: 20, textAlign: "right" }}>{s.total}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent trades table — matching screenshot */}
            <div style={{ background: CARD, border: "1px solid " + BORDER2, borderRadius: 16, overflow: "hidden" }}>
              <div style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: TEXT }}>Recent Trades</div>
                  <div style={{ fontSize: 12, color: M2, marginTop: 2 }}>{stats.total} trades recorded</div>
                </div>
              </div>
              {accountTrades.length === 0 ? (
                <div style={{ padding: "40px 0", textAlign: "center", color: M2, fontSize: 14 }}>No trades yet — click <span style={{ color: GOLD, fontWeight: 600 }}>+ Log Trade</span> to start</div>
              ) : (
                <div className="table-wrap" style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 560 }}>
                    <thead><tr>
                      {["Date","Symbol","Side","Setup","RR","Result","Score"].map(h => <th key={h} style={thS}>{h}</th>)}
                    </tr></thead>
                    <tbody>
                      {[...accountTrades].sort((a, b) => (a.date + (a.time || "")) < (b.date + (b.time || "")) ? 1 : -1).slice(0, 8).map(t => (
                        <tr key={t.id} onClick={() => setDetail(t)} style={{ cursor: "pointer", transition: "background 0.1s" }}>
                          <td style={tdS}><span style={{ color: TEXT2, fontSize: 12, fontFamily: FONT_MONO }}>{t.date}</span></td>
                          <td style={tdS}><span style={{ fontWeight: 700, fontSize: 14, fontFamily: FONT_MONO }}>{t.pair}</span></td>
                          <td style={tdS}><DirBadge dir={t.direction} /></td>
                          <td style={{ ...tdS, color: M2, fontSize: 12, maxWidth: 120 }}><span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.setup}</span></td>
                          <td style={tdS}><Rr v={t.rrActual} /></td>
                          <td style={tdS}><Pill result={t.result} /></td>
                          <td style={tdS}>{t.reviewLoading ? <span style={{ color: M2, fontSize: 12 }}>…</span> : t.review ? <span style={{ color: t.review.score >= 7 ? "#4ade80" : t.review.score >= 5 ? GOLD : "#f87171", fontFamily: FONT_MONO, fontWeight: 700 }}>{t.review.score}/10</span> : <span style={{ color: M2 }}>—</span>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
        {/* LOG */}
        {tab === "log" && (
          <CalendarLog trades={accountTrades} onSelectTrade={t => setDetail(t)} onNewTrade={date => { setModal({ ...EMPTY_TRADE, date, account: activeAccount, pair: activeAccount === "Indices" ? "DAX40" : "EURUSD" }); }} />
        )}

        {/* PSYCHOLOGY */}
        {tab === "psychology" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
            <div style={{ background: CARD, border: "1px solid " + BORDER, borderRadius: 8, padding: 13 }}>
              <SH>Emotion → Win Rate & R</SH>
              {(() => {
                const m = {};
                trades.filter(t => t.result !== "Open" && t.emotion).forEach(t => {
                  if (!m[t.emotion]) m[t.emotion] = { wins: 0, losses: 0, r: 0 };
                  if (t.result === "Win") m[t.emotion].wins++;
                  else if (t.result === "Loss") m[t.emotion].losses++;
                  m[t.emotion].r += toR(t.rrActual);
                });
                const rows = Object.entries(m).map(([e, v]) => ({ emotion: e, ...v, total: v.wins + v.losses, winRate: v.wins + v.losses > 0 ? Math.round(v.wins / (v.wins + v.losses) * 100) : 0, r: +v.r.toFixed(2) })).sort((a, b) => b.total - a.total);
                if (!rows.length) return <div style={{ color: M2, textAlign: "center", padding: 20, fontSize: 16 }}>Track your emotions when logging trades</div>;
                return (
                  <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                    {rows.map(row => (
                      <div key={row.emotion} style={{ display: "grid", gridTemplateColumns: "110px 1fr 60px 50px 30px", alignItems: "center", gap: 7 }}>
                        <EmoBadge emotion={row.emotion} />
                        <WBar wr={row.winRate} total={row.total} />
                        <Rr v={row.r} />
                        <span style={{ fontSize: 16, color: M2 }}>{row.wins}W/{row.losses}L</span>
                        <span style={{ fontSize: 16, color: M2 }}>{row.total}T</span>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
            <div style={{ background: CARD, border: "1px solid " + BORDER, borderRadius: 8, padding: 13 }}>
              <SH>Discipline Score Distribution</SH>
              {(() => {
                const disc = [1,2,3,4,5].map(n => {
                  const filtered = trades.filter(t => t.result !== "Open" && t.discipline === n);
                  const wins = filtered.filter(t => t.result === "Win").length;
                  const total = filtered.length;
                  return { score: n, label: ["","Off-plan","Major breaks","Some breaks","Minor dev.","Perfect"][n], total, wins, winRate: total > 0 ? Math.round(wins / total * 100) : 0 };
                });
                if (!disc.some(d => d.total > 0)) return <div style={{ color: M2, textAlign: "center", padding: 20, fontSize: 16 }}>Track discipline scores when logging trades</div>;
                return (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {disc.map(d => (
                      <div key={d.score} style={{ display: "grid", gridTemplateColumns: "20px 110px 1fr 50px 30px", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 16, color: A }}>{"★".repeat(d.score)}</span>
                        <span style={{ fontSize: 16, color: M2 }}>{d.label}</span>
                        <WBar wr={d.winRate} total={d.total} />
                        <span style={{ fontSize: 16, color: M2 }}>{d.wins}W/{d.total - d.wins}L</span>
                        <span style={{ fontSize: 16, color: M2 }}>{d.total}T</span>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
            <div style={{ background: CARD, border: "1px solid " + BORDER, borderRadius: 8, padding: 13 }}>
              <SH>Checklist Compliance</SH>
              {(() => {
                const withChk = trades.filter(t => t.checklist);
                if (!withChk.length) return <div style={{ color: M2, textAlign: "center", padding: 18, fontSize: 16 }}>No checklist data yet</div>;
                return (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {CHECKLIST.map(item => {
                      const rate = Math.round(withChk.filter(t => t.checklist[item]).length / withChk.length * 100);
                      return (
                        <div key={item} style={{ display: "flex", alignItems: "center", gap: 9 }}>
                          <span style={{ width: 165, fontSize: 16, color: TEXT, flexShrink: 0 }}>{item}</span>
                          <div style={{ flex: 1, height: 3, background: BORDER, borderRadius: 2 }}>
                            <div style={{ width: rate + "%", height: "100%", background: rate >= 80 ? G : rate >= 50 ? A : R, borderRadius: 2 }} />
                          </div>
                          <span style={{ fontSize: 16, color: rate >= 80 ? G : rate >= 50 ? A : R, fontFamily: FONT_MONO, width: 30, textAlign: "right" }}>{rate}%</span>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* COACH */}
        {tab === "coach" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
            <div style={{ background: CARD, border: "1px solid " + BORDER, borderRadius: 8, overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 14px", borderBottom: "1px solid " + BORDER }}>
                <div>
                  <SH>Deep Pattern Analysis</SH>
                  <div style={{ fontSize: 16, color: M2, marginTop: -7 }}>Templates, emotions, setups — full AI breakdown</div>
                </div>
                <button onClick={doCoach} disabled={coachLoading || closedCount < 3}
                  style={{ padding: "6px 14px", borderRadius: 5, border: "none", background: coachLoading ? MUTED : G, color: "#000", cursor: coachLoading ? "not-allowed" : "pointer", fontFamily: FONT_MONO, fontSize: 16, fontWeight: 800, opacity: closedCount < 3 ? 0.4 : 1 }}>
                  {coachLoading ? "Analyzing…" : coachReport ? "Regenerate" : "Analyze My Trading"}
                </button>
              </div>
              <div style={{ padding: 14 }}>
                {coachLoading && (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 11, padding: 36, color: M2 }}>
                    <div style={{ width: 26, height: 26, border: "2px solid " + MUTED, borderTopColor: G, borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                    <div style={{ fontFamily: FONT_MONO, fontSize: 16 }}>Analyzing {closedCount} trades…</div>
                  </div>
                )}
                {!coachLoading && !coachReport && (
                  <div style={{ textAlign: "center", padding: "32px 16px", color: M2, fontSize: 16 }}>
                    {closedCount < 3 ? "Log at least 3 closed trades first." : "Click \"Analyze My Trading\" to generate your coaching report."}
                  </div>
                )}
                {!coachLoading && coachReport && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div style={{ display: "flex", gap: 11 }}>
                      <div style={{ background: (coachReport.overallScore >= 7 ? G : coachReport.overallScore >= 5 ? A : R) + "15", border: "1px solid " + (coachReport.overallScore >= 7 ? G : coachReport.overallScore >= 5 ? A : R) + "40", borderRadius: 9, padding: "12px 16px", textAlign: "center", flexShrink: 0 }}>
                        <div style={{ fontSize: 16, color: M2, letterSpacing: 2, fontFamily: FONT_MONO }}>SCORE</div>
                        <div style={{ fontSize: 36, fontWeight: 900, color: coachReport.overallScore >= 7 ? G : coachReport.overallScore >= 5 ? A : R, fontFamily: FONT_MONO }}>{coachReport.overallScore}</div>
                        <div style={{ fontSize: 16, color: M2, fontFamily: FONT_MONO }}>/10</div>
                      </div>
                      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                        <div style={{ background: CARD2, border: "1px solid " + BORDER, borderRadius: 6, padding: 9 }}>
                          <div style={{ fontSize: 16, color: M2, letterSpacing: 2, fontFamily: FONT_MONO, marginBottom: 3 }}>PROFILE</div>
                          <div style={{ color: A, fontSize: 17, fontStyle: "italic" }}>{coachReport.profile}</div>
                        </div>
                        <div style={{ background: CARD2, border: "1px solid " + BORDER, borderRadius: 6, padding: 9 }}>
                          <div style={{ color: TEXT, fontSize: 17, lineHeight: 1.6 }}>{coachReport.summary}</div>
                        </div>
                      </div>
                    </div>
                    {[["Emotional Pattern","#e040fb",coachReport.emotionalPattern],["Setup Pattern",G,coachReport.setupPattern],["Template Pattern","#ce93d8",coachReport.templatePattern],["Session Pattern","#64b5f6",coachReport.sessionPattern],["Risk Pattern",A,coachReport.riskPattern]].map(([label, color, text]) => text ? (
                      <div key={label} style={{ background: CARD2, border: "1px solid " + BORDER, borderRadius: 6, padding: 11 }}>
                        <div style={{ fontSize: 16, color: color, letterSpacing: 2, fontFamily: FONT_MONO, marginBottom: 4 }}>{label.toUpperCase()}</div>
                        <div style={{ color: TEXT, fontSize: 17, lineHeight: 1.6 }}>{text}</div>
                      </div>
                    ) : null)}
                    {coachReport.actionPlan && (
                      <div style={{ background: "#1a1d28", border: "1px solid " + BORDER, borderRadius: 8, padding: 13 }}>
                        <SH color={G}>5-Step Action Plan</SH>
                        {coachReport.actionPlan.map((a, i) => (
                          <div key={i} style={{ display: "flex", gap: 9, marginBottom: 8, alignItems: "flex-start" }}>
                            <div style={{ width: 18, height: 18, borderRadius: "50%", background: G + "20", border: "1px solid " + G + "40", color: G, fontSize: 16, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontFamily: FONT_MONO }}>{i + 1}</div>
                            <div style={{ color: TEXT, fontSize: 17, lineHeight: 1.5 }}>{a}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 7 }}>
                      {[[G,"FOCUS SETUP",coachReport.focusSetup],[R,"AVOID SETUP",coachReport.avoidSetup],[A,"WEEKLY GOAL",coachReport.weeklyGoal]].map(([color, label, value]) => (
                        <div key={label} style={{ background: color + "08", border: "1px solid " + color + "30", borderRadius: 6, padding: 9 }}>
                          <div style={{ fontSize: 16, color: color, letterSpacing: 2, fontFamily: FONT_MONO, marginBottom: 4 }}>{label}</div>
                          <div style={{ color: TEXT, fontSize: 16, lineHeight: 1.5 }}>{value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div style={{ background: CARD, border: "1px solid " + BORDER, borderRadius: 8, overflow: "hidden" }}>
              <div style={{ padding: "11px 14px", borderBottom: "1px solid " + BORDER }}>
                <SH>Chat With Your Coach</SH>
                <div style={{ fontSize: 16, color: M2, marginTop: -7 }}>Ask about templates, emotions, setups — it knows your data</div>
              </div>
              <div style={{ height: 280, overflowY: "auto", padding: 12, display: "flex", flexDirection: "column", gap: 7 }}>
                {chatHistory.length === 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    <div style={{ color: M2, fontSize: 16, textAlign: "center", marginBottom: 4 }}>Suggested:</div>
                    {["What's my biggest weakness?","Which weekly template am I most profitable on?","Which session should I stop trading?","How does my emotion affect my results?"].map(q => (
                      <button key={q} onClick={() => setChatInput(q)}
                        style={{ padding: "6px 10px", borderRadius: 4, border: "1px solid " + BORDER, background: CARD2, color: M2, cursor: "pointer", fontFamily: FONT_MONO, fontSize: 16, textAlign: "left" }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = G}
                        onMouseLeave={e => e.currentTarget.style.borderColor = BORDER}>
                        {q}
                      </button>
                    ))}
                  </div>
                )}
                {chatHistory.map((m, i) => (
                  <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: m.role === "user" ? "flex-end" : "flex-start", gap: 2 }}>
                    <div style={{ fontSize: 16, color: M2, letterSpacing: 1 }}>{m.role === "user" ? "YOU" : "COACH"}</div>
                    <div style={{ maxWidth: "85%", padding: "8px 11px", borderRadius: m.role === "user" ? "9px 9px 2px 9px" : "9px 9px 9px 2px", background: m.role === "user" ? G + "20" : CARD2, border: "1px solid " + (m.role === "user" ? G + "30" : BORDER), color: TEXT, fontSize: 16, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{m.content}</div>
                  </div>
                ))}
                {chatLoading && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, color: M2, fontSize: 16 }}>
                    <div style={{ width: 12, height: 12, border: "2px solid " + MUTED, borderTopColor: G, borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                    Thinking…
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
              <div style={{ padding: "8px 11px", borderTop: "1px solid " + BORDER, display: "flex", gap: 6 }}>
                <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendChat()}
                  placeholder={trades.length === 0 ? "Log trades first…" : "Ask your coach…"}
                  disabled={trades.length === 0 || chatLoading}
                  style={{ flex: 1, background: CARD2, border: "1px solid " + BORDER, borderRadius: 5, color: TEXT, padding: "6px 9px", fontSize: 16, fontFamily: FONT_MONO, outline: "none" }} />
                <button onClick={sendChat} disabled={!chatInput.trim() || chatLoading || trades.length === 0}
                  style={{ padding: "6px 12px", borderRadius: 5, border: "none", background: G, color: "#000", cursor: "pointer", fontFamily: FONT_MONO, fontSize: 16, fontWeight: 700, opacity: !chatInput.trim() || chatLoading ? 0.4 : 1 }}>Send</button>
              </div>
            </div>
          </div>
        )}

        {/* ANALYTICS */}
        {tab === "analytics" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div style={{ background: CARD, border: "1px solid " + BORDER, borderRadius: 8, padding: 13 }}>
                <SH>Win Rate by Day (%)</SH>
                <ResponsiveContainer width="100%" height={125}>
                  <BarChart data={dayData}>
                    <XAxis dataKey="key" stroke={BORDER} tick={{ fill: M2, fontSize: 16 }} />
                    <YAxis domain={[0, 100]} stroke={BORDER} tick={{ fill: M2, fontSize: 16 }} />
                    <Tooltip content={<ChartTip />} />
                    <ReferenceLine y={50} stroke={A} strokeDasharray="3 3" />
                    <Bar dataKey="winRate" name="Win %" radius={[3,3,0,0]}>
                      {dayData.map((d, i) => <Cell key={i} fill={d.winRate >= 50 ? G : R} fillOpacity={0.8} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ background: CARD, border: "1px solid " + BORDER, borderRadius: 8, padding: 13 }}>
                <SH>Planned vs Actual RR</SH>
                {rrCompare.length < 2 ? (
                  <div style={{ color: M2, textAlign: "center", padding: 22, fontSize: 16 }}>Need more closed trades</div>
                ) : (
                  <ResponsiveContainer width="100%" height={125}>
                    <LineChart data={rrCompare}>
                      <XAxis dataKey="i" stroke={BORDER} tick={{ fill: M2, fontSize: 16 }} />
                      <YAxis stroke={BORDER} tick={{ fill: M2, fontSize: 16 }} />
                      <Tooltip content={<ChartTip />} />
                      <ReferenceLine y={0} stroke={BORDER} strokeDasharray="3 3" />
                      <Line type="monotone" dataKey="planned" name="Planned" stroke={M2} strokeWidth={1.5} dot={false} strokeDasharray="4 4" />
                      <Line type="monotone" dataKey="actual" name="Actual" stroke={G} strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
            <div style={{ background: CARD, border: "1px solid " + BORDER, borderRadius: 8, padding: 13 }}>
              <SH>Weekly Template Performance</SH>
              {tplData.length === 0 ? (
                <div style={{ color: M2, textAlign: "center", padding: 20, fontSize: 16 }}>Select templates when logging trades</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {tplData.map(t => {
                    const tpl = TEMPLATES.find(x => x.id === t.id);
                    const col = BC[t.bias];
                    return (
                      <div key={t.id} style={{ display: "grid", gridTemplateColumns: "190px 55px 1fr 60px 46px 30px", alignItems: "center", gap: 7, padding: "5px 7px", borderRadius: 4, background: CARD2 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          {tpl && <Sparkline pts={tpl.pts} color={col} w={36} h={16} />}
                          <span style={{ fontSize: 16, color: TEXT }}>{t.name}</span>
                        </div>
                        <span style={{ fontSize: 13, padding: "1px 4px", borderRadius: 10, background: col + "15", color: col }}>{t.bias}</span>
                        <WBar wr={t.winRate} total={t.total} />
                        <Rr v={t.r} />
                        <span style={{ fontSize: 16, color: M2 }}>{t.wins}W/{t.losses}L</span>
                        <span style={{ fontSize: 16, color: M2 }}>{t.total}T</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div style={{ background: CARD, border: "1px solid " + BORDER, borderRadius: 8, padding: 13 }}>
              <SH>ICT Setup Performance</SH>
              {setupData.length === 0 ? (
                <div style={{ color: M2, textAlign: "center", padding: 18, fontSize: 16 }}>No data</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  {setupData.map(d => (
                    <div key={d.key} style={{ display: "grid", gridTemplateColumns: "185px 1fr 60px 46px 30px", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 16, color: TEXT }}>{d.key}</span>
                      <WBar wr={d.winRate} total={d.total} />
                      <Rr v={d.r} />
                      <span style={{ fontSize: 16, color: M2 }}>{d.wins}W/{d.losses}L</span>
                      <span style={{ fontSize: 16, color: M2 }}>{d.total}T</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div style={{ background: CARD, border: "1px solid " + BORDER, borderRadius: 8, overflow: "hidden" }}>
              <div style={{ padding: "9px 12px", borderBottom: "1px solid " + BORDER }}><SH>By Pair</SH></div>
              {pairData.length === 0 ? (
                <div style={{ padding: 18, textAlign: "center", color: M2, fontSize: 16 }}>No data</div>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead><tr>{["Pair","Total","W","L","Win Rate","Total R"].map(h => <th key={h} style={thS}>{h}</th>)}</tr></thead>
                  <tbody>{pairData.map(p => (
                    <tr key={p.key}>
                      <td style={{ ...tdS, color: A, fontWeight: 700 }}>{p.key}</td>
                      <td style={tdS}>{p.total}</td>
                      <td style={{ ...tdS, color: G }}>{p.wins}</td>
                      <td style={{ ...tdS, color: R }}>{p.losses}</td>
                      <td style={tdS}><WBar wr={p.winRate} total={p.total} /></td>
                      <td style={tdS}><Rr v={p.r} /></td>
                    </tr>
                  ))}</tbody>
                </table>
              )}
            </div>
          </div>
        )}

      </div>

      {modal && <TradeModal trade={modal === "new" ? null : modal} onSave={saveTrade} onDelete={deleteTrade} onClose={() => setModal(null)} />}
      {detail && <TradeDetail trade={detail} onClose={() => setDetail(null)} onEdit={() => { setModal(detail); setDetail(null); }} onUpdateScreenshots={updateScreenshots} />}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  );
}