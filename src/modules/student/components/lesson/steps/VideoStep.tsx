export function VideoStep({ url, title }: { url: string; title: string }) {
  return (
    <div className="aspect-video w-full overflow-hidden rounded-card bg-ink">
      <iframe src={url} title={title} className="h-full w-full" allow="accelerometer; encrypted-media; picture-in-picture" allowFullScreen />
    </div>
  );
}
