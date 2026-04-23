import { useState, useMemo, useEffect } from "react";

/*
  Delt Portal — Merchant Residual Detail View
  Matches the existing Delt light-theme portal design language.
  This is what opens when you click a merchant name on the Residuals page.
*/

/* ─── DESIGN TOKENS (matching Delt portal) ─── */
const C = {
  bg: "#F8F9FC",
  white: "#FFFFFF",
  border: "#E8ECF4",
  borderLight: "#F0F2F8",
  text: "#1A1F36",
  textMid: "#3C4257",
  textMuted: "#6B7394",
  textDim: "#9CA3C0",
  indigo: "#4318FF",
  indigoLight: "#E8E3FF",
  indigoBg: "#F5F3FF",
  green: "#0E9F6E",
  greenLight: "#DEF7EC",
  greenText: "#03543F",
  red: "#F05252",
  redLight: "#FDE8E8",
  redText: "#9B1C1C",
  amber: "#E3A008",
  amberLight: "#FDF6B2",
  amberText: "#723B13",
  blue: "#3B82F6",
  blueLight: "#DBEAFE",
  cyan: "#06B6D4",
  orange: "#F97316",
  orangeLight: "#FFF7ED",
  sidebar: "#FAFBFD",
};

/* ─── MERCHANT DATA ─── */
const MERCHANT = {
  name: "Sunrise Cafe & Bakery",
  dba: "Sunrise Cafe",
  legalName: "Sunrise Cafe & Bakery LLC",
  mid: "4485-7721-0093",
  status: "Active",
  industry: "Food & Beverage / Restaurant",
  owner: "Michael Roberts",
  email: "michael@sunrisecafe.com",
  phone: "(305) 555-0147",
  address: "2847 SW 8th St, Miami, FL 33135",
  agent: "Sarah Johnson",
  agentSplit: 50,
  onboarded: "2025-08-12",
  processor: "North / NAB",
  platform: "Clover Flex + Clover Station Duo",
  pricingModel: "Tiered + Pass-Through",
  mcc: "5812",
  riskLevel: "Low",
  lensScore: 78,
  chargebackRate: 0.004,
  planTier: "Growth",
};

const EQUIPMENT = [
  { device: "Clover Station Duo", serial: "C06-2841-XR", location: "Front Counter", status: "Active", deployed: "2025-08-15", warranty: "2027-08-15", connectivity: "Ethernet", firmware: "v4.12.3", lastPing: "2 min ago" },
  { device: "Clover Flex (LTE)", serial: "CFX-9917-BM", location: "Patio / Mobile", status: "Active", deployed: "2025-09-02", warranty: "2027-09-02", connectivity: "LTE + WiFi", firmware: "v4.12.3", lastPing: "8 min ago" },
  { device: "Clover Mini (WiFi)", serial: "CMN-4402-KL", location: "Bar Register", status: "Active", deployed: "2026-01-10", warranty: "2028-01-10", connectivity: "WiFi", firmware: "v4.11.8", lastPing: "1 min ago" },
];

const MONTHLY_RESIDUALS = [
  { month: "Mar 2026", volume: 37500, txns: 812, grossRev: 1282.50, procFees: 487.50, netRev: 795.00, agentShare: 397.50, deltNet: 397.50, effRate: 0.0342, avgTicket: 46.18 },
  { month: "Feb 2026", volume: 33400, txns: 724, grossRev: 1123.46, procFees: 434.10, netRev: 689.36, agentShare: 344.68, deltNet: 344.68, effRate: 0.0336, avgTicket: 46.13 },
  { month: "Jan 2026", volume: 31200, txns: 688, grossRev: 1060.80, procFees: 405.60, netRev: 655.20, agentShare: 327.60, deltNet: 327.60, effRate: 0.0340, avgTicket: 45.35 },
  { month: "Dec 2025", volume: 39800, txns: 876, grossRev: 1393.00, procFees: 517.40, netRev: 875.60, agentShare: 437.80, deltNet: 437.80, effRate: 0.0350, avgTicket: 45.43 },
  { month: "Nov 2025", volume: 28900, txns: 642, grossRev: 982.60, procFees: 375.70, netRev: 606.90, agentShare: 303.45, deltNet: 303.45, effRate: 0.0340, avgTicket: 45.02 },
  { month: "Oct 2025", volume: 26100, txns: 578, grossRev: 887.40, procFees: 339.30, netRev: 548.10, agentShare: 274.05, deltNet: 274.05, effRate: 0.0340, avgTicket: 45.16 },
];

const INTERCHANGE_BREAKDOWN = [
  { category: "Visa Credit — Qual", volume: 14250, pct: 0.38, rate: "1.65% + $0.10", cost: 248.63 },
  { category: "Visa Credit — Mid-Qual", volume: 3375, pct: 0.09, rate: "2.30% + $0.10", cost: 81.00 },
  { category: "Visa Debit — Regulated", volume: 7500, pct: 0.20, rate: "0.05% + $0.22", cost: 19.51 },
  { category: "MC Credit — Qual", volume: 8625, pct: 0.23, rate: "1.73% + $0.10", cost: 157.80 },
  { category: "MC Debit — Regulated", volume: 2250, pct: 0.06, rate: "0.05% + $0.22", cost: 6.08 },
  { category: "Amex OptBlue", volume: 1500, pct: 0.04, rate: "2.40% + $0.10", cost: 37.50 },
];

const FEE_SCHEDULE = [
  { fee: "Monthly Minimum", amount: 25.00, type: "fixed" },
  { fee: "Statement Fee", amount: 10.00, type: "fixed" },
  { fee: "PCI Compliance Fee", amount: 14.95, type: "fixed" },
  { fee: "Batch Settlement Fee", amount: 0.25, type: "per-batch", note: "~30 batches/mo" },
  { fee: "Gateway Fee", amount: 0.03, type: "per-txn" },
  { fee: "Chargeback Fee", amount: 25.00, type: "per-incident" },
  { fee: "Retrieval Fee", amount: 15.00, type: "per-incident" },
  { fee: "Annual Fee", amount: 99.00, type: "annual", note: "Billed August" },
];

const CHARGEBACKS = [
  { date: "2026-03-22", amount: 87.50, reason: "4837 — No Cardholder Auth", status: "Won", resolution: "2026-04-05" },
  { date: "2026-01-14", amount: 142.00, reason: "4853 — Not as Described", status: "Lost", resolution: "2026-02-10" },
  { date: "2025-11-30", amount: 56.25, reason: "4840 — Fraudulent Processing", status: "Won", resolution: "2025-12-18" },
];

const BATCHES_RECENT = [
  { date: "Apr 14", txns: 28, amount: 1294.50, settled: true, time: "11:02 PM" },
  { date: "Apr 13", txns: 31, amount: 1387.00, settled: true, time: "11:01 PM" },
  { date: "Apr 12", txns: 24, amount: 1102.75, settled: true, time: "11:03 PM" },
  { date: "Apr 11", txns: 33, amount: 1521.25, settled: true, time: "11:01 PM" },
  { date: "Apr 10", txns: 27, amount: 1245.80, settled: true, time: "11:02 PM" },
  { date: "Apr 9", txns: 22, amount: 998.50, settled: true, time: "11:04 PM" },
  { date: "Apr 8", txns: 30, amount: 1356.20, settled: true, time: "11:01 PM" },
];

/* ─── HELPERS ─── */
const fmt = n => new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",minimumFractionDigits:2}).format(n);
const fmt0 = n => new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",minimumFractionDigits:0,maximumFractionDigits:0}).format(n);
const fmtPct = n => `${(n*100).toFixed(2)}%`;
const fmtK = n => n>=1000?`$${(n/1000).toFixed(1)}k`:fmt0(n);
const fmtNum = n => new Intl.NumberFormat("en-US").format(n);

/* ─── MICRO SPARKBAR ─── */
function SparkBar({data,color,maxVal}){
  const mx = maxVal || Math.max(...data);
  return <div style={{display:"flex",alignItems:"flex-end",gap:2,height:32}}>
    {data.map((v,i)=><div key={i} style={{width:10,borderRadius:2,background:i===0?color:`${color}50`,height:`${Math.max((v/mx)*100,4)}%`,transition:"height 0.3s ease"}}/>)}
  </div>;
}

/* ─── STATUS PILL ─── */
function Pill({label,bg,color}){
  return <span style={{display:"inline-flex",padding:"3px 10px",borderRadius:20,background:bg,color,fontSize:11,fontWeight:600,letterSpacing:"0.01em"}}>{label}</span>;
}

/* ─── CARD WRAPPER ─── */
function Card({children,style:s,...rest}){
  return <div style={{background:C.white,border:`1px solid ${C.border}`,borderRadius:12,padding:20,...s}} {...rest}>{children}</div>;
}

/* ─── SECTION TITLE ─── */
function STitle({children,sub,right}){
  return <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
    <div>
      <h3 style={{fontSize:15,fontWeight:700,color:C.text,margin:0,letterSpacing:"-0.01em"}}>{children}</h3>
      {sub && <p style={{fontSize:12,color:C.textMuted,margin:"2px 0 0"}}>{sub}</p>}
    </div>
    {right}
  </div>;
}

/* ─── TINY TABLE STYLES ─── */
const th = {fontSize:10,fontWeight:700,letterSpacing:"0.06em",textTransform:"uppercase",color:C.textDim,padding:"8px 10px",borderBottom:`1px solid ${C.borderLight}`,textAlign:"left"};
const td = {fontSize:13,color:C.text,padding:"10px 10px",borderBottom:`1px solid ${C.borderLight}`,fontFamily:"'Geist Mono',monospace"};
const tdL = {...td,fontFamily:"'DM Sans',sans-serif",fontWeight:500};

/* ─── MAIN COMPONENT ─── */
export default function MerchantResidualDetail(){
  const [activeTab,setActiveTab]=useState("residuals");
  const [loaded,setLoaded]=useState(false);
  useEffect(()=>{setLoaded(true);},[]);

  const M = MERCHANT;
  const latestMonth = MONTHLY_RESIDUALS[0];
  const prevMonth = MONTHLY_RESIDUALS[1];
  const volDelta = prevMonth.volume>0?(latestMonth.volume-prevMonth.volume)/prevMonth.volume:0;
  const revDelta = prevMonth.netRev>0?(latestMonth.netRev-prevMonth.netRev)/prevMonth.netRev:0;
  const totalInterchangeCost = INTERCHANGE_BREAKDOWN.reduce((s,r)=>s+r.cost,0);

  const tabs = [
    {key:"residuals",label:"Residual Detail"},
    {key:"interchange",label:"Interchange & Rates"},
    {key:"equipment",label:"Equipment & Terminals"},
    {key:"chargebacks",label:"Chargebacks & Risk"},
    {key:"batches",label:"Batch History"},
  ];

  return <div style={{
    minHeight:"100vh",
    background:C.bg,
    fontFamily:"'DM Sans',-apple-system,BlinkMacSystemFont,sans-serif",
    color:C.text,
    opacity:loaded?1:0,
    transition:"opacity 0.4s ease",
  }}>
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=Geist+Mono:wght@400;500;600;700&display=swap');
      *{box-sizing:border-box;margin:0;padding:0}
      @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
      .tab-btn{transition:all .15s;cursor:pointer;border:none;font-family:'DM Sans',sans-serif;background:transparent}
      .tab-btn:hover{color:${C.text}!important}
      .eq-row:hover{background:${C.bg}!important}
    `}</style>

    {/* ─── BREADCRUMB + BACK ─── */}
    <div style={{padding:"20px 32px 0",animation:"fadeUp .3s ease"}}>
      <div style={{display:"flex",alignItems:"center",gap:6,fontSize:13,color:C.textMuted,marginBottom:6}}>
        <span style={{cursor:"pointer",color:C.indigo,fontWeight:500}}>Merchants</span>
        <span style={{color:C.textDim}}>›</span>
        <span style={{cursor:"pointer",color:C.indigo,fontWeight:500}}>Residuals</span>
        <span style={{color:C.textDim}}>›</span>
        <span style={{color:C.textMid,fontWeight:500}}>{M.name}</span>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:6,cursor:"pointer",color:C.indigo,fontSize:13,fontWeight:500,marginBottom:16}}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.indigo} strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        Back to Residuals
      </div>
    </div>

    {/* ─── MERCHANT HEADER ─── */}
    <div style={{padding:"0 32px 0",animation:"fadeUp .3s ease .05s both"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:16}}>
        <div>
          <div style={{display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
            <h1 style={{fontSize:24,fontWeight:700,letterSpacing:"-0.02em",margin:0}}>{M.name}</h1>
            <Pill label="Food & Beverage" bg={C.indigoLight} color={C.indigo}/>
            <Pill label="Active" bg={C.greenLight} color={C.greenText}/>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:16,marginTop:6,fontSize:13,color:C.textMuted,flexWrap:"wrap"}}>
            <span>MID: <strong style={{color:C.text,fontFamily:"'Geist Mono',monospace",fontSize:12}}>{M.mid}</strong></span>
            <span>MCC: <strong style={{color:C.text}}>{M.mcc}</strong></span>
            <span>Agent: <strong style={{color:C.indigo}}>{M.agent}</strong> ({M.agentSplit}% split)</span>
            <span>Processor: <strong style={{color:C.text}}>{M.processor}</strong></span>
          </div>
        </div>
        <div style={{display:"flex",gap:8}}>
          <button style={{padding:"9px 18px",borderRadius:8,border:`1px solid ${C.border}`,background:C.white,color:C.text,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",display:"flex",alignItems:"center",gap:6}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.textMid} strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            Edit
          </button>
          <button style={{padding:"9px 18px",borderRadius:8,border:"none",background:C.indigo,color:"#fff",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",display:"flex",alignItems:"center",gap:6}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
            Export Statement
          </button>
        </div>
      </div>
    </div>

    {/* ─── KPI CARDS ─── */}
    <div style={{padding:"20px 32px 0",display:"flex",gap:12,flexWrap:"wrap",animation:"fadeUp .3s ease .1s both"}}>
      {[
        {label:"Monthly Volume",value:fmt0(latestMonth.volume),delta:volDelta,sub:"vs. last month",accent:C.indigo},
        {label:"Net Revenue",value:fmt(latestMonth.netRev),delta:revDelta,sub:"Delt + Agent",accent:C.green},
        {label:"Effective Rate",value:fmtPct(latestMonth.effRate),sub:`Avg ticket ${fmt(latestMonth.avgTicket)}`,accent:C.blue},
        {label:"Delt Net",value:fmt(latestMonth.deltNet),sub:`${M.agentSplit}% after agent split`,accent:C.indigo},
        {label:"Lens Health Score",value:null,score:M.lensScore,sub:"Out of 100 · Good",accent:C.green},
        {label:"Chargeback Rate",value:fmtPct(M.chargebackRate),sub:"Industry avg: 0.6%",accent:M.chargebackRate>0.008?C.red:C.green},
      ].map((k,i)=>(
        <div key={i} style={{flex:1,minWidth:150,background:C.white,border:`1px solid ${C.border}`,borderRadius:12,padding:"16px 18px",position:"relative"}}>
          <div style={{fontSize:11,color:C.textMuted,fontWeight:500,letterSpacing:"0.03em",marginBottom:6}}>{k.label}</div>
          {k.score!==undefined ? (
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <svg width="44" height="44" viewBox="0 0 44 44">
                <circle cx="22" cy="22" r="18" fill="none" stroke={C.borderLight} strokeWidth="4"/>
                <circle cx="22" cy="22" r="18" fill="none" stroke={k.score>=70?C.green:k.score>=50?C.amber:C.red} strokeWidth="4"
                  strokeDasharray={`${(k.score/100)*113.1} 113.1`} strokeLinecap="round"
                  transform="rotate(-90 22 22)"/>
                <text x="22" y="26" textAnchor="middle" fontSize="14" fontWeight="700" fill={C.text} fontFamily="'Geist Mono',monospace">{k.score}</text>
              </svg>
            </div>
          ) : (
            <div style={{fontSize:22,fontWeight:700,color:C.text,letterSpacing:"-0.02em",display:"flex",alignItems:"center",gap:8}}>
              {k.value}
              {k.delta!==undefined && <span style={{fontSize:12,fontWeight:600,color:k.delta>=0?C.green:C.red,display:"inline-flex",alignItems:"center",gap:2}}>
                <svg width="10" height="10" viewBox="0 0 10 10" style={{transform:k.delta>=0?"":"rotate(180deg)"}}><path d="M5 1L9 6H1Z" fill={k.delta>=0?C.green:C.red}/></svg>
                {Math.abs(k.delta*100).toFixed(1)}%
              </span>}
            </div>
          )}
          <div style={{fontSize:11,color:C.textDim,marginTop:3}}>{k.sub}</div>
        </div>
      ))}
    </div>

    {/* ─── TAB BAR ─── */}
    <div style={{padding:"22px 32px 0",animation:"fadeUp .3s ease .15s both"}}>
      <div style={{display:"flex",gap:0,borderBottom:`1px solid ${C.border}`}}>
        {tabs.map(t=>(
          <button key={t.key} className="tab-btn" onClick={()=>setActiveTab(t.key)} style={{
            padding:"10px 20px",fontSize:13,fontWeight:600,
            color:activeTab===t.key?C.indigo:C.textMuted,
            borderBottom:activeTab===t.key?`2px solid ${C.indigo}`:"2px solid transparent",
            marginBottom:-1,
          }}>{t.label}</button>
        ))}
      </div>
    </div>

    {/* ─── TAB CONTENT ─── */}
    <div style={{padding:"20px 32px 40px",animation:"fadeUp .3s ease"}}>

      {/* ═══ RESIDUAL DETAIL TAB ═══ */}
      {activeTab==="residuals" && <div style={{display:"grid",gridTemplateColumns:"1fr 340px",gap:16}}>
        {/* Monthly History Table */}
        <Card>
          <STitle sub="Rolling 6-month processor residual history">Monthly Residual History</STitle>
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse"}}>
              <thead><tr>
                {["Period","Volume","Txns","Gross Rev","Proc Fees","Net Rev","Agent","Delt Net","Eff Rate","Avg Ticket"].map(h=>
                  <th key={h} style={th}>{h}</th>
                )}
              </tr></thead>
              <tbody>
                {MONTHLY_RESIDUALS.map((r,i)=>(
                  <tr key={i} style={{background:i===0?"#F8F5FF":"transparent"}}>
                    <td style={{...tdL,fontWeight:700,color:i===0?C.indigo:C.text}}>{r.month}</td>
                    <td style={td}>{fmt0(r.volume)}</td>
                    <td style={td}>{fmtNum(r.txns)}</td>
                    <td style={td}>{fmt(r.grossRev)}</td>
                    <td style={{...td,color:C.red}}>{fmt(r.procFees)}</td>
                    <td style={{...td,fontWeight:700}}>{fmt(r.netRev)}</td>
                    <td style={{...td,color:C.indigo}}>{fmt(r.agentShare)}</td>
                    <td style={{...td,fontWeight:700,color:C.green}}>{fmt(r.deltNet)}</td>
                    <td style={td}>{fmtPct(r.effRate)}</td>
                    <td style={td}>{fmt(r.avgTicket)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Right sidebar */}
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          {/* Volume Trend */}
          <Card>
            <STitle sub="Last 6 months">Volume Trend</STitle>
            <div style={{display:"flex",alignItems:"flex-end",justifyContent:"space-between",gap:4,height:64,padding:"0 4px"}}>
              {[...MONTHLY_RESIDUALS].reverse().map((r,i,arr)=>{
                const mx=Math.max(...arr.map(x=>x.volume));
                const isLast=i===arr.length-1;
                return <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                  <div style={{width:"100%",maxWidth:24,borderRadius:4,background:isLast?C.indigo:`${C.indigo}30`,height:`${Math.max((r.volume/mx)*100,6)}%`,transition:"height .5s ease"}}/>
                  <span style={{fontSize:8,color:C.textDim,fontFamily:"'Geist Mono',monospace"}}>{r.month.slice(0,3)}</span>
                </div>;
              })}
            </div>
          </Card>

          {/* Merchant Info */}
          <Card>
            <STitle>Account Details</STitle>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {[
                {l:"Legal Name",v:M.legalName},
                {l:"DBA",v:M.dba},
                {l:"MID",v:M.mid,mono:true},
                {l:"MCC Code",v:`${M.mcc} — Eating Places, Restaurants`},
                {l:"Pricing Model",v:M.pricingModel},
                {l:"Owner",v:M.owner},
                {l:"Contact",v:M.email},
                {l:"Phone",v:M.phone},
                {l:"Address",v:M.address},
                {l:"Onboarded",v:new Date(M.onboarded+"T12:00:00").toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"})},
                {l:"Risk Tier",v:M.riskLevel},
              ].map((r,i)=>(
                <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12}}>
                  <span style={{fontSize:12,color:C.textMuted,flexShrink:0,minWidth:90}}>{r.l}</span>
                  <span style={{fontSize:12,color:C.text,fontWeight:500,textAlign:"right",fontFamily:r.mono?"'Geist Mono',monospace":"inherit"}}>{r.v}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Agent Split */}
          <Card>
            <STitle>Agent Commission Structure</STitle>
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
              <div style={{width:36,height:36,borderRadius:8,background:C.indigoBg,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,color:C.indigo,fontSize:14}}>SJ</div>
              <div>
                <div style={{fontSize:14,fontWeight:600}}>{M.agent}</div>
                <div style={{fontSize:11,color:C.textMuted}}>50/50 net revenue split</div>
              </div>
            </div>
            <div style={{background:C.bg,borderRadius:8,padding:12,display:"flex",gap:12}}>
              <div style={{flex:1,textAlign:"center"}}>
                <div style={{fontSize:10,color:C.textMuted,marginBottom:2}}>Agent</div>
                <div style={{fontSize:16,fontWeight:700,color:C.indigo}}>{fmt(latestMonth.agentShare)}</div>
              </div>
              <div style={{width:1,background:C.border}}/>
              <div style={{flex:1,textAlign:"center"}}>
                <div style={{fontSize:10,color:C.textMuted,marginBottom:2}}>Delt</div>
                <div style={{fontSize:16,fontWeight:700,color:C.green}}>{fmt(latestMonth.deltNet)}</div>
              </div>
            </div>
          </Card>
        </div>
      </div>}

      {/* ═══ INTERCHANGE TAB ═══ */}
      {activeTab==="interchange" && <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        <Card style={{gridColumn:"1 / -1"}}>
          <STitle sub={`March 2026 · ${fmt0(latestMonth.volume)} total volume`}>Interchange Breakdown by Card Type</STitle>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead><tr>
              {["Card Category","Volume","% of Total","Interchange Rate","IC Cost","Margin to Merchant"].map(h=><th key={h} style={th}>{h}</th>)}
            </tr></thead>
            <tbody>
              {INTERCHANGE_BREAKDOWN.map((r,i)=>(
                <tr key={i}>
                  <td style={tdL}>{r.category}</td>
                  <td style={td}>{fmt0(r.volume)}</td>
                  <td style={td}>{fmtPct(r.pct)}</td>
                  <td style={{...td,color:C.textMid}}>{r.rate}</td>
                  <td style={{...td,color:C.red}}>{fmt(r.cost)}</td>
                  <td style={{...td,color:C.green,fontWeight:600}}>{fmt((r.volume * latestMonth.effRate) - r.cost)}</td>
                </tr>
              ))}
              <tr style={{background:C.bg}}>
                <td style={{...tdL,fontWeight:700}}>Total</td>
                <td style={{...td,fontWeight:700}}>{fmt0(latestMonth.volume)}</td>
                <td style={{...td,fontWeight:700}}>100%</td>
                <td style={td}></td>
                <td style={{...td,fontWeight:700,color:C.red}}>{fmt(totalInterchangeCost)}</td>
                <td style={{...td,fontWeight:700,color:C.green}}>{fmt(latestMonth.grossRev - totalInterchangeCost)}</td>
              </tr>
            </tbody>
          </table>
        </Card>

        {/* Fee Schedule */}
        <Card>
          <STitle sub="Monthly recurring + per-transaction fees">Fee Schedule</STitle>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead><tr>{["Fee","Amount","Type"].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead>
            <tbody>
              {FEE_SCHEDULE.map((f,i)=>(
                <tr key={i}>
                  <td style={tdL}>{f.fee}</td>
                  <td style={td}>{fmt(f.amount)}</td>
                  <td style={{...tdL,fontSize:11}}>
                    <Pill label={f.type==="fixed"?"Fixed":f.type==="per-txn"?"Per Txn":f.type==="per-batch"?"Per Batch":f.type==="per-incident"?"Per Incident":"Annual"}
                      bg={f.type==="fixed"?C.blueLight:f.type==="annual"?C.amberLight:C.bg}
                      color={f.type==="fixed"?C.blue:f.type==="annual"?C.amberText:C.textMid}/>
                    {f.note && <span style={{marginLeft:6,fontSize:10,color:C.textDim}}>{f.note}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        {/* Rate Analysis */}
        <Card>
          <STitle sub="Merchant pricing vs actual cost basis">Rate Analysis</STitle>
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            {[
              {label:"Merchant Effective Rate",value:fmtPct(latestMonth.effRate),bar:latestMonth.effRate,color:C.text},
              {label:"Blended IC + Assessments",value:fmtPct(totalInterchangeCost/latestMonth.volume),bar:totalInterchangeCost/latestMonth.volume,color:C.red},
              {label:"Gross Margin (Spread)",value:fmtPct(latestMonth.effRate - totalInterchangeCost/latestMonth.volume),bar:latestMonth.effRate - totalInterchangeCost/latestMonth.volume,color:C.green},
              {label:"Net Margin After Agent",value:fmtPct((latestMonth.deltNet)/(latestMonth.volume)),bar:(latestMonth.deltNet)/(latestMonth.volume),color:C.indigo},
            ].map((r,i)=>(
              <div key={i}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                  <span style={{fontSize:12,color:C.textMid,fontWeight:500}}>{r.label}</span>
                  <span style={{fontSize:13,fontWeight:700,color:r.color,fontFamily:"'Geist Mono',monospace"}}>{r.value}</span>
                </div>
                <div style={{height:6,borderRadius:3,background:C.borderLight,overflow:"hidden"}}>
                  <div style={{height:"100%",width:`${Math.min((r.bar/0.04)*100,100)}%`,borderRadius:3,background:r.color,opacity:0.7,transition:"width .5s ease"}}/>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>}

      {/* ═══ EQUIPMENT TAB ═══ */}
      {activeTab==="equipment" && <div style={{display:"flex",flexDirection:"column",gap:16}}>
        <Card>
          <STitle sub={`${EQUIPMENT.length} active devices`} right={
            <Pill label={`Platform: ${M.platform.split("+")[0].trim()}`} bg={C.indigoLight} color={C.indigo}/>
          }>Terminal & Equipment Inventory</STitle>
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            {EQUIPMENT.map((eq,i)=>(
              <div key={i} className="eq-row" style={{border:`1px solid ${C.border}`,borderRadius:10,padding:16,display:"grid",gridTemplateColumns:"1.5fr 1fr 1fr 1fr 1fr",gap:16,alignItems:"flex-start",transition:"background .15s",cursor:"pointer"}}>
                <div>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.indigo} strokeWidth="1.5"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
                    <span style={{fontSize:14,fontWeight:700,color:C.text}}>{eq.device}</span>
                  </div>
                  <div style={{fontSize:11,color:C.textMuted,fontFamily:"'Geist Mono',monospace"}}>{eq.serial}</div>
                </div>
                <div>
                  <div style={{fontSize:10,color:C.textDim,marginBottom:2,fontWeight:600,textTransform:"uppercase",letterSpacing:".05em"}}>Location</div>
                  <div style={{fontSize:13,fontWeight:500}}>{eq.location}</div>
                </div>
                <div>
                  <div style={{fontSize:10,color:C.textDim,marginBottom:2,fontWeight:600,textTransform:"uppercase",letterSpacing:".05em"}}>Connectivity</div>
                  <div style={{fontSize:13,fontWeight:500}}>{eq.connectivity}</div>
                  <div style={{fontSize:10,color:C.textDim,marginTop:2}}>FW {eq.firmware}</div>
                </div>
                <div>
                  <div style={{fontSize:10,color:C.textDim,marginBottom:2,fontWeight:600,textTransform:"uppercase",letterSpacing:".05em"}}>Warranty</div>
                  <div style={{fontSize:13,fontWeight:500}}>{new Date(eq.warranty+"T12:00:00").toLocaleDateString("en-US",{month:"short",year:"numeric"})}</div>
                  <div style={{fontSize:10,color:C.textDim,marginTop:2}}>Deployed {new Date(eq.deployed+"T12:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}</div>
                </div>
                <div>
                  <div style={{fontSize:10,color:C.textDim,marginBottom:2,fontWeight:600,textTransform:"uppercase",letterSpacing:".05em"}}>Status</div>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <span style={{width:6,height:6,borderRadius:"50%",background:C.green,boxShadow:`0 0 6px ${C.green}40`}}/>
                    <span style={{fontSize:13,fontWeight:600,color:C.green}}>Online</span>
                  </div>
                  <div style={{fontSize:10,color:C.textDim,marginTop:2}}>Last ping: {eq.lastPing}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>}

      {/* ═══ CHARGEBACKS TAB ═══ */}
      {activeTab==="chargebacks" && <div style={{display:"grid",gridTemplateColumns:"1fr 340px",gap:16}}>
        <Card>
          <STitle sub="All disputes and representments" right={
            <Pill label={`${fmtPct(M.chargebackRate)} rate`} bg={M.chargebackRate>0.008?C.redLight:C.greenLight} color={M.chargebackRate>0.008?C.redText:C.greenText}/>
          }>Chargeback History</STitle>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead><tr>{["Date","Amount","Reason Code","Status","Resolved"].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead>
            <tbody>
              {CHARGEBACKS.map((cb,i)=>(
                <tr key={i}>
                  <td style={td}>{new Date(cb.date+"T12:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}</td>
                  <td style={{...td,fontWeight:600}}>{fmt(cb.amount)}</td>
                  <td style={tdL}>{cb.reason}</td>
                  <td style={tdL}><Pill label={cb.status} bg={cb.status==="Won"?C.greenLight:C.redLight} color={cb.status==="Won"?C.greenText:C.redText}/></td>
                  <td style={td}>{new Date(cb.resolution+"T12:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric"})}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          <Card>
            <STitle>Risk Summary</STitle>
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              {[
                {l:"Chargeback Rate",v:fmtPct(M.chargebackRate),c:M.chargebackRate>0.008?C.red:C.green},
                {l:"Visa Threshold",v:M.chargebackRate>0.009?"At Risk":"Within Limits",c:M.chargebackRate>0.009?C.red:C.green},
                {l:"MC Threshold",v:"Within Limits",c:C.green},
                {l:"Total Disputes (12mo)",v:"3"},
                {l:"Win Rate",v:"66.7%",c:C.green},
                {l:"Total Exposure",v:fmt(CHARGEBACKS.reduce((s,c)=>s+c.amount,0))},
                {l:"Risk Tier",v:M.riskLevel,c:C.green},
              ].map((r,i)=>(
                <div key={i} style={{display:"flex",justifyContent:"space-between"}}>
                  <span style={{fontSize:12,color:C.textMuted}}>{r.l}</span>
                  <span style={{fontSize:12,fontWeight:600,color:r.c||C.text}}>{r.v}</span>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <STitle>Compliance Status</STitle>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {[
                {l:"PCI DSS",v:"Compliant",ok:true},
                {l:"SAQ Type",v:"SAQ B-IP",ok:true},
                {l:"Last PCI Scan",v:"Mar 12, 2026",ok:true},
                {l:"EMV Enabled",v:"All terminals",ok:true},
                {l:"3D Secure",v:"N/A (Card Present)",ok:true},
              ].map((r,i)=>(
                <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span style={{fontSize:12,color:C.textMuted}}>{r.l}</span>
                  <div style={{display:"flex",alignItems:"center",gap:5}}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
                    <span style={{fontSize:12,fontWeight:600,color:C.green}}>{r.v}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>}

      {/* ═══ BATCH HISTORY TAB ═══ */}
      {activeTab==="batches" && <div style={{display:"grid",gridTemplateColumns:"1fr 340px",gap:16}}>
        <Card>
          <STitle sub="Last 7 days of batch settlements">Recent Batch History</STitle>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead><tr>{["Date","Settled","Transactions","Amount","Avg Txn"].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead>
            <tbody>
              {BATCHES_RECENT.map((b,i)=>(
                <tr key={i}>
                  <td style={{...tdL,fontWeight:600}}>{b.date}</td>
                  <td style={tdL}>
                    <div style={{display:"flex",alignItems:"center",gap:5}}>
                      <span style={{width:6,height:6,borderRadius:"50%",background:C.green}}/>
                      <span style={{fontSize:12,color:C.green,fontWeight:500}}>{b.time}</span>
                    </div>
                  </td>
                  <td style={td}>{b.txns}</td>
                  <td style={{...td,fontWeight:700}}>{fmt(b.amount)}</td>
                  <td style={td}>{fmt(b.amount/b.txns)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          <Card>
            <STitle>7-Day Batch Summary</STitle>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {[
                {l:"Total Settled",v:fmt(BATCHES_RECENT.reduce((s,b)=>s+b.amount,0))},
                {l:"Total Transactions",v:fmtNum(BATCHES_RECENT.reduce((s,b)=>s+b.txns,0))},
                {l:"Avg Daily Volume",v:fmt(BATCHES_RECENT.reduce((s,b)=>s+b.amount,0)/BATCHES_RECENT.length)},
                {l:"Avg Batch Size",v:`${Math.round(BATCHES_RECENT.reduce((s,b)=>s+b.txns,0)/BATCHES_RECENT.length)} txns`},
                {l:"Settlement Time",v:"Next Day",c:C.green},
                {l:"Missed Batches",v:"0",c:C.green},
              ].map((r,i)=>(
                <div key={i} style={{display:"flex",justifyContent:"space-between"}}>
                  <span style={{fontSize:12,color:C.textMuted}}>{r.l}</span>
                  <span style={{fontSize:12,fontWeight:600,color:r.c||C.text,fontFamily:"'Geist Mono',monospace"}}>{r.v}</span>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <STitle>Batch Volume (7d)</STitle>
            <div style={{display:"flex",alignItems:"flex-end",justifyContent:"space-between",gap:6,height:56,padding:"0 4px"}}>
              {[...BATCHES_RECENT].reverse().map((b,i,arr)=>{
                const mx=Math.max(...arr.map(x=>x.amount));
                return <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                  <div style={{width:"100%",maxWidth:28,borderRadius:4,background:i===arr.length-1?C.indigo:`${C.indigo}30`,height:`${Math.max((b.amount/mx)*100,8)}%`,transition:"height .5s ease"}}/>
                  <span style={{fontSize:8,color:C.textDim,fontFamily:"'Geist Mono',monospace"}}>{b.date.split(" ")[1]}</span>
                </div>;
              })}
            </div>
          </Card>
        </div>
      </div>}

    </div>
  </div>;
}