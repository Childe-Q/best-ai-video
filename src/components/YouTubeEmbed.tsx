'use client';

type YouTubeEmbedProps = {
  videoUrl: string;
  title?: string;
};

/**
 * Extracts YouTube video ID from various URL formats:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 */
function extractVideoId(url: string): string | null {
  if (!url) return null;

  // Handle youtu.be short links
  const youtuBeMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
  if (youtuBeMatch) return youtuBeMatch[1];

  // Handle youtube.com/watch?v= format
  const watchMatch = url.match(/[?&]v=([a-zA-Z0-9_-]+)/);
  if (watchMatch) return watchMatch[1];

  // Handle youtube.com/embed/ format
  const embedMatch = url.match(/\/embed\/([a-zA-Z0-9_-]+)/);
  if (embedMatch) return embedMatch[1];

  return null;
}

export default function YouTubeEmbed({ videoUrl, title }: YouTubeEmbedProps) {
  const videoId = extractVideoId(videoUrl);

  if (!videoId) {
    return null;
  }

  const embedUrl = `https://www.youtube.com/embed/${videoId}`;

  return (
    <div className="w-full aspect-video rounded-lg overflow-hidden bg-gray-100 shadow-sm">
      <iframe
        src={embedUrl}
        title={title || 'YouTube video player'}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        className="w-full h-full"
      />
    </div>
  );
}

