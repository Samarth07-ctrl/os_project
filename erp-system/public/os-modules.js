// public/os-modules.js - Frontend Controllers & Visualizers for All OS & AI Modules
// Academia ERP - Operating Systems & AI Course Project Extension

// ══════════════════════════════════════════════════════════════
// 1. OS VIRTUAL LAB & SIMULATOR SUITE
// ══════════════════════════════════════════════════════════════
let curLabTab = 'cpu';

window.loadOSLab = function() {
  const p = $('page-os-lab');
  p.innerHTML = `
    <div class="os-subnav">
      <button class="os-tab-btn ${curLabTab==='cpu'?'active':''}" onclick="switchLabTab('cpu')">🖥️ CPU Scheduling Visualizer</button>
      <button class="os-tab-btn ${curLabTab==='page'?'active':''}" onclick="switchLabTab('page')">💾 Page Replacement (FIFO/LRU/Opt)</button>
      <button class="os-tab-btn ${curLabTab==='term'?'active':''}" onclick="switchLabTab('term')">📟 Linux Bash Shell & Process Tree</button>
    </div>
    <div id="os-lab-content"></div>
  `;
  renderLabTab();
};

window.switchLabTab = function(tab) {
  curLabTab = tab;
  document.querySelectorAll('.os-tab-btn').forEach((b, i) => {
    b.classList.toggle('active', (tab==='cpu'&&i===0) || (tab==='page'&&i===1) || (tab==='term'&&i===2));
  });
  renderLabTab();
};

function renderLabTab() {
  if (curLabTab === 'cpu') renderCPULab();
  else if (curLabTab === 'page') renderPageLab();
  else if (curLabTab === 'term') renderTerminalLab();
}

// ── CPU Scheduling Visualizer ──
let cpuProcs = [
  { pid: 'P1', at: 0, bt: 5, priority: 2 },
  { pid: 'P2', at: 1, bt: 3, priority: 1 },
  { pid: 'P3', at: 2, bt: 8, priority: 4 },
  { pid: 'P4', at: 3, bt: 6, priority: 3 }
];

function renderCPULab() {
  const el = $('os-lab-content');
  el.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;">
      <div class="card"><div class="ch"><span class="ct">Workload Configuration</span><span style="font-size:12px;color:var(--text3);">Practical 8 & AI Assignment 1</span></div><div class="cb">
        <div style="display:flex;gap:8px;margin-bottom:12px;">
          <button class="btn btn-s btn-sm" onclick="setCPUPreset('standard')">Standard Preset</button>
          <button class="btn btn-s btn-sm" onclick="setCPUPreset('variance')">High Variance Preset</button>
          <button class="btn btn-s btn-sm" onclick="setCPUPreset('priority')">Strict Priority Preset</button>
        </div>
        <table class="matrix-table" id="cpu-proc-table">
          <thead><tr><th>Process ID</th><th>Arrival Time</th><th>Burst Time</th><th>Priority (1=High)</th><th>Action</th></tr></thead>
          <tbody>
            ${cpuProcs.map((p, i) => `
              <tr>
                <td><input class="fc" style="padding:4px;text-align:center;" value="${p.pid}" id="cpid-${i}"></td>
                <td><input type="number" class="fc" style="padding:4px;text-align:center;" value="${p.at}" id="cat-${i}" min="0"></td>
                <td><input type="number" class="fc" style="padding:4px;text-align:center;" value="${p.bt}" id="cbt-${i}" min="1"></td>
                <td><input type="number" class="fc" style="padding:4px;text-align:center;" value="${p.priority}" id="cprio-${i}" min="1" max="10"></td>
                <td><button class="btn btn-g btn-sm" style="color:var(--red);" onclick="delCPUProc(${i})">✕</button></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div style="margin-top:10px;display:flex;justify-content:space-between;">
          <button class="btn btn-s btn-sm" onclick="addCPUProc()">+ Add Process</button>
        </div>
      </div></div>

      <div class="card"><div class="ch"><span class="ct">Execution Parameters</span></div><div class="cb">
        <div class="fg">
          <label>Algorithm Selection</label>
          <select class="fc" id="cpu-algo-sel" onchange="toggleQuantum()">
            <option value="FCFS">FCFS (First-Come, First-Served)</option>
            <option value="SJF_NP">SJF (Shortest Job First - Non-Preemptive)</option>
            <option value="SJF_P">SRTF (Shortest Remaining Time First - Preemptive)</option>
            <option value="RR">Round Robin (Time Sliced)</option>
            <option value="PRIORITY_NP">Priority (Non-Preemptive)</option>
          </select>
        </div>
        <div class="fg" id="quantum-row" style="display:none;">
          <label>Time Quantum (Units)</label>
          <input type="number" class="fc" id="cpu-quantum" value="2" min="1" max="20">
        </div>
        <div style="display:flex;gap:10px;margin-top:20px;">
          <button class="btn btn-p btn-lg" style="flex:1;" onclick="runCPUSim()">▶ Run Simulation</button>
          <button class="btn btn-s btn-lg" style="flex:1.2;background:var(--accent-bg);color:var(--accent);border-color:var(--accent-b);" onclick="runAIRecommend()">🧠 AI Recommender</button>
        </div>
      </div></div>
    </div>

    <div id="cpu-results-area"></div>
  `;
  runCPUSim();
}

window.toggleQuantum = function() {
  const algo = $('cpu-algo-sel').value;
  $('quantum-row').style.display = algo === 'RR' ? 'block' : 'none';
};

window.addCPUProc = function() {
  saveCurrentCPUInputs();
  const nextId = cpuProcs.length + 1;
  cpuProcs.push({ pid: `P${nextId}`, at: nextId - 1, bt: 4, priority: 3 });
  renderCPULab();
};

window.delCPUProc = function(i) {
  saveCurrentCPUInputs();
  if (cpuProcs.length <= 1) { toast('Must keep at least 1 process','w'); return; }
  cpuProcs.splice(i, 1);
  renderCPULab();
};

function saveCurrentCPUInputs() {
  cpuProcs.forEach((p, i) => {
    const pidEl = $(`cpid-${i}`);
    if (pidEl) {
      p.pid = pidEl.value.trim() || `P${i+1}`;
      p.at = parseInt($(`cat-${i}`).value, 10) || 0;
      p.bt = Math.max(1, parseInt($(`cbt-${i}`).value, 10) || 1);
      p.priority = parseInt($(`cprio-${i}`).value, 10) || 1;
    }
  });
}

window.setCPUPreset = function(type) {
  if (type === 'variance') {
    cpuProcs = [
      { pid: 'P1', at: 0, bt: 18, priority: 2 },
      { pid: 'P2', at: 1, bt: 2, priority: 1 },
      { pid: 'P3', at: 2, bt: 1, priority: 3 },
      { pid: 'P4', at: 3, bt: 14, priority: 4 }
    ];
  } else if (type === 'priority') {
    cpuProcs = [
      { pid: 'P1 (Kernel)', at: 0, bt: 4, priority: 1 },
      { pid: 'P2 (Auth API)', at: 1, bt: 3, priority: 2 },
      { pid: 'P3 (Background)', at: 2, bt: 7, priority: 5 },
      { pid: 'P4 (UI Render)', at: 3, bt: 2, priority: 3 }
    ];
  } else {
    cpuProcs = [
      { pid: 'P1', at: 0, bt: 5, priority: 2 },
      { pid: 'P2', at: 1, bt: 3, priority: 1 },
      { pid: 'P3', at: 2, bt: 8, priority: 4 },
      { pid: 'P4', at: 3, bt: 6, priority: 3 }
    ];
  }
  renderCPULab();
};

window.runCPUSim = async function() {
  saveCurrentCPUInputs();
  const algo = $('cpu-algo-sel').value;
  const quantum = parseInt($('cpu-quantum')?.value, 10) || 2;
  const resArea = $('cpu-results-area');
  resArea.innerHTML = '<div class="loading"><span class="spin spin-d"></span> Simulating CPU scheduling...</div>';

  try {
    const r = await api('/os-lab/cpu-schedule', {
      method: 'POST',
      body: JSON.stringify({ processes: cpuProcs, algorithm: algo, quantum })
    });
    if (!r.success) throw new Error(r.message);
    const d = r.result;

    const colors = ['#1971C2', '#2F9E44', '#E67700', '#6741D9', '#C92A2A', '#0C8599', '#D6336C'];
    const pColorMap = {};
    cpuProcs.forEach((p, idx) => pColorMap[p.pid] = colors[idx % colors.length]);
    pColorMap['IDLE'] = '#868E96';

    resArea.innerHTML = `
      <div class="card" style="margin-bottom:16px;"><div class="ch"><span class="ct">Interactive Visual Gantt Chart</span><span class="badge bb">${algo}</span></div><div class="cb">
        <div class="gantt-wrap">
          ${d.gantt.map(g => {
            const width = Math.max(50, (g.end - g.start) * 28);
            const c = pColorMap[g.pid] || '#495057';
            return `
              <div class="gantt-block" style="width:${width}px;background:${c};">
                <span>${g.pid}</span>
                <span class="gantt-time-start">${g.start}</span>
                <span class="gantt-time-end">${g.end}</span>
              </div>
            `;
          }).join('')}
        </div>
      </div></div>

      <div class="sr" style="margin-bottom:16px;">
        <div class="sb"><div class="sl">Avg Turnaround Time (TAT)</div><div class="sv" style="color:var(--accent);">${d.avgTAT} <small style="font-size:12px;">units</small></div><div class="ss">Completion - Arrival Time</div></div>
        <div class="sb"><div class="sl">Avg Waiting Time (WT)</div><div class="sv" style="color:var(--green);">${d.avgWT} <small style="font-size:12px;">units</small></div><div class="ss">Turnaround - Burst Time</div></div>
        <div class="sb"><div class="sl">Processes Scheduled</div><div class="sv">${d.procs.length}</div><div class="ss">All jobs terminated safely</div></div>
      </div>

      <div class="card"><div class="ch"><span class="ct">Process Performance Breakdown</span></div><div class="cb"><div class="tw"><table>
        <thead><tr><th>Process</th><th>Arrival</th><th>Burst</th><th>Completion</th><th>Turnaround (TAT)</th><th>Waiting (WT)</th></tr></thead>
        <tbody>
          ${d.procs.map(p => `
            <tr>
              <td><span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:${pColorMap[p.pid]||'#333'};margin-right:6px;"></span><strong>${p.pid}</strong></td>
              <td>${p.at}</td><td>${p.bt}</td><td><strong>${p.ct}</strong></td>
              <td><span class="badge bb">${p.tat}</span></td>
              <td><span class="badge ${p.wt<=d.avgWT?'bg':'br'}">${p.wt}</span></td>
            </tr>
          `).join('')}
        </tbody>
      </table></div></div></div>
    `;
  } catch(e) {
    resArea.innerHTML = `<div class="alert ae">${e.message}</div>`;
  }
};

window.runAIRecommend = async function() {
  saveCurrentCPUInputs();
  const resArea = $('cpu-results-area');
  resArea.innerHTML = '<div class="loading"><span class="spin spin-d"></span> AI model analyzing workload variance and features...</div>';

  try {
    const r = await api('/os-lab/cpu-recommend', {
      method: 'POST',
      body: JSON.stringify({ processes: cpuProcs })
    });
    if (!r.success) throw new Error(r.message);
    const rec = r.recommendation;
    const b = rec.benchmarkComparison;

    resArea.innerHTML = `
      <div class="card" style="border:2px solid var(--accent);margin-bottom:16px;"><div class="ch" style="background:var(--accent-bg);"><span class="ct" style="color:var(--accent);">🤖 AI Workload Scheduling Recommendation</span><span class="badge bb">AI Assignment 1</span></div><div class="cb">
        <div style="font-size:16px;font-weight:700;color:var(--text);margin-bottom:6px;">Recommended Policy: <span style="color:var(--accent);">${rec.recommended}</span></div>
        <p style="font-size:13.5px;color:var(--text2);line-height:1.6;margin-bottom:14px;">${rec.reason}</p>
        <div style="display:flex;gap:12px;flex-wrap:wrap;font-size:12px;color:var(--text3);margin-bottom:14px;">
          <span>Processes: <b>${rec.workloadMetrics.processCount}</b></span>
          <span>Mean Burst: <b>${rec.workloadMetrics.meanBurst}</b></span>
          <span>Burst StdDev: <b>${rec.workloadMetrics.stdDev}</b></span>
          <span>Priorities Configured: <b>${rec.workloadMetrics.hasPriorities?'Yes':'No'}</b></span>
        </div>
        <button class="btn btn-p btn-sm" onclick="$('cpu-algo-sel').value='${rec.recommended}'; toggleQuantum(); runCPUSim();">Apply AI Recommendation</button>
      </div></div>

      <div class="card"><div class="ch"><span class="ct">Side-by-Side Algorithm Benchmark Comparison</span></div><div class="cb"><div class="tw"><table>
        <thead><tr><th>Algorithm</th><th>Avg Turnaround Time (TAT)</th><th>Avg Waiting Time (WT)</th><th>Status</th></tr></thead>
        <tbody>
          ${Object.entries(b).map(([algoName, res]) => `
            <tr style="${algoName===rec.recommended?'background:var(--accent-bg);font-weight:700;':''}">
              <td>${algoName}</td>
              <td>${res.avgTAT} units</td>
              <td>${res.avgWT} units</td>
              <td>${algoName===rec.recommended?'<span class="badge bg">★ AI Top Pick</span>':'<span class="badge">Evaluated</span>'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table></div></div></div>
    `;
  } catch(e) {
    resArea.innerHTML = `<div class="alert ae">${e.message}</div>`;
  }
};

// ── Page Replacement Simulator ──
function renderPageLab() {
  const el = $('os-lab-content');
  el.innerHTML = `
    <div class="card" style="margin-bottom:16px;"><div class="ch"><span class="ct">Memory Paging & Page Replacement Simulator</span><span style="font-size:12px;color:var(--text3);">Practical 10 & Unit 5</span></div><div class="cb">
      <div style="display:grid;grid-template-columns:2fr 1fr auto;gap:14px;align-items:flex-end;">
        <div class="fg" style="margin-bottom:0;"><label>Reference String (Space separated pages)</label><input class="fc" id="pg-ref-str" value="7 0 1 2 0 3 0 4 2 3 0 3 2"></div>
        <div class="fg" style="margin-bottom:0;"><label>Memory Page Frames</label><input type="number" class="fc" id="pg-frames" value="3" min="1" max="8"></div>
        <button class="btn btn-p btn-lg" onclick="runPageSim()">Simulate Paging</button>
      </div>
    </div></div>
    <div id="page-sim-results"></div>
  `;
  runPageSim();
}

window.runPageSim = async function() {
  const ref = $('pg-ref-str').value.trim();
  const frames = parseInt($('pg-frames').value, 10) || 3;
  const area = $('page-sim-results');
  area.innerHTML = '<div class="loading"><span class="spin spin-d"></span> Simulating memory page allocations...</div>';

  try {
    const r = await api('/os-lab/page-replacement', {
      method: 'POST',
      body: JSON.stringify({ referenceString: ref, frames })
    });
    if (!r.success) throw new Error(r.message);
    const d = r.result;

    const renderAlgoResult = (title, res, badgeClass) => `
      <div class="card" style="margin-bottom:16px;"><div class="ch"><span class="ct">${title}</span><span class="badge ${badgeClass}">${res.pageFaults} Page Faults · ${res.faultRate}% Miss Rate</span></div><div class="cb">
        <div class="frame-flow">
          ${res.steps.map(s => `
            <div class="frame-col">
              <div class="frame-page-tag ${s.isHit?'hit':'fault'}">${s.page}</div>
              ${Array.from({length: frames}).map((_, i) => `
                <div class="frame-cell">${s.frames[i] !== undefined ? s.frames[i] : '—'}</div>
              `).join('')}
              <div style="font-size:10px;margin-top:4px;color:${s.isHit?'var(--green)':'var(--red)'};font-weight:700;">${s.isHit?'HIT':'FAULT'}</div>
            </div>
          `).join('')}
        </div>
      </div></div>
    `;

    area.innerHTML = `
      <div class="sr" style="margin-bottom:16px;">
        <div class="sb"><div class="sl">FIFO Faults</div><div class="sv" style="color:var(--amber);">${d.FIFO.pageFaults}</div><div class="ss">${d.FIFO.faultRate}% fault rate</div></div>
        <div class="sb"><div class="sl">LRU Faults</div><div class="sv" style="color:var(--accent);">${d.LRU.pageFaults}</div><div class="ss">${d.LRU.faultRate}% fault rate</div></div>
        <div class="sb"><div class="sl">Optimal (Belady) Faults</div><div class="sv" style="color:var(--green);">${d.OPTIMAL.pageFaults}</div><div class="ss">${d.OPTIMAL.faultRate}% fault rate</div></div>
      </div>
      ${renderAlgoResult('FIFO (First-In, First-Out) Algorithm', d.FIFO, 'ba')}
      ${renderAlgoResult('LRU (Least Recently Used) Algorithm', d.LRU, 'bb')}
      ${renderAlgoResult("Optimal (Belady's Theoretical Minimum) Algorithm", d.OPTIMAL, 'bg')}
    `;
  } catch(e) {
    area.innerHTML = `<div class="alert ae">${e.message}</div>`;
  }
};

// ── Linux Terminal & Process Tree Simulator ──
function renderTerminalLab() {
  const el = $('os-lab-content');
  el.innerHTML = `
    <div style="display:grid;grid-template-columns:1.8fr 1.2fr;gap:16px;">
      <div>
        <div class="term-window">
          <div class="term-header">
            <div class="term-dots"><span class="term-dot r"></span><span class="term-dot y"></span><span class="term-dot g"></span></div>
            <span style="font-size:11.5px;color:#8B949E;">bash — student@academia-os-lab</span>
            <span></span>
          </div>
          <div class="term-body" id="term-output">Welcome to Academia OS Interactive Linux Terminal!
Demonstrates: System Calls (fork, wait, kill), Linux Shell Scripting, and Process Hierarchy.
Type 'help' to see supported commands.
Type 'fork' to simulate fork() system call.
Type 'zombie' or 'orphan' to simulate OS process states.
Type 'pstree' to view full process tree hierarchy.
----------------------------------------------------------------</div>
          <div class="term-input-row">
            <span class="term-prompt">student@os:~$</span>
            <input class="term-input" id="term-in" autofocus placeholder="Type command e.g. pstree, fork, ps, kill..." onkeydown="handleTermKey(event)">
          </div>
        </div>
        <div style="margin-top:10px;display:flex;gap:6px;flex-wrap:wrap;">
          <span style="font-size:12px;color:var(--text3);line-height:24px;">Quick Commands:</span>
          ${['pstree', 'fork', 'zombie', 'orphan', 'ps', 'ls', 'whoami', 'date', 'help'].map(c => `
            <button class="btn btn-g btn-sm" onclick="runTermCmd('${c}')">${c}</button>
          `).join('')}
        </div>
      </div>

      <div class="card"><div class="ch"><span class="ct">Live Process Table</span><span style="font-size:11px;color:var(--text3);">Unit 2 Process States</span></div><div class="cb" id="proc-table-box">
        <div class="loading"><span class="spin spin-d"></span> Loading process table...</div>
      </div></div>
    </div>
  `;
  runTermCmd('ps');
}

window.handleTermKey = function(e) {
  if (e.key === 'Enter') {
    const cmd = $('term-in').value;
    $('term-in').value = '';
    runTermCmd(cmd);
  }
};

window.runTermCmd = async function(cmd) {
  const out = $('term-output');
  if (out && cmd) {
    out.innerHTML += `\n<span style="color:#3FB950;">student@os:~$</span> ${cmd}`;
  }
  try {
    const r = await api('/os-lab/terminal', {
      method: 'POST',
      body: JSON.stringify({ command: cmd })
    });
    if (out) {
      out.innerHTML += `\n${r.output}\n`;
      out.scrollTop = out.scrollHeight;
    }
    renderProcessTable(r.processes || []);
  } catch(e) {
    if (out) out.innerHTML += `\nError: ${e.message}\n`;
  }
};

function renderProcessTable(procs) {
  const box = $('proc-table-box');
  if (!box) return;
  box.innerHTML = `
    <div class="tw"><table>
      <thead><tr><th>PID</th><th>PPID</th><th>Command</th><th>State</th></tr></thead>
      <tbody>
        ${procs.map(p => `
          <tr>
            <td><strong>${p.pid}</strong></td>
            <td>${p.ppid}</td>
            <td style="font-family:var(--m);font-size:11.5px;">${p.name}</td>
            <td><span class="badge ${p.state.includes('ZOMBIE')?'br':p.state.includes('ORPHAN')?'ba':'bg'}">${p.state}</span></td>
          </tr>
        `).join('')}
      </tbody>
    </table></div>
  `;
}


// ══════════════════════════════════════════════════════════════
// 2. OS BACKGROUND TASK SCHEDULER
// ══════════════════════════════════════════════════════════════
let schedPoll = null;

window.loadTaskScheduler = async function() {
  const p = $('page-task-scheduler');
  p.innerHTML = '<div class="loading"><span class="spin spin-d"></span> Loading Task Scheduler...</div>';
  fetchSchedulerState();
  if (schedPoll) clearInterval(schedPoll);
  schedPoll = setInterval(fetchSchedulerState, 2000);
};

async function fetchSchedulerState() {
  const p = $('page-task-scheduler');
  if (!p || !p.classList.contains('active')) {
    if (schedPoll) clearInterval(schedPoll);
    return;
  }
  try {
    const r = await api('/jobs/status');
    if (!r.success) return;
    const d = r.data;

    p.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:10px;">
        <div>
          <span style="font-size:13px;color:var(--text2);">Background Worker Engine implementing <b>OS CPU Scheduling</b></span>
        </div>
        <div style="display:flex;gap:8px;align-items:center;">
          <select class="fc" style="width:auto;padding:6px 10px;" id="sched-algo-sel" onchange="changeSchedAlgo()">
            <option value="PRIORITY" ${d.algorithm==='PRIORITY'?'selected':''}>Priority Scheduling</option>
            <option value="SJF" ${d.algorithm==='SJF'?'selected':''}>Shortest Job First (SJF)</option>
            <option value="ROUND_ROBIN" ${d.algorithm==='ROUND_ROBIN'?'selected':''}>Round Robin (RR)</option>
            <option value="FCFS" ${d.algorithm==='FCFS'?'selected':''}>FCFS</option>
          </select>
          <button class="btn btn-s btn-sm" onclick="stepSched()">Step Tick</button>
          <button class="btn btn-s btn-sm" onclick="toggleSched('${d.isRunning?'pause':'resume'}')">${d.isRunning?'⏸ Pause':'▶ Resume'}</button>
          <button class="btn btn-p btn-sm" onclick="seedSchedJobs()">+ Seed Jobs</button>
        </div>
      </div>

      <div class="sr" style="margin-bottom:16px;">
        <div class="sb"><div class="sl">Active Algorithm</div><div class="sv" style="color:var(--accent);">${d.algorithm}</div><div class="ss">Quantum: ${d.timeQuantum} ticks</div></div>
        <div class="sb"><div class="sl">System Tick</div><div class="sv">${d.systemTick}</div><div class="ss">Worker status: ${d.isRunning?'Active':'Paused'}</div></div>
        <div class="sb"><div class="sl">Avg Turnaround Time</div><div class="sv" style="color:var(--green);">${d.avgTurnaroundTimeSec}s</div><div class="ss">Completed: ${d.completedCount} jobs</div></div>
        <div class="sb"><div class="sl">Avg Waiting Time</div><div class="sv" style="color:var(--amber);">${d.avgWaitingTimeTicks} <small style="font-size:11px;">ticks</small></div><div class="ss">Ready queue: ${d.queue.length}</div></div>
      </div>

      <!-- Live Execution Gantt Bar -->
      <div class="card" style="margin-bottom:16px;"><div class="ch"><span class="ct">Live CPU Execution Timeline (Recent Ticks)</span></div><div class="cb">
        ${d.ganttHistory.length === 0 ? '<p style="color:var(--text3);font-size:13px;">CPU Idle. No jobs executed yet.</p>' : `
          <div class="gantt-wrap">
            ${d.ganttHistory.map(g => `
              <div class="gantt-block" style="background:${g.color};min-width:65px;padding:4px;">
                <span>${g.title.split(' ')[0]}</span>
                <small style="font-size:9px;font-weight:400;">Tick ${g.tick}</small>
              </div>
            `).join('')}
          </div>
        `}
      </div></div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
        <!-- Currently Executing & Ready Queue -->
        <div class="card"><div class="ch"><span class="ct">Ready Queue (${d.queue.length} Pending)</span></div><div class="cb">
          ${d.currentJob ? `
            <div style="background:var(--accent-bg);border:1px solid var(--accent-b);border-radius:var(--rs);padding:12px;margin-bottom:14px;">
              <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
                <span style="font-size:13px;font-weight:700;color:var(--accent);">⚡ ON CPU: ${d.currentJob.title}</span>
                <span class="badge bb">Burst Left: ${d.currentJob.remainingTime}/${d.currentJob.burstTime}</span>
              </div>
              <div class="prog"><div class="pb pb-b" style="width:${Math.round(((d.currentJob.burstTime - d.currentJob.remainingTime)/d.currentJob.burstTime)*100)}%;"></div></div>
            </div>
          ` : '<div class="alert" style="margin-bottom:12px;">CPU is currently IDLE</div>'}

          ${d.queue.length === 0 ? '<p style="color:var(--text3);font-size:13px;">Ready queue is empty.</p>' : `
            <div class="tw"><table>
              <thead><tr><th>Job</th><th>Burst</th><th>Priority</th><th>Wait Time</th></tr></thead>
              <tbody>
                ${d.queue.map(j => `
                  <tr>
                    <td><strong>${j.title}</strong><div style="font-size:10.5px;color:var(--text3);">${j.type}</div></td>
                    <td>${j.remainingTime}s</td>
                    <td><span class="badge ${j.priority<=2?'br':j.priority===3?'bb':'bg'}">P${j.priority}</span></td>
                    <td>${j.waitingTime} ticks</td>
                  </tr>
                `).join('')}
              </tbody>
            </table></div>
          `}
        </div></div>

        <!-- Add Job Form & Completed -->
        <div>
          <div class="card" style="margin-bottom:16px;"><div class="ch"><span class="ct">Dispatch New Task</span></div><div class="cb">
            <div class="fg"><label>Task Title</label><input class="fc" id="new-job-title" placeholder="e.g. Generate Semester Marks PDF"></div>
            <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;">
              <div class="fg"><label>Type</label>
                <select class="fc" id="new-job-type">
                  <option value="REPORT_GEN">Report PDF</option>
                  <option value="BATCH_NOTIF">Batch SMS</option>
                  <option value="DATA_EXPORT">Data Export</option>
                  <option value="SECURITY_SCAN">Audit Scan</option>
                </select>
              </div>
              <div class="fg"><label>Burst Units</label><input type="number" class="fc" id="new-job-burst" value="4" min="1" max="15"></div>
              <div class="fg"><label>Priority (1=High)</label><input type="number" class="fc" id="new-job-prio" value="2" min="1" max="5"></div>
            </div>
            <button class="btn btn-p btn-full" onclick="submitCustomJob()">Add to OS Queue</button>
          </div></div>

          <div class="card"><div class="ch"><span class="ct">Recently Completed Tasks</span></div><div class="cb">
            ${d.recentCompleted.length === 0 ? '<p style="color:var(--text3);font-size:13px;">No tasks finished yet.</p>' : `
              <div class="tw"><table>
                <thead><tr><th>Task</th><th>TAT</th><th>WT</th></tr></thead>
                <tbody>
                  ${d.recentCompleted.map(j => `
                    <tr>
                      <td style="font-size:12px;">${j.title}</td>
                      <td><span class="badge bb">${j.turnaroundTime}s</span></td>
                      <td><span class="badge bg">${j.waitingTime}t</span></td>
                    </tr>
                  `).join('')}
                </tbody>
              </table></div>
            `}
          </div></div>
        </div>
      </div>
    `;
  } catch(e) {}
}

window.changeSchedAlgo = async function() {
  const algo = $('sched-algo-sel').value;
  await api('/jobs/config', { method: 'POST', body: JSON.stringify({ algorithm: algo }) });
  fetchSchedulerState();
  toast(`Switched scheduler to ${algo}`, 's');
};

window.stepSched = async function() {
  await api('/jobs/control', { method: 'POST', body: JSON.stringify({ action: 'step' }) });
  fetchSchedulerState();
};

window.toggleSched = async function(action) {
  await api('/jobs/control', { method: 'POST', body: JSON.stringify({ action }) });
  fetchSchedulerState();
};

window.seedSchedJobs = async function() {
  await api('/jobs/seed', { method: 'POST' });
  fetchSchedulerState();
  toast('Sample tasks added to ready queue', 's');
};

window.submitCustomJob = async function() {
  const title = $('new-job-title').value.trim();
  const type = $('new-job-type').value;
  const burst = parseInt($('new-job-burst').value, 10) || 4;
  const priority = parseInt($('new-job-prio').value, 10) || 3;
  if (!title) { toast('Please enter job title', 'w'); return; }

  await api('/jobs/submit', { method: 'POST', body: JSON.stringify({ title, type, estimatedBurst: burst, priority }) });
  $('new-job-title').value = '';
  fetchSchedulerState();
  toast('Task added to OS queue', 's');
};


// ══════════════════════════════════════════════════════════════
// 3. CONCURRENCY CONTROL & MUTEX SEAT BOOKING
// ══════════════════════════════════════════════════════════════
window.loadConcurrency = async function() {
  const p = $('page-concurrency');
  p.innerHTML = '<div class="loading"><span class="spin spin-d"></span> Loading Course Slots...</div>';

  try {
    const r = await api('/concurrency/slots');
    if (!r.success) throw new Error(r.message);
    const slots = r.slots;

    p.innerHTML = `
      <div style="margin-bottom:16px;">
        <span style="font-size:13px;color:var(--text2);">Unit 2 Concurrency: Demonstrating <b>Race Condition Prevention</b> via Mutex Locks</span>
      </div>

      <div class="card" style="border:2px solid var(--purple);margin-bottom:20px;"><div class="ch" style="background:var(--purple-bg);"><span class="ct" style="color:var(--purple);">⚡ Live Concurrent Race-Condition Stress Tester</span><span class="badge bp">Critical Section Benchmark</span></div><div class="cb">
        <p style="font-size:13px;color:var(--text2);margin-bottom:12px;">
          Fire 15 simultaneous booking requests at a slot with only 4 seats to observe whether database race conditions cause overbooking.
        </p>
        <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;">
          <button class="btn btn-p" style="background:var(--green);border-color:var(--green);" onclick="runRaceBenchmark('WITH_MUTEX')">🛡️ Test WITH Mutex Lock (Protected)</button>
          <button class="btn btn-p" style="background:var(--red);border-color:var(--red);" onclick="runRaceBenchmark('WITHOUT_LOCK')">⚠️ Test WITHOUT Lock (Simulate Bug)</button>
        </div>
        <div id="benchmark-results" style="margin-top:14px;"></div>
      </div></div>

      <div style="font-size:15px;font-weight:700;margin-bottom:12px;">Active Course & Lab Slots</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:16px;">
        ${slots.map(s => {
          const booked = s.totalCapacity - s.availableSeats;
          const isFull = s.availableSeats <= 0;
          return `
            <div class="card"><div class="cb">
              <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
                <span class="badge bb">${s.courseCode}</span>
                <span class="badge ${isFull?'br':'bg'}">${s.availableSeats} / ${s.totalCapacity} Seats Free</span>
              </div>
              <div style="font-size:15px;font-weight:700;margin-bottom:2px;">${s.courseName}</div>
              <div style="font-size:12px;color:var(--text3);margin-bottom:12px;">${s.room} · ${s.instructor}</div>
              <div class="prog" style="margin-bottom:14px;"><div class="pb ${isFull?'pb-r':'pb-b'}" style="width:${Math.round((booked/s.totalCapacity)*100)}%;"></div></div>
              <button class="btn btn-p btn-full" ${isFull?'disabled':''} onclick="bookSlotSeat('${s._id}')">${isFull?'Slot Full':'🔒 Book Seat (Mutex Protected)'}</button>
            </div></div>
          `;
        }).join('')}
      </div>
    `;
  } catch(e) {
    p.innerHTML = `<div class="alert ae">${e.message}</div>`;
  }
};

window.bookSlotSeat = async function(slotId) {
  try {
    const r = await api('/concurrency/book', { method: 'POST', body: JSON.stringify({ slotId }) });
    if (!r.success) throw new Error(r.message);
    toast(r.message, 's');
    loadConcurrency();
  } catch(e) {
    toast(e.message, 'e');
  }
};

window.runRaceBenchmark = async function(mode) {
  const box = $('benchmark-results');
  box.innerHTML = '<div class="loading"><span class="spin spin-d"></span> Firing 15 concurrent threads simultaneously...</div>';
  try {
    const r = await api('/concurrency/benchmark', {
      method: 'POST',
      body: JSON.stringify({ mode, concurrentRequests: 15 })
    });
    const b = r.benchmark;
    box.innerHTML = `
      <div class="alert ${b.isOverbooked?'ae':'as'}" style="margin-bottom:10px;">
        <div><strong>${b.explanation}</strong></div>
        <div style="font-size:12px;margin-top:4px;">
          Requests: ${b.concurrentRequests} · Capacity: ${b.slotCapacity} · Actually Booked: <b>${b.totalSuccessfulBookings}</b> · Execution Time: ${b.totalTimeMs}ms
        </div>
      </div>
    `;
  } catch(e) {
    box.innerHTML = `<div class="alert ae">${e.message}</div>`;
  }
};


// ══════════════════════════════════════════════════════════════
// 4. IN-MEMORY LRU CACHE & MEMORY TELEMETRY
// ══════════════════════════════════════════════════════════════
window.loadCacheTelemetry = async function() {
  const p = $('page-cache-telemetry');
  p.innerHTML = '<div class="loading"><span class="spin spin-d"></span> Loading Cache Telemetry...</div>';

  try {
    const r = await api('/cache/stats');
    if (!r.success) throw new Error(r.message);
    const t = r.telemetry;

    p.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:10px;">
        <span style="font-size:13px;color:var(--text2);">Unit 5 Memory Management: <b>In-Memory LRU & FIFO Cache</b></span>
        <div style="display:flex;gap:8px;">
          <button class="btn btn-s btn-sm" onclick="toggleCachePolicy('${t.policy==='LRU'?'FIFO':'LRU'}')">Switch to ${t.policy==='LRU'?'FIFO':'LRU'}</button>
          <button class="btn btn-s btn-sm" onclick="purgeCache()">Purge Cache</button>
        </div>
      </div>

      <div class="sr" style="margin-bottom:16px;">
        <div class="sb"><div class="sl">Cache Hit Ratio</div><div class="sv" style="color:var(--green);">${t.hitRate}%</div><div class="ss">Hits: ${t.hits} · Misses: ${t.misses}</div></div>
        <div class="sb"><div class="sl">Active Replacement Policy</div><div class="sv" style="color:var(--accent);">${t.policy}</div><div class="ss">Capacity: ${t.capacity} items</div></div>
        <div class="sb"><div class="sl">Current Cache Size</div><div class="sv">${t.currentSize}</div><div class="ss">Evictions: ${t.evictions} items</div></div>
      </div>

      <!-- Latency Benchmark Card -->
      <div class="card" style="margin-bottom:16px;"><div class="ch"><span class="ct">Live Database vs OS In-Memory Cache Benchmark</span></div><div class="cb">
        <p style="font-size:13px;color:var(--text2);margin-bottom:12px;">Compare MongoDB Atlas network round-trip latency against instant in-memory LRU cache retrieval.</p>
        <button class="btn btn-p" onclick="runCacheBenchmark()">⚡ Run Latency Benchmark</button>
        <div id="cache-bench-box" style="margin-top:12px;"></div>
      </div></div>

      <div class="card"><div class="ch"><span class="ct">Cached API Entries (Ordered by Recent Access)</span></div><div class="cb">
        ${t.entries.length === 0 ? '<p style="color:var(--text3);font-size:13px;">Cache is currently empty.</p>' : `
          <div class="tw"><table>
            <thead><tr><th>Cache Key</th><th>Hits</th><th>Approx Size</th></tr></thead>
            <tbody>
              ${t.entries.map(e => `
                <tr>
                  <td style="font-family:var(--m);font-size:12px;">${e.key}</td>
                  <td><span class="badge bg">${e.hits} hits</span></td>
                  <td>${e.sizeApprox} bytes</td>
                </tr>
              `).join('')}
            </tbody>
          </table></div>
        `}
      </div></div>
    `;
  } catch(e) {
    p.innerHTML = `<div class="alert ae">${e.message}</div>`;
  }
};

window.runCacheBenchmark = async function() {
  const box = $('cache-bench-box');
  box.innerHTML = '<div class="loading"><span class="spin spin-d"></span> Running latency benchmark...</div>';
  try {
    const r = await api('/cache/benchmark');
    const b = r.benchmark;
    box.innerHTML = `
      <div style="display:flex;gap:16px;align-items:center;background:var(--accent-bg);padding:14px;border-radius:var(--r);border:1px solid var(--accent-b);">
        <div><div style="font-size:11px;color:var(--text3);">MongoDB Latency</div><div style="font-size:18px;font-weight:800;color:var(--red);">${b.dbLatencyMs} ms</div></div>
        <div style="font-size:24px;color:var(--text3);">➔</div>
        <div><div style="font-size:11px;color:var(--text3);">LRU Cache Latency</div><div style="font-size:18px;font-weight:800;color:var(--green);">${b.cacheLatencyMs} ms</div></div>
        <div style="margin-left:auto;"><span class="badge bg" style="font-size:14px;padding:6px 12px;">${b.speedupFactor}</span></div>
      </div>
    `;
  } catch(e) {
    box.innerHTML = `<div class="alert ae">${e.message}</div>`;
  }
};

window.toggleCachePolicy = async function(p) {
  await api('/cache/config', { method: 'POST', body: JSON.stringify({ policy: p }) });
  loadCacheTelemetry();
  toast(`Cache policy switched to ${p}`, 's');
};

window.purgeCache = async function() {
  await api('/cache/purge', { method: 'POST' });
  loadCacheTelemetry();
  toast('Cache purged successfully', 's');
};


// ══════════════════════════════════════════════════════════════
// 5. DEADLOCK AVOIDANCE & BANKER'S ALGORITHM CAMPUS ALLOCATOR
// ══════════════════════════════════════════════════════════════
window.loadCampusAllocator = async function() {
  const p = $('page-campus-allocator');
  p.innerHTML = '<div class="loading"><span class="spin spin-d"></span> Loading Banker\'s Algorithm Matrix...</div>';

  try {
    const r = await api('/resources/state');
    if (!r.success) throw new Error(r.message);
    const d = r.data;

    p.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:10px;">
        <span style="font-size:13px;color:var(--text2);">Unit 4 Deadlock: <b>Dijkstra's Banker's Algorithm</b> for Campus Resources</span>
        <button class="btn btn-s btn-sm" onclick="resetBanker()">Reset to Default Scenario</button>
      </div>

      <div class="alert ${d.isSafe?'as':'ae'}" style="margin-bottom:16px;">
        <div style="font-size:14px;font-weight:700;">${d.isSafe?'✅ SYSTEM IS IN A SAFE STATE':'⚠️ DEADLOCK HAZARD DETECTED'}</div>
        <div style="font-size:12.5px;margin-top:4px;">
          ${d.isSafe ? `Safe Execution Sequence: <b>${d.safeSequence.join(' ➔ ')}</b>` : 'System cannot guarantee completion without deadlock.'}
        </div>
      </div>

      <div class="sr" style="margin-bottom:16px;">
        ${d.resourceTypes.map((resName, j) => `
          <div class="sb">
            <div class="sl">${resName}</div>
            <div class="sv" style="color:var(--accent);">${d.available[j]} <small style="font-size:12px;color:var(--text3);">/ ${d.totalInstances[j]}</small></div>
            <div class="ss">Available / Total</div>
          </div>
        `).join('')}
      </div>

      <!-- Request Resources Form -->
      <div class="card" style="margin-bottom:16px;"><div class="ch"><span class="ct">Submit Multi-Resource Allocation Request</span></div><div class="cb">
        <p style="font-size:13px;color:var(--text2);margin-bottom:12px;">Banker's Algorithm will mathematically check if granting this request keeps the campus inventory in a Safe State.</p>
        <div style="display:grid;grid-template-columns:2fr repeat(4, 1fr) auto;gap:10px;align-items:flex-end;">
          <div class="fg" style="margin-bottom:0;"><label>Department / Entity</label>
            <select class="fc" id="banker-req-entity">
              ${d.entities.map((e, idx) => `<option value="${idx}">${e}</option>`).join('')}
            </select>
          </div>
          ${d.resourceTypes.map((rName, j) => `
            <div class="fg" style="margin-bottom:0;"><label>${rName.split(' ')[0]}</label><input type="number" class="fc" id="breq-${j}" value="1" min="0" max="${d.available[j]}"></div>
          `).join('')}
          <button class="btn btn-p" onclick="submitBankerRequest()">Check & Allocate</button>
        </div>
        <div id="banker-feedback" style="margin-top:10px;"></div>
      </div></div>

      <!-- Matrices View -->
      <div class="card"><div class="ch"><span class="ct">Current Resource Matrices [Allocation vs Max vs Need]</span></div><div class="cb"><div class="tw">
        <table class="matrix-table">
          <thead>
            <tr>
              <th rowspan="2">Department / Entity</th>
              <th colspan="4" style="background:#E7F5FF;">Current Allocation</th>
              <th colspan="4" style="background:#FFF9DB;">Max Claim</th>
              <th colspan="4" style="background:#EBFBEE;">Remaining Need</th>
            </tr>
            <tr>
              ${[...d.resourceTypes, ...d.resourceTypes, ...d.resourceTypes].map((r, i) => `<th>${r.split(' ')[0]}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${d.entities.map((entity, i) => `
              <tr>
                <td style="text-align:left;font-weight:600;">${entity}</td>
                ${d.allocation[i].map(v => `<td style="background:#F8F9FA;">${v}</td>`).join('')}
                ${d.maxClaim[i].map(v => `<td style="background:#F8F9FA;">${v}</td>`).join('')}
                ${d.need[i].map(v => `<td style="background:#F8F9FA;font-weight:700;color:var(--accent);">${v}</td>`).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div></div></div>
    `;
  } catch(e) {
    p.innerHTML = `<div class="alert ae">${e.message}</div>`;
  }
};

window.submitBankerRequest = async function() {
  const entityIdx = parseInt($('banker-req-entity').value, 10);
  const reqVector = [
    parseInt($('breq-0').value, 10) || 0,
    parseInt($('breq-1').value, 10) || 0,
    parseInt($('breq-2').value, 10) || 0,
    parseInt($('breq-3').value, 10) || 0
  ];
  const fb = $('banker-feedback');
  fb.innerHTML = '<div class="loading"><span class="spin spin-d"></span> Running Banker\'s safety verification...</div>';

  try {
    const r = await api('/resources/request', {
      method: 'POST',
      body: JSON.stringify({ entityIdx, requestVector: reqVector })
    });
    if (!r.success) {
      fb.innerHTML = `<div class="alert ae">${r.message}</div>`;
    } else {
      fb.innerHTML = `<div class="alert as">${r.message}</div>`;
      toast('Allocation approved safely!', 's');
      setTimeout(loadCampusAllocator, 1500);
    }
  } catch(e) {
    fb.innerHTML = `<div class="alert ae">${e.message}</div>`;
  }
};

window.resetBanker = async function() {
  await api('/resources/reset', { method: 'POST' });
  loadCampusAllocator();
  toast('Matrices reset to textbook scenario', 's');
};


// ══════════════════════════════════════════════════════════════
// 6. AI SECURITY OPERATIONS & LOG ANOMALY DETECTOR
// ══════════════════════════════════════════════════════════════
window.loadSecuritySOC = async function() {
  const p = $('page-security-soc');
  p.innerHTML = '<div class="loading"><span class="spin spin-d"></span> Loading Security Audit Logs...</div>';

  try {
    const r = await api('/security/dashboard');
    if (!r.success) throw new Error(r.message);
    const d = r.data;

    p.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:10px;">
        <span style="font-size:13px;color:var(--text2);">AI Assignment 3: <b>Unsupervised Anomaly Detection in System Logs</b></span>
        <div style="display:flex;gap:8px;">
          <button class="btn btn-s btn-sm" onclick="simSecurityAttack('BRUTE_FORCE')">🚨 Simulate Brute-Force</button>
          <button class="btn btn-s btn-sm" onclick="simSecurityAttack('DATA_SCRAPING')">🕷️ Simulate Scraper Burst</button>
        </div>
      </div>

      <div class="sr" style="margin-bottom:16px;">
        <div class="sb"><div class="sl">System Threat Level</div><div class="sv" style="color:${d.threatLevel==='NORMAL'?'var(--green)':'var(--red)'};">${d.threatLevel}</div><div class="ss">Real-time threat status</div></div>
        <div class="sb"><div class="sl">Audited Events</div><div class="sv">${d.totalAuditedEvents}</div><div class="ss">Logged HTTP/OS events</div></div>
        <div class="sb"><div class="sl">Anomalies Detected</div><div class="sv" style="color:var(--red);">${d.totalAnomaliesDetected}</div><div class="ss">Flagged by AI scoring</div></div>
        <div class="sb"><div class="sl">Avg Anomaly Score</div><div class="sv" style="color:var(--accent);">${d.averageAnomalyScore} / 100</div><div class="ss">Z-score + heuristics</div></div>
      </div>

      <div class="card"><div class="ch"><span class="ct">Security Audit & Anomaly Stream</span></div><div class="cb"><div class="tw"><table>
        <thead><tr><th>Time</th><th>User</th><th>Action</th><th>IP Address</th><th>Anomaly Score</th><th>Detection Reason</th></tr></thead>
        <tbody>
          ${d.allLogs.map(l => `
            <tr style="${l.isAnomaly?'background:var(--red-bg);':''}">
              <td style="font-size:11px;color:var(--text3);">${new Date(l.createdAt).toLocaleTimeString()}</td>
              <td><strong>${l.userName}</strong><div style="font-size:10px;color:var(--text3);">${l.role}</div></td>
              <td style="font-family:var(--m);font-size:11.5px;">${l.action}</td>
              <td style="font-family:var(--m);font-size:11.5px;">${l.ip}</td>
              <td><span class="badge ${l.anomalyScore>=50?'br':l.anomalyScore>=25?'ba':'bg'}">${l.anomalyScore}</span></td>
              <td style="font-size:12px;color:${l.isAnomaly?'var(--red)':'var(--text3)'};">${l.anomalyReason || 'Normal pattern'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table></div></div></div>
    `;
  } catch(e) {
    p.innerHTML = `<div class="alert ae">${e.message}</div>`;
  }
};

window.simSecurityAttack = async function(scenario) {
  try {
    const r = await api('/security/simulate-attack', { method: 'POST', body: JSON.stringify({ scenario }) });
    if (!r.success) throw new Error(r.message);
    toast(`Attack simulation [${scenario}] executed! Flagged by detector.`, 'w');
    loadSecuritySOC();
  } catch(e) {
    toast(e.message, 'e');
  }
};


// ══════════════════════════════════════════════════════════════
// 7. CONTENT-ADDRESSABLE STORAGE DEDUPLICATION
// ══════════════════════════════════════════════════════════════
window.loadStorageDedup = async function() {
  const p = $('page-storage-dedup');
  p.innerHTML = '<div class="loading"><span class="spin spin-d"></span> Loading Storage Telemetry...</div>';

  try {
    const r = await api('/storage/stats');
    if (!r.success) throw new Error(r.message);
    const d = r.data;

    p.innerHTML = `
      <div style="margin-bottom:16px;">
        <span style="font-size:13px;color:var(--text2);">Unit 6 Storage: <b>Content-Addressable Storage (CAS) Deduplication</b></span>
      </div>

      <div class="sr" style="margin-bottom:16px;">
        <div class="sb"><div class="sl">Storage Saved</div><div class="sv" style="color:var(--green);">${d.savingsPercentage}%</div><div class="ss">${d.savedBytes} bytes saved</div></div>
        <div class="sb"><div class="sl">Total Files Uploaded</div><div class="sv">${d.totalUploadedFiles}</div><div class="ss">Total raw: ${d.totalRawUploadedBytes} bytes</div></div>
        <div class="sb"><div class="sl">Unique Physical Blocks</div><div class="sv" style="color:var(--accent);">${d.uniquePhysicalBlocks}</div><div class="ss">Actual disk: ${d.actualPhysicalBytesStored} bytes</div></div>
      </div>

      <div class="card" style="margin-bottom:16px;"><div class="ch"><span class="ct">Test Deduplicated File Upload</span></div><div class="cb">
        <p style="font-size:13px;color:var(--text2);margin-bottom:12px;">If you upload content identical to an existing file, SHA-256 deduplication creates a virtual pointer without storing duplicate binary data.</p>
        <div style="display:grid;grid-template-columns:1fr 2fr auto;gap:10px;align-items:flex-end;">
          <div class="fg" style="margin-bottom:0;"><label>Filename</label><input class="fc" id="dedup-fname" value="my_code_submission.c"></div>
          <div class="fg" style="margin-bottom:0;"><label>File Content</label><input class="fc" id="dedup-fcontent" value="/* OS Lab Assignment Starter Template */\n#include <stdio.h>\nint main() { printf('OS Lab'); return 0; }"></div>
          <button class="btn btn-p" onclick="uploadDedupFile()">Upload & Deduplicate</button>
        </div>
      </div></div>

      <div class="card"><div class="ch"><span class="ct">Stored File Pointers & SHA-256 Block Hashes</span></div><div class="cb"><div class="tw"><table>
        <thead><tr><th>Filename</th><th>Uploaded By</th><th>Size</th><th>SHA-256 Hash</th><th>Storage Status</th></tr></thead>
        <tbody>
          ${d.recentFiles.map(f => `
            <tr>
              <td><strong>${f.originalName}</strong></td>
              <td>${f.uploadedBy}</td>
              <td>${f.size} B</td>
              <td style="font-family:var(--m);font-size:11px;color:var(--text3);">${f.hash.substring(0, 20)}...</td>
              <td><span class="badge ${f.isDuplicate?'bg':'bb'}">${f.isDuplicate?'♻️ Deduplicated (Virtual Pointer)':'💾 New Physical Block'}</span></td>
            </tr>
          `).join('')}
        </tbody>
      </table></div></div></div>
    `;
  } catch(e) {
    p.innerHTML = `<div class="alert ae">${e.message}</div>`;
  }
};

window.uploadDedupFile = async function() {
  const name = $('dedup-fname').value.trim();
  const content = $('dedup-fcontent').value;
  if (!name || !content) { toast('Please provide filename and content', 'w'); return; }

  try {
    const r = await api('/storage/upload', {
      method: 'POST',
      body: JSON.stringify({ originalName: name, content })
    });
    toast(r.message, r.dedupStatus.includes('DEDUPLICATED') ? 's' : 'i');
    loadStorageDedup();
  } catch(e) {
    toast(e.message, 'e');
  }
};
