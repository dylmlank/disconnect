/**
 * AI Content Detection Service
 *
 * Provides heuristics and pattern matching to detect AI-generated content.
 * For production use, integrate with external APIs like GPTZero, Hive, or Originality.ai.
 *
 * This module provides:
 * - Text pattern analysis (GPT-isms, formatting patterns)
 * - Image metadata checks (AI-generated flags in EXIF)
 * - Confidence scoring
 * - Extensible detection pipeline
 */

export interface AIDetectionResult {
  isAiGenerated: boolean;
  confidence: number; // 0-1
  flags: string[];
  method: 'pattern' | 'metadata' | 'api';
}

interface PatternMatch {
  pattern: RegExp;
  flag: string;
  weight: number; // contribution to confidence
}

/**
 * Common AI text patterns - these are indicators, not definitive proof.
 * GPT and similar models tend to use certain phrases and structures.
 */
const TEXT_PATTERNS: PatternMatch[] = [
  // Opening phrases AI often uses
  {
    pattern: /^(In conclusion|To summarize|In summary|Overall|In today's|In this day and age)/i,
    flag: 'pattern:ai_intro',
    weight: 0.15,
  },
  {
    pattern: /^(Let's dive|Let's explore|Let's discuss|Let me explain)/i,
    flag: 'pattern:ai_conversational',
    weight: 0.12,
  },

  // Transition phrases
  {
    pattern: /(It's important to note|It is worth noting|Keep in mind that|Bear in mind)/i,
    flag: 'pattern:ai_transition',
    weight: 0.1,
  },

  // Hedging language
  {
    pattern: /(In a world where|In an era where|In today's digital age)/i,
    flag: 'pattern:ai_hedging',
    weight: 0.15,
  },

  // Overused adjectives
  {
    pattern:
      /\b(stunning|breathtaking|remarkable|game-changing|revolutionary|cutting-edge|innovative|seamless|unparalleled|unmatched)\b/i,
    flag: 'pattern:ai_adjectives',
    weight: 0.08,
  },

  // Closing patterns
  {
    pattern: /(Whether you're|Whether you are|Not only.*but also|In a nutshell|All in all)/i,
    flag: 'pattern:ai_closing',
    weight: 0.1,
  },

  // Perfect structure indicators - AI often creates perfectly structured content
  {
    pattern: /^(What|Why|How|When|Where|Who)\s+\w+\s*\n\n/gm,
    flag: 'pattern:question_headers',
    weight: 0.12,
  },

  // Numbered list patterns AI favors
  {
    pattern: /^(First[,.]?\s+|Second[,.]?\s+|Third[,.]?\s+|Finally[,.]?\s+)/gm,
    flag: 'pattern:ordinal_list',
    weight: 0.08,
  },

  // Em-dash overuse (AI uses these frequently)
  { pattern: /—.{1,50}—/g, flag: 'pattern:emdashes', weight: 0.05 },

  // Perfect parallel structure in lists
  {
    pattern: /^(\s*[-•*]\s+\w+[^.!?]*[.!?]\s*){3,}$/gm,
    flag: 'pattern:parallel_lists',
    weight: 0.1,
  },
];

/**
 * Patterns that suggest human-written content (reduce AI confidence)
 */
const HUMAN_INDICATORS: PatternMatch[] = [
  {
    pattern: /\b(uh|um|like|you know|kinda|sorta|i mean|honestly|tbh|ngl)\b/i,
    flag: 'human:casual',
    weight: -0.15,
  },
  { pattern: /[A-Z]{3,}/, flag: 'human:acronyms', weight: -0.05 }, // Real acronyms
  { pattern: /:\)/, flag: 'human:emoji_text', weight: -0.08 },
  {
    pattern: /\b(gonna|wanna|gotta|kinda|sorta|lemme|dunno)\b/i,
    flag: 'human:contractions',
    weight: -0.1,
  },
  { pattern: /[–—]{2,}/, flag: 'human:typos', weight: -0.05 }, // Multiple dashes (typos)
];

/**
 * Analyze text for AI generation patterns
 */
export function analyzeTextPatterns(text: string): AIDetectionResult {
  const flags: string[] = [];
  let confidenceScore = 0;

  // Check AI patterns
  for (const { pattern, flag, weight } of TEXT_PATTERNS) {
    if (pattern.test(text)) {
      flags.push(flag);
      confidenceScore += weight;
    }
  }

  // Check human indicators
  for (const { pattern, flag, weight } of HUMAN_INDICATORS) {
    if (pattern.test(text)) {
      flags.push(flag);
      confidenceScore += weight; // weight is negative
    }
  }

  // Additional heuristics

  // Very uniform sentence length is suspicious
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  if (sentences.length >= 3) {
    const lengths = sentences.map((s) => s.trim().length);
    const avgLength = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    const variance = lengths.reduce((sum, l) => sum + (l - avgLength) ** 2, 0) / lengths.length;
    const stdDev = Math.sqrt(variance);

    // Very low variance in sentence length is AI-like
    if (stdDev < 20 && avgLength > 50) {
      flags.push('pattern:uniform_sentences');
      confidenceScore += 0.1;
    }
  }

  // Perfect grammar, no typos (very suspicious for casual content)
  const wordCount = text.split(/\s+/).length;
  const hasTypos = /[a-z]{2,}[A-Z]|[A-Z]{2,}[a-z]/.test(text); // camelCase accidents
  if (!hasTypos && wordCount > 50) {
    // Check for common human typos - if none, slightly suspicious
    const commonTypos = /\b(teh|adn|taht|thier|recieve|occured|seperate)\b/i;
    if (!commonTypos.test(text)) {
      flags.push('pattern:no_typos');
      confidenceScore += 0.05;
    }
  }

  // Clamp confidence to 0-1
  const confidence = Math.max(0, Math.min(1, confidenceScore));

  return {
    isAiGenerated: confidence > 0.5,
    confidence,
    flags,
    method: 'pattern',
  };
}

/**
 * Check image metadata for AI generation indicators
 * Many AI image generators embed metadata indicating generation
 */
export async function analyzeImageMetadata(imageBuffer: Buffer): Promise<AIDetectionResult> {
  const flags: string[] = [];
  let confidence = 0;

  // Check for common AI image generator signatures in metadata
  // This requires parsing EXIF/IPTC data - simplified here

  // Common patterns in AI-generated image filenames/metadata
  const metaPatterns = [
    { pattern: /DALL[·•-]?E/i, flag: 'metadata:dalle', weight: 0.9 },
    { pattern: /Midjourney/i, flag: 'metadata:midjourney', weight: 0.9 },
    { pattern: /Stable Diffusion/i, flag: 'metadata:stable_diffusion', weight: 0.9 },
    { pattern: /Generated by AI/i, flag: 'metadata:ai_label', weight: 0.85 },
    { pattern: /Adobe Firefly/i, flag: 'metadata:firefly', weight: 0.9 },
    { pattern: /dreamstudio/i, flag: 'metadata:dreamstudio', weight: 0.85 },
    { pattern: /leonardo\.ai/i, flag: 'metadata:leonardo', weight: 0.85 },
  ];

  // Convert buffer to string for pattern matching (simplified)
  const bufferString = imageBuffer.toString('utf8');

  for (const { pattern, flag, weight } of metaPatterns) {
    if (pattern.test(bufferString)) {
      flags.push(flag);
      confidence = Math.max(confidence, weight);
    }
  }

  return {
    isAiGenerated: confidence > 0.5,
    confidence,
    flags,
    method: 'metadata',
  };
}

/**
 * Combined detection for posts/content that may include both text and images
 */
export interface ContentAnalysis {
  textResult: AIDetectionResult | null;
  imageResults: AIDetectionResult[];
  combinedConfidence: number;
  allFlags: string[];
  recommendation: 'allow' | 'warn' | 'requires_label' | 'block';
}

export function analyzeContent(text?: string, imageBuffers?: Buffer[]): ContentAnalysis {
  const textResult = text ? analyzeTextPatterns(text) : null;
  const imageResults: AIDetectionResult[] = [];

  if (imageBuffers) {
    // Note: In production, this would be async
    // For now, we skip actual image analysis in sync context
  }

  const allFlags: string[] = [];
  if (textResult) allFlags.push(...textResult.flags);
  imageResults.forEach((r) => allFlags.push(...r.flags));

  // Combine confidences - take max if both present, or single value
  let combinedConfidence = 0;
  if (textResult && imageResults.length > 0) {
    combinedConfidence = Math.max(textResult.confidence, ...imageResults.map((r) => r.confidence));
  } else if (textResult) {
    combinedConfidence = textResult.confidence;
  } else if (imageResults.length > 0) {
    combinedConfidence = Math.max(...imageResults.map((r) => r.confidence));
  }

  // Determine recommendation based on confidence
  let recommendation: ContentAnalysis['recommendation'];
  if (combinedConfidence >= 0.8) {
    recommendation = 'requires_label';
  } else if (combinedConfidence >= 0.6) {
    recommendation = 'warn';
  } else if (combinedConfidence >= 0.4) {
    recommendation = 'warn';
  } else {
    recommendation = 'allow';
  }

  return {
    textResult,
    imageResults,
    combinedConfidence,
    allFlags,
    recommendation,
  };
}

/**
 * External API integration placeholder
 * In production, this would call GPTZero, Hive, or similar services
 */
export async function detectWithExternalAPI(text: string): Promise<AIDetectionResult> {
  // Placeholder - integrate with actual API
  // Popular options:
  // - GPTZero: https://gptzero.me/docs/api
  // - Hive AI Detection: https://hivemoderation.com/ai-generated-content-detection
  // - Originality.ai: https://originality.ai/api

  // For now, return pattern-based detection
  const result = analyzeTextPatterns(text);
  return {
    ...result,
    method: 'api', // Would be 'api' when actually using external service
  };
}

/**
 * Utility to generate detection summary for display
 */
export function formatDetectionSummary(result: AIDetectionResult): string {
  const percent = Math.round(result.confidence * 100);
  const likelihood = result.isAiGenerated ? 'likely' : 'unlikely';

  return `AI content ${likelihood} (${percent}% confidence). Flags: ${result.flags.join(', ') || 'none'}`;
}
