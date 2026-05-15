import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Database,
  Sparkles,
  Layers,
  Zap,
} from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { runFusionAnalysis } from '../agents/fusionAgent/runner';
import { runXpsProcessing } from '../agents/xpsAgent/runner';
import { runFtirProcessing } from '../agents/ftirAgent/runner';
import { runRamanProcessing } from '../agents/ramanAgent/runner';
import { xpsDemoData } from '../data/xpsDemoData';
import { ftirDemoData } from '../data/ftirDemoData';
import { ramanDemoData } from '../data/ramanDemoData';
import type { FusionResult } from '../agents/fusionAgent/types';
import { getRegistryProject, normalizeRegistryProjectId } from '../data/demoProjectRegistry';
import { DEFAULT_PROJECT_ID } from '../data/demoProjects';

export default function FusionWorkspace() {
  const [searchParams] = useSearchParams();
  const registryProject = getRegistryProject(normalizeRegistryProjectId(searchParams.get('project')) || DEFAULT_PROJECT_ID);
  const [activeTab, setActiveTab] = useState<'decision' | 'matrix' | 'claims' | 'contradictions' | 'report'>('decision');
  const [fusionResult, setFusionResult] = useState<FusionResult | null>(null);
  const requiredFusionTechniques = ['xps', 'ftir', 'raman'] as const;
  const missingFusionTechniques = requiredFusionTechniques.filter(
    (technique) => !registryProject.selectedTechniques.includes(technique),
  );
  const hasFusionBundle = missingFusionTechniques.length === 0;
  
  // Run fusion analysis
  const handleRunFusion = () => {
    if (!hasFusionBundle) {
      setFusionResult(null);
      return;
    }

    // Import processed results from demo data
    const xpsResult = runXpsProcessing(xpsDemoData);
    const ftirResult = runFtirProcessing(ftirDemoData);
    const ramanResult = runRamanProcessing(ramanDemoData);
    
    // Run fusion analysis
    const result = runFusionAnalysis(xpsResult, ftirResult, ramanResult);
    setFusionResult(result);
  };
  
  // Auto-run fusion on mount
  React.useEffect(() => {
    handleRunFusion();
  }, [registryProject.id, hasFusionBundle]);
  
  // Get conclusion badge color
  const getConclusionBadgeColor = (status: 'strongly-supported' | 'supported' | 'partial') => {
    switch (status) {
      case 'strongly-supported':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'supported':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'partial':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };
  
  // Get support badge color
  const getSupportBadgeColor = (support: 'supports' | 'contradicts' | 'neutral' | 'ambiguous') => {
    switch (support) {
      case 'supports':
        return 'bg-green-100 text-green-800';
      case 'contradicts':
        return 'bg-red-100 text-red-800';
      case 'ambiguous':
        return 'bg-yellow-100 text-yellow-800';
      case 'neutral':
        return 'bg-gray-100 text-gray-600';
    }
  };
  
  // Get severity badge color
  const getSeverityBadgeColor = (severity: 'none' | 'low' | 'medium' | 'high') => {
    switch (severity) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'none':
        return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const formatReviewStatus = (value: number) => (
    value >= 0.9 ? 'Supported' : value >= 0.75 ? 'Requires validation' : 'Validation-limited'
  );
  
  // Left Panel Content
  const leftPanel = (
    <div className="space-y-4">
      {/* Project Info */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Project Information</h3>
        <div className="space-y-2 text-sm">
          <div>
            <span className="text-gray-500">Project:</span>
            <span className="ml-2 font-medium">{registryProject.title}</span>
          </div>
          <div>
            <span className="text-gray-500">Sample:</span>
            <span className="ml-2 font-medium">{registryProject.materialSystem}</span>
          </div>
        </div>
      </div>
      
      {/* Included Techniques */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Included Techniques</h3>
        <div className="space-y-2">
          {registryProject.selectedTechniques
            .filter((technique) => technique !== 'multi')
            .map((technique) => (
              <div key={technique} className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span>{technique.toUpperCase()}</span>
              </div>
            ))}
          {missingFusionTechniques.map((technique) => (
            <div key={technique} className="flex items-center gap-2 text-sm text-amber-700">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>{technique.toUpperCase()} pending</span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Fusion Rules */}
      <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
        <h3 className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
          <Layers className="w-4 h-4" />
          Fusion Rules
        </h3>
        <div className="text-xs text-blue-800 space-y-1">
          <div>• <strong>XPS:</strong> Authority for oxidation states</div>
          <div>• <strong>Raman:</strong> Authority for structure</div>
          <div>• <strong>FTIR:</strong> Authority for functional groups</div>
          <div className="mt-2 pt-2 border-t border-blue-200">
            Status based on evidence agreement, not averaging
          </div>
        </div>
      </div>
      
      {/* Run Fusion Button */}
      <button
        onClick={handleRunFusion}
        disabled={!hasFusionBundle}
        className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:text-gray-600 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
      >
        <Zap className="w-5 h-5" />
        {hasFusionBundle ? 'Run Fusion' : 'Fusion Pending Evidence'}
      </button>
    </div>
  );
  
  // Right Panel Content
  const rightPanel = fusionResult ? (
    <div className="space-y-4">
      {/* Characterization Overview */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Characterization Overview</h3>
        <p className="text-sm text-gray-700 leading-relaxed">
          {fusionResult.decision.primaryConclusion}
        </p>
      </div>
      
      {/* Interpretation */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Interpretation</h3>
        <div className="space-y-3">
          <div>
            <div className="text-xs text-gray-500 mb-1">Overall Status</div>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getConclusionBadgeColor(fusionResult.decision.confidenceScore >= 0.9 ? 'strongly-supported' : fusionResult.decision.confidenceScore >= 0.75 ? 'supported' : 'partial')}`}>
                {formatReviewStatus(fusionResult.decision.confidenceScore)}
              </span>
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">Supporting Data</div>
            <div className="text-lg font-semibold text-gray-900">
              {fusionResult.supportedClaims.length} / {fusionResult.claims.length}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">Contradictions</div>
            <div className="text-lg font-semibold text-gray-900">
              {fusionResult.contradictions.length}
            </div>
          </div>
        </div>
      </div>
      
      {/* Supporting Data */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Supporting Data</h3>
        <div className="space-y-2 text-xs">
          {fusionResult.claims
            .filter(c => c.status === 'supported')
            .slice(0, 3)
            .map((claim, idx) => (
              <div key={claim.id} className="flex items-start gap-2">
                <span className="text-gray-400 font-medium">{idx + 1}.</span>
                <div>
                  <div className="font-medium text-gray-900">{claim.title}</div>
                  <div className="text-gray-600 mt-0.5">
                    {claim.supportingTechniques
                      .filter(t => t.support === 'supports')
                      .map(t => t.technique)
                      .join(', ')}
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
      
      {/* Recommended Validation */}
      <div className="bg-amber-50 rounded-lg border border-amber-200 p-4">
        <h3 className="text-sm font-semibold text-amber-900 mb-2 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          Recommended Validation
        </h3>
        <ul className="text-xs text-amber-800 space-y-1">
          {fusionResult.recommendedValidation.slice(0, 3).map((rec, idx) => (
            <li key={idx}>• {rec}</li>
          ))}
        </ul>
      </div>
    </div>
  ) : (
    <div className="bg-gray-50 rounded-lg border border-gray-200 p-8 text-center">
      <Sparkles className="w-12 h-12 text-gray-400 mx-auto mb-3" />
      <p className="text-sm font-semibold text-gray-700">
        {hasFusionBundle ? 'Run fusion to see results' : `${registryProject.title} fusion evidence is pending`}
      </p>
      {!hasFusionBundle && (
        <p className="mt-2 text-xs text-gray-500">
          Missing {missingFusionTechniques.map((technique) => technique.toUpperCase()).join(', ')} evidence.
        </p>
      )}
    </div>
  );

  // Center Panel Content
  const centerPanel = fusionResult ? (
    <div className="h-full flex flex-col">
      {/* Tab Bar */}
      <div className="flex border-b border-gray-200 bg-white">
        <button
          onClick={() => setActiveTab('decision')}
          className={`px-6 py-3 text-sm font-medium transition-colors ${
            activeTab === 'decision'
              ? 'border-b-2 border-indigo-600 text-indigo-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Interpretation
        </button>
        <button
          onClick={() => setActiveTab('matrix')}
          className={`px-6 py-3 text-sm font-medium transition-colors ${
            activeTab === 'matrix'
              ? 'border-b-2 border-indigo-600 text-indigo-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Cross-Technique Insights
        </button>
        <button
          onClick={() => setActiveTab('claims')}
          className={`px-6 py-3 text-sm font-medium transition-colors ${
            activeTab === 'claims'
              ? 'border-b-2 border-indigo-600 text-indigo-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Review Cards
        </button>
        <button
          onClick={() => setActiveTab('contradictions')}
          className={`px-6 py-3 text-sm font-medium transition-colors ${
            activeTab === 'contradictions'
              ? 'border-b-2 border-indigo-600 text-indigo-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Contradictions
        </button>
        <button
          onClick={() => setActiveTab('report')}
          className={`px-6 py-3 text-sm font-medium transition-colors ${
            activeTab === 'report'
              ? 'border-b-2 border-indigo-600 text-indigo-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Report
        </button>
      </div>
      
      {/* Tab Content */}
      <div className="flex-1 overflow-auto p-6 bg-gray-50">
        {activeTab === 'decision' && (
          <div className="space-y-6">
            {/* Report-ready Discussion Card */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Report-ready Discussion</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                {fusionResult.decision.primaryConclusion}
              </p>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600">Evidence status:</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getConclusionBadgeColor(fusionResult.decision.confidenceScore >= 0.9 ? 'strongly-supported' : fusionResult.decision.confidenceScore >= 0.75 ? 'supported' : 'partial')}`}>
                  {formatReviewStatus(fusionResult.decision.confidenceScore)}
                </span>
              </div>
            </div>
            
            {/* Supporting Data */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-base font-semibold text-gray-900 mb-3">Supporting Data</h3>
              <ul className="space-y-2">
                {fusionResult.claims
                  .filter(c => c.status === 'supported')
                  .map(claim => (
                    <li key={claim.id} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{claim.title}</span>
                      <span className={`ml-auto px-2 py-0.5 rounded text-xs font-medium border ${getConclusionBadgeColor(claim.confidenceScore >= 0.9 ? 'strongly-supported' : claim.confidenceScore >= 0.75 ? 'supported' : 'partial')}`}>
                        {formatReviewStatus(claim.confidenceScore)}
                      </span>
                    </li>
                  ))}
              </ul>
            </div>
            
            {/* Pending Review */}
            {fusionResult.unresolvedClaims.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-base font-semibold text-gray-900 mb-3">Pending Review</h3>
                <ul className="space-y-2">
                  {fusionResult.claims
                    .filter(c => c.status === 'unresolved')
                    .map(claim => (
                      <li key={claim.id} className="flex items-start gap-2 text-sm">
                        <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{claim.title}</span>
                      </li>
                    ))}
                </ul>
              </div>
            )}
            
            {/* Caveats */}
            {fusionResult.caveats.length > 0 && (
              <div className="bg-amber-50 rounded-lg border border-amber-200 p-6">
                <h3 className="text-base font-semibold text-amber-900 mb-3">Caveats</h3>
                <ul className="space-y-2 text-sm text-amber-800">
                  {fusionResult.caveats.map((caveat, idx) => (
                    <li key={idx}>• {caveat}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'matrix' && (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Claim</th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-700">XPS</th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-700">FTIR</th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-700">Raman</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {fusionResult.evidenceMatrix.claims.map((claim, claimIdx) => (
                    <tr key={claim.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{claim.title}</td>
                      {fusionResult.evidenceMatrix.techniques.map((technique, techIdx) => {
                        const cell = fusionResult.evidenceMatrix.cells[claimIdx][techIdx];
                        return (
                          <td key={technique} className="px-4 py-3 text-center">
                            <div className="flex flex-col items-center gap-1">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${getSupportBadgeColor(cell.support)}`}>
                                {cell.support}
                              </span>
                              {cell.evidenceText && cell.evidenceText !== 'No evidence' && (
                                <span className="text-xs text-gray-600 max-w-[200px] truncate" title={cell.evidenceText}>
                                  {cell.evidenceText}
                                </span>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {activeTab === 'claims' && (
          <div className="space-y-4">
            {fusionResult.claims.map(claim => (
              <div key={claim.id} className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-base font-semibold text-gray-900">{claim.title}</h3>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getConclusionBadgeColor(claim.confidenceScore >= 0.9 ? 'strongly-supported' : claim.confidenceScore >= 0.75 ? 'supported' : 'partial')}`}>
                    {formatReviewStatus(claim.confidenceScore)}
                  </span>
                </div>
                
                <p className="text-sm text-gray-600 mb-4">{claim.description}</p>
                
                {/* Supporting Techniques */}
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Cross-Technique Insights</h4>
                  <div className="space-y-2">
                    {claim.supportingTechniques
                      .filter(t => t.support === 'supports')
                      .map(tech => (
                        <div key={tech.technique} className="flex items-start gap-2 text-sm">
                          <span className="font-medium text-gray-900 min-w-[60px]">{tech.technique}:</span>
                          <span className="text-gray-600">{tech.reasoning}</span>
                        </div>
                      ))}
                  </div>
                </div>
                
                {/* Evidence Items */}
                {claim.supportingTechniques.some(t => t.evidenceItems.length > 0) && (
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Evidence Items</h4>
                    <ul className="space-y-1 text-sm text-gray-600">
                      {claim.supportingTechniques
                        .flatMap(t => t.evidenceItems)
                        .map((item, idx) => (
                          <li key={idx}>• {item.label}</li>
                        ))}
                    </ul>
                  </div>
                )}
                
                {/* Caveats */}
                {claim.caveats.length > 0 && (
                  <div className="bg-amber-50 rounded border border-amber-200 p-3">
                    <h4 className="text-sm font-semibold text-amber-900 mb-1">Limitations and Follow-up Validation</h4>
                    <ul className="space-y-1 text-xs text-amber-800">
                      {claim.caveats.map((caveat, idx) => (
                        <li key={idx}>• {caveat}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        
        {activeTab === 'contradictions' && (
          <div className="space-y-4">
            {fusionResult.contradictions.length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-3" />
                <p className="text-sm text-gray-600">No contradictions detected</p>
              </div>
            ) : (
              fusionResult.contradictions.map(contradiction => (
                <div key={contradiction.id} className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-base font-semibold text-gray-900">{contradiction.id}</h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getSeverityBadgeColor(contradiction.severity)}`}>
                      {contradiction.severity.toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="font-semibold text-gray-700">Techniques Involved:</span>
                      <span className="ml-2 text-gray-600">{contradiction.techniques.join(', ')}</span>
                    </div>
                    
                    <div>
                      <span className="font-semibold text-gray-700">Explanation:</span>
                      <p className="mt-1 text-gray-600">{contradiction.explanation}</p>
                    </div>
                    
                    <div>
                      <span className="font-semibold text-gray-700">Effect on Claim Boundary:</span>
                      <p className="mt-1 text-gray-600">{contradiction.effectOnConfidence}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
        
        {activeTab === 'report' && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="prose prose-sm max-w-none">
              <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">
                {fusionResult.report}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  ) : (
    <div className="h-full flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Sparkles className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">Run fusion to see results</p>
      </div>
    </div>
  );
  
  return (
    <DashboardLayout>
      <div className="flex-1 overflow-y-auto bg-gray-50">
        <div className="grid min-h-full gap-4 p-4 xl:grid-cols-[280px_minmax(0,1fr)_320px]">
          <aside className="space-y-4">{leftPanel}</aside>
          <main className="min-w-0">{centerPanel}</main>
          <aside className="space-y-4">{rightPanel}</aside>
        </div>
      </div>
    </DashboardLayout>
  );
}
