import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Play, 
  Database, 
  Brain, 
  Activity, 
  CheckCircle2, 
  CircleDot, 
  ArrowRight,
  Terminal,
  Microscope,
  FileText,
  Loader2,
  ChevronLeft
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';

const PIPELINE_STEPS = [
  { id: 'input', label: 'Input' },
  { id: 'context', label: 'Context' },
  { id: 'execution', label: 'Execution' },
  { id: 'fusion', label: 'Fusion' },
  { id: 'reasoning', label: 'Reasoning' },
  { id: 'decision', label: 'Decision' }
];

const MOCK_XRD_DATA = Array.from({ length: 80 }, (_, i) => {
  const x = i + 10;
  let y = Math.random() * 50 + 10;
  // Add some synthetic peaks
  if (Math.abs(x - 20.1) < 1) y += 400;
  if (Math.abs(x - 30.2) < 1.5) y += 800;
  if (Math.abs(x - 35.5) < 1.2) y += 1200;
  if (Math.abs(x - 43.3) < 1.5) y += 600;
  if (Math.abs(x - 57.2) < 2) y += 500;
  return { x, y: Math.max(0, y) };
});

export default function AgentDemo() {
  const navigate = useNavigate();
  const [goal, setGoal] = useState("Identify material and resolve conflicting signals");
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState<string | null>(null);
  const [logs, setLogs] = useState<{time: string, msg: string, type?: string}[]>([]);
  const [result, setResult] = useState<any>(null);
  
  const logEndRef = useRef<HTMLDivElement>(null);

  const addLog = (msg: string, type: string = 'info') => {
    setLogs(prev => [...prev, {
      time: new Date().toLocaleTimeString([], { hour12: false }),
      msg,
      type
    }]);
  };

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const runAgent = async () => {
    if (!goal.trim()) return;
    
    setIsRunning(true);
    setResult(null);
    setLogs([]);
    addLog(`Goal received: "${goal}"`, 'info');
    setCurrentStep('input');
    
    try {
      // Simulate frontend-side state transitions for UI pipeline
      await new Promise(r => setTimeout(r, 600));
      setCurrentStep('context');
      addLog("Building context from dataset: Spinel_Ferrite_A.xrd", 'info');
      
      await new Promise(r => setTimeout(r, 800));
      setCurrentStep('execution');
      addLog("Executing Tool: XRD Analyzer", 'system');
      addLog("Detecting peaks and fitting pattern...", 'system');
      
      // Call Backend
      const response = await fetch('http://localhost:3001/run-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal, dataset: { name: 'Spinel_Ferrite_A.xrd', peaks: [20.1, 30.2, 35.5, 43.3, 57.2] } })
      });
      
      const data = await response.json();
      
      setCurrentStep('fusion');
      addLog("Aggregating results from XRD Analyzer", 'info');
      await new Promise(r => setTimeout(r, 600));
      
      setCurrentStep('reasoning');
      addLog("Reasoning Layer: Evaluating hypotheses via Gemini", 'system');
      await new Promise(r => setTimeout(r, 800));
      
      setCurrentStep('decision');
      addLog("Generating final decision and confidence score", 'success');
      
      if (data.success) {
        setResult(data.data);
      } else {
        addLog("Error: Agent failed to return a valid result.", 'error');
      }
      
    } catch (err) {
      addLog(`Execution Error: ${err}`, 'error');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070B12] text-slate-300 font-sans flex flex-col h-screen overflow-hidden">
      {/* Top Header & Pipeline */}
      <header className="h-16 border-b border-slate-800 bg-[#0A0F1A] flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')} className="text-slate-400 hover:text-white transition-colors">
            <ChevronLeft size={20} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary/20 flex items-center justify-center border border-primary/30">
              <Brain size={14} className="text-primary" />
            </div>
            <span className="font-semibold text-white tracking-wide">DIFARYX Agent</span>
          </div>
        </div>

        {/* Pipeline Viz */}
        <div className="flex items-center gap-2 hidden md:flex">
          {PIPELINE_STEPS.map((step, idx) => {
            const isActive = currentStep === step.id;
            const isPast = PIPELINE_STEPS.findIndex(s => s.id === currentStep) > idx;
            const isDone = result !== null;
            
            let color = "text-slate-600 border-slate-700";
            if (isActive) color = "text-cyan border-cyan bg-cyan/10 animate-pulse";
            else if (isPast || isDone) color = "text-primary border-primary bg-primary/10";

            return (
              <React.Fragment key={step.id}>
                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-medium transition-colors ${color}`}>
                  {(isPast || isDone) ? <CheckCircle2 size={12} /> : isActive ? <Loader2 size={12} className="animate-spin" /> : <CircleDot size={12} />}
                  {step.label}
                </div>
                {idx < PIPELINE_STEPS.length - 1 && (
                  <ArrowRight size={14} className={isPast || isDone ? "text-primary/50" : "text-slate-700"} />
                )}
              </React.Fragment>
            );
          })}
        </div>
        
        <div className="w-24 flex justify-end">
           <div className={`flex items-center gap-2 text-xs font-medium ${isRunning ? 'text-emerald-400' : 'text-slate-500'}`}>
             <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
             {isRunning ? 'Agent Active' : 'Agent Idle'}
           </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Panel: Input & Context */}
        <div className="w-80 border-r border-slate-800 bg-[#0A0F1A]/50 p-5 flex flex-col gap-6 shrink-0 overflow-y-auto">
          <div>
            <h2 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
              <Activity size={16} className="text-primary" /> Define Goal
            </h2>
            <textarea 
              className="w-full bg-[#070B12] border border-slate-700 rounded-lg p-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-primary resize-none h-32"
              placeholder="What do you want the agent to analyze?"
              value={goal}
              onChange={e => setGoal(e.target.value)}
              disabled={isRunning}
            />
            <button 
              onClick={runAgent}
              disabled={isRunning || !goal.trim()}
              className="mt-3 w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRunning ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} fill="currentColor" />}
              {isRunning ? 'Agent Running...' : 'Execute Agent'}
            </button>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
              <Database size={16} className="text-primary" /> Available Datasets
            </h2>
            <div className="space-y-2">
              {[
                { name: 'Spinel_Ferrite_A.xrd', tech: 'XRD', active: true },
                { name: 'Spinel_Ferrite_A.xps', tech: 'XPS', active: false },
                { name: 'Spinel_Ferrite_A.ftir', tech: 'FTIR', active: false }
              ].map(ds => (
                <div key={ds.name} className={`flex items-center justify-between p-2.5 rounded border ${ds.active ? 'bg-primary/10 border-primary/30' : 'bg-[#070B12] border-slate-800 opacity-60'}`}>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={ds.active} readOnly className="rounded border-slate-600 bg-slate-800 text-primary focus:ring-primary focus:ring-offset-[#070B12]" />
                    <span className="text-xs font-medium text-slate-300">{ds.name}</span>
                  </div>
                  <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">{ds.tech}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Center Panel: Execution & Graph */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 p-6 flex flex-col min-h-0 relative">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
              <Microscope size={16} className="text-primary" /> Execution View: XRD Pattern
            </h2>
            <div className="flex-1 bg-[#0A0F1A] border border-slate-800 rounded-xl p-4 relative min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={MOCK_XRD_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="x" stroke="#475569" tick={{fill: '#64748b', fontSize: 10}} />
                  <YAxis stroke="#475569" tick={{fill: '#64748b', fontSize: 10}} />
                  <Line type="monotone" dataKey="y" stroke="#2563eb" strokeWidth={2} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>

              {/* Execution Overlay */}
              {isRunning && (
                <div className="absolute inset-0 bg-[#0A0F1A]/60 backdrop-blur-[2px] flex items-center justify-center rounded-xl">
                  <div className="bg-[#070B12] border border-cyan/30 rounded-lg p-6 shadow-2xl shadow-cyan/10 text-center max-w-sm">
                    <div className="w-12 h-12 rounded-full bg-cyan/10 border border-cyan/30 flex items-center justify-center mx-auto mb-4">
                      <Loader2 size={24} className="text-cyan animate-spin" />
                    </div>
                    <h3 className="text-white font-semibold mb-1">Agent is analyzing</h3>
                    <p className="text-sm text-cyan animate-pulse">{
                      currentStep === 'execution' ? 'Extracting peaks and fitting reference...' :
                      currentStep === 'fusion' ? 'Fusing evidence across modules...' :
                      currentStep === 'reasoning' ? 'Gemini is evaluating hypotheses...' :
                      'Preparing results...'
                    }</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Panel: Execution Log */}
          <div className="h-64 border-t border-slate-800 bg-[#0A0F1A]/80 p-4 flex flex-col shrink-0">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2 mb-3">
              <Terminal size={14} /> Execution Log
            </h2>
            <div className="flex-1 overflow-y-auto font-mono text-[11px] space-y-1.5 pr-2 custom-scrollbar">
              {logs.length === 0 && <span className="text-slate-600">Waiting for agent execution...</span>}
              {logs.map((log, i) => (
                <div key={i} className="flex gap-3">
                  <span className="text-slate-500 shrink-0">[{log.time}]</span>
                  <span className={`
                    ${log.type === 'system' ? 'text-cyan' : ''}
                    ${log.type === 'error' ? 'text-red-400' : ''}
                    ${log.type === 'success' ? 'text-emerald-400' : ''}
                    ${log.type === 'info' ? 'text-slate-300' : ''}
                  `}>
                    {log.type === 'system' && '> '}
                    {log.msg}
                  </span>
                </div>
              ))}
              <div ref={logEndRef} />
            </div>
          </div>
        </div>

        {/* Right Panel: Decision & Evidence */}
        <div className="w-[340px] border-l border-slate-800 bg-[#0A0F1A]/50 p-5 flex flex-col gap-6 shrink-0 overflow-y-auto">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <FileText size={16} className="text-primary" /> Final Decision
          </h2>
          
          {!result && !isRunning && (
            <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50">
              <Brain size={48} className="text-slate-700 mb-4" />
              <p className="text-sm text-slate-400">Run the agent to see the final decision and evidence.</p>
            </div>
          )}

          {isRunning && (
            <div className="flex-1 flex flex-col items-center justify-center">
               <Loader2 size={32} className="text-slate-600 animate-spin mb-4" />
               <p className="text-sm text-slate-500">Awaiting decision...</p>
            </div>
          )}

          {result && !isRunning && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500 flex flex-col gap-6">
              
              <div className="bg-[#070B12] border border-emerald-500/30 rounded-xl p-5 text-center shadow-lg shadow-emerald-500/5">
                <CheckCircle2 size={32} className="text-emerald-500 mx-auto mb-3" />
                <h3 className="text-xl font-bold text-white mb-2 leading-tight">
                  {result.final_decision}
                </h3>
              </div>

              <div className="bg-[#070B12] border border-slate-800 rounded-xl p-5 flex items-center justify-between">
                <span className="text-sm font-medium text-slate-400">Confidence Score</span>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-emerald-400">{result.confidence}%</span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Key Evidence</h4>
                <div className="space-y-2">
                  {result.evidence?.map((item: string, idx: number) => (
                    <div key={idx} className="bg-[#070B12] border border-slate-800 rounded-lg p-3 flex gap-3 items-start">
                      <div className="mt-0.5 w-4 h-4 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0">
                        <span className="text-[10px] text-primary font-bold">{idx + 1}</span>
                      </div>
                      <p className="text-sm text-slate-300 leading-snug">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="mt-auto pt-4 border-t border-slate-800">
                <p className="text-[11px] text-slate-500 text-center">
                  Powered by Google Gemini 1.5 Pro
                </p>
              </div>

            </div>
          )}
        </div>

      </div>
    </div>
  );
}
