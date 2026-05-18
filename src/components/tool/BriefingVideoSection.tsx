import YouTubeEmbed from '@/components/YouTubeEmbed';

type BriefingVideo = {
  title: string;
  description?: string;
  url: string;
  duration?: string;
  provider?: 'local' | 'youtube' | 'cdn';
  posterUrl?: string;
  sourceNote: string;
  disclaimer: string;
};

export default function BriefingVideoSection({ video }: { video: BriefingVideo }) {
  const provider = video.provider ?? 'local';

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-[11px] font-black uppercase tracking-[0.16em] text-gray-500">Briefing video</p>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
          AI-generated
        </span>
        {video.duration ? (
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
            {video.duration}
          </span>
        ) : null}
      </div>
      <h2 className="mt-2 text-2xl font-bold text-gray-900">{video.title}</h2>
      {video.description ? (
        <p className="mt-3 max-w-3xl text-sm leading-7 text-gray-600">{video.description}</p>
      ) : null}
      <div className="mt-5 max-w-4xl overflow-hidden rounded-2xl border border-slate-200 bg-slate-950">
        {provider === 'youtube' ? (
          <YouTubeEmbed videoUrl={video.url} title={video.title} />
        ) : (
          <video
            className="aspect-video w-full"
            controls
            preload="metadata"
            playsInline
            poster={video.posterUrl}
          >
            <source src={video.url} type="video/mp4" />
            Your browser does not support embedded video playback.
          </video>
        )}
      </div>
      <div className="mt-4 grid gap-2 text-sm leading-6 text-slate-600 sm:grid-cols-2">
        <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
          AI-generated briefing based on official source materials
        </p>
        <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-medium text-slate-700">
          Not a hands-on test
        </p>
      </div>
    </div>
  );
}
