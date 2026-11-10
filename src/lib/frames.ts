export interface ExtractedFrame {
  id: string;
  timeSec: number;
  dataUrl: string;
}

const seekTo = (v: HTMLVideoElement, t: number) =>
  new Promise<void>((resolve) => {
    const done = () => {
      v.removeEventListener('seeked', done);
      clearTimeout(timer);
      resolve();
    };
    const timer = setTimeout(done, 8000);
    v.addEventListener('seeked', done);
    v.currentTime = t;
  });

/**
 * Takes `count` random frames from a video, in the browser.
 * The video is split into `count` equal segments and one random moment is picked inside each,
 * so frames are random but never bunched together. Shorter videos give fewer frames (about one per second).
 */
export async function extractRandomFrames(src: string, count = 10, maxWidth = 640): Promise<{ frames: ExtractedFrame[]; duration: number }> {
  const video = document.createElement('video');
  video.muted = true;
  video.playsInline = true;
  video.preload = 'auto';
  if (!src.startsWith('data:') && !src.startsWith('blob:')) video.crossOrigin = 'anonymous';
  video.src = src;

  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('The video took too long to load.')), 25000);
    video.onloadedmetadata = () => {
      clearTimeout(timer);
      resolve();
    };
    video.onerror = () => {
      clearTimeout(timer);
      reject(new Error('This video could not be opened. Try an MP4 file.'));
    };
  });

  const duration = video.duration;
  if (!isFinite(duration) || duration <= 0) throw new Error('This video has no readable length.');

  const vw = video.videoWidth || 640;
  const vh = video.videoHeight || 360;
  const w = Math.min(maxWidth, vw);
  const h = Math.round((w * vh) / vw);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Your browser cannot read video frames.');

  const n = Math.max(1, Math.min(count, Math.floor(duration)));
  const seg = duration / n;
  const frames: ExtractedFrame[] = [];
  for (let i = 0; i < n; i++) {
    const t = Math.min(duration - 0.05, Math.max(0.05, seg * i + Math.random() * seg));
    await seekTo(video, t);
    ctx.drawImage(video, 0, 0, w, h);
    let dataUrl: string;
    try {
      dataUrl = canvas.toDataURL('image/jpeg', 0.72);
    } catch {
      throw new Error('The browser blocked reading frames from this video link. Upload the video file instead.');
    }
    frames.push({ id: `frame-${Date.now()}-${i}`, timeSec: Math.round(t * 10) / 10, dataUrl });
  }
  video.removeAttribute('src');
  video.load();
  return { frames, duration };
}
