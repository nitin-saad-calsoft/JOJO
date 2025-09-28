// ffmpegHelper.ts
import * as FFmpeg from "@ffmpeg/ffmpeg";

const { createFFmpeg, fetchFile } = FFmpeg;

const ffmpeg = createFFmpeg({ log: true });

export async function makeVideo(frames: string[], audioPath: string) {
  if (!ffmpeg.isLoaded()) {
    await ffmpeg.load();
  }

  // Write frames into FFmpeg virtual FS
  for (let i = 0; i < frames.length; i++) {
    const fileName = `frame-${String(i).padStart(3, "0")}.jpg`;
    ffmpeg.FS("writeFile", fileName, await fetchFile(frames[i]));
  }

  // Write audio
  ffmpeg.FS("writeFile", "audio.mp3", await fetchFile(audioPath));

  // Run FFmpeg to create mp4
  await ffmpeg.run(
    "-framerate", "30",
    "-i", "frame-%03d.jpg",
    "-i", "audio.mp3",
    "-c:v", "libx264",
    "-pix_fmt", "yuv420p",
    "-shortest",
    "output.mp4"
  );

  // Get result as Uint8Array
  const data = ffmpeg.FS("readFile", "output.mp4");

  // Convert to Blob URL (for preview or download)
  const videoUrl = URL.createObjectURL(
    new Blob([data.buffer], { type: "video/mp4" })
  );

  return videoUrl;
}
