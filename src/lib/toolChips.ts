import { Tool } from '@/types/tool';
import { ToolContent } from '@/types/toolContent';

export interface UseCaseChip {
  id: string;
  label: string;
}

export interface CapabilityChip {
  id: string;
  label: string;
  targetId: string;
  keywords: string[];
  kind?: 'core' | 'differentiator';
  diffScore?: number; // 内部计算用
}

/**
 * 生成 Use-case chips（最多 3 个）
 * 优先级：content.overview.useCases > tool.best_for > tool.target_audience_list > tool.categories/tags
 */
export function getUseCaseChips(
  tool: Tool,
  content?: ToolContent | null
): UseCaseChip[] {
  const chips: UseCaseChip[] = [];
  const seen = new Set<string>();

  // 1. 优先使用 content.overview.useCases
  if (content?.overview?.useCases && content.overview.useCases.length > 0) {
    for (const uc of content.overview.useCases.slice(0, 3)) {
      const normalized = normalizeLabel(uc.title);
      if (normalized && !seen.has(normalized)) {
        chips.push({ id: `usecase-${chips.length}`, label: uc.title });
        seen.add(normalized);
        if (chips.length >= 3) break;
      }
    }
  }

  // 2. 如果还不够，尝试从 tool.best_for 提取
  if (chips.length < 3 && tool.best_for) {
    const parts = tool.best_for
      .split(/[,&]/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0 && p.length < 50);
    
    for (const part of parts) {
      if (chips.length >= 3) break;
      const normalized = normalizeLabel(part);
      if (normalized && !seen.has(normalized) && part.length < 30) {
        chips.push({ id: `usecase-${chips.length}`, label: truncateLabel(part) });
        seen.add(normalized);
      }
    }
  }

  // 3. 如果还不够，使用 target_audience_list
  if (chips.length < 3 && tool.target_audience_list && tool.target_audience_list.length > 0) {
    for (const audience of tool.target_audience_list) {
      if (chips.length >= 3) break;
      const normalized = normalizeLabel(audience);
      if (normalized && !seen.has(normalized) && audience.length < 30) {
        chips.push({ id: `usecase-${chips.length}`, label: truncateLabel(audience) });
        seen.add(normalized);
      }
    }
  }

  // 4. 最后，从 categories/tags 中挑选场景类标签
  if (chips.length < 3) {
    const scenarioKeywords = [
      'marketing', 'youtubers', 'educators', 'l&d', 'social media',
      'content creators', 'teams', 'enterprise', 'beginners', 'professionals'
    ];
    
    const candidates = [
      ...(tool.categories || []),
      ...(tool.tags || [])
    ];

    for (const candidate of candidates) {
      if (chips.length >= 3) break;
      const lower = candidate.toLowerCase();
      const normalized = normalizeLabel(candidate);
      
      if (
        normalized &&
        !seen.has(normalized) &&
        candidate.length < 30 &&
        (scenarioKeywords.some(kw => lower.includes(kw)) || 
         ['marketing', 'social', 'team', 'creator', 'educator', 'l&d'].some(kw => lower.includes(kw)))
      ) {
        chips.push({ id: `usecase-${chips.length}`, label: truncateLabel(candidate) });
        seen.add(normalized);
      }
    }
  }

  return chips.slice(0, 3);
}

/**
 * 生成 Capability chips（分为 Core 和 Differentiators）
 */
export function getCapabilityChips(
  tool: Tool,
  content?: ToolContent | null,
  allTools?: Tool[]
): { core: CapabilityChip[], differentiators: CapabilityChip[] } {
  // 1. 收集当前工具的所有文本数据用于评分
  const textSources: Array<{ text: string; weight: number }> = [];
  
  // 高权重：highlights, key_facts
  if (tool.highlights) tool.highlights.forEach(h => textSources.push({ text: h, weight: 3 }));
  if (tool.key_facts) tool.key_facts.forEach(kf => textSources.push({ text: kf, weight: 3 }));
  
  // 中权重：pros, cons
  if (tool.pros) tool.pros.forEach(p => textSources.push({ text: p, weight: 2 }));
  if (tool.cons) tool.cons.forEach(c => textSources.push({ text: c, weight: 2 }));
  
  // 低权重：tagline, bottomLine
  if (tool.tagline) textSources.push({ text: tool.tagline, weight: 1 });
  if (content?.reviews?.verdict?.bottomLine) {
    textSources.push({ text: content.reviews.verdict.bottomLine, weight: 1 });
  }

  // 能力词典
  const capabilityDict = [
    {
      id: 'cap-watermark',
      label: 'Watermark',
      keywords: ['watermark', 'watermarked', 'no watermark', 'branding'],
      defaultTarget: 'key-facts',
    },
    {
      id: 'cap-export',
      label: 'Export quality',
      keywords: ['720p', '1080p', '4k', 'resolution', 'export quality', 'export resolution', 'hd', 'full hd'],
      defaultTarget: 'key-facts',
    },
    {
      id: 'cap-credits',
      label: 'Credit burn',
      keywords: ['credit', 'credits', 'minutes', 'quota', 'expire', 'rollover', 'usage', 'consumption'],
      defaultTarget: 'key-facts',
    },
    {
      id: 'cap-rights',
      label: 'Commercial rights',
      keywords: ['commercial', 'rights', 'licensing', 'terms', 'resale', 'license'],
      defaultTarget: 'key-facts',
    },
    {
      id: 'cap-avatars',
      label: 'Avatars',
      keywords: ['avatar', 'talking', 'lip-sync', 'voice clone', 'clone', 'presenter', 'talking head'],
      defaultTarget: 'key-facts',
    },
    {
      id: 'cap-editing',
      label: 'Editing control',
      keywords: ['timeline', 'frame', 'editor', 'editing control', 'cut', 'trim', 'edit', 'precise'],
      defaultTarget: 'pros-cons',
    },
    {
      id: 'cap-stock',
      label: 'Stock & Voice',
      keywords: ['stock', 'shutterstock', 'istock', 'storyblocks', 'voice', 'tts', 'voiceover', 'narration'],
      defaultTarget: 'key-facts',
    },
    {
      id: 'cap-speed',
      label: 'Speed',
      keywords: ['fast', 'render', 'processing', 'generation time', 'latency', 'quick', 'speed'],
      defaultTarget: 'key-facts',
    },
    {
      id: 'cap-collaboration',
      label: 'Collaboration',
      keywords: ['team', 'seats', 'workspace', 'collaboration', 'review', 'share', 'multi-user'],
      defaultTarget: 'key-facts',
    },
  ];

  // 2. 计算当前工具对每个 capability 的得分 (capScore)
  const capScores = new Map<string, number>();
  
  for (const cap of capabilityDict) {
    let score = 0;
    for (const source of textSources) {
      const lowerText = source.text.toLowerCase();
      const matchCount = cap.keywords.filter(kw => 
        lowerText.includes(kw.toLowerCase())
      ).length;
      if (matchCount > 0) {
        score += matchCount * source.weight;
      }
    }
    capScores.set(cap.id, score);
  }

  // 3. 计算同类基线 (freq)
  const capFreq = new Map<string, number>();
  
  if (allTools && allTools.length > 0) {
    // 筛选同类工具（category/tag 重叠）
    const peers = allTools.filter(t => 
      t.slug !== tool.slug && 
      (
        (t.categories && tool.categories && t.categories.some(c => tool.categories!.includes(c))) || 
        (t.tags && tool.tags && t.tags.some(tag => tool.tags!.includes(tag)))
      )
    ).slice(0, 30); // 最多取 30 个做样本

    if (peers.length > 0) {
      for (const cap of capabilityDict) {
        let hitCount = 0;
        for (const peer of peers) {
          // 简化的命中检查：只要 peer 的 highlights/key_facts/tagline 包含关键词即可
          const peerText = [
            ...(peer.highlights || []),
            ...(peer.key_facts || []),
            peer.tagline || ''
          ].join(' ').toLowerCase();
          
          if (cap.keywords.some(kw => peerText.includes(kw.toLowerCase()))) {
            hitCount++;
          }
        }
        capFreq.set(cap.id, hitCount / peers.length);
      }
    }
  }

  // 4. 生成 Differentiators
  // 规则：capScore > 0, freq < 0.65, 差异分 = score * (1 - freq)
  const diffCandidates: Array<CapabilityChip & { diffScore: number }> = [];
  
  for (const cap of capabilityDict) {
    const score = capScores.get(cap.id) || 0;
    const freq = capFreq.get(cap.id) || 0; // 如果没有 allTools，freq 为 0，diffScore = score
    
    // 只考虑当前工具具备的能力
    if (score > 0) {
      // 过滤掉过于通用的能力（作为 differentiator）
      if (freq < 0.65) {
        const diffScore = score * (1 - freq);
        diffCandidates.push({
          ...cap,
          kind: 'differentiator',
          targetId: resolveTargetId(cap.defaultTarget, tool, cap.keywords),
          diffScore
        });
      }
    }
  }
  
  // 按差异分排序，取前 3 个
  diffCandidates.sort((a, b) => b.diffScore - a.diffScore);
  const differentiators = diffCandidates.slice(0, 3);
  const diffIds = new Set(differentiators.map(d => d.id));

  // 5. 生成 Core (保持现状但略收敛)
  // 规则：capScore > 0，不与 differentiators 重复（可选，这里允许重叠？用户说“允许重叠”，
  // 但最好 Differentiator 既然已经突出了，Core 可以展示其他的，或者保留重叠以强调 Core 能力。
  // 用户需求：1) Core 允许重叠; 2) Differentiators 尽量不重叠; 
  // D) Core 如果 freq >= 0.85，最多保留 1 个
  
  const coreCandidates: Array<{ cap: typeof capabilityDict[0]; score: number }> = [];
  
  for (const cap of capabilityDict) {
    const score = capScores.get(cap.id) || 0;
    if (score > 0) {
      coreCandidates.push({ cap, score });
    }
  }
  
  // 按分数排序
  coreCandidates.sort((a, b) => b.score - a.score);
  
  const coreChips: CapabilityChip[] = [];
  let commonCount = 0;
  
  for (const candidate of coreCandidates) {
    if (coreChips.length >= 4) break;
    
    const freq = capFreq.get(candidate.cap.id) || 0;
    
    // 如果是非常通用的能力 (freq >= 0.85)，且已经收录了一个通用能力，则跳过
    if (freq >= 0.85) {
      if (commonCount >= 1) continue;
      commonCount++;
    }
    
    coreChips.push({
      ...candidate.cap,
      kind: 'core',
      targetId: resolveTargetId(candidate.cap.defaultTarget, tool, candidate.cap.keywords),
    });
  }

  return {
    core: coreChips,
    differentiators
  };
}

// 辅助函数：解析 targetId
function resolveTargetId(defaultTarget: string, tool: Tool, keywords: string[]): string {
  // 优先在 key_facts 中查找匹配
  if (tool.key_facts && tool.key_facts.length > 0) {
    for (let i = 0; i < tool.key_facts.length; i++) {
      const fact = tool.key_facts[i].toLowerCase();
      if (keywords.some(kw => fact.includes(kw.toLowerCase()))) {
        return `key-fact-${i}`;
      }
    }
  }
  return defaultTarget;
}

/**
 * 规范化标签（用于去重）
 */
function normalizeLabel(label: string): string {
  return label.toLowerCase().trim().replace(/\s+/g, ' ');
}

/**
 * 截断标签（控制在 2-4 个词）
 */
function truncateLabel(label: string): string {
  const words = label.trim().split(/\s+/);
  if (words.length <= 4) return label;
  return words.slice(0, 4).join(' ');
}
