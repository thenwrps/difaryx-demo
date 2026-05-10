/**
 * LockedScientificContext Component
 * 
 * Displays user-confirmed scientific context as a locked constraint that cannot
 * be modified by the agent without explicit user action. This component reinforces
 * the public-beta guardrail that DIFARYX can test analytical pathways and refine
 * interpretations, but cannot modify user-confirmed scientific context.
 * 
 * Supports two variants:
 * - 'full': Displays all fields with guardrail wording (for Agent Mode RightPanel)
 * - 'compact': Displays condensed version (for XRD Workspace sidebar)
 */

import React, { useState } from 'react';

export interface LockedScientificContextProps {
  sampleIdentity: string;
  technique: string;
  sourceDataset: string;
  sourceProcessingPath: string;
  referenceScope: string;
  claimBoundary: string;
  variant?: 'full' | 'compact';
}

export function LockedScientificContext({
  sampleIdentity,
  technique,
  sourceDataset,
  sourceProcessingPath,
  referenceScope,
  claimBoundary,
  variant = 'full',
}: LockedScientificContextProps) {
  if (variant === 'compact') {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [expanded, setExpanded] = useState(false);
    return (
      <div className="rounded border border-amber-500/30 bg-amber-500/5 px-2.5 py-1.5">
        <div className="flex items-center justify-between">
          <h4 className="text-[9px] font-bold text-text-main">Locked Context</h4>
          <div className="flex items-center gap-1.5">
            <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[8px] font-semibold text-amber-700">
              Locked
            </span>
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="text-[8px] font-semibold text-text-muted hover:text-text-main transition-colors"
            >
              {expanded ? 'less' : 'more'}
            </button>
          </div>
        </div>
        {/* Always-visible summary */}
        <div className="mt-1 space-y-0.5">
          <div className="text-[9px]">
            <span className="font-semibold text-text-main">Sample:</span>{' '}
            <span className="text-text-muted">{sampleIdentity || 'Not specified'}</span>
          </div>
          <div className="text-[9px]">
            <span className="font-semibold text-text-main">Boundary:</span>{' '}
            <span className="text-text-muted line-clamp-2">{claimBoundary || 'Not specified'}</span>
          </div>
        </div>
        {/* Expanded details */}
        {expanded && (
          <div className="mt-1 space-y-0.5 border-t border-amber-500/20 pt-1">
            <div className="text-[9px]">
              <span className="font-semibold text-text-main">Technique:</span>{' '}
              <span className="text-text-muted">{technique || 'Not specified'}</span>
            </div>
            <div className="text-[9px]">
              <span className="font-semibold text-text-main">Dataset:</span>{' '}
              <span className="text-text-muted">{sourceDataset || 'Not specified'}</span>
            </div>
            <div className="text-[9px]">
              <span className="font-semibold text-text-main">Path:</span>{' '}
              <span className="text-text-muted">{sourceProcessingPath || 'Not specified'}</span>
            </div>
            <div className="text-[9px]">
              <span className="font-semibold text-text-main">Scope:</span>{' '}
              <span className="text-text-muted">{referenceScope || 'Not specified'}</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Full variant
  return (
    <div className="rounded border border-amber-500/30 bg-amber-500/5 px-3 py-2.5">
      <div className="mb-2 flex items-center justify-between">
        <h4 className="text-xs font-bold text-text-main">Locked Scientific Context</h4>
        <span className="rounded bg-amber-500/10 px-2 py-0.5 text-[9px] font-semibold text-amber-700">
          Locked by user
        </span>
      </div>
      <p className="mb-2.5 text-[10px] text-text-muted">Source context preserved</p>
      <div className="space-y-1.5">
        <div className="text-[10px]">
          <span className="font-semibold text-text-main">Sample Identity:</span>{' '}
          <span className="text-text-muted">{sampleIdentity || 'Not specified'}</span>
        </div>
        <div className="text-[10px]">
          <span className="font-semibold text-text-main">Technique:</span>{' '}
          <span className="text-text-muted">{technique || 'Not specified'}</span>
        </div>
        <div className="text-[10px]">
          <span className="font-semibold text-text-main">Source Dataset:</span>{' '}
          <span className="text-text-muted">{sourceDataset || 'Not specified'}</span>
        </div>
        <div className="text-[10px]">
          <span className="font-semibold text-text-main">Source Processing Path:</span>{' '}
          <span className="text-text-muted">{sourceProcessingPath || 'Not specified'}</span>
        </div>
        <div className="text-[10px]">
          <span className="font-semibold text-text-main">Reference Scope:</span>{' '}
          <span className="text-text-muted">{referenceScope || 'Not specified'}</span>
        </div>
        <div className="text-[10px]">
          <span className="font-semibold text-text-main">Claim Boundary:</span>{' '}
          <span className="text-text-muted">{claimBoundary || 'Not specified'}</span>
        </div>
      </div>
      <div className="mt-2.5 space-y-1 border-t border-amber-500/20 pt-2.5 text-[9px] leading-snug text-text-muted">
        <p>User-confirmed context is treated as a locked scientific constraint.</p>
        <p>DIFARYX may test analytical paths, but source context remains unchanged.</p>
        <p>Suggested changes require explicit user action.</p>
        <p>Interpretation is bounded by current evidence coverage.</p>
      </div>
    </div>
  );
}
