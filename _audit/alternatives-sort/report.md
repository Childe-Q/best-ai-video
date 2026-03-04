# Alternatives Sort Audit Report

## 1. 跨页面同质化分析

**Top 10 最同质化的页面对:**
- **sora & steve-ai** (Jaccard: 1.00)
  - List A: invideo, fliki, pika, runway
  - List B: invideo, fliki, pika, runway
- **deepbrain-ai & synthesys** (Jaccard: 1.00)
  - List A: heygen, synthesia, elai-io, colossyan
  - List B: heygen, synthesia, elai-io, colossyan
- **d-id & deepbrain-ai** (Jaccard: 0.80)
  - List A: heygen, synthesia, elai-io, colossyan, deepbrain-ai
  - List B: heygen, synthesia, elai-io, colossyan
- **d-id & synthesys** (Jaccard: 0.80)
  - List A: heygen, synthesia, elai-io, colossyan, deepbrain-ai
  - List B: heygen, synthesia, elai-io, colossyan
- **sora & lumen5** (Jaccard: 0.75)
  - List A: invideo, fliki, pika, runway
  - List B: invideo, fliki, pika
- **lumen5 & steve-ai** (Jaccard: 0.75)
  - List A: invideo, fliki, pika
  - List B: invideo, fliki, pika, runway
- **heygen & elai-io** (Jaccard: 0.67)
  - List A: pictory, synthesia, deepbrain-ai, colossyan, d-id
  - List B: heygen, pictory, synthesia, deepbrain-ai, colossyan
- **fliki & zebracat** (Jaccard: 0.67)
  - List A: lumen5, pictory, invideo, runway, sora
  - List B: lumen5, pictory, fliki, runway, sora
- **synthesia & elai-io** (Jaccard: 0.67)
  - List A: heygen, pictory, deepbrain-ai, colossyan, opus-clip
  - List B: heygen, pictory, synthesia, deepbrain-ai, colossyan
- **elai-io & d-id** (Jaccard: 0.67)
  - List A: heygen, pictory, synthesia, deepbrain-ai, colossyan
  - List B: heygen, synthesia, elai-io, colossyan, deepbrain-ai

## 2. “为什么 Pictory 经常第一” 根因分析（基于数据）
Pictory 在 8 个页面的 Top Picks 中出现。
它在 Intent Gating (初始候选) 的平均排名: 0.00
它在 Diversified (MMR打分后) 的平均排名: 0.63
-> **结论**: 我们将在下文总结。

## 3. 各页面详情追溯

### Tool: invideo
- **Base Intent**: text_to_video
- **Preference Label**: avatar
- **Top Picks (Final)**: pictory, runway, sora, synthesia [Featured], veed-io [Featured]
- **Deep Dives (Final)**: pictory, runway, sora, synthesia [Featured], veed-io [Featured]
- **Raw Candidates**: pictory, veed-io, runway, sora, synthesia ...
- **Intent Gated (Before Diversity)**: pictory, runway, sora, synthesia, veed-io
- **Diversified (After Diversity)**: pictory, runway, sora, synthesia, veed-io
- **Featured Preference Order**: heygen, synthesia, fliki, veed-io, zebracat
- **Featured Adjusted Top Picks**: pictory, runway, sora, synthesia, veed-io
- **Ensure Featured Triggered?**: false
- **Cap Featured Trimmed?**: false
- **Fallback Featured Deep Dive Triggered?**: false ()
- **Filler Deep Dives**: 

### Tool: heygen
- **Base Intent**: avatar
- **Preference Label**: avatar
- **Top Picks (Final)**: pictory, synthesia [Featured], deepbrain-ai, colossyan, d-id
- **Deep Dives (Final)**: pictory, synthesia [Featured], deepbrain-ai, colossyan, d-id, synthesys
- **Raw Candidates**: pictory, synthesia, descript, deepbrain-ai, colossyan, synthesys, d-id, runway, sora ...
- **Intent Gated (Before Diversity)**: pictory, synthesia, deepbrain-ai, colossyan, synthesys, d-id
- **Diversified (After Diversity)**: pictory, synthesia, deepbrain-ai, colossyan, d-id, synthesys
- **Featured Preference Order**: synthesia, fliki, veed-io, zebracat, invideo
- **Featured Adjusted Top Picks**: pictory, synthesia, deepbrain-ai, colossyan, d-id
- **Ensure Featured Triggered?**: false
- **Cap Featured Trimmed?**: false
- **Fallback Featured Deep Dive Triggered?**: false ()
- **Filler Deep Dives**: 

### Tool: fliki
- **Base Intent**: text_to_video
- **Preference Label**: general
- **Top Picks (Final)**: lumen5, pictory, invideo [Featured], runway, sora
- **Deep Dives (Final)**: lumen5, pictory, invideo [Featured], runway, sora, steve-ai
- **Raw Candidates**: pictory, lumen5, descript, opus-clip, runway, sora, veed-io, steve-ai, invideo ...
- **Intent Gated (Before Diversity)**: pictory, lumen5, runway, sora, steve-ai, invideo
- **Diversified (After Diversity)**: lumen5, pictory, runway, sora, steve-ai, opus-clip
- **Featured Preference Order**: heygen, invideo, veed-io, zebracat, synthesia
- **Featured Adjusted Top Picks**: lumen5, pictory, invideo, runway, sora
- **Ensure Featured Triggered?**: true
- **Cap Featured Trimmed?**: false
- **Fallback Featured Deep Dive Triggered?**: true (invideo)
- **Filler Deep Dives**: 

### Tool: veed-io
- **Base Intent**: editor
- **Preference Label**: general
- **Top Picks (Final)**: pictory, descript, opus-clip, flexclip, lumen5
- **Deep Dives (Final)**: pictory, descript, opus-clip, flexclip, lumen5, steve-ai
- **Raw Candidates**: pictory, flexclip, descript, lumen5, opus-clip, steve-ai, d-id ...
- **Intent Gated (Before Diversity)**: pictory, flexclip, descript, lumen5, steve-ai, opus-clip
- **Diversified (After Diversity)**: pictory, descript, flexclip, opus-clip, lumen5, steve-ai
- **Featured Preference Order**: fliki, heygen, invideo, zebracat, synthesia
- **Featured Adjusted Top Picks**: pictory, descript, flexclip, opus-clip, lumen5
- **Ensure Featured Triggered?**: false
- **Cap Featured Trimmed?**: false
- **Fallback Featured Deep Dive Triggered?**: false ()
- **Filler Deep Dives**: 

### Tool: zebracat
- **Base Intent**: text_to_video
- **Preference Label**: general
- **Top Picks (Final)**: lumen5, pictory, fliki [Featured], runway, sora
- **Deep Dives (Final)**: lumen5, pictory, runway, sora, steve-ai, fliki [Featured]
- **Raw Candidates**: pictory, descript, lumen5, opus-clip, runway, sora, veed-io, steve-ai, flexclip, fliki ...
- **Intent Gated (Before Diversity)**: pictory, lumen5, runway, sora, steve-ai, flexclip
- **Diversified (After Diversity)**: lumen5, pictory, runway, sora, steve-ai, fliki
- **Featured Preference Order**: fliki, heygen, invideo, veed-io, synthesia
- **Featured Adjusted Top Picks**: lumen5, pictory, fliki, runway, sora
- **Ensure Featured Triggered?**: true
- **Cap Featured Trimmed?**: false
- **Fallback Featured Deep Dive Triggered?**: false ()
- **Filler Deep Dives**: 

### Tool: synthesia
- **Base Intent**: avatar
- **Preference Label**: general
- **Top Picks (Final)**: heygen [Featured], pictory, deepbrain-ai, colossyan, opus-clip
- **Deep Dives (Final)**: heygen [Featured], pictory, deepbrain-ai, opus-clip, colossyan, synthesys
- **Raw Candidates**: pictory, heygen, descript, deepbrain-ai, colossyan, synthesys, opus-clip, runway, sora, d-id ...
- **Intent Gated (Before Diversity)**: pictory, heygen, deepbrain-ai, colossyan, synthesys, d-id
- **Diversified (After Diversity)**: heygen, pictory, deepbrain-ai, colossyan, opus-clip, synthesys
- **Featured Preference Order**: fliki, heygen, invideo, veed-io, zebracat
- **Featured Adjusted Top Picks**: heygen, pictory, deepbrain-ai, colossyan, opus-clip
- **Ensure Featured Triggered?**: false
- **Cap Featured Trimmed?**: false
- **Fallback Featured Deep Dive Triggered?**: false ()
- **Filler Deep Dives**: 

### Tool: elai-io
- **Base Intent**: avatar
- **Preference Label**: avatar
- **Top Picks (Final)**: heygen [Featured], pictory, synthesia [Featured], deepbrain-ai, colossyan
- **Deep Dives (Final)**: heygen [Featured], pictory, synthesia [Featured], deepbrain-ai, colossyan, synthesys
- **Raw Candidates**: pictory, heygen, synthesia, deepbrain-ai, colossyan, synthesys, d-id ...
- **Intent Gated (Before Diversity)**: pictory, heygen, synthesia, deepbrain-ai, colossyan, synthesys
- **Diversified (After Diversity)**: heygen, pictory, synthesia, deepbrain-ai, colossyan, synthesys
- **Featured Preference Order**: heygen, synthesia, fliki, veed-io, zebracat, invideo
- **Featured Adjusted Top Picks**: heygen, pictory, synthesia, deepbrain-ai, colossyan
- **Ensure Featured Triggered?**: false
- **Cap Featured Trimmed?**: false
- **Fallback Featured Deep Dive Triggered?**: false ()
- **Filler Deep Dives**: 

### Tool: pika
- **Base Intent**: text_to_video
- **Preference Label**: general
- **Top Picks (Final)**: flexclip, pictory, fliki [Featured], runway, steve-ai
- **Deep Dives (Final)**: flexclip, pictory, runway, steve-ai, sora, fliki [Featured]
- **Raw Candidates**: pictory, flexclip, descript, steve-ai, opus-clip, runway, sora, d-id, fliki, veed-io ...
- **Intent Gated (Before Diversity)**: pictory, flexclip, steve-ai, runway, sora, fliki
- **Diversified (After Diversity)**: flexclip, pictory, runway, steve-ai, sora, fliki
- **Featured Preference Order**: fliki, heygen, invideo, veed-io, zebracat, synthesia
- **Featured Adjusted Top Picks**: flexclip, pictory, fliki, runway, steve-ai
- **Ensure Featured Triggered?**: true
- **Cap Featured Trimmed?**: false
- **Fallback Featured Deep Dive Triggered?**: false ()
- **Filler Deep Dives**: 

### Tool: descript
- **Base Intent**: editor
- **Preference Label**: avatar
- **Top Picks (Final)**: veed-io [Featured], invideo [Featured], sora, runway
- **Deep Dives (Final)**: veed-io [Featured], invideo [Featured], sora, runway, pictory
- **Raw Candidates**: invideo, heygen, veed-io, synthesia, runway, sora, pictory, colossyan ...
- **Intent Gated (Before Diversity)**: invideo, veed-io, sora, pictory, runway, heygen
- **Diversified (After Diversity)**: veed-io, invideo, sora, runway, heygen, pictory
- **Featured Preference Order**: heygen, synthesia, fliki, veed-io, zebracat, invideo
- **Featured Adjusted Top Picks**: veed-io, invideo, sora, runway
- **Ensure Featured Triggered?**: false
- **Cap Featured Trimmed?**: true
- **Fallback Featured Deep Dive Triggered?**: false ()
- **Filler Deep Dives**: 

### Tool: opus-clip
- **Base Intent**: repurpose
- **Preference Label**: avatar
- **Top Picks (Final)**: zebracat [Featured], invideo [Featured]
- **Deep Dives (Final)**: zebracat [Featured], invideo [Featured]
- **Raw Candidates**: invideo, heygen, fliki, veed-io, zebracat, synthesia, pika, runway ...
- **Intent Gated (Before Diversity)**: invideo, zebracat, heygen, fliki, veed-io, synthesia
- **Diversified (After Diversity)**: zebracat, invideo, heygen, veed-io, fliki, synthesia
- **Featured Preference Order**: heygen, synthesia, fliki, veed-io, zebracat, invideo
- **Featured Adjusted Top Picks**: zebracat, invideo
- **Ensure Featured Triggered?**: false
- **Cap Featured Trimmed?**: true
- **Fallback Featured Deep Dive Triggered?**: false ()
- **Filler Deep Dives**: 

### Tool: runway
- **Base Intent**: cinematic
- **Preference Label**: avatar
- **Top Picks (Final)**: sora, zebracat [Featured], descript, invideo [Featured]
- **Deep Dives (Final)**: sora, zebracat [Featured], descript, invideo [Featured]
- **Raw Candidates**: invideo, heygen, fliki, zebracat, synthesia, pika, descript, sora ...
- **Intent Gated (Before Diversity)**: invideo, sora, fliki, zebracat, pika, descript
- **Diversified (After Diversity)**: sora, invideo, zebracat, descript, fliki, heygen
- **Featured Preference Order**: heygen, synthesia, fliki, veed-io, zebracat, invideo
- **Featured Adjusted Top Picks**: sora, invideo, zebracat, descript
- **Ensure Featured Triggered?**: false
- **Cap Featured Trimmed?**: true
- **Fallback Featured Deep Dive Triggered?**: false ()
- **Filler Deep Dives**: 

### Tool: sora
- **Base Intent**: text_to_video
- **Preference Label**: avatar
- **Top Picks (Final)**: invideo [Featured], fliki [Featured], pika, runway
- **Deep Dives (Final)**: invideo [Featured], fliki [Featured], pika, runway
- **Raw Candidates**: invideo, heygen, fliki, zebracat, synthesia, pika, descript, runway ...
- **Intent Gated (Before Diversity)**: invideo, fliki, zebracat, pika, runway, heygen
- **Diversified (After Diversity)**: invideo, fliki, zebracat, pika, runway, heygen
- **Featured Preference Order**: heygen, synthesia, fliki, veed-io, zebracat, invideo
- **Featured Adjusted Top Picks**: invideo, fliki, pika, runway
- **Ensure Featured Triggered?**: false
- **Cap Featured Trimmed?**: true
- **Fallback Featured Deep Dive Triggered?**: false ()
- **Filler Deep Dives**: 

### Tool: pictory
- **Base Intent**: editor
- **Preference Label**: avatar
- **Top Picks (Final)**: veed-io [Featured], invideo [Featured], descript
- **Deep Dives (Final)**: veed-io [Featured], invideo [Featured], descript, opus-clip
- **Raw Candidates**: invideo, fliki, veed-io, zebracat, synthesia, pika, descript, opus-clip ...
- **Intent Gated (Before Diversity)**: invideo, fliki, veed-io, zebracat, descript, pika
- **Diversified (After Diversity)**: veed-io, invideo, fliki, zebracat, descript, opus-clip
- **Featured Preference Order**: heygen, synthesia, fliki, veed-io, zebracat, invideo
- **Featured Adjusted Top Picks**: veed-io, invideo, descript
- **Ensure Featured Triggered?**: false
- **Cap Featured Trimmed?**: true
- **Fallback Featured Deep Dive Triggered?**: false ()
- **Filler Deep Dives**: 

### Tool: colossyan
- **Base Intent**: avatar
- **Preference Label**: avatar
- **Top Picks (Final)**: heygen [Featured], synthesia [Featured], elai-io, d-id, pika
- **Deep Dives (Final)**: heygen [Featured], synthesia [Featured], elai-io, d-id, pika, runway
- **Raw Candidates**: heygen, synthesia, elai-io, pika, descript, runway, sora, d-id ...
- **Intent Gated (Before Diversity)**: heygen, synthesia, elai-io, d-id, pika, runway
- **Diversified (After Diversity)**: heygen, synthesia, elai-io, d-id, pika, runway
- **Featured Preference Order**: heygen, synthesia, fliki, veed-io, zebracat, invideo
- **Featured Adjusted Top Picks**: heygen, synthesia, elai-io, d-id, pika
- **Ensure Featured Triggered?**: false
- **Cap Featured Trimmed?**: false
- **Fallback Featured Deep Dive Triggered?**: false ()
- **Filler Deep Dives**: 

### Tool: d-id
- **Base Intent**: avatar
- **Preference Label**: avatar
- **Top Picks (Final)**: heygen [Featured], synthesia [Featured], elai-io, colossyan, deepbrain-ai
- **Deep Dives (Final)**: heygen [Featured], synthesia [Featured], elai-io, colossyan, deepbrain-ai
- **Raw Candidates**: invideo, heygen, veed-io, synthesia, elai-io, pika, colossyan, deepbrain-ai ...
- **Intent Gated (Before Diversity)**: heygen, synthesia, elai-io, colossyan, deepbrain-ai, invideo
- **Diversified (After Diversity)**: heygen, synthesia, elai-io, colossyan, deepbrain-ai, invideo
- **Featured Preference Order**: heygen, synthesia, fliki, veed-io, zebracat, invideo
- **Featured Adjusted Top Picks**: heygen, synthesia, elai-io, colossyan, deepbrain-ai
- **Ensure Featured Triggered?**: false
- **Cap Featured Trimmed?**: true
- **Fallback Featured Deep Dive Triggered?**: false ()
- **Filler Deep Dives**: 

### Tool: deepbrain-ai
- **Base Intent**: avatar
- **Preference Label**: avatar
- **Top Picks (Final)**: heygen [Featured], synthesia [Featured], elai-io, colossyan
- **Deep Dives (Final)**: heygen [Featured], synthesia [Featured], elai-io, colossyan, runway
- **Raw Candidates**: heygen, zebracat, synthesia, elai-io, descript, runway, sora, colossyan ...
- **Intent Gated (Before Diversity)**: heygen, synthesia, elai-io, colossyan, zebracat, runway
- **Diversified (After Diversity)**: heygen, synthesia, elai-io, zebracat, colossyan, runway
- **Featured Preference Order**: heygen, synthesia, fliki, veed-io, zebracat, invideo
- **Featured Adjusted Top Picks**: heygen, synthesia, elai-io, colossyan
- **Ensure Featured Triggered?**: false
- **Cap Featured Trimmed?**: true
- **Fallback Featured Deep Dive Triggered?**: false ()
- **Filler Deep Dives**: 

### Tool: synthesys
- **Base Intent**: avatar
- **Preference Label**: avatar
- **Top Picks (Final)**: heygen [Featured], synthesia [Featured], elai-io, colossyan
- **Deep Dives (Final)**: heygen [Featured], synthesia [Featured], elai-io, colossyan, runway
- **Raw Candidates**: heygen, zebracat, synthesia, elai-io, descript, runway, sora, colossyan ...
- **Intent Gated (Before Diversity)**: heygen, synthesia, elai-io, colossyan, zebracat, runway
- **Diversified (After Diversity)**: heygen, synthesia, elai-io, zebracat, colossyan, runway
- **Featured Preference Order**: heygen, synthesia, fliki, veed-io, zebracat, invideo
- **Featured Adjusted Top Picks**: heygen, synthesia, elai-io, colossyan
- **Ensure Featured Triggered?**: false
- **Cap Featured Trimmed?**: true
- **Fallback Featured Deep Dive Triggered?**: false ()
- **Filler Deep Dives**: 

### Tool: flexclip
- **Base Intent**: editor
- **Preference Label**: avatar
- **Top Picks (Final)**: veed-io [Featured], zebracat [Featured], descript, pika
- **Deep Dives (Final)**: veed-io [Featured], zebracat [Featured], descript, pika, pictory
- **Raw Candidates**: invideo, veed-io, zebracat, synthesia, pika, descript, pictory, d-id ...
- **Intent Gated (Before Diversity)**: invideo, veed-io, zebracat, descript, pictory, pika
- **Diversified (After Diversity)**: veed-io, zebracat, invideo, descript, pika, pictory
- **Featured Preference Order**: heygen, synthesia, fliki, veed-io, zebracat, invideo
- **Featured Adjusted Top Picks**: veed-io, zebracat, descript, pika
- **Ensure Featured Triggered?**: false
- **Cap Featured Trimmed?**: true
- **Fallback Featured Deep Dive Triggered?**: false ()
- **Filler Deep Dives**: 

### Tool: lumen5
- **Base Intent**: text_to_video
- **Preference Label**: avatar
- **Top Picks (Final)**: invideo [Featured], fliki [Featured], pika
- **Deep Dives (Final)**: invideo [Featured], fliki [Featured], pika, opus-clip
- **Raw Candidates**: invideo, heygen, fliki, veed-io, zebracat, pika, descript, opus-clip ...
- **Intent Gated (Before Diversity)**: invideo, fliki, zebracat, pika, heygen, opus-clip
- **Diversified (After Diversity)**: invideo, fliki, zebracat, pika, heygen, opus-clip
- **Featured Preference Order**: heygen, synthesia, fliki, veed-io, zebracat, invideo
- **Featured Adjusted Top Picks**: invideo, fliki, pika
- **Ensure Featured Triggered?**: false
- **Cap Featured Trimmed?**: true
- **Fallback Featured Deep Dive Triggered?**: false ()
- **Filler Deep Dives**: 

### Tool: steve-ai
- **Base Intent**: text_to_video
- **Preference Label**: avatar
- **Top Picks (Final)**: invideo [Featured], fliki [Featured], pika, runway
- **Deep Dives (Final)**: invideo [Featured], fliki [Featured], pika, runway, sora
- **Raw Candidates**: invideo, heygen, fliki, veed-io, zebracat, pika, runway, sora ...
- **Intent Gated (Before Diversity)**: invideo, fliki, zebracat, pika, runway, sora
- **Diversified (After Diversity)**: invideo, fliki, zebracat, pika, runway, sora
- **Featured Preference Order**: heygen, synthesia, fliki, veed-io, zebracat, invideo
- **Featured Adjusted Top Picks**: invideo, fliki, pika, runway
- **Ensure Featured Triggered?**: false
- **Cap Featured Trimmed?**: true
- **Fallback Featured Deep Dive Triggered?**: false ()
- **Filler Deep Dives**: 

