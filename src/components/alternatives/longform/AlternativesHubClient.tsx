'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';

type ToolEntry = {
  name: string;
  slug: string;
  href: string;
  summary: string;
};

type TopicEntry = {
  title: string;
  slug: string;
  href: string;
  intro: string;
};

interface AlternativesHubClientProps {
  tools: ToolEntry[];
  topics: TopicEntry[];
}

export default function AlternativesHubClient({ tools, topics }: AlternativesHubClientProps) {
  const [query, setQuery] = useState('');

  const normalized = query.trim().toLowerCase();

  const filteredTools = useMemo(() => {
    if (!normalized) return tools;
    return tools.filter((tool) => {
      const text = `${tool.name} ${tool.summary} ${tool.slug}`.toLowerCase();
      return text.includes(normalized);
    });
  }, [normalized, tools]);

  const filteredTopics = useMemo(() => {
    if (!normalized) return topics;
    return topics.filter((topic) => {
      const text = `${topic.title} ${topic.intro} ${topic.slug}`.toLowerCase();
      return text.includes(normalized);
    });
  }, [normalized, topics]);

  return (
    <div className="w-full bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-10 md:py-14 space-y-10">
        <header className="rounded-2xl border border-slate-200 bg-white px-6 py-7">
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900">Alternatives Hub</h1>
          <p className="text-slate-700 mt-3 max-w-[80ch]">
            Find alternatives by exact tool or by workflow topic. One template, consistent decision flow.
          </p>
          <div className="mt-5">
            <label htmlFor="alt-search" className="block text-sm font-semibold text-slate-800 mb-2">
              Search by tool or topic
            </label>
            <input
              id="alt-search"
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="e.g. InVideo, budget video, team collaboration"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20"
            />
          </div>
        </header>

        <section className="space-y-3">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900">By Tool</h2>
          <p className="text-sm text-slate-700">Top tool-level alternatives pages.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTools.map((tool) => (
              <Link
                key={tool.slug}
                href={tool.href}
                className="rounded-xl border border-slate-200 bg-white p-4 hover:border-slate-400 transition-colors"
              >
                <h3 className="text-lg font-bold text-slate-900">{tool.name} alternatives</h3>
                <p className="text-sm text-slate-700 mt-2">{tool.summary}</p>
              </Link>
            ))}
          </div>
          {filteredTools.length === 0 && (
            <p className="text-sm text-slate-600">No matching tool pages.</p>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900">By Topic</h2>
          <p className="text-sm text-slate-700">Start from workflow intent, including tools not listed in our directory.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTopics.map((topic) => (
              <Link
                key={topic.slug}
                href={topic.href}
                className="rounded-xl border border-slate-200 bg-white p-4 hover:border-slate-400 transition-colors"
              >
                <h3 className="text-lg font-bold text-slate-900">{topic.title}</h3>
                <p className="text-sm text-slate-700 mt-2">{topic.intro}</p>
              </Link>
            ))}
          </div>
          {filteredTopics.length === 0 && (
            <p className="text-sm text-slate-600">No matching topic pages.</p>
          )}
        </section>
      </div>
    </div>
  );
}
