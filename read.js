const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, HeadingLevel, BorderStyle, WidthType, ShadingType,
  VerticalAlign, LevelFormat, PageBreak
} = require('docx');
const fs = require('fs');

// ── COLOUR PALETTE ──────────────────────────────────────────────────────────
const C = {
  navy:    "1F3864", navyLight: "2E5DA8",
  orange:  "C55A11", orangeLight: "FCE4D6",
  green:   "375623", greenLight: "E2EFDA",
  purple:  "6B3A7D", purpleLight: "EAD7F5",
  teal:    "1F6B75", tealLight:   "D9EEF1",
  red:     "9C0006", redLight:    "FFC7CE",
  gold:    "7D5A0A", goldLight:   "FFF2CC",
  gray:    "595959", grayLight:   "F2F2F2",
  white:   "FFFFFF", black:       "000000",
};

const bdr  = (c="AAAAAA",sz=6) => ({ style: BorderStyle.SINGLE, size: sz, color: c });
const bAll = (c,sz) => { const b=bdr(c,sz); return { top:b,bottom:b,left:b,right:b }; };

// ── BUILDER HELPERS ─────────────────────────────────────────────────────────
const pb = () => new Paragraph({ children: [new PageBreak()] });
const sp = (b=60,a=60) => new Paragraph({ spacing:{before:b,after:a}, children:[new TextRun("")] });

function banner(text, bg=C.navy, fg=C.white, sz=36) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    shading: { fill: bg, type: ShadingType.CLEAR },
    spacing: { before: 240, after: 0 },
    children: [new TextRun({ text, bold:true, color:fg, size:sz, font:"Arial" })]
  });
}

function subBanner(text, bg=C.orange) {
  return new Paragraph({
    shading: { fill: bg, type: ShadingType.CLEAR },
    spacing: { before: 200, after: 80 },
    indent: { left: 0 },
    children: [new TextRun({ text:`  ${text}`, bold:true, color:C.white, size:28, font:"Arial" })]
  });
}

function sectionTitle(text, bg=C.teal) {
  return new Paragraph({
    shading: { fill: bg, type: ShadingType.CLEAR },
    spacing: { before: 160, after: 60 },
    children: [new TextRun({ text:`  ${text}`, bold:true, color:C.white, size:24, font:"Arial" })]
  });
}

function body(text, bold=false, color=C.black, sz=22) {
  return new Paragraph({
    spacing: { before: 40, after: 40 },
    children: [new TextRun({ text, bold, color, size: sz, font:"Arial" })]
  });
}

function memCode(code, meaning) {
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [1800, 7560],
    rows: [new TableRow({ children: [
      new TableCell({
        borders: bAll(C.purple, 8),
        width: { size: 1800, type: WidthType.DXA },
        shading: { fill: C.purple, type: ShadingType.CLEAR },
        margins: { top:80, bottom:80, left:120, right:120 },
        verticalAlign: VerticalAlign.CENTER,
        children: [new Paragraph({ alignment: AlignmentType.CENTER,
          children: [new TextRun({ text:code, bold:true, color:C.white, size:28, font:"Courier New" })] })]
      }),
      new TableCell({
        borders: bAll(C.purple, 8),
        width: { size: 7560, type: WidthType.DXA },
        shading: { fill: C.purpleLight, type: ShadingType.CLEAR },
        margins: { top:80, bottom:80, left:160, right:120 },
        children: [new Paragraph({
          children: [new TextRun({ text: meaning, size:22, font:"Arial", italics:true, color: C.purple })] })]
      }),
    ]})]
  });
}

function mindMapRow(center, branches) {
  // center box + right side branches as a table
  const branchRows = branches.map(([icon,label,detail]) => new TableRow({ children: [
    new TableCell({
      borders: bAll(C.teal, 4),
      width: { size: 400, type: WidthType.DXA },
      shading: { fill: C.teal, type: ShadingType.CLEAR },
      margins: { top:40, bottom:40, left:80, right:80 },
      verticalAlign: VerticalAlign.CENTER,
      children: [new Paragraph({ alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: icon, bold:true, color:C.white, size:22, font:"Arial" })] })]
    }),
    new TableCell({
      borders: bAll(C.teal, 4),
      width: { size: 2000, type: WidthType.DXA },
      shading: { fill: C.tealLight, type: ShadingType.CLEAR },
      margins: { top:40, bottom:40, left:100, right:100 },
      children: [new Paragraph({
        children: [new TextRun({ text: label, bold:true, size:20, font:"Arial", color: C.teal })] })]
    }),
    new TableCell({
      borders: bAll(C.teal, 4),
      width: { size: 5360, type: WidthType.DXA },
      shading: { fill: C.white, type: ShadingType.CLEAR },
      margins: { top:40, bottom:40, left:100, right:100 },
      children: [new Paragraph({
        children: [new TextRun({ text: detail, size:20, font:"Arial", color: C.gray })] })]
    }),
  ]}));

  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [1600, 7760],
    rows: [new TableRow({ children: [
      new TableCell({
        borders: bAll(C.navy, 10),
        width: { size: 1600, type: WidthType.DXA },
        shading: { fill: C.navy, type: ShadingType.CLEAR },
        margins: { top:80, bottom:80, left:120, right:120 },
        verticalAlign: VerticalAlign.CENTER,
        children: [new Paragraph({ alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: center, bold:true, color:C.white, size:22, font:"Arial" })] })]
      }),
      new TableCell({
        borders: bAll(C.navy, 10),
        width: { size: 7760, type: WidthType.DXA },
        shading: { fill: C.white, type: ShadingType.CLEAR },
        margins: { top:0, bottom:0, left:0, right:0 },
        children: [new Table({
          width: { size: 7760, type: WidthType.DXA },
          columnWidths: [400, 2000, 5360],
          rows: branchRows
        })]
      }),
    ]})]
  });
}

function keyBox(title, items, bg=C.goldLight, border_c=C.gold) {
  const rows = items.map(([k,v]) => new TableRow({ children: [
    new TableCell({
      borders: bAll(border_c, 4),
      width: { size: 2600, type: WidthType.DXA },
      shading: { fill: border_c, type: ShadingType.CLEAR },
      margins: { top:50, bottom:50, left:100, right:100 },
      children: [new Paragraph({ children: [new TextRun({ text:k, bold:true, color:C.white, size:20, font:"Arial" })] })]
    }),
    new TableCell({
      borders: bAll(border_c, 4),
      width: { size: 6760, type: WidthType.DXA },
      shading: { fill: bg, type: ShadingType.CLEAR },
      margins: { top:50, bottom:50, left:100, right:100 },
      children: [new Paragraph({ children: [new TextRun({ text:v, size:20, font:"Arial" })] })]
    }),
  ]}));
  const t = new Table({
    width: { size: 9360, type: WidthType.DXA }, columnWidths: [2600, 6760], rows
  });
  return [
    new Paragraph({ spacing:{before:80,after:40}, children:[new TextRun({ text:`  ${title}`, bold:true, size:22, color:C.white, font:"Arial" })],
      shading:{ fill: border_c, type:ShadingType.CLEAR } }),
    t
  ];
}

function twoColTable(headers, rows, c1=3000, c2=6360) {
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [c1, c2],
    rows: [
      new TableRow({ children: headers.map((h,i)=> new TableCell({
        borders: bAll(C.navy,6), width:{size:i===0?c1:c2,type:WidthType.DXA},
        shading:{fill:C.navy,type:ShadingType.CLEAR}, margins:{top:60,bottom:60,left:100,right:100},
        children:[new Paragraph({alignment:AlignmentType.CENTER,
          children:[new TextRun({text:h,bold:true,color:C.white,size:20,font:"Arial"})]})]
      })) }),
      ...rows.map((r,ri)=> new TableRow({ children: r.map((cell,ci)=> new TableCell({
        borders: bAll(C.grayLight,4), width:{size:ci===0?c1:c2,type:WidthType.DXA},
        shading:{fill: ri%2===0?C.white:C.grayLight,type:ShadingType.CLEAR},
        margins:{top:50,bottom:50,left:100,right:100},
        children:[new Paragraph({children:[new TextRun({text:String(cell),size:20,font:"Arial"})]})]
      })) }))
    ]
  });
}

function fmtBox(label, formula, color=C.orange) {
  return new Table({
    width:{size:9360,type:WidthType.DXA}, columnWidths:[2400,6960],
    rows:[new TableRow({children:[
      new TableCell({ borders:bAll(color,8), width:{size:2400,type:WidthType.DXA},
        shading:{fill:color,type:ShadingType.CLEAR}, margins:{top:70,bottom:70,left:120,right:120},
        verticalAlign:VerticalAlign.CENTER,
        children:[new Paragraph({alignment:AlignmentType.CENTER,
          children:[new TextRun({text:label,bold:true,color:C.white,size:22,font:"Arial"})]})] }),
      new TableCell({ borders:bAll(color,8), width:{size:6960,type:WidthType.DXA},
        shading:{fill:C.goldLight,type:ShadingType.CLEAR}, margins:{top:70,bottom:70,left:160,right:120},
        children:[new Paragraph({
          children:[new TextRun({text:formula,bold:true,color:color,size:26,font:"Courier New"})]})] }),
    ]})]
  });
}

function highlightPara(emoji, text, bg=C.greenLight, tc=C.green) {
  return new Paragraph({
    spacing:{before:80,after:40},
    shading:{fill:bg,type:ShadingType.CLEAR},
    border:{left:{style:BorderStyle.SINGLE,size:18,color:tc,space:4}},
    indent:{left:200},
    children:[new TextRun({text:`${emoji}  ${text}`, size:22, font:"Arial", color: tc, bold:false })]
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// BUILD DOCUMENT
// ═══════════════════════════════════════════════════════════════════════════
const children = [];
const add = (...items) => items.forEach(item => Array.isArray(item)?children.push(...item):children.push(item));

// ── COVER PAGE ──────────────────────────────────────────────────────────────
add(
  banner("CSE 405", C.navy, C.white, 56),
  banner("SOFTWARE ENGINEERING ECONOMICS", C.navy, C.white, 32),
  banner("COMPLETE STUDY SUMMARY", C.orange, C.white, 28),
  new Paragraph({ alignment:AlignmentType.CENTER, spacing:{before:60,after:60},
    children:[new TextRun({text:"Memory Codes  •  Mind Maps  •  Key Points  •  All 4 Lectures", italics:true, size:24, color:C.gray, font:"Arial"})] }),
  banner("Read this → Understand → Ace the Exam!", C.green, C.white, 24),
  sp(200,200),
);

// ── THE BIG PICTURE MIND MAP ─────────────────────────────────────────────────
add(
  subBanner("THE BIG PICTURE — What Is This Course About?", C.navy),
  sp(40,40),
  mindMapRow("CSE 405\nSEE", [
    ["L1","What is Economics?", "Scarce resources → reasoned choices → decision making under constraints"],
    ["L2","Life-cycle Economics", "Product → Project → Program → Portfolio → EVM tracking"],
    ["L3","Risk & Uncertainty", "RE=P×C  |  COCOMO  |  MoSCoW  |  EV  |  Minimax Regret"],
    ["L4","Economic Analysis", "For-Profit  |  BEP  |  Cost-Benefit  |  ROI  |  ROCE"],
  ]),
  sp(60,40),
  highlightPara("🧠","MEMORY CODE for the 4 Lectures: \"LLRR\" = Life-cycle, Life-cycle, Risk, Revenue (analysis)", C.purpleLight, C.purple),
  sp(60,40),
);

// ═══ LECTURE 1 ══════════════════════════════════════════════════════════════
add(pb());
add(banner("LECTURE 1 — Introduction to Economics & SEE", C.navy));
add(banner("Memory Code: \"WISE\" = Why economics, Important terms, Scarce resources, Engineering decisions", C.orange, C.white, 22));
add(sp(60,40));

// What is Economics mind map
add(sectionTitle("1A. WHAT IS ECONOMICS? — Mind Map", C.teal));
add(sp(40,40));
add(mindMapRow("ECONOMICS", [
  ["📖","Definition",    "Study of how society manages SCARCE/LIMITED resources"],
  ["🔬","Micro",         "Small scale — your team, your project, your company"],
  ["🌍","Macro",         "Big scale — whole industry, whole country, national policy"],
  ["⚙️","In Engineering","Systematic evaluation of economic merits of proposed solutions"],
  ["❓","Key Questions", "Who works? What to produce? How? At what price?"],
]));
add(sp(60,40));

add(sectionTitle("1B. TEN PRINCIPLES — Memory Code: \"TOM-TRIPS-SGP\"", C.orange));
add(sp(40,40));
add(memCode("TOM-TRIPS-SGP", "Trade-offs, Opportunity cost, Marginally think — Trade makes better, Respond to incentives, Inflation-unemployment tradeoff, Print=inflation, Scarcity managed, Government helps, Production=wealth"));
add(sp(60,40));
add(twoColTable(["Principle (Memory Letter)","What It Means for Software Projects"],[
  ["T — Trade-offs",         "Fast, cheap, good — pick only TWO. You can't have all three."],
  ["O — Opportunity cost",   "Using team on Project A = giving up Project B. That missed profit = opportunity cost."],
  ["M — Marginal thinking",  "Add one more feature ONLY if extra benefit > extra cost."],
  ["T — Trade = better off", "Outsourcing (like G-Tech) specialises = both sides gain."],
  ["R — Respond to incentives","Bonuses for early delivery → developers work faster."],
  ["I — Inflation/Unemployment","More spending → more jobs → prices rise (short-run tradeoff)."],
  ["P — Print money = inflation","More money printed → naira buys less → prices rise."],
  ["S — Scarcity",           "Society cannot produce everything. Economics manages the gap."],
  ["G — Government helps markets","Regulations prevent monopolies from overcharging."],
  ["P — Production = wealth","More software produced per hour = richer company & workers."],
],2800,6560));
add(sp(60,40));

add(sectionTitle("1C. SEE FUNDAMENTALS — Memory Code: \"FACTD-TEP\"", C.purple));
add(sp(40,40));
add(memCode("FACTD-TEP","Finance, Accounting, Controlling, Time value, Decision-making — Time value of money, Efficiency, Productivity"));
add(sp(40,40));
add(twoColTable(["Fundamental","Plain Meaning"],[
  ["F — Finance",           "How money is raised, invested & managed in software projects"],
  ["A — Accounting",        "Tracking actual costs vs planned to see if profit was made"],
  ["C — Controlling",       "Keeping project costs within approved budget & plan"],
  ["T — Cash Flow",         "Movement of money IN and OUT of a project over time"],
  ["D — Decision Making",   "Structured process to choose the best option using data"],
  ["T — Time Value of Money","₦1,000 today > ₦1,000 next year — because today's money can earn interest"],
  ["E — Efficiency",        "Getting the most output from the least input (doing things RIGHT)"],
  ["P — Productivity",      "Output per person per hour — higher = better & cheaper"],
],2800,6560));

// ═══ LECTURE 2 ══════════════════════════════════════════════════════════════
add(pb());
add(banner("LECTURE 2 — Software Engineering Life-Cycle Economics", C.navy));
add(banner("Memory Code: \"PP-PP-EVM\" = Product, Project, Program, Portfolio — Earned Value Management", C.orange, C.white, 22));
add(sp(60,40));

add(sectionTitle("2A. PRODUCT vs PROJECT vs PROGRAM vs PORTFOLIO — Mind Map", C.teal));
add(sp(40,40));
add(mindMapRow("PP-PP\n(4 Levels)", [
  ["📦","PRODUCT",   "What you SELL or deliver — the PDBMS itself (e.g., HR database)"],
  ["🔨","PROJECT",   "TEMPORARY work to build the product — G-Tech building PDBMS (has start & end)"],
  ["🗂️","PROGRAM",   "GROUP of related projects coordinated together — PDBMS + Payroll + Inventory"],
  ["💼","PORTFOLIO", "ALL programs & projects managed together to achieve company's STRATEGIC goals"],
]));
add(sp(60,40));
add(highlightPara("🧠","Think of it like Russian dolls: PRODUCT is inside PROJECT, which is inside PROGRAM, inside PORTFOLIO.", C.tealLight, C.teal));
add(sp(60,40));

add(sectionTitle("2B. SDLC vs SPLC — Key Difference", C.orange));
add(sp(40,40));
add(twoColTable(["SDLC (Dev Life Cycle)","SPLC (Product Life Cycle)"],[
  ["Build phase only","Build + Operate + Maintain + RETIRE"],
  ["Shorter timeframe","Much LONGER timeframe"],
  ["Less total cost","Operate/maintain costs MORE than initial build"],
  ["Ends at deployment","Ends only when product is RETIRED from market"],
  ["Stages: Plan→Design→Code→Test→Deploy","Stages: Develop→Introduce→Grow→Mature→DECLINE"],
],4000,5360));
add(sp(40,40));
add(highlightPara("🔑","KEY INSIGHT: Operating & maintaining software COSTS MORE than building it. Always plan for TCO (Total Cost of Ownership)!", C.goldLight, C.gold));
add(sp(60,40));

add(sectionTitle("2C. PROJECT LIFE CYCLE — Memory Code: \"I-PEMC\"", C.purple));
add(sp(40,40));
add(memCode("I-PEMC","Initiating → Planning → Executing → Monitoring & Controlling → Closing"));
add(sp(40,40));
add(twoColTable(["Stage (Memory Letter)","What Happens"],[
  ["I — Initiating",         "Explore requirements, scope, risks, and benefits"],
  ["P — Planning",           "Figure out teams, tasks, timeline, budget breakdown"],
  ["E — Executing",          "Take the plan and PUT it into action — actually build"],
  ["M — Monitoring & Control","Check project is on track; adjust plans if it's drifting"],
  ["C — Closing",            "Finish the project; document lessons learned"],
],2800,6560));
add(sp(60,40));

add(sectionTitle("2D. PORTFOLIO MANAGEMENT CYCLE — Memory Code: \"DOPD\"", C.teal));
add(sp(40,40));
add(memCode("DOPD","Define → Optimize → Protect → Deliver → (back to Define)"));
add(sp(40,40));
add(twoColTable(["Stage","Purpose"],[
  ["1. DEFINE Portfolio",   "Set parameters; select projects aligned to strategic objectives"],
  ["2. OPTIMIZE Value",     "Build the BEST MIX of projects given budget & constraints"],
  ["3. PROTECT Value",      "Manage risks; ensure benefits are actually delivered"],
  ["4. DELIVER Value",      "Compare expected vs actual benefits; feed back → Define again"],
],2800,6560));
add(sp(60,40));

add(sectionTitle("2E. EARNED VALUE MANAGEMENT (EVM) — The Most Important Formula Set!", C.orange));
add(sp(40,40));
add(memCode("PV-EV-AC → CV-SV-CPI-SPI","Planned Value, Earned Value, Actual Cost → then calculate the 4 health metrics"));
add(sp(40,40));

// EVM formula table
const evmRows = [
  ["PV — Planned Value",   "BAC × Planned %",   "Budget planned for work that should be done by now"],
  ["EV — Earned Value",    "BAC × Actual %",    "Budget for work that IS actually done (regardless of cost)"],
  ["AC — Actual Cost",     "Just look at bills", "Real money spent so far on the project"],
  ["CV — Cost Variance",   "EV − AC",           "+ = UNDER budget (GOOD) | − = OVER budget (BAD)"],
  ["SV — Schedule Var.",   "EV − PV",           "+ = AHEAD of schedule | − = BEHIND schedule"],
  ["CPI — Cost Perf. Index","EV / AC",           "> 1 = efficient | < 1 = burning cash too fast"],
  ["SPI — Sched. Perf. Index","EV / PV",         "> 1 = ahead | < 1 = falling behind"],
];
add(new Table({
  width:{size:9360,type:WidthType.DXA}, columnWidths:[2400,2400,4560],
  rows:[
    new TableRow({children:[
      ...["Metric + Formula","Formula","What It Tells You"].map((h,i)=>new TableCell({
        borders:bAll(C.navy,6), width:{size:[2400,2400,4560][i],type:WidthType.DXA},
        shading:{fill:C.navy,type:ShadingType.CLEAR}, margins:{top:60,bottom:60,left:100,right:100},
        children:[new Paragraph({alignment:AlignmentType.CENTER,
          children:[new TextRun({text:h,bold:true,color:C.white,size:20,font:"Arial"})]})]
      }))
    ]}),
    ...evmRows.map(([m,f,e],ri)=>new TableRow({children:[
      new TableCell({ borders:bAll(C.orange,4), width:{size:2400,type:WidthType.DXA},
        shading:{fill:C.orangeLight,type:ShadingType.CLEAR}, margins:{top:50,bottom:50,left:100,right:100},
        children:[new Paragraph({children:[new TextRun({text:m,bold:true,size:20,font:"Arial",color:C.orange})]})] }),
      new TableCell({ borders:bAll(C.orange,4), width:{size:2400,type:WidthType.DXA},
        shading:{fill:C.goldLight,type:ShadingType.CLEAR}, margins:{top:50,bottom:50,left:100,right:100},
        children:[new Paragraph({children:[new TextRun({text:f,bold:true,size:20,font:"Courier New",color:C.orange})]})] }),
      new TableCell({ borders:bAll(C.orange,4), width:{size:4560,type:WidthType.DXA},
        shading:{fill:ri%2===0?C.white:C.grayLight,type:ShadingType.CLEAR}, margins:{top:50,bottom:50,left:100,right:100},
        children:[new Paragraph({children:[new TextRun({text:e,size:20,font:"Arial"})]})] }),
    ]}))
  ]
}));
add(sp(60,40));
add(highlightPara("⚡","EASY MEMORY: If EV > AC → under budget. If EV > PV → ahead of schedule. EV is always the KEY number!", C.greenLight, C.green));
add(sp(60,40));

add(sectionTitle("2F. COST CONCEPTS — Memory Code: \"SOTIC\"", C.purple));
add(sp(40,40));
add(memCode("SOTIC","Sunk cost, Opportunity cost, Total cost of ownership, Investment, Costing"));
add(sp(40,40));
add(twoColTable(["Cost Concept","Plain Meaning + Example"],[
  ["Sunk Cost",       "Money ALREADY spent — cannot get it back. IGNORE it in future decisions! (Don't throw good money after bad)"],
  ["Opportunity Cost","What you GIVE UP to pursue another option. Chose G-Tech → gave up using internal team."],
  ["TCO",             "Total Cost of Ownership = buying + running + maintaining + retiring. Always bigger than initial cost!"],
  ["Investment",      "Spending money now expecting MORE money back later (ROI must exceed MARR)"],
  ["Costing",         "Process of determining realistic costs for producing software (direct + indirect costs)"],
],2600,6760));

// ═══ LECTURE 3 ══════════════════════════════════════════════════════════════
add(pb());
add(banner("LECTURE 3 — Risk and Uncertainty", C.navy));
add(banner("Memory Code: \"RECEM-DRUD\" = Risk Exposure, Categorise, Estimate, COCOMO, MoSCoW — Decisions Risk, Under, Decisions Uncertainty", C.orange, C.white, 20));
add(sp(60,40));

add(sectionTitle("3A. WHAT IS RISK? — Mind Map", C.teal));
add(sp(40,40));
add(mindMapRow("RISK", [
  ["❓","Definition", "Possibility of LOSS in software dev — cost overrun, poor quality, late delivery"],
  ["🎲","Uncertainty", "Risk MAY or MAY NOT happen (100% likely events are CONSTRAINTS, not risks)"],
  ["💸","Loss",        "When a risk becomes reality → unwanted cost, delay or quality problem"],
  ["🔒","Internal",   "Within project manager's control — team skill, process, tools"],
  ["🌩️","External",   "Beyond control — market change, customer requirements shift, regulation"],
]));
add(sp(40,40));
add(fmtBox("Risk Exposure", "RE = P × C", C.orange));
add(sp(40,40));
add(highlightPara("🧠","P = Probability (0 to 1) | C = Cost if it happens | Multiply = expected loss. Set this aside as risk budget!", C.orangeLight, C.orange));
add(sp(60,40));

add(sectionTitle("3B. RISK CATEGORIES — Memory Code: \"PTB\"", C.orange));
add(sp(40,40));
add(memCode("PTB","Project risks, Technical risks, Business risks"));
add(sp(40,40));
add(twoColTable(["Category","What Gets Threatened + Examples"],[
  ["P — Project Risks",   "Threatens the PROJECT PLAN → schedule slips, costs rise. Example: team member quits."],
  ["T — Technical Risks", "Threatens QUALITY & TIMELINESS → implementation may become impossible. Example: new tech not mastered."],
  ["B — Business Risks",  "Threatens VIABILITY of the product. Sub-types: Market (nobody wants it), Strategic (doesn't fit company), Sales (can't sell it), Management (lose sponsor), Budget (funding cut)."],
],2200,7160));
add(sp(60,40));

add(sectionTitle("3C. GOALS, ESTIMATES & PLANS — Memory Code: \"GEP\"", C.purple));
add(sp(40,40));
add(memCode("GEP","Goals (WHAT to achieve) → Estimates (HOW MUCH it costs) → Plans (HOW to get there)"));
add(sp(40,40));
add(twoColTable(["Concept","Meaning"],[
  ["G — Goals",    "Business objectives — e.g., increase profit by 20%. Goals are EXTERNAL, set by business needs."],
  ["E — Estimates","Well-founded evaluation of time & resources needed. INTERNAL — constrained by dependencies & uncertainties."],
  ["P — Plans",    "Breakdown of goals into activities & milestones. Must align BOTH the goal AND the estimate. Win-win approach."],
],1600,7760));
add(sp(60,40));

add(sectionTitle("3D. ESTIMATION TECHNIQUES — Memory Code: \"EABPS\"", C.teal));
add(sp(40,40));
add(memCode("EABPS","Expert judgment, Analogy, By-parts (decomposition), Parametric, Statistical"));
add(sp(40,40));
add(twoColTable(["Technique","How It Works"],[
  ["E — Expert Judgment", "Ask people with EXPERIENCE in similar projects to estimate."],
  ["A — Analogy",         "Compare to a PAST SIMILAR project → adjust numbers up or down."],
  ["B — By Parts",        "Break system into COMPONENTS, cost each separately, then ADD up."],
  ["P — Parametric",      "Use a MATH MODEL (COCOMO) that links size to effort via formula."],
  ["S — Statistical",     "Use INDUSTRY DATA from thousands of past projects."],
],2000,7360));
add(sp(40,40));
add(highlightPara("⚡","No single technique is perfect. Use MULTIPLE techniques and compare. If they agree → confident estimate!", C.greenLight, C.green));
add(sp(60,40));

add(sectionTitle("3E. COCOMO — The Famous Estimation Model", C.orange));
add(sp(40,40));
add(memCode("COCOMO","COnstructive COst MOdel — created by Barry Boehm (1981). Still used worldwide!"));
add(sp(40,40));
add(mindMapRow("COCOMO\n3 Levels", [
  ["1","BASIC",        "Size (KLOC) only → quick rough estimate. Formula: E = a(S)^b"],
  ["2","INTERMEDIATE", "Size + 15 COST DRIVERS → more accurate. Formula: E = a(S)^b × Π(drivers)"],
  ["3","ADVANCED",     "Intermediate + phase-by-phase adjustments at module/component level"],
]));
add(sp(60,40));

add(sectionTitle("3F. DEVELOPMENT MODES — Memory Code: \"OSE\"", C.teal));
add(sp(40,40));
add(memCode("OSE","Organic (easy) → Semi-detached (mixed) → Embedded (hardest)"));
add(sp(40,40));
add(new Table({
  width:{size:9360,type:WidthType.DXA}, columnWidths:[1600,2200,800,800,1000,1000,1960],
  rows:[
    new TableRow({children:["Mode","Description","a(Basic)","b","a(Inter)","C","D"].map((h,i)=>new TableCell({
      borders:bAll(C.navy,6), width:{size:[1600,2200,800,800,1000,1000,1960][i],type:WidthType.DXA},
      shading:{fill:C.navy,type:ShadingType.CLEAR}, margins:{top:60,bottom:60,left:80,right:80},
      children:[new Paragraph({alignment:AlignmentType.CENTER,
        children:[new TextRun({text:h,bold:true,color:C.white,size:18,font:"Arial"})]})]
    }))}),
    ...[
      ["ORGANIC","Small familiar team, routine project","2.4","1.05","3.2","2.5","0.38",C.greenLight],
      ["SEMI-DET.","Mixed team, medium complexity","3.0","1.12","3.0","2.5","0.35",C.goldLight],
      ["EMBEDDED","Complex, tight constraints, innovation needed","3.6","1.20","2.8","2.5","0.32",C.redLight],
    ].map(([m,d,a,b,ai,c,dv,bg])=>new TableRow({children:[m,d,a,b,ai,c,dv].map((v,i)=>new TableCell({
      borders:bAll(C.orange,4), width:{size:[1600,2200,800,800,1000,1000,1960][i],type:WidthType.DXA},
      shading:{fill:bg,type:ShadingType.CLEAR}, margins:{top:50,bottom:50,left:80,right:80},
      children:[new Paragraph({alignment:AlignmentType.CENTER,
        children:[new TextRun({text:v,bold:i===0,size:19,font:"Arial",color:i===0?C.orange:C.black})]})]
    }))}))
  ]
}));
add(sp(40,40));

add(fmtBox("Basic COCOMO", "E = a × (S)^b", C.orange));
add(sp(30,30));
add(fmtBox("Intermediate COCOMO", "E = a × (S)^b × Π(cost drivers)", C.orange));
add(sp(30,30));
add(fmtBox("Dev Time", "TDEV = C × E^D", C.teal));
add(sp(30,30));
add(fmtBox("Personnel", "NP = E / TDEV", C.teal));
add(sp(40,40));
add(highlightPara("🧠","COCOMO STEPS: (1) Get size in KLOC, (2) Pick mode → get a,b, (3) Multiply cost drivers, (4) Calculate E, (5) Calculate TDEV, (6) Divide for NP", C.purpleLight, C.purple));
add(sp(60,40));

add(sectionTitle("3G. PRIORITIZATION — MoSCoW Method", C.purple));
add(sp(40,40));
add(memCode("MoSCoW","Must have, Should have, Could have, Won't have — ranked by value & urgency"));
add(sp(40,40));
add(new Table({
  width:{size:9360,type:WidthType.DXA}, columnWidths:[1000,1800,3480,3080],
  rows:[
    new TableRow({children:["Letter","Category","Definition","Real Example"].map((h,i)=>new TableCell({
      borders:bAll(C.navy,6), width:{size:[1000,1800,3480,3080][i],type:WidthType.DXA},
      shading:{fill:C.navy,type:ShadingType.CLEAR}, margins:{top:60,bottom:60,left:80,right:80},
      children:[new Paragraph({alignment:AlignmentType.CENTER,
        children:[new TextRun({text:h,bold:true,color:C.white,size:20,font:"Arial"})]})]
    }))}),
    ...([
      ["Mo","MUST HAVE",  "Non-negotiable. Minimum viable product. Project fails without it.",  "Secure login, bug-free code, case tracking", C.redLight,   C.red],
      ["S", "SHOULD HAVE","Important but solution still works without it. Painful but viable.", "Fast site, email alerts, good design",       C.orangeLight,C.orange],
      ["Co","COULD HAVE", "Desirable only if time & budget allow. Nice bonus.",                "Custom menus, blog, AI suggestions",         C.goldLight,  C.gold],
      ["W", "WON'T HAVE", "Explicitly OUT OF SCOPE for this release. Agreed by all parties.",  "Ads, public member section, paid content",    C.grayLight,  C.gray],
    ].map(([l,c,d,e,bg,tc])=>new TableRow({children:[l,c,d,e].map((v,i)=>new TableCell({
      borders:bAll(tc,4), width:{size:[1000,1800,3480,3080][i],type:WidthType.DXA},
      shading:{fill:i===0?tc:bg,type:ShadingType.CLEAR}, margins:{top:50,bottom:50,left:80,right:80},
      children:[new Paragraph({children:[new TextRun({text:v,bold:i<2,size:20,font:"Arial",color:i===0?C.white:C.black})]})]
    }))})))
  ]
}));
add(sp(60,40));

add(sectionTitle("3H. DECISIONS UNDER RISK — Memory Code: \"EE-MC\"", C.teal));
add(sp(40,40));
add(memCode("EE-MC","Expected value, Expectation-Variance, Monte Carlo, EVPI (perfect info)"));
add(sp(40,40));
add(twoColTable(["Technique","When & How to Use"],[
  ["Expected Value (EV)", "Probabilities KNOWN. EV = Σ(Prob × Payoff). Pick HIGHEST EV."],
  ["Expectation-Variance", "When two options have similar EV but different risk profiles. Consider variance (spread of outcomes)."],
  ["Monte Carlo",          "Randomly generate many input combinations → see distribution of outcomes. Named after Monaco casino!"],
  ["EVPI",                 "EVPI = EPPI − EMV. Maximum you should PAY for perfect information before deciding."],
],2200,7160));
add(sp(60,40));

add(sectionTitle("3I. DECISIONS UNDER UNCERTAINTY — Memory Code: \"LMM-HM\"", C.orange));
add(sp(40,40));
add(memCode("LMM-HM","Laplace (equal), Maximin (pessimist), Maximax (optimist), Hurwicz (realist), Minimax Regret (avoid regret)"));
add(sp(40,40));
add(new Table({
  width:{size:9360,type:WidthType.DXA}, columnWidths:[1800,1600,2600,3360],
  rows:[
    new TableRow({children:["Method","Attitude","Rule","Pick"].map((h,i)=>new TableCell({
      borders:bAll(C.navy,6), width:{size:[1800,1600,2600,3360][i],type:WidthType.DXA},
      shading:{fill:C.navy,type:ShadingType.CLEAR}, margins:{top:60,bottom:60,left:80,right:80},
      children:[new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:h,bold:true,color:C.white,size:20,font:"Arial"})]})]
    }))}),
    ...([
      ["Laplace","Equal likely","Average all payoffs per alternative","Highest average",C.tealLight],
      ["Maximin","Pessimist","Find WORST outcome per row → pick BEST worst","Highest minimum",C.redLight],
      ["Maximax","Optimist","Find BEST outcome per row → pick BEST best","Highest maximum",C.greenLight],
      ["Hurwicz","Realist","α(best) + (1-α)(worst) where 0≤α≤1","Highest weighted avg",C.goldLight],
      ["Minimax Regret","Regret avoider","Regret = best_in_state − your_payoff. Find MAX regret per row","LOWEST max regret",C.purpleLight],
    ].map(([m,a,r,p,bg])=>new TableRow({children:[m,a,r,p].map((v,i)=>new TableCell({
      borders:bAll(C.teal,4), width:{size:[1800,1600,2600,3360][i],type:WidthType.DXA},
      shading:{fill:bg,type:ShadingType.CLEAR}, margins:{top:50,bottom:50,left:80,right:80},
      children:[new Paragraph({children:[new TextRun({text:v,bold:i===0,size:19,font:"Arial"})]})]
    }))})))
  ]
}));
add(sp(40,40));
add(highlightPara("🧠","KEY: Under RISK → you KNOW probabilities → use EV. Under UNCERTAINTY → probabilities UNKNOWN → use LMM-HM table", C.orangeLight, C.orange));

// ═══ LECTURE 4 ══════════════════════════════════════════════════════════════
add(pb());
add(banner("LECTURE 4 — Economic Analysis Methods", C.navy));
add(banner("Memory Code: \"For-MRR-CCB-BMO\" = For-profit, MARR, ROI, ROCE — Cost-Benefit, Cost-Effectiveness, Break-even — Business case, Multiple attribute, Optimization", C.orange, C.white, 20));
add(sp(60,40));

add(sectionTitle("4A. FOR-PROFIT DECISION ANALYSIS — Mind Map", C.teal));
add(sp(40,40));
add(mindMapRow("FOR-PROFIT\nANALYSIS", [
  ["📋","Definition",   "Identify ALL alternatives, assess all aspects, choose the most favourable outcome"],
  ["🎯","Criteria",     "ROI (Return on Investment), ROCE (Return on Capital), or EV (Expected Value)"],
  ["🌳","Decision Tree","Draw branches: each alternative → success/failure → expected payoff"],
  ["📊","EV Calc",      "EV = (P_success × Payoff_success) + (P_failure × Payoff_failure)"],
  ["💵","Net Gain",     "Net Gain = EV − Initial Investment. Pick HIGHEST positive net gain."],
]));
add(sp(60,40));
add(fmtBox("Expected Value", "EV = Σ (Probability × Payoff)", C.orange));
add(sp(40,40));
add(highlightPara("📌","Example: San Francisco: EV = (0.4×$15M)+(0.6×-$4M) = $3.6M. Net = $3.6M − $2M = $1.6M ✓  New York: EV=$2M. Net=$2M−$5M= -$3M ✗  → Choose San Francisco", C.greenLight, C.green));
add(sp(60,40));

add(sectionTitle("4B. MARR, ROI, ROCE — Three Profitability Metrics", C.orange));
add(sp(40,40));
add(memCode("MRR","MARR (Minimum threshold), ROI (how profitable?), ROCE (how efficiently used?)"));
add(sp(40,40));
add(fmtBox("ROI","ROI = (Current Value − Cost) / Cost", C.orange));
add(sp(30,30));
add(fmtBox("ROCE %","ROCE = (Operating Profit / Capital Employed) × 100", C.orange));
add(sp(30,30));
add(fmtBox("Rate of Return %","RoR = [(Current − Initial) / Initial] × 100", C.teal));
add(sp(40,40));
add(twoColTable(["Metric","Key Point"],[
  ["MARR","MINIMUM ACCEPTABLE Rate of Return — the floor below which you NEVER invest. If a project returns less than MARR, reject it."],
  ["ROI","Measures profitability. Jo invested $1,000, got back $1,200 → ROI = ($1,200-$1,000)/$1,000 = 20%."],
  ["ROCE","Measures efficiency of capital use. EBIT ÷ (Total Assets − Current Liabilities). Example: £280k profit / £1.4M capital = 20%."],
],1800,7560));
add(sp(60,40));

add(sectionTitle("4C. COST-BENEFIT ANALYSIS (CBA)", C.teal));
add(sp(40,40));
add(fmtBox("Benefit-Cost Ratio","BCR = PV of Benefits / PV of Costs", C.teal));
add(sp(40,40));
add(twoColTable(["BCR Result","Decision"],[
  ["BCR < 1.0","REJECT — costs MORE than the benefits. Discard without further analysis."],
  ["BCR = 1.0","Break-even — benefits exactly equal costs. Marginal case."],
  ["BCR > 1.0","CONSIDER — but also check associated risk & compare to guaranteed interest rate."],
  ["BCR highest","If choosing between proposals, pick the one with the HIGHEST BCR (all else equal)."],
],1800,7560));
add(sp(60,40));

add(sectionTitle("4D. COST-EFFECTIVENESS ANALYSIS (CEA) vs CBA", C.purple));
add(sp(40,40));
add(twoColTable(["CBA","CEA"],[
  ["Benefits CAN be measured in money","Benefits CANNOT be measured in money (e.g., lives saved, patients treated)"],
  ["Use BCR = Benefits/Costs","Use CE ratio = Cost / Effectiveness (e.g., cost per life saved)"],
  ["Pick highest BCR","Pick lowest CE ratio (= most impact per naira spent)"],
  ["Example: Software with €12k benefit vs €10k cost → BCR=1.2","Example: $10M saves 15 lives → CE = $0.67M per life saved"],
],4500,4860));
add(sp(60,40));

add(sectionTitle("4E. BREAK-EVEN ANALYSIS — Very Common in Exams!", C.orange));
add(sp(40,40));
add(fmtBox("BEP","BEP = Fixed Costs / (Selling Price − Variable Cost)", C.orange));
add(sp(40,40));
add(twoColTable(["Term","Meaning + Example"],[
  ["Fixed Costs (FC)",  "Costs that DON'T change with units sold — rent, salaries, insurance. Example: $210,000/year"],
  ["Variable Cost (VC)","Cost PER UNIT sold — materials, commissions. Example: $400 per license"],
  ["Selling Price (SP)","What you charge per unit. Example: $1,000 per license"],
  ["BEP Calculation",   "BEP = $210,000 / ($1,000 − $400) = 210,000 / 600 = 350 units"],
  ["Interpretation",    "Sell 350 → break-even. Sell 351 → start making PROFIT. ALWAYS round UP."],
],2400,6960));
add(sp(60,40));

add(sectionTitle("4F. BUSINESS CASE — Elements Memory Code: \"EOTCOT\"", C.teal));
add(sp(40,40));
add(memCode("EOTCOT","Executive summary, Objectives, Timeline, Cost, Operational benefits, Technology/Solution"));
add(sp(40,40));
add(highlightPara("📌","A Business Case = the FULL STORY for a decision maker: cost + benefit + risk + plan. Owned by the PRODUCT MANAGER.", C.tealLight, C.teal));
add(sp(60,40));

add(sectionTitle("4G. MULTIPLE ATTRIBUTE EVALUATION", C.purple));
add(sp(40,40));
add(twoColTable(["Approach","How It Works"],[
  ["Compensatory","Collapses ALL attributes (money, security, usability) into ONE score. Allows trade-offs between attributes."],
  ["Non-Compensatory","Each attribute is treated SEPARATELY. A weakness in one CANNOT be offset by a strength in another."],
  ["When to use?","Use when money is NOT the only factor — e.g., choosing software vendor also on security, reliability, support."],
],2600,6760));
add(sp(60,40));

add(sectionTitle("4H. OPTIMIZATION ANALYSIS — Finding the Sweet Spot", C.orange));
add(sp(40,40));
add(twoColTable(["Concept","Explanation"],[
  ["Definition","Study a cost function over a RANGE of values to find where OVERALL PERFORMANCE is best."],
  ["Classic Example","Space-Time Tradeoff: faster algorithm uses MORE memory. Find the balance point."],
  ["Tool: Sensitivity Analysis","Ask 'What if?' — change ONE variable at a time → see how output changes. Identifies which inputs matter most."],
  ["Steps",   "1) Define output formula  2) Identify key variables  3) Set ranges  4) Build Excel table  5) Read results"],
],2000,7360));

// ═══ THE GOOD ENOUGH PRINCIPLE (Assignment Topic) ════════════════════════════
add(pb());
add(banner("THE 'GOOD ENOUGH' PRINCIPLE — ToyTimeInc. & PDBMS", C.navy));
add(banner("This is your assignment topic — understand it deeply!", C.orange, C.white, 24));
add(sp(60,40));

add(sectionTitle("What Does 'Good Enough' Mean?", C.teal));
add(sp(40,40));
add(mindMapRow("GOOD\nENOUGH", [
  ["🎯","Core Idea",     "Don't aim for PERFECT — aim for sufficient to meet business goals without wasting resources"],
  ["💰","Trade-offs",    "More security costs more money. Balance QUALITY ATTRIBUTES against COST and TIME."],
  ["🔧","Attributes",    "Security, Usability, Portability, Robustness, Performance — each costs more to improve"],
  ["📊","How to decide", "Use Multiple Attribute Evaluation + Cost-Benefit Analysis to find the optimal level"],
  ["⚠️","Risk",          "Too little quality = system fails. Too much = wasted money that could fund other features."],
]));
add(sp(60,40));

add(sectionTitle("Answering the 4 Assignment Questions", C.orange));
add(sp(40,40));
add(twoColTable(["Question","Model Answer Key Points"],[
  ["Q1. How can 'Good Enough' be applied?",
   "ToyTimeInc. should define MINIMUM requirements for security (protect employee data from breaches), usability (HR staff can use without training), portability (works on all offshore branches' systems), robustness (handles peak payroll periods). Use CBA: e.g., military-grade security costs 10× but reduces breach risk by only 20% more — NOT worth it. Use MoSCoW to rank: security = MUST HAVE, multi-language = COULD HAVE."],
  ["Q2. Effects of Friction-Free Economy?",
   "Friction-free = no barriers to trade, information flows freely. Effects on ToyTimeInc.: (1) Easy to outsource globally → chose G-Tech (specialisation). (2) Lower transaction costs → outsourcing becomes economically rational. (3) Price competition forces efficiency. (4) Access to better talent worldwide. (5) But also: competitors can copy faster, so innovation matters more."],
  ["Q3. How can ToyTimeInc. add value to PDBMS?",
   "As a CONSUMER, ToyTimeInc. adds value by: (1) Integrating PDBMS with their existing payroll/inventory systems. (2) Training HR staff to use it effectively. (3) Providing feedback to G-Tech to improve the system. (4) Using data from PDBMS to make better HR decisions (analytics). (5) Ensuring continuous updates & maintenance to keep it current."],
  ["Q4. Why outsource to G-Tech?",
   "Principle: Trade makes everyone better off (Specialisation). Reasons: (1) G-Tech has EXPERTISE in software development — ToyTimeInc. makes TOYS, not software. (2) Cost — G-Tech can build faster & cheaper due to economies of scale. (3) Focus — ToyTimeInc. can focus on core business (toys). (4) Friction-free economy makes international outsourcing seamless. (5) Risk transfer — G-Tech bears technical risk."],
],3000,6360));

// ═══ SUPER MEMORY PAGE ═══════════════════════════════════════════════════════
add(pb());
add(banner("SUPER MEMORY PAGE — Read This 5 Minutes Before Exam!", C.red));
add(sp(60,40));

add(sectionTitle("ALL MEMORY CODES IN ONE PLACE", C.navy));
add(sp(40,40));
add(twoColTable(["Topic","Memory Code"],[
  ["4 Lectures Overview",        "LLRR = Life-cycle, Life-cycle, Risk, Revenue-analysis"],
  ["10 Principles of Economics", "TOM-TRIPS-SGP"],
  ["SEE Fundamentals",           "FACTD-TEP"],
  ["Life-cycle hierarchy",       "PP-PP = Product, Project, Program, Portfolio (Russian dolls)"],
  ["Project Life Cycle stages",  "I-PEMC = Initiating, Planning, Executing, Monitoring, Closing"],
  ["Portfolio Management Cycle", "DOPD = Define, Optimize, Protect, Deliver"],
  ["EVM metrics",                "PV-EV-AC → CV-SV-CPI-SPI (always start with PV and EV first!)"],
  ["Cost concepts",              "SOTIC = Sunk, Opportunity, TCO, Investment, Costing"],
  ["Risk categories",            "PTB = Project, Technical, Business"],
  ["Goals-Estimates-Plans",      "GEP = Goals (what), Estimates (how much), Plans (how)"],
  ["Estimation techniques",      "EABPS = Expert, Analogy, By-parts, Parametric, Statistical"],
  ["COCOMO levels",              "BIA = Basic, Intermediate, Advanced"],
  ["Development modes",          "OSE = Organic (easy), Semi-detached (mixed), Embedded (hardest)"],
  ["MoSCoW prioritization",      "Must, Should, Could, Won't — always in this order!"],
  ["Decisions under Risk",       "EE-MC = Expected Value, Expectation-Variance, Monte Carlo, EVPI"],
  ["Decisions under Uncertainty","LMM-HM = Laplace, Maximin, Maximax, Hurwicz, Minimax Regret"],
  ["Economic Analysis Methods",  "For-MRR-CCB-BMO = For-profit, MARR ROI ROCE, CBA CEA BEP, Business case Multiple-attr Optimization"],
  ["Business Case elements",     "EOTCOT = Executive summary, Objectives, Timeline, Cost, Operational benefits, Tech/Solution"],
],3200,6160));
add(sp(60,40));

add(sectionTitle("THE GOLDEN RULES — Never Forget These!", C.orange));
add(sp(40,40));
add(highlightPara("🥇","RULE 1 — EVM Signs: CV+ = under budget (GOOD). CV- = over budget (BAD). SV+ = ahead. SV- = behind.", C.greenLight, C.green));
add(sp(20,20));
add(highlightPara("🥇","RULE 2 — Risk: RE = P × C. Always SET ASIDE this amount as your risk reserve/buffer.", C.orangeLight, C.orange));
add(sp(20,20));
add(highlightPara("🥇","RULE 3 — COCOMO: E = a(S)^b × Π(drivers) for intermediate. Then TDEV = 2.5 × E^D. Then NP = E/TDEV.", C.purpleLight, C.purple));
add(sp(20,20));
add(highlightPara("🥇","RULE 4 — BEP: Always ROUND UP. You need to EXCEED break-even to make profit.", C.redLight, C.red));
add(sp(20,20));
add(highlightPara("🥇","RULE 5 — Under RISK (probabilities known) → use Expected Value. Under UNCERTAINTY (unknown) → use LMM-HM.", C.tealLight, C.teal));
add(sp(20,20));
add(highlightPara("🥇","RULE 6 — BCR < 1.0 → ALWAYS REJECT. BCR > 1.0 → consider it (but check risk too).", C.goldLight, C.gold));
add(sp(20,20));
add(highlightPara("🥇","RULE 7 — Sunk costs: ALWAYS IGNORE them in future decisions. They're gone — don't let them cloud judgment.", C.grayLight, C.gray));
add(sp(20,20));
add(highlightPara("🥇","RULE 8 — SPLC > SDLC: Operating + maintaining software ALWAYS costs more than building it. Think TCO!", C.greenLight, C.green));
add(sp(20,20));
add(highlightPara("🥇","RULE 9 — Minimax Regret: Build regret table (Best in column − your payoff), find MAX per row, pick row with LOWEST max.", C.purpleLight, C.purple));
add(sp(20,20));
add(highlightPara("🥇","RULE 10 — Good Enough: Balance quality attributes with cost. Not too little (fails), not too much (wastes money).", C.orangeLight, C.orange));
add(sp(60,40));

// footer
add(new Paragraph({
  alignment: AlignmentType.CENTER,
  shading: { fill: C.navy, type: ShadingType.CLEAR },
  spacing: { before: 120, after: 0 },
  children: [new TextRun({ text: "CSE 405 SEE  |  Study Smart, Not Hard  |  You Have Got This!", bold:true, color:C.white, size:24, font:"Arial" })]
}));

// ── ASSEMBLE & WRITE ─────────────────────────────────────────────────────────
const doc = new Document({
  numbering: { config: [
    { reference:"bullets", levels:[{level:0,format:LevelFormat.BULLET,text:"\u2022",
        alignment:AlignmentType.LEFT,style:{paragraph:{indent:{left:720,hanging:360}}}}] }
  ]},
  styles: {
    default: { document: { run: { font:"Arial", size:22 } } },
    paragraphStyles: [
      { id:"Heading1", name:"Heading 1", basedOn:"Normal", next:"Normal", quickFormat:true,
        run:{size:32,bold:true,font:"Arial"}, paragraph:{spacing:{before:360,after:120},outlineLevel:0} },
      { id:"Heading2", name:"Heading 2", basedOn:"Normal", next:"Normal", quickFormat:true,
        run:{size:26,bold:true,font:"Arial"}, paragraph:{spacing:{before:240,after:80},outlineLevel:1} },
    ]
  },
  sections:[{
    properties:{ page:{ size:{width:12240,height:15840}, margin:{top:900,right:900,bottom:900,left:900} } },
    children
  }]
});

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync('/home/claude/CSE405_Summary_Guide.docx', buf);
  console.log('Done');
});