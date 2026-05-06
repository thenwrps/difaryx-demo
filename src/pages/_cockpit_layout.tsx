      {/* HEADER */}
      <header className="flex h-11 shrink-0 items-center justify-between border-b border-slate-800 bg-[#08101D]/95 px-4">
        <div className="flex items-center gap-3">
          <Link to="/dashboard" className="flex items-center gap-2 text-sm font-bold text-white hover:text-cyan-300">
            <Brain size={16} className="text-cyan-300" />DIFARYX
          </Link>
          <span className="hidden text-[10px] font-bold uppercase tracking-widest text-slate-600 sm:inline">Agent Mode</span>
          <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-300">Gemma v0.1</span>
        </div>
        <div className="flex items-center gap-3">
          <span className={`rounded-full border px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${isRunning ? 'border-cyan-400/40 bg-cyan-400/10 text-cyan-300' : runComplete ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300' : 'border-slate-700 bg-[#070B12] text-slate-500'}`}>
            {isRunning ? 'Running' : runComplete ? 'Complete' : 'Ready'}
          </span>
          <button type="button" onClick={runAgent} disabled={isRunning} className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 text-xs font-bold text-white shadow-lg shadow-blue-600/20 transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60">
            {isRunning ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} fill="currentColor" />}
            {runComplete ? 'Re-run' : 'Run Agent'}
          </button>
          <Link to="/" className="text-[10px] font-semibold text-slate-500 hover:text-white">Landing</Link>
        </div>
      </header>

      {/* 3-COLUMN COCKPIT */}
      <div className="flex min-h-0 flex-1">

        {/* LEFT SIDEBAR — Mission Control */}
        <aside className="cockpit-scroll w-[280px] shrink-0 overflow-y-auto border-r border-slate-800/50 bg-[#080E19] p-3 space-y-3">
          <div className="rounded-lg border border-slate-800 bg-[#0A0F1A] p-3">
            <div className="flex items-center gap-2 mb-2"><Target size={14} className="text-cyan-300" /><span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Mission</span></div>
            <p className="text-xs leading-5 text-slate-300">Determine whether the uploaded sample is consistent with <span className="font-semibold text-white">{formatChemicalFormula('CuFe2O4')} spinel ferrite</span> phase from multi-technique evidence.</p>
          </div>

          <div className="rounded-lg border border-slate-800 bg-[#0A0F1A] p-3">
            <div className="flex items-center gap-2 mb-2"><ClipboardList size={14} className="text-indigo-300" /><span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Objectives</span></div>
            <div className="space-y-1.5">
              {MISSION_OBJECTIVES.map((obj, i) => {
                const done = currentStepIndex > i;
                const active = currentStepIndex === i;
                return (
                  <div key={obj} className={`flex items-start gap-2 rounded-md px-2 py-1.5 text-[11px] ${done ? 'text-emerald-300' : active ? 'text-cyan-300 bg-cyan-400/5' : 'text-slate-600'}`}>
                    {done ? <CheckCircle2 size={12} className="mt-0.5 shrink-0" /> : active ? <Loader2 size={12} className="mt-0.5 shrink-0 animate-spin" /> : <CircleDot size={12} className="mt-0.5 shrink-0" />}
                    <span>{obj}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-lg border border-slate-800 bg-[#0A0F1A] p-3">
            <div className="flex items-center gap-2 mb-2"><Layers size={14} className="text-amber-300" /><span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Tool Stack</span></div>
            <div className="space-y-1">
              {TOOL_STACK.map((t, i) => (
                <div key={t} className="flex items-center gap-2 text-[10px] font-mono">
                  <span className="text-slate-600">{i + 1}.</span>
                  <span className={currentStepIndex > i ? 'text-emerald-300' : currentStepIndex === i ? 'text-cyan-300' : 'text-slate-500'}>{t}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-slate-800 bg-[#0A0F1A] p-3">
            <div className="flex items-center gap-2 mb-2"><Database size={14} className="text-emerald-300" /><span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Data Sources</span></div>
            <div className="space-y-2">
              {DATA_SOURCES.map(ds => (
                <div key={ds.label} className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-white">{ds.label}</p>
                    <p className="truncate text-[10px] text-slate-500">{ds.file}</p>
                  </div>
                  <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[8px] font-bold uppercase ${ds.status === 'loaded' ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300' : 'border-violet-400/30 bg-violet-400/10 text-violet-300'}`}>{ds.status}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-slate-800 bg-[#0A0F1A] p-3">
            <div className="flex items-center gap-2 mb-2"><Activity size={14} className="text-slate-400" /><span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Agent Info</span></div>
            <div className="space-y-1 text-[10px]">
              <div className="flex justify-between"><span className="text-slate-500">Model</span><span className="text-amber-300 font-semibold">Gemma</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Mode</span><span className="text-slate-300">Phase identification</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Orchestration</span><span className="text-slate-300">Deterministic</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Material</span><span className="text-white font-semibold">CuFe₂O₄</span></div>
            </div>
          </div>
        </aside>

        {/* CENTER — Agent Flow + Evidence + Trace */}
        <main className="cockpit-scroll flex min-w-0 flex-1 flex-col gap-3 overflow-y-auto p-4">

          {/* Horizontal Step Flow */}
          <div className="rounded-lg border border-slate-800 bg-[#0A0F1A] px-4 py-3">
            <div className="flex items-center gap-0">
              {REASONING_TRACE_STEPS.map((step, i) => {
                const st = reasoningStatus(i, currentStepIndex);
                return (
                  <React.Fragment key={step.label}>
                    {i > 0 && <div className={`h-0.5 flex-1 transition-colors duration-300 ${st !== 'pending' ? 'bg-gradient-to-r from-cyan-400/40 to-emerald-400/40' : 'bg-slate-800'}`} />}
                    <div className="flex flex-col items-center gap-1">
                      <div className={`flex h-7 w-7 items-center justify-center rounded-full border-2 text-[10px] font-bold transition-all duration-300 ${st === 'complete' ? 'border-emerald-400 bg-emerald-400/20 text-emerald-300' : st === 'running' ? 'border-cyan-400 bg-cyan-400/20 text-cyan-300 animate-pulse' : 'border-slate-700 bg-[#070B12] text-slate-600'}`}>
                        {st === 'complete' ? <CheckCircle2 size={13} /> : i + 1}
                      </div>
                      <span className={`w-16 text-center text-[8px] font-bold uppercase tracking-wider leading-tight ${st === 'complete' ? 'text-emerald-300/70' : st === 'running' ? 'text-cyan-300/70' : 'text-slate-600'}`}>
                        {step.label.replace('_', '\n').split('_').pop()}
                      </span>
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-300 transition-all duration-300" style={{ width: `${progressPercent}%` }} /></div>
          </div>

          {/* Evidence Viewer — XRD + Raman side by side */}
          <div className="grid gap-3 lg:grid-cols-2">
            {/* XRD Evidence */}
            <div className="rounded-lg border border-slate-800 bg-[#0A0F1A] p-3">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Microscope size={13} className="text-cyan-300" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">XRD Evidence</span>
                </div>
                {showPeakMarkers && <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2 py-0.5 text-[9px] font-bold text-cyan-300">12 peaks</span>}
              </div>
              <div className="h-[180px] rounded border border-slate-800 bg-[#050812] p-1">
                <Graph type="xrd" height="100%" externalData={dataset.dataPoints} baselineData={xrdAgentResult.baselineData} peakMarkers={showPeakMarkers ? detectedPeaks.slice(0, CANONICAL_PEAK_COUNT) : undefined} showBackground showCalculated={false} showResidual={false} />
              </div>
              <div className="mt-2 grid grid-cols-3 gap-1.5">
                {[{ l: 'Peaks', v: '12' }, { l: 'Match', v: '0.92' }, { l: 'Phase', v: 'CuFe₂O₄' }].map(s => (
                  <div key={s.l} className="rounded border border-slate-800 bg-[#070B12] px-2 py-1.5 text-center">
                    <p className="text-[8px] font-bold uppercase text-slate-600">{s.l}</p>
                    <p className="text-xs font-bold text-white">{s.v}</p>
                  </div>
                ))}
              </div>
            </div>
            {/* Raman Evidence */}
            <div className="rounded-lg border border-slate-800 bg-[#0A0F1A] p-3">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap size={13} className="text-violet-300" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Raman Evidence</span>
                </div>
                <span className="rounded-full border border-violet-400/30 bg-violet-400/10 px-2 py-0.5 text-[9px] font-bold text-violet-300">synthetic</span>
              </div>
              <div className="h-[180px] rounded border border-slate-800 bg-[#050812] p-1">
                <MiniRamanSvg />
              </div>
              <div className="mt-2 grid grid-cols-4 gap-1">
                {RAMAN_EVIDENCE_PEAKS.map(p => (
                  <div key={p.label} className="rounded border border-slate-800 bg-[#070B12] px-1.5 py-1.5 text-center">
                    <p className="text-[8px] font-bold text-violet-300">{p.label}</p>
                    <p className="text-[9px] text-slate-400">{p.pos}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Execution Log + Reasoning Trace */}
          <div className="grid gap-3 lg:grid-cols-[1fr_1fr]">
            {/* Log */}
            <div className="rounded-lg border border-slate-800 bg-[#0A0F1A] p-3">
              <div className="mb-2 flex items-center gap-2"><Terminal size={13} className="text-slate-400" /><span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Execution Log</span></div>
              <div className="h-[140px] overflow-y-auto rounded border border-slate-800 bg-[#050812] p-2 font-mono text-[10px]">
                {logs.length === 0 ? <p className="text-slate-600">Awaiting Run Agent...</p> : (
                  <div className="space-y-1">
                    {logs.map((e, i) => (
                      <div key={`${e.stamp}-${i}`} className="flex gap-2"><span className="shrink-0 text-slate-600">{e.stamp}</span><span className={logClass(e.type)}>{e.message}</span></div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            {/* Reasoning Trace */}
            <div className="rounded-lg border border-slate-800 bg-[#0A0F1A] p-3">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2"><Brain size={13} className="text-amber-300" /><span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Agent Interpretation</span></div>
                <span className="text-[9px] font-bold uppercase text-slate-600">{isRunning ? 'running' : runComplete ? 'done' : 'idle'}</span>
              </div>
              <div className="h-[140px] space-y-1.5 overflow-y-auto pr-1">
                {REASONING_TRACE_STEPS.map((step, index) => {
                  const status = reasoningStatus(index, currentStepIndex);
                  return (
                    <div key={step.label} className={`rounded border p-2 transition-all duration-300 ${statusPillClass(status)} ${status === 'running' ? 'animate-pulse' : ''}`}>
                      <div className="flex items-center gap-2">
                        <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[9px] font-bold ${statusPillClass(status)}`}>
                          {status === 'complete' ? <CheckCircle2 size={11} /> : status === 'running' ? <Loader2 size={11} className="animate-spin" /> : index + 1}
                        </span>
                        <span className="text-[10px] font-bold font-mono text-amber-300">{step.label}</span>
                      </div>
                      {status === 'complete' && (
                        <div className="mt-1.5 space-y-1 pl-7">
                          <pre className="whitespace-pre-wrap break-all rounded bg-black/40 px-1.5 py-1 font-mono text-[9px] leading-relaxed text-amber-200/70">{step.gemmaCmd}</pre>
                          <p className="text-[10px] text-cyan-300/80">{step.toolResult}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </main>

        {/* RIGHT PANEL — Insight & Action */}
        <aside className="cockpit-scroll w-[360px] shrink-0 overflow-y-auto border-l border-slate-800/50 bg-[#080E19] p-3 space-y-3">

          {/* Conclusion Display */}
          <div className={`rounded-lg border p-4 text-center transition-all duration-500 ${runComplete ? 'border-emerald-400/30 bg-emerald-400/5' : 'border-slate-800 bg-[#0A0F1A]'}`}>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Conclusion</p>
            <p className={`mt-1 text-4xl font-black ${runComplete ? 'text-emerald-300' : 'text-slate-700'}`}>{runComplete ? 'Complete' : 'Pending'}</p>
            <p className="mt-1 text-[10px] text-slate-500">{runComplete ? 'Ready - phase confirmed' : 'Pending characterization'}</p>
          </div>

          {/* Phase Result */}
          <div className={`rounded-lg border p-3 ${runComplete ? 'border-cyan-400/20 bg-[#07111F]' : 'border-slate-800 bg-[#0A0F1A]'}`}>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Identified Phase</p>
            <p className={`mt-1 text-lg font-bold ${runComplete ? 'text-white' : 'text-slate-700'}`}>{runComplete ? SCIENTIFIC_INSIGHT.phase : 'Pending'}</p>
            {runComplete && <p className="mt-1 text-[11px] text-slate-400">Spinel ferrite · Fd-3m</p>}
          </div>

          {showScientificInsight && result ? (
            <div className="agent-insight-in space-y-3">
              {/* Evidence */}
              <div className="rounded-lg border border-slate-800 bg-[#0A0F1A] p-3">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Evidence</p>
                <div className="space-y-1">
                  {SCIENTIFIC_INSIGHT.evidence.map(e => (
                    <div key={e} className="flex items-start gap-2 rounded-md border border-slate-800 bg-[#070B12] px-2 py-1.5 text-[11px] text-slate-300">
                      <CheckCircle2 size={12} className="mt-0.5 shrink-0 text-emerald-300" /><span>{e}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Supporting Data */}
              <div className="rounded-lg border border-slate-800 bg-[#0A0F1A] p-3">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Supporting Data</p>
                <div className="space-y-1">
            <p className={`mt-1 text-4xl font-black ${runComplete ? 'text-emerald-300' : 'text-slate-700'}`}>{runComplete ? 'Complete' : 'Pending'}</p>
                    <div key={c} className="flex items-center gap-2 rounded-md border border-indigo-400/20 bg-indigo-500/10 px-2 py-1.5 text-[11px] text-indigo-100">
                      <CircleDot size={11} className="shrink-0 text-indigo-200" /><span>{c}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Interpretation */}
              <div className="rounded-lg border border-slate-800 bg-[#0A0F1A] p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Interpretation</p>
                <p className="mt-1.5 text-[11px] leading-5 text-slate-300">{SCIENTIFIC_INSIGHT.interpretation}</p>
              </div>

              {/* Roles */}
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg border border-amber-400/20 bg-amber-400/5 p-2.5">
                  <p className="text-[9px] font-bold uppercase text-amber-300">Model</p>
                  <p className="mt-1 text-[11px] text-slate-200">{SCIENTIFIC_INSIGHT.modelRole}</p>
                </div>
                <div className="rounded-lg border border-cyan-400/20 bg-cyan-400/5 p-2.5">
                  <p className="text-[9px] font-bold uppercase text-cyan-300">Tools</p>
                  <p className="mt-1 text-[11px] text-slate-200">{SCIENTIFIC_INSIGHT.toolRole}</p>
                </div>
              </div>

              {/* Caveat */}
              <div className="rounded-lg border border-orange-400/20 bg-orange-400/5 p-3">
                <div className="flex items-center gap-1.5 mb-1"><AlertTriangle size={12} className="text-orange-300" /><p className="text-[9px] font-bold uppercase text-orange-300">Caveat</p></div>
                <p className="text-[11px] leading-5 text-slate-300">{SCIENTIFIC_INSIGHT.caveat}</p>
              </div>

              {/* Next Step */}
              <div className="rounded-lg border border-indigo-400/20 bg-indigo-500/10 p-3">
                <p className="text-[9px] font-bold uppercase text-indigo-200">Recommended Next</p>
                <p className="mt-1 text-[11px] leading-5 text-slate-200">{SCIENTIFIC_INSIGHT.nextStep}</p>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={handleExportReport} className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-cyan-400/40 bg-[#0A0F1A] text-[11px] font-semibold text-cyan-300 hover:bg-cyan-400/10"><Download size={12} />Export</button>
                <Link to={workspacePath} className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-slate-700 bg-[#0A0F1A] text-[11px] font-semibold text-slate-200 hover:border-slate-500"><Microscope size={12} />Workspace</Link>
                <button type="button" onClick={handleSaveToNotebook} className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-indigo-400/40 bg-[#0A0F1A] text-[11px] font-semibold text-indigo-200 hover:bg-indigo-500/10"><FileText size={12} />Notebook</button>
                <button type="button" onClick={handleGenerateReproducibleReport} className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-emerald-400/40 bg-[#0A0F1A] text-[11px] font-semibold text-emerald-200 hover:bg-emerald-500/10"><ClipboardList size={12} />Repro Report</button>
              </div>

              {feedback && <div className="rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-[11px] font-semibold text-primary">{feedback}</div>}
            </div>
          ) : (
            <div className="rounded-lg border border-slate-800 bg-[#0A0F1A] p-4 text-center">
              <Brain size={28} className="mx-auto mb-2 text-slate-700" />
              <p className="text-xs font-semibold text-white">Decision Pending</p>
              <p className="mt-1.5 text-[11px] leading-5 text-slate-500">Run the agent to execute tools, collect evidence, and generate the scientific insight.</p>
            </div>
          )}

          {/* Impact */}
          <div className="rounded-lg border border-emerald-400/20 bg-emerald-400/5 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-300 mb-1">Why This Matters</p>
            <p className="text-[11px] leading-5 text-slate-300">{IMPACT_TEXT}</p>
          </div>

          {/* Meta */}
          <div className="rounded-lg border border-slate-800 bg-[#0A0F1A] p-2.5 text-center">
            <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-amber-300">Demo build: structured Gemma orchestration</span>
          </div>
        </aside>

      </div>
    </div>
  );
}
