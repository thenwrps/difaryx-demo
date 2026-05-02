/**
 * Scientific Text Formatting Types
 * 
 * Production-grade type definitions for scientific notation formatting
 * across XRD, XPS, FTIR, and Raman techniques.
 */

/**
 * Supported analytical techniques for context-aware formatting
 */
export type Technique = 'XRD' | 'FTIR' | 'XPS' | 'RAMAN' | 'AUTO';

/**
 * Output rendering modes
 */
export type RenderMode = 'html' | 'jsx' | 'unicode';

/**
 * Formatting options
 */
export interface FormatOptions {
  /**
   * Analytical technique context for specialized formatting rules
   * @default 'AUTO'
   */
  technique?: Technique;
  
  /**
   * Output rendering mode
   * @default 'html'
   */
  mode?: RenderMode;
  
  /**
   * Skip formatting if input already contains HTML tags
   * @default true
   */
  skipIfFormatted?: boolean;
}

/**
 * Pattern matching result
 */
export interface PatternMatch {
  /** Original matched text */
  original: string;
  
  /** Formatted replacement text */
  formatted: string;
  
  /** Start index in original string */
  start: number;
  
  /** End index in original string */
  end: number;
  
  /** Pattern type identifier */
  type: PatternType;
}

/**
 * Pattern types for scientific notation
 */
export type PatternType =
  | 'xps-orbital'
  | 'oxidation-state'
  | 'chemical-formula'
  | 'ionic-expression'
  | 'raman-mode'
  | 'wavenumber-unit'
  | 'miller-index'
  | 'protected';

/**
 * Transformation function signature
 */
export type TransformFunction = (input: string, mode: RenderMode) => string;

/**
 * Pattern definition
 */
export interface PatternDefinition {
  /** Pattern type identifier */
  type: PatternType;
  
  /** Regular expression for matching */
  pattern: RegExp;
  
  /** Transformation function */
  transform: TransformFunction;
  
  /** Priority order (lower = earlier) */
  priority: number;
  
  /** Whether to apply this pattern */
  enabled?: boolean;
}
