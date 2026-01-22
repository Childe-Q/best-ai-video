import { calculateJaccardSimilarity } from './generateStyleProfile';

/**
 * Check similarity between multiple tools' How usage works content
 * Returns similarity matrix and warnings if any tool pair exceeds threshold
 */
export function checkUsageWorksSimilarity(
  toolsContent: Array<{ toolName: string; bullets: string[]; tip: string }>,
  threshold: number = 0.5
): {
  similarityMatrix: Array<Array<{ tool1: string; tool2: string; similarity: number }>>;
  warnings: Array<{ tool1: string; tool2: string; similarity: number }>;
} {
  const similarityMatrix: Array<Array<{ tool1: string; tool2: string; similarity: number }>> = [];
  const warnings: Array<{ tool1: string; tool2: string; similarity: number }> = [];
  
  for (let i = 0; i < toolsContent.length; i++) {
    const row: Array<{ tool1: string; tool2: string; similarity: number }> = [];
    const tool1 = toolsContent[i];
    const combined1 = [...tool1.bullets, tool1.tip].join(' ');
    
    for (let j = 0; j < toolsContent.length; j++) {
      if (i === j) {
        row.push({ tool1: tool1.toolName, tool2: tool1.toolName, similarity: 1.0 });
      } else {
        const tool2 = toolsContent[j];
        const combined2 = [...tool2.bullets, tool2.tip].join(' ');
        const similarity = calculateJaccardSimilarity(combined1, combined2);
        row.push({ tool1: tool1.toolName, tool2: tool2.toolName, similarity });
        
        if (similarity >= threshold) {
          warnings.push({ tool1: tool1.toolName, tool2: tool2.toolName, similarity });
        }
      }
    }
    similarityMatrix.push(row);
  }
  
  return { similarityMatrix, warnings };
}
