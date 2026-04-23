import { useState, useMemo, useEffect } from "react";

/* ─── BRAND TOKENS ─── */
const B = {
  indigo: "#4318FF", indigoLight: "#6B5BFF", indigoDim: "rgba(67,24,255,0.12)",
  navy: "#041e42",
  dark: "#070C1A", surface: "#0B1224", surfaceRaised: "#101A32",
  surfaceHover: "#152342", border: "rgba(107,91,255,0.10)", borderLight: "rgba(255,255,255,0.05)",
  text: "#EEF0F6", textMuted: "#7A8BB5", textDim: "#3F5078",
  green: "#22C55E", greenDim: "rgba(34,197,94,0.10)",
  amber: "#F59E0B", amberDim: "rgba(245,158,11,0.10)",
  red: "#EF4444", redDim: "rgba(239,68,68,0.10)",
  cyan: "#06B6D4", cyanDim: "rgba(6,182,212,0.10)",
  purple: "#A855F7", purpleDim: "rgba(168,85,247,0.10)",
  orange: "#F97316", orangeDim: "rgba(249,115,22,0.10)",
};

/* ─── DEAL DATA ─── */
const DEALS = [
  // Self-funded deals
  { id:"MCA-2026-001", merchant:"Havana Bites Café", type:"Restaurant", channel:"self", funded:"2026-01-15", fundedAmt:18000, factor:1.35, totalOwed:24300, collected:17820, holdback:15, dailyDebit:145, status:"active", daysInDefault:0, lastPayment:"2026-04-12", achStatus:"current",
    avg7d:141, avg30d:148, stackCount:0, renewalEligible:true, uccFiled:"2026-01-14", uccExpires:"2031-01-14", costOfCapitalPaid:2160, referralCommission:0 },
  { id:"MCA-2026-002", merchant:"Coral Reef Auto Spa", type:"Auto Services", channel:"self", funded:"2026-02-03", fundedAmt:25000, factor:1.38, totalOwed:34500, collected:18400, holdback:18, dailyDebit:210, status:"active", daysInDefault:0, lastPayment:"2026-04-14", achStatus:"current",
    avg7d:215, avg30d:208, stackCount:1, renewalEligible:true, uccFiled:"2026-02-02", uccExpires:"2031-02-02", costOfCapitalPaid:2500, referralCommission:0 },
  { id:"MCA-2026-003", merchant:"Wynwood Ink Studio", type:"Retail", channel:"self", funded:"2025-11-20", fundedAmt:12000, factor:1.32, totalOwed:15840, collected:15840, holdback:12, dailyDebit:0, status:"paid", daysInDefault:0, lastPayment:"2026-03-28", achStatus:"completed",
    avg7d:0, avg30d:0, stackCount:0, renewalEligible:false, uccFiled:"2025-11-19", uccExpires:"2030-11-19", costOfCapitalPaid:1440, referralCommission:0 },
  { id:"MCA-2026-004", merchant:"SoBe Cycle & Fitness", type:"Health & Fitness", channel:"self", funded:"2026-03-01", fundedAmt:20000, factor:1.36, totalOwed:27200, collected:5440, holdback:15, dailyDebit:165, status:"active", daysInDefault:0, lastPayment:"2026-04-13", achStatus:"current",
    avg7d:162, avg30d:167, stackCount:0, renewalEligible:false, uccFiled:"2026-02-28", uccExpires:"2031-02-28", costOfCapitalPaid:800, referralCommission:0 },
  { id:"MCA-2026-005", merchant:"Little Havana Barbershop", type:"Personal Services", channel:"self", funded:"2025-12-10", fundedAmt:8000, factor:1.30, totalOwed:10400, collected:7280, holdback:10, dailyDebit:68, status:"slow", daysInDefault:5, lastPayment:"2026-04-08", achStatus:"nsf-retry",
    avg7d:42, avg30d:63, stackCount:2, renewalEligible:false, uccFiled:"2025-12-09", uccExpires:"2030-12-09", costOfCapitalPaid:960, referralCommission:0 },
  { id:"MCA-2026-006", merchant:"Doral Fresh Market", type:"Grocery", channel:"self", funded:"2026-01-28", fundedAmt:22000, factor:1.34, totalOwed:29480, collected:14150, holdback:16, dailyDebit:188, status:"active", daysInDefault:0, lastPayment:"2026-04-14", achStatus:"current",
    avg7d:192, avg30d:186, stackCount:0, renewalEligible:false, uccFiled:"2026-01-27", uccExpires:"2031-01-27", costOfCapitalPaid:1760, referralCommission:0 },
  { id:"MCA-2026-007", merchant:"Brickell Dry Cleaners", type:"Services", channel:"self", funded:"2026-02-20", fundedAmt:10000, factor:1.33, totalOwed:13300, collected:3990, holdback:12, dailyDebit:85, status:"default", daysInDefault:14, lastPayment:"2026-03-31", achStatus:"suspended",
    avg7d:0, avg30d:28, stackCount:3, renewalEligible:false, uccFiled:"2026-02-19", uccExpires:"2031-02-19", costOfCapitalPaid:600, referralCommission:0 },
  // Fundomate referral deals
  { id:"FDM-2026-001", merchant:"Midtown Taqueria", type:"Restaurant", channel:"fundomate", funded:"2026-02-10", fundedAmt:35000, factor:1.40, totalOwed:49000, collected:22050, holdback:17, dailyDebit:310, status:"active", daysInDefault:0, lastPayment:"2026-04-14", achStatus:"current",
    avg7d:305, avg30d:312, stackCount:0, renewalEligible:true, uccFiled:"2026-02-09", uccExpires:"2031-02-09", costOfCapitalPaid:0, referralCommission:2450, commissionRate:0.07, commissionPaid:true },
  { id:"FDM-2026-002", merchant:"Kendall Pet Grooming", type:"Personal Services", channel:"fundomate", funded:"2026-03-05", fundedAmt:18000, factor:1.36, totalOwed:24480, collected:6120, holdback:14, dailyDebit:155, status:"active", daysInDefault:0, lastPayment:"2026-04-13", achStatus:"current",
    avg7d:158, avg30d:153, stackCount:0, renewalEligible:false, uccFiled:"2026-03-04", uccExpires:"2031-03-04", costOfCapitalPaid:0, referralCommission:1260, commissionRate:0.07, commissionPaid:true },
  { id:"FDM-2026-003", merchant:"Aventura Nail Lounge", type:"Personal Services", channel:"fundomate", funded:"2026-03-18", fundedAmt:28000, factor:1.38, totalOwed:38640, collected:4636, holdback:15, dailyDebit:245, status:"active", daysInDefault:0, lastPayment:"2026-04-14", achStatus:"current",
    avg7d:248, avg30d:241, stackCount:1, renewalEligible:false, uccFiled:"2026-03-17", uccExpires:"2031-03-17", costOfCapitalPaid:0, referralCommission:1960, commissionRate:0.07, commissionPaid:false },
  { id:"FDM-2026-004", merchant:"Hialeah Tire & Brake", type:"Auto Services", channel:"fundomate", funded:"2026-01-22", fundedAmt:42000, factor:1.42, totalOwed:59640, collected:35784, holdback:20, dailyDebit:380, status:"active", daysInDefault:0, lastPayment:"2026-04-14", achStatus:"current",
    avg7d:375, avg30d:382, stackCount:0, renewalEligible:true, uccFiled:"2026-01-21", uccExpires:"2031-01-21", costOfCapitalPaid:0, referralCommission:2940, commissionRate:0.07, commissionPaid:true },
  { id:"FDM-2026-005", merchant:"Palmetto Bay Bakery", type:"Restaurant", channel:"fundomate", funded:"2026-04-01", fundedAmt:15000, factor:1.32, totalOwed:19800, collected:1188, holdback:12, dailyDebit:126, status:"active", daysInDefault:0, lastPayment:"2026-04-14", achStatus:"current",
    avg7d:126, avg30d:126, stackCount:0, renewalEligible:false, uccFiled:"2026-03-31", uccExpires:"2031-03-31", costOfCapitalPaid:0, referralCommission:1050, commissionRate:0.07, commissionPaid:false },
];

const COST_RATE = 0.02;

/* ─── HELPERS ─── */
const fmt = n => new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",minimumFractionDigits:0,maximumFractionDigits:0}).format(n);
const fmtK = n => n>=1000?`$${(n/1000).toFixed(n>=10000?0:1)}k`:fmt(n);
const fmtPct = n => `${(n*100).toFixed(1)}%`;
const fmtDate = d => new Date(d+"T12:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric"});
const fmtDateFull = d => new Date(d+"T12:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"});
const daysBetween = (a,b) => Math.round((new Date(b)-new Date(a))/86400000);
const today = "2026-04-14";

/* ─── TINY COMPONENTS ─── */
function StatusDot({color}){return <span style={{width:6,height:6,borderRadius:"50%",background:color,boxShadow:`0 0 6px ${color}80`,display:"inline-block",flexShrink:0}}/>;}
function StatusBadge({status}){
  const m={active:{l:"Active",bg:B.greenDim,c:B.green},paid:{l:"Paid Off",bg:B.cyanDim,c:B.cyan},slow:{l:"Slow Pay",bg:B.amberDim,c:B.amber},default:{l:"Default",bg:B.redDim,c:B.red}};
  const s=m[status];
  return <span style={{display:"inline-flex",alignItems:"center",gap:5,padding:"3px 9px",borderRadius:20,background:s.bg,color:s.c,fontSize:11,fontWeight:600}}><StatusDot color={s.c}/>{s.l}</span>;
}
function ChannelBadge({channel}){
  const isSelf = channel==="self";
  return <span style={{display:"inline-flex",alignItems:"center",gap:4,padding:"2px 7px",borderRadius:6,background:isSelf?B.indigoDim:B.orangeDim,color:isSelf?B.indigoLight:B.orange,fontSize:9,fontWeight:700,letterSpacing:"0.04em",textTransform:"uppercase",fontFamily:"'JetBrains Mono',monospace"}}>
    {isSelf?"SELF-FUNDED":"FUNDOMATE"}
  </span>;
}
function ACHBadge({status}){
  const m={current:{l:"Current",c:B.green},completed:{l:"Completed",c:B.cyan},"nsf-retry":{l:"NSF Retry",c:B.amber},suspended:{l:"Suspended",c:B.red}};
  const s=m[status];
  return <span style={{fontSize:10,fontWeight:700,color:s.c,letterSpacing:"0.05em",textTransform:"uppercase",fontFamily:"'JetBrains Mono',monospace"}}>{s.l}</span>;
}
function ProgressBar({pct,color,h=5}){
  return <div style={{width:"100%",height:h,borderRadius:h/2,background:"rgba(255,255,255,0.04)",overflow:"hidden"}}>
    <div style={{height:"100%",width:`${Math.min(pct,100)}%`,borderRadius:h/2,background:`linear-gradient(90deg,${color},${color}cc)`,boxShadow:`0 0 10px ${color}30`,transition:"width 0.8s cubic-bezier(0.16,1,0.3,1)"}}/>
  </div>;
}
function VelocityArrow({avg7d,avg30d}){
  if(avg30d===0) return <span style={{color:B.textDim,fontSize:11}}>—</span>;
  const delta=(avg7d-avg30d)/avg30d;
  const up=delta>=0;
  const color=up?B.green:delta>-0.15?B.amber:B.red;
  return <span style={{display:"inline-flex",alignItems:"center",gap:3,color,fontSize:11,fontWeight:600,fontFamily:"'JetBrains Mono',monospace"}}>
    <svg width="10" height="10" viewBox="0 0 10 10" style={{transform:up?"":"rotate(180deg)"}}><path d="M5 1L9 6H6.5V9H3.5V6H1Z" fill={color}/></svg>
    {Math.abs(delta*100).toFixed(0)}%
  </span>;
}
function StackWarning({count}){
  if(count===0) return <span style={{fontSize:10,color:B.textDim}}>Clean</span>;
  const color=count>=2?B.red:B.amber;
  return <span style={{display:"inline-flex",alignItems:"center",gap:4,fontSize:10,fontWeight:700,color,fontFamily:"'JetBrains Mono',monospace"}}>
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5"><path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>
    {count}
  </span>;
}
function UCCCountdown({expires}){
  const d=daysBetween(today,expires);
  const color=d<365?B.red:d<730?B.amber:B.textMuted;
  return <span style={{fontSize:10,color,fontFamily:"'JetBrains Mono',monospace",fontWeight:500}}>{d>365?`${Math.floor(d/365)}y ${Math.floor((d%365)/30)}m`:`${d}d`}</span>;
}
function RenewalBadge(){
  return <span style={{display:"inline-flex",alignItems:"center",gap:3,padding:"2px 7px",borderRadius:10,background:B.purpleDim,color:B.purple,fontSize:9,fontWeight:700,letterSpacing:"0.03em"}}>
    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke={B.purple} strokeWidth="2.5"><path d="M1 4v6h6M23 20v-6h-6"/><path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15"/></svg>
    RENEWAL
  </span>;
}
function CommissionBadge({paid}){
  return <span style={{display:"inline-flex",alignItems:"center",gap:3,padding:"2px 7px",borderRadius:10,background:paid?B.greenDim:B.amberDim,color:paid?B.green:B.amber,fontSize:9,fontWeight:700}}>
    {paid?"COMM PAID":"COMM PENDING"}
  </span>;
}
function SectionLabel({children,icon}){
  return <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
    {icon}
    <span style={{fontSize:10,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:B.textDim,fontFamily:"'JetBrains Mono',monospace"}}>{children}</span>
    <div style={{flex:1,height:1,background:B.borderLight}}/>
  </div>;
}
function KPI({label,value,sub,accent,small}){
  return <div style={{background:B.surface,border:`1px solid ${B.border}`,borderRadius:14,padding:small?"14px 16px":"18px 20px",flex:1,minWidth:small?130:155,position:"relative",overflow:"hidden"}}>
    <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,transparent,${accent},transparent)`,opacity:0.5}}/>
    <div style={{fontSize:small?9:10,color:B.textMuted,fontWeight:600,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:small?4:6}}>{label}</div>
    <div style={{fontSize:small?18:24,fontWeight:700,color:B.text,letterSpacing:"-0.02em",lineHeight:1.1}}>{value}</div>
    {sub && <div style={{fontSize:small?10:11,color:B.textDim,marginTop:small?3:5,fontFamily:"'JetBrains Mono',monospace"}}>{sub}</div>}
  </div>;
}
function ConcentrationBar({data,total}){
  const colors=[B.indigo,B.cyan,B.green,B.amber,B.purple,B.red,"#F472B6","#818CF8",B.orange,"#34D399"];
  return <div style={{display:"flex",width:"100%",height:8,borderRadius:4,overflow:"hidden",gap:1}}>
    {data.map((d,i)=><div key={i} title={`${d.label}: ${fmtPct(d.value/total)}`} style={{width:`${(d.value/total)*100}%`,background:colors[i%colors.length],minWidth:d.value>0?3:0,transition:"width 0.5s ease"}}/>)}
  </div>;
}

/* ─── TABLE CELL STYLES ─── */
const thS={fontSize:9,fontWeight:700,letterSpacing:"0.07em",textTransform:"uppercase",color:B.textDim,fontFamily:"'JetBrains Mono',monospace",padding:"8px 6px",borderBottom:`1px solid ${B.borderLight}`};
const tdS={fontSize:12,color:B.text,padding:"10px 6px",borderBottom:`1px solid ${B.borderLight}`};

/* ═══════════════════════════════════════════ */
/* ═══            MAIN COMPONENT           ═══ */
/* ═══════════════════════════════════════════ */
export default function DeltMCATrackerV3(){
  const [filter,setFilter]=useState("all");
  const [channelFilter,setChannelFilter]=useState("all"); // all | self | fundomate
  const [search,setSearch]=useState("");
  const [expandedRow,setExpandedRow]=useState(null);
  const [activeTab,setActiveTab]=useState("portfolio");
  const [loaded,setLoaded]=useState(false);
  useEffect(()=>{setTimeout(()=>setLoaded(true),50);},[]);

  const filtered=useMemo(()=>DEALS.filter(m=>{
    if(filter!=="all"&&m.status!==filter) return false;
    if(channelFilter!=="all"&&m.channel!==channelFilter) return false;
    if(search&&!m.merchant.toLowerCase().includes(search.toLowerCase())&&!m.id.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }),[filter,search,channelFilter]);

  const M=useMemo(()=>{
    const self=DEALS.filter(m=>m.channel==="self");
    const ref=DEALS.filter(m=>m.channel==="fundomate");
    const selfActive=self.filter(m=>m.status!=="paid");
    const allActive=DEALS.filter(m=>m.status!=="paid");

    // Self-funded metrics
    const selfDeployed=self.reduce((s,m)=>s+m.fundedAmt,0);
    const selfOwed=self.reduce((s,m)=>s+m.totalOwed,0);
    const selfCollected=self.reduce((s,m)=>s+m.collected,0);
    const selfCOC=self.reduce((s,m)=>s+m.costOfCapitalPaid,0);
    const selfOutstanding=selfActive.reduce((s,m)=>s+(m.totalOwed-m.collected),0);
    const selfGross=selfCollected-selfDeployed;
    const selfNet=selfGross-selfCOC;
    const selfRTR=selfDeployed>0?selfOutstanding/selfDeployed:0;
    const selfWAF=selfDeployed>0?self.reduce((s,m)=>s+m.factor*(m.fundedAmt/selfDeployed),0):0;
    const selfDaily=selfActive.reduce((s,m)=>s+m.dailyDebit,0);

    // Fundomate referral metrics
    const refFunded=ref.reduce((s,m)=>s+m.fundedAmt,0);
    const refCommTotal=ref.reduce((s,m)=>s+m.referralCommission,0);
    const refCommPaid=ref.filter(m=>m.commissionPaid).reduce((s,m)=>s+m.referralCommission,0);
    const refCommPending=refCommTotal-refCommPaid;
    const refAvgRate=ref.length>0?ref.reduce((s,m)=>s+(m.commissionRate||0),0)/ref.length:0;
    const refCollected=ref.reduce((s,m)=>s+m.collected,0);
    const refOwed=ref.reduce((s,m)=>s+m.totalOwed,0);

    // Blended
    const totalDeals=DEALS.length;
    const totalDaily=allActive.reduce((s,m)=>s+m.dailyDebit,0);
    const renewals=DEALS.filter(m=>m.renewalEligible).length;
    const stacked=DEALS.filter(m=>m.stackCount>0).length;
    const defaultRate=DEALS.filter(m=>m.status==="default").length/DEALS.length;
    // Total revenue = self net profit + referral commissions
    const totalRevenue=selfNet+refCommTotal;

    // Vintages
    const vintages={};
    DEALS.forEach(m=>{
      const mo=m.funded.slice(0,7);
      if(!vintages[mo]) vintages[mo]={count:0,selfCount:0,refCount:0,deployed:0,refFunded:0,collected:0,owed:0,defaults:0,commissions:0};
      vintages[mo].count++;
      if(m.channel==="self"){vintages[mo].selfCount++;vintages[mo].deployed+=m.fundedAmt;}
      else{vintages[mo].refCount++;vintages[mo].refFunded+=m.fundedAmt;vintages[mo].commissions+=m.referralCommission;}
      vintages[mo].collected+=m.collected;
      vintages[mo].owed+=m.totalOwed;
      if(m.status==="default") vintages[mo].defaults++;
    });

    // Concentration
    const activeDeployed=selfActive.reduce((s,m)=>s+m.fundedAmt,0);
    const byMerchant=selfActive.map(m=>({label:m.merchant.split(" ").slice(0,2).join(" "),value:m.fundedAmt})).sort((a,b)=>b.value-a.value);
    const vertMap={};
    selfActive.forEach(m=>{vertMap[m.type]=(vertMap[m.type]||0)+m.fundedAmt;});
    const byVertical=Object.entries(vertMap).map(([k,v])=>({label:k,value:v})).sort((a,b)=>b.value-a.value);
    // Channel split for all deals
    const channelSplit=[{label:"Self-Funded",value:selfDeployed},{label:"Fundomate Referred",value:refFunded}];
    const totalVolume=selfDeployed+refFunded;

    return {selfDeployed,selfOwed,selfCollected,selfCOC,selfOutstanding,selfGross,selfNet,selfRTR,selfWAF,selfDaily,
      refFunded,refCommTotal,refCommPaid,refCommPending,refAvgRate,refCollected,refOwed,
      totalDeals,totalDaily,renewals,stacked,defaultRate,totalRevenue,
      vintages,activeDeployed,byMerchant,byVertical,channelSplit,totalVolume,
      selfCount:self.length,refCount:ref.length,
      activeCount:allActive.filter(m=>m.status==="active").length,
      atRisk:DEALS.filter(m=>m.status==="slow"||m.status==="default").length,
    };
  },[]);

  const statusTabs=[
    {key:"all",label:"All",count:DEALS.length},
    {key:"active",label:"Active",count:DEALS.filter(m=>m.status==="active").length},
    {key:"slow",label:"Slow",count:DEALS.filter(m=>m.status==="slow").length},
    {key:"default",label:"Default",count:DEALS.filter(m=>m.status==="default").length},
    {key:"paid",label:"Paid",count:DEALS.filter(m=>m.status==="paid").length},
  ];
  const channelTabs=[
    {key:"all",label:"All Channels",count:DEALS.length},
    {key:"self",label:"Self-Funded",count:M.selfCount},
    {key:"fundomate",label:"Fundomate",count:M.refCount},
  ];

  return <div style={{minHeight:"100vh",background:B.dark,fontFamily:"'DM Sans',-apple-system,sans-serif",color:B.text,opacity:loaded?1:0,transition:"opacity 0.5s ease"}}>
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=JetBrains+Mono:wght@400;500;600;700&display=swap');
      *{box-sizing:border-box;margin:0;padding:0}
      ::-webkit-scrollbar{width:5px;height:5px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:${B.textDim};border-radius:3px}
      @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
      @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
      .rh:hover{background:${B.surfaceHover}!important}
      .tb{transition:all .15s;cursor:pointer;border:none;font-family:'DM Sans',sans-serif}
      .tb:hover{background:${B.surfaceHover}!important}
    `}</style>

    {/* HEADER */}
    <div style={{padding:"24px 32px 0",animation:"fadeUp .4s ease"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:16}}>
        <div>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:3}}>
            <div style={{width:7,height:7,borderRadius:2,background:B.indigo,boxShadow:`0 0 10px ${B.indigo}80`}}/>
            <span style={{fontSize:10,fontWeight:700,letterSpacing:".14em",textTransform:"uppercase",color:B.indigoLight,fontFamily:"'JetBrains Mono',monospace"}}>Delt Capital</span>
            <span style={{fontSize:9,padding:"2px 6px",borderRadius:4,background:B.indigoDim,color:B.indigoLight,fontWeight:600,fontFamily:"'JetBrains Mono',monospace"}}>v3</span>
          </div>
          <h1 style={{fontSize:22,fontWeight:700,letterSpacing:"-.03em",lineHeight:1.2}}>MCA Portfolio Tracker</h1>
          <p style={{fontSize:11,color:B.textMuted,marginTop:2}}>Self-funded positions + Fundomate referral pipeline</p>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{textAlign:"right",fontSize:10,fontFamily:"'JetBrains Mono',monospace"}}>
            <div style={{color:B.textDim}}>ACH.com · DataMerch · FiCoSo</div>
            <div style={{color:B.green}}>Synced Apr 14 · 2:48 PM</div>
          </div>
          <div style={{width:7,height:7,borderRadius:"50%",background:B.green,boxShadow:`0 0 8px ${B.green}60`,animation:"pulse 3s infinite"}}/>
        </div>
      </div>
    </div>

    {/* VIEW TABS */}
    <div style={{padding:"18px 32px 0",animation:"fadeUp .4s ease .05s both"}}>
      <div style={{display:"flex",gap:2,borderBottom:`1px solid ${B.borderLight}`}}>
        {[{key:"portfolio",label:"Portfolio Overview"},{key:"risk",label:"Risk & Velocity"},{key:"concentration",label:"Concentration & Vintage"}].map(t=>
          <button key={t.key} className="tb" onClick={()=>setActiveTab(t.key)} style={{
            padding:"9px 18px",fontSize:12,fontWeight:600,color:activeTab===t.key?B.text:B.textMuted,
            background:"transparent",borderBottom:activeTab===t.key?`2px solid ${B.indigo}`:"2px solid transparent",marginBottom:-1
          }}>{t.label}</button>
        )}
      </div>
    </div>

    {/* ═══ PORTFOLIO TAB ═══ */}
    {activeTab==="portfolio" && <>
      {/* Channel Summary Strip */}
      <div style={{padding:"20px 32px 0",display:"flex",gap:16,flexWrap:"wrap",animation:"fadeUp .4s ease .1s both"}}>
        {/* Self-Funded Block */}
        <div style={{flex:2,background:B.surface,border:`1px solid ${B.border}`,borderRadius:14,padding:"18px 22px",position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,${B.indigo},${B.indigoLight},transparent)`}}/>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
            <ChannelBadge channel="self"/>
            <span style={{fontSize:11,color:B.textMuted}}>{M.selfCount} deals · Family office capital @ 2%/mo</span>
          </div>
          <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
            <KPI small label="Deployed" value={fmt(M.selfDeployed)} sub={`RTR ${fmtPct(M.selfRTR)}`} accent={B.indigo}/>
            <KPI small label="Outstanding" value={fmt(M.selfOutstanding)} sub={`WAF ${M.selfWAF.toFixed(3)}x`} accent={B.amber}/>
            <KPI small label="Gross Collected" value={fmt(M.selfCollected)} sub={`Gross P&L ${fmt(M.selfGross)}`} accent={B.green}/>
            <KPI small label="Net After COC" value={fmt(M.selfNet)} sub={`COC: ${fmt(M.selfCOC)}`} accent={M.selfNet>=0?B.cyan:B.red}/>
            <KPI small label="Daily ACH" value={fmt(M.selfDaily)} accent={B.cyan}/>
          </div>
        </div>
        {/* Fundomate Block */}
        <div style={{flex:1,background:B.surface,border:`1px solid ${B.border}`,borderRadius:14,padding:"18px 22px",position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,${B.orange},transparent)`}}/>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
            <ChannelBadge channel="fundomate"/>
            <span style={{fontSize:11,color:B.textMuted}}>{M.refCount} referred · {fmtPct(M.refAvgRate)} avg comm</span>
          </div>
          <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
            <KPI small label="Vol Referred" value={fmt(M.refFunded)} sub={`${M.refCount} deals sent`} accent={B.orange}/>
            <KPI small label="Comm Earned" value={fmt(M.refCommTotal)} sub={`${fmt(M.refCommPaid)} paid`} accent={B.green}/>
            <KPI small label="Comm Pending" value={fmt(M.refCommPending)} sub="Awaiting payout" accent={M.refCommPending>0?B.amber:B.green}/>
          </div>
        </div>
      </div>
      {/* Blended KPIs */}
      <div style={{padding:"12px 32px 0",display:"flex",gap:12,flexWrap:"wrap",animation:"fadeUp .4s ease .15s both"}}>
        <KPI label="Total Revenue" value={fmt(M.totalRevenue)} sub={`Self net ${fmt(M.selfNet)} + Comm ${fmt(M.refCommTotal)}`} accent={B.green}/>
        <KPI label="Total Volume" value={fmt(M.totalVolume)} sub={`${M.selfCount} self + ${M.refCount} referred`} accent={B.indigo}/>
        <KPI label="Default Rate" value={fmtPct(M.defaultRate)} sub={`${DEALS.filter(m=>m.status==="default").length} of ${M.totalDeals}`} accent={M.defaultRate>0.1?B.red:B.green}/>
        <KPI label="Stacked" value={M.stacked} sub="DataMerch monitored" accent={M.stacked>0?B.amber:B.green}/>
        <KPI label="Renewal Pipeline" value={M.renewals} sub="≥50% collected" accent={B.purple}/>
      </div>
    </>}

    {/* ═══ RISK TAB ═══ */}
    {activeTab==="risk" && <div style={{padding:"20px 32px 0",animation:"fadeUp .3s ease"}}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        {/* Velocity */}
        <div style={{background:B.surface,border:`1px solid ${B.border}`,borderRadius:14,padding:20,overflow:"auto"}}>
          <SectionLabel icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={B.cyan} strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>}>Payment Velocity</SectionLabel>
          <div style={{display:"grid",gridTemplateColumns:"1.8fr 0.5fr 0.8fr 0.8fr 0.6fr 0.6fr",gap:0}}>
            {["Merchant","Ch","7d Avg","30d Avg","Delta","Signal"].map(h=><div key={h} style={thS}>{h}</div>)}
            {DEALS.filter(m=>m.status!=="paid").map(m=>{
              const delta=m.avg30d>0?(m.avg7d-m.avg30d)/m.avg30d:0;
              const signal=m.avg7d===0?"STOPPED":delta<-.15?"DECEL":delta<0?"SOFT":"STABLE";
              const sigColor={STOPPED:B.red,DECEL:B.red,SOFT:B.amber,STABLE:B.green}[signal];
              return <React.Fragment key={m.id}>
                <div style={tdS}><span style={{fontWeight:600,fontSize:11}}>{m.merchant.length>18?m.merchant.slice(0,18)+"…":m.merchant}</span></div>
                <div style={tdS}><ChannelBadge channel={m.channel}/></div>
                <div style={{...tdS,fontFamily:"'JetBrains Mono',monospace",fontSize:11}}>{fmt(m.avg7d)}</div>
                <div style={{...tdS,fontFamily:"'JetBrains Mono',monospace",fontSize:11}}>{fmt(m.avg30d)}</div>
                <div style={tdS}><VelocityArrow avg7d={m.avg7d} avg30d={m.avg30d}/></div>
                <div style={tdS}><span style={{fontSize:9,fontWeight:700,color:sigColor,fontFamily:"'JetBrains Mono',monospace"}}>{signal}</span></div>
              </React.Fragment>;
            })}
          </div>
        </div>
        {/* Stacking & UCC */}
        <div style={{background:B.surface,border:`1px solid ${B.border}`,borderRadius:14,padding:20,overflow:"auto"}}>
          <SectionLabel icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={B.amber} strokeWidth="2"><path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>}>Stacking & UCC Status</SectionLabel>
          <div style={{display:"grid",gridTemplateColumns:"1.8fr 0.5fr 0.6fr 0.8fr 0.8fr",gap:0}}>
            {["Merchant","Ch","Stacks","UCC Filed","Expires In"].map(h=><div key={h} style={thS}>{h}</div>)}
            {DEALS.map(m=><React.Fragment key={m.id}>
              <div style={tdS}><span style={{fontWeight:600,fontSize:11}}>{m.merchant.length>18?m.merchant.slice(0,18)+"…":m.merchant}</span></div>
              <div style={tdS}><ChannelBadge channel={m.channel}/></div>
              <div style={tdS}><StackWarning count={m.stackCount}/></div>
              <div style={{...tdS,fontSize:10,color:B.textMuted,fontFamily:"'JetBrains Mono',monospace"}}>{fmtDate(m.uccFiled)}</div>
              <div style={tdS}><UCCCountdown expires={m.uccExpires}/></div>
            </React.Fragment>)}
          </div>
        </div>
      </div>
    </div>}

    {/* ═══ CONCENTRATION TAB ═══ */}
    {activeTab==="concentration" && <div style={{padding:"20px 32px 0",animation:"fadeUp .3s ease"}}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:16}}>
        {/* Channel Split */}
        <div style={{background:B.surface,border:`1px solid ${B.border}`,borderRadius:14,padding:20}}>
          <SectionLabel icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={B.orange} strokeWidth="2"><path d="M16 3h5v5M4 20L21 3M21 16v5h-5M4 4l17 17"/></svg>}>Channel Split</SectionLabel>
          <ConcentrationBar data={M.channelSplit} total={M.totalVolume}/>
          <div style={{marginTop:14,display:"flex",flexDirection:"column",gap:10}}>
            {M.channelSplit.map((d,i)=>{
              const pct=d.value/M.totalVolume;
              const colors=[B.indigo,B.orange];
              return <div key={i} style={{display:"flex",alignItems:"center",gap:10}}>
                <div style={{width:8,height:8,borderRadius:2,background:colors[i],flexShrink:0}}/>
                <span style={{fontSize:12,color:B.text,flex:1,fontWeight:500}}>{d.label}</span>
                <span style={{fontSize:11,fontFamily:"'JetBrains Mono',monospace",color:B.textMuted}}>{fmtK(d.value)}</span>
                <span style={{fontSize:11,fontFamily:"'JetBrains Mono',monospace",color:B.text,fontWeight:600,minWidth:42,textAlign:"right"}}>{fmtPct(pct)}</span>
              </div>;
            })}
          </div>
          <div style={{marginTop:16,padding:"12px 14px",background:B.surfaceRaised,borderRadius:10,border:`1px solid ${B.borderLight}`}}>
            <div style={{fontSize:10,color:B.textMuted,fontWeight:600,marginBottom:6,textTransform:"uppercase",letterSpacing:".06em",fontFamily:"'JetBrains Mono',monospace"}}>Capital at Risk</div>
            <div style={{fontSize:9,color:B.textDim,lineHeight:1.6}}>
              Self-funded: {fmt(M.selfDeployed)} deployed (your capital)<br/>
              Fundomate: {fmt(M.refFunded)} (their capital, your commission)<br/>
              <span style={{color:B.green,fontWeight:600}}>Referral = zero capital risk, pure fee income</span>
            </div>
          </div>
        </div>
        {/* By Merchant (self-funded only) */}
        <div style={{background:B.surface,border:`1px solid ${B.border}`,borderRadius:14,padding:20}}>
          <SectionLabel icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={B.indigo} strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0110 10"/></svg>}>Self-Funded Concentration</SectionLabel>
          <ConcentrationBar data={M.byMerchant} total={M.activeDeployed}/>
          <div style={{marginTop:14,display:"flex",flexDirection:"column",gap:8}}>
            {M.byMerchant.map((m,i)=>{
              const pct=m.value/M.activeDeployed;
              const colors=[B.indigo,B.cyan,B.green,B.amber,B.purple,B.red,"#F472B6","#818CF8"];
              return <div key={i} style={{display:"flex",alignItems:"center",gap:10}}>
                <div style={{width:8,height:8,borderRadius:2,background:colors[i%colors.length],flexShrink:0}}/>
                <span style={{fontSize:12,color:B.text,flex:1,fontWeight:500}}>{m.label}</span>
                <span style={{fontSize:11,fontFamily:"'JetBrains Mono',monospace",color:B.textMuted}}>{fmtK(m.value)}</span>
                <span style={{fontSize:11,fontFamily:"'JetBrains Mono',monospace",color:pct>.25?B.amber:B.textDim,fontWeight:pct>.25?700:400,minWidth:42,textAlign:"right"}}>{fmtPct(pct)}</span>
                {pct>.25 && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={B.amber} strokeWidth="2.5"><path d="M12 9v4m0 4h.01"/></svg>}
              </div>;
            })}
          </div>
        </div>
        {/* By Vertical */}
        <div style={{background:B.surface,border:`1px solid ${B.border}`,borderRadius:14,padding:20}}>
          <SectionLabel icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={B.purple} strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>}>Vertical Concentration</SectionLabel>
          <ConcentrationBar data={M.byVertical} total={M.activeDeployed}/>
          <div style={{marginTop:14,display:"flex",flexDirection:"column",gap:8}}>
            {M.byVertical.map((m,i)=>{
              const pct=m.value/M.activeDeployed;
              const colors=[B.indigo,B.cyan,B.green,B.amber,B.purple,B.red];
              return <div key={i} style={{display:"flex",alignItems:"center",gap:10}}>
                <div style={{width:8,height:8,borderRadius:2,background:colors[i%colors.length],flexShrink:0}}/>
                <span style={{fontSize:12,color:B.text,flex:1,fontWeight:500}}>{m.label}</span>
                <span style={{fontSize:11,fontFamily:"'JetBrains Mono',monospace",color:B.textMuted}}>{fmtK(m.value)}</span>
                <span style={{fontSize:11,fontFamily:"'JetBrains Mono',monospace",color:pct>.30?B.amber:B.textDim,fontWeight:pct>.30?700:400,minWidth:42,textAlign:"right"}}>{fmtPct(pct)}</span>
              </div>;
            })}
          </div>
        </div>
        {/* Vintage Cohort - full width */}
        <div style={{background:B.surface,border:`1px solid ${B.border}`,borderRadius:14,padding:20,gridColumn:"1 / -1"}}>
          <SectionLabel icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={B.green} strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>}>Vintage Cohort Performance</SectionLabel>
          <div style={{display:"grid",gridTemplateColumns:"1fr .5fr .5fr 1fr .8fr 1fr .7fr 1fr",gap:0}}>
            {["Cohort","Self","Ref","Self Deployed","Ref Volume","Collected","Dflt %","Collection Rate"].map(h=><div key={h} style={thS}>{h}</div>)}
            {Object.entries(M.vintages).sort(([a],[b])=>a.localeCompare(b)).map(([mo,v])=>{
              const totalOwed=v.owed;
              const cr=totalOwed>0?v.collected/totalOwed:0;
              const dr=v.count>0?v.defaults/v.count:0;
              return <React.Fragment key={mo}>
                <div style={{...tdS,fontWeight:600,color:B.indigoLight}}>{new Date(mo+"-01T12:00:00").toLocaleDateString("en-US",{month:"short",year:"numeric"})}</div>
                <div style={{...tdS,fontFamily:"'JetBrains Mono',monospace"}}>{v.selfCount}</div>
                <div style={{...tdS,fontFamily:"'JetBrains Mono',monospace",color:B.orange}}>{v.refCount}</div>
                <div style={{...tdS,fontFamily:"'JetBrains Mono',monospace"}}>{v.deployed>0?fmt(v.deployed):"—"}</div>
                <div style={{...tdS,fontFamily:"'JetBrains Mono',monospace",color:B.orange}}>{v.refFunded>0?fmt(v.refFunded):"—"}</div>
                <div style={{...tdS,fontFamily:"'JetBrains Mono',monospace",color:B.green}}>{fmt(v.collected)}</div>
                <div style={{...tdS,fontFamily:"'JetBrains Mono',monospace",color:dr>0?B.red:B.green,fontWeight:700}}>{fmtPct(dr)}</div>
                <div style={tdS}><div style={{display:"flex",alignItems:"center",gap:8}}><ProgressBar pct={cr*100} color={cr>.7?B.green:cr>.4?B.amber:B.textDim} h={4}/><span style={{fontSize:10,fontFamily:"'JetBrains Mono',monospace",color:B.textMuted,minWidth:36}}>{fmtPct(cr)}</span></div></div>
              </React.Fragment>;
            })}
          </div>
        </div>
      </div>
    </div>}

    {/* ═══ FILTERS + SEARCH ═══ */}
    <div style={{padding:"20px 32px 0",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10,animation:"fadeUp .4s ease .2s both"}}>
      <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
        {/* Channel filter */}
        <div style={{display:"flex",gap:2,background:B.surface,borderRadius:10,padding:3,border:`1px solid ${B.border}`}}>
          {channelTabs.map(t=><button key={t.key} className="tb" onClick={()=>setChannelFilter(t.key)} style={{
            padding:"7px 12px",borderRadius:7,background:channelFilter===t.key?B.surfaceRaised:"transparent",
            color:channelFilter===t.key?B.text:B.textMuted,fontSize:11,fontWeight:600,display:"flex",alignItems:"center",gap:5,
            boxShadow:channelFilter===t.key?`0 0 0 1px ${B.border}`:"none",
          }}>{t.label}<span style={{fontSize:9,fontFamily:"'JetBrains Mono',monospace",background:channelFilter===t.key?B.indigoDim:"rgba(255,255,255,.03)",color:channelFilter===t.key?B.indigoLight:B.textDim,padding:"1px 5px",borderRadius:5,fontWeight:700}}>{t.count}</span></button>)}
        </div>
        {/* Status filter */}
        <div style={{display:"flex",gap:2,background:B.surface,borderRadius:10,padding:3,border:`1px solid ${B.border}`}}>
          {statusTabs.map(t=><button key={t.key} className="tb" onClick={()=>setFilter(t.key)} style={{
            padding:"7px 12px",borderRadius:7,background:filter===t.key?B.surfaceRaised:"transparent",
            color:filter===t.key?B.text:B.textMuted,fontSize:11,fontWeight:600,display:"flex",alignItems:"center",gap:5,
            boxShadow:filter===t.key?`0 0 0 1px ${B.border}`:"none",
          }}>{t.label}<span style={{fontSize:9,fontFamily:"'JetBrains Mono',monospace",background:filter===t.key?B.indigoDim:"rgba(255,255,255,.03)",color:filter===t.key?B.indigoLight:B.textDim,padding:"1px 5px",borderRadius:5,fontWeight:700}}>{t.count}</span></button>)}
        </div>
      </div>
      <div style={{position:"relative"}}>
        <input type="text" placeholder="Search merchant or ID…" value={search} onChange={e=>setSearch(e.target.value)} style={{
          padding:"9px 14px 9px 34px",borderRadius:9,border:`1px solid ${B.border}`,background:B.surface,color:B.text,
          fontSize:12,fontFamily:"'DM Sans',sans-serif",width:220,outline:"none",
        }}/>
        <svg style={{position:"absolute",left:11,top:"50%",transform:"translateY(-50%)"}} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={B.textDim} strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg>
      </div>
    </div>

    {/* ═══ DEAL TABLE ═══ */}
    <div style={{padding:"14px 32px 32px",animation:"fadeUp .4s ease .25s both"}}>
      <div style={{background:B.surface,borderRadius:14,border:`1px solid ${B.border}`,overflow:"hidden"}}>
        <div style={{display:"grid",gridTemplateColumns:"1.8fr .55fr .8fr .7fr 1.2fr .65fr .55fr .5fr .55fr .55fr",padding:"12px 18px",borderBottom:`1px solid ${B.borderLight}`,background:B.surfaceRaised}}>
          {["Merchant","Channel","Funded","Factor","Collection","Daily","Vel","Stack","ACH","Status"].map(h=>
            <div key={h} style={{fontSize:8,fontWeight:700,letterSpacing:".08em",textTransform:"uppercase",color:B.textDim,fontFamily:"'JetBrains Mono',monospace"}}>{h}</div>
          )}
        </div>
        {filtered.map(m=>{
          const remaining=m.totalOwed-m.collected;
          const pct=m.collected/m.totalOwed;
          const isExp=expandedRow===m.id;
          const isSelf=m.channel==="self";
          const dtb=m.collected>=m.fundedAmt?0:m.dailyDebit>0?Math.ceil((m.fundedAmt-m.collected)/m.dailyDebit):-1;
          const trueProfit=isSelf?Math.max(m.collected-m.fundedAmt,0)-m.costOfCapitalPaid:m.referralCommission;

          return <div key={m.id}>
            <div className="rh" onClick={()=>setExpandedRow(isExp?null:m.id)} style={{
              display:"grid",gridTemplateColumns:"1.8fr .55fr .8fr .7fr 1.2fr .65fr .55fr .5fr .55fr .55fr",
              padding:"13px 18px",alignItems:"center",borderBottom:`1px solid ${B.borderLight}`,cursor:"pointer",
              transition:"background .12s",background:isExp?B.surfaceHover:"transparent",
            }}>
              <div>
                <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                  <span style={{fontSize:13,fontWeight:600}}>{m.merchant}</span>
                  {m.renewalEligible && <RenewalBadge/>}
                  {!isSelf && m.commissionPaid!==undefined && <CommissionBadge paid={m.commissionPaid}/>}
                </div>
                <div style={{display:"flex",alignItems:"center",gap:5,marginTop:2}}>
                  <span style={{fontSize:9,color:B.textDim,fontFamily:"'JetBrains Mono',monospace"}}>{m.id}</span>
                  <span style={{fontSize:8,color:B.textMuted,background:"rgba(255,255,255,.03)",padding:"1px 4px",borderRadius:3}}>{m.type}</span>
                </div>
              </div>
              <ChannelBadge channel={m.channel}/>
              <div>
                <div style={{fontSize:12,fontWeight:600}}>{fmtK(m.fundedAmt)}</div>
                <div style={{fontSize:9,color:B.textDim}}>{fmtDate(m.funded)}</div>
              </div>
              <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:12,fontWeight:600,color:B.indigoLight}}>{m.factor.toFixed(2)}x</div>
              <div style={{paddingRight:10}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                  <span style={{fontSize:11,fontWeight:500}}>{fmtK(m.collected)}</span>
                  <span style={{fontSize:9,color:B.textMuted,fontFamily:"'JetBrains Mono',monospace"}}>{fmtPct(pct)}</span>
                </div>
                <ProgressBar pct={pct*100} color={{active:B.indigo,paid:B.cyan,slow:B.amber,default:B.red}[m.status]}/>
              </div>
              <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:12,fontWeight:600,color:m.dailyDebit>0?B.text:B.textDim}}>
                {m.dailyDebit>0?fmt(m.dailyDebit):"—"}
              </div>
              <VelocityArrow avg7d={m.avg7d} avg30d={m.avg30d}/>
              <StackWarning count={m.stackCount}/>
              <ACHBadge status={m.achStatus}/>
              <StatusBadge status={m.status}/>
            </div>

            {/* EXPANDED ROW */}
            {isExp && <div style={{padding:"18px 18px 18px 36px",background:B.surfaceRaised,borderBottom:`1px solid ${B.borderLight}`,animation:"fadeUp .2s ease"}}>
              {isSelf ? <>
                {/* Self-funded expanded */}
                <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:18}}>
                  {[
                    {l:"Factor Profit (Gross)",v:fmt(m.totalOwed-m.fundedAmt),s:`${fmtPct(m.factor-1)} return`},
                    {l:"Cost of Capital Paid",v:fmt(m.costOfCapitalPaid),s:"2%/mo declining bal"},
                    {l:"True Net Profit",v:fmt(trueProfit),s:trueProfit>=0?"Net positive":"Net negative",c:trueProfit>=0?B.green:B.red},
                    {l:"Days to Breakeven",v:dtb===0?"Recovered":dtb>0?`${dtb}d`:"N/A",s:dtb===0?"House money":dtb>0?`~${fmtDate(new Date(Date.now()+dtb*86400000).toISOString().split("T")[0])}`:"No debits",c:dtb===0?B.green:B.text},
                    {l:"Est. Payoff",v:m.dailyDebit>0&&remaining>0?`${Math.ceil(remaining/m.dailyDebit)}d`:"—",s:m.dailyDebit>0&&remaining>0?`~${fmtDate(new Date(Date.now()+Math.ceil(remaining/m.dailyDebit)*86400000).toISOString().split("T")[0])}`:"Complete / suspended"},
                  ].map((d,j)=><div key={j}>
                    <div style={{fontSize:9,fontWeight:700,letterSpacing:".06em",textTransform:"uppercase",color:B.textDim,marginBottom:4,fontFamily:"'JetBrains Mono',monospace"}}>{d.l}</div>
                    <div style={{fontSize:16,fontWeight:700,color:d.c||B.text,marginBottom:2}}>{d.v}</div>
                    <div style={{fontSize:10,color:B.textMuted}}>{d.s}</div>
                  </div>)}
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:18,marginTop:16,paddingTop:14,borderTop:`1px solid ${B.borderLight}`}}>
                  {[
                    {l:"7d / 30d Avg",v:`${fmt(m.avg7d)} / ${fmt(m.avg30d)}`},
                    {l:"Velocity",v:<VelocityArrow avg7d={m.avg7d} avg30d={m.avg30d}/>,s:m.avg7d>=m.avg30d?"Stable":"Decelerating"},
                    {l:"UCC Expires",v:fmtDateFull(m.uccExpires),s:`Filed ${fmtDate(m.uccFiled)} · FiCoSo`},
                    {l:"Last Payment",v:fmtDate(m.lastPayment),s:m.daysInDefault>0?<span style={{color:B.red}}>{m.daysInDefault}d overdue</span>:"On schedule"},
                    {l:"Holdback",v:`${m.holdback}%`,s:"Of daily card volume"},
                  ].map((d,j)=><div key={j}>
                    <div style={{fontSize:9,fontWeight:700,letterSpacing:".06em",textTransform:"uppercase",color:B.textDim,marginBottom:4,fontFamily:"'JetBrains Mono',monospace"}}>{d.l}</div>
                    <div style={{fontSize:14,fontWeight:700,color:B.text,marginBottom:2}}>{d.v}</div>
                    {d.s && <div style={{fontSize:10,color:B.textMuted}}>{d.s}</div>}
                  </div>)}
                </div>
              </> : <>
                {/* Fundomate referral expanded */}
                <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:18}}>
                  {[
                    {l:"Referral Commission",v:fmt(m.referralCommission),s:`${fmtPct(m.commissionRate)} of ${fmtK(m.fundedAmt)} funded`,c:B.orange},
                    {l:"Commission Status",v:m.commissionPaid?"Paid":"Pending",s:m.commissionPaid?"Funds received":"Awaiting Fundomate payout",c:m.commissionPaid?B.green:B.amber},
                    {l:"Deal Performance",v:fmtPct(pct)+" collected",s:`${fmtK(m.collected)} of ${fmtK(m.totalOwed)}`},
                    {l:"Capital at Risk",v:"$0",s:"Fundomate bears all credit risk",c:B.green},
                    {l:"Renewal Potential",v:m.renewalEligible?"Eligible":"Not yet",s:m.renewalEligible?"New commission opportunity":"Below 50% threshold",c:m.renewalEligible?B.purple:B.textDim},
                  ].map((d,j)=><div key={j}>
                    <div style={{fontSize:9,fontWeight:700,letterSpacing:".06em",textTransform:"uppercase",color:B.textDim,marginBottom:4,fontFamily:"'JetBrains Mono',monospace"}}>{d.l}</div>
                    <div style={{fontSize:16,fontWeight:700,color:d.c||B.text,marginBottom:2}}>{d.v}</div>
                    <div style={{fontSize:10,color:B.textMuted}}>{d.s}</div>
                  </div>)}
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:18,marginTop:16,paddingTop:14,borderTop:`1px solid ${B.borderLight}`}}>
                  {[
                    {l:"7d / 30d Avg",v:`${fmt(m.avg7d)} / ${fmt(m.avg30d)}`},
                    {l:"Velocity",v:<VelocityArrow avg7d={m.avg7d} avg30d={m.avg30d}/>,s:m.avg7d>=m.avg30d?"Stable":"Decelerating"},
                    {l:"Stacking",v:m.stackCount>0?`${m.stackCount} detected`:"Clean",s:"DataMerch",c:m.stackCount>0?B.amber:B.green},
                    {l:"Last Payment",v:fmtDate(m.lastPayment),s:"Fundomate servicing"},
                    {l:"UCC",v:fmtDateFull(m.uccExpires),s:`Filed by Fundomate`},
                  ].map((d,j)=><div key={j}>
                    <div style={{fontSize:9,fontWeight:700,letterSpacing:".06em",textTransform:"uppercase",color:B.textDim,marginBottom:4,fontFamily:"'JetBrains Mono',monospace"}}>{d.l}</div>
                    <div style={{fontSize:14,fontWeight:700,color:d.c||B.text,marginBottom:2}}>{d.v}</div>
                    {d.s && <div style={{fontSize:10,color:B.textMuted}}>{d.s}</div>}
                  </div>)}
                </div>
              </>}
            </div>}
          </div>;
        })}
        {filtered.length===0 && <div style={{padding:"40px",textAlign:"center",color:B.textMuted,fontSize:13}}>No deals match filters.</div>}
      </div>
    </div>

    {/* Footer */}
    <div style={{padding:"0 32px 28px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
      <span style={{fontSize:10,color:B.textDim,fontFamily:"'JetBrains Mono',monospace"}}>{filtered.length}/{DEALS.length} deals · ACH.com · QBO · DataMerch · FiCoSo · Fundomate</span>
      <span style={{fontSize:10,color:B.textDim}}><span style={{color:B.indigoLight,fontWeight:700}}>delt</span>pay.com</span>
    </div>
  </div>;
}