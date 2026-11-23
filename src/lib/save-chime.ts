// Start the audio context during the Save gesture so mobile browsers can unlock it.
export async function chimeOnSave(request: Promise<Response>) {
  let audio: AudioContext | undefined;
  try {
    audio = new AudioContext();
    const ready = audio.resume().catch(() => {});
    if (!(await request).ok) return;
    await ready;
    if (audio.state !== "running" || document.hidden) return;

    const tone = audio.createOscillator();
    const gain = audio.createGain();
    tone.connect(gain).connect(audio.destination);

    // Two quiet sine notes with a short attack and a soft tail.
    const start = audio.currentTime;
    for (const [offset, frequency, peak, decay] of [
      [0, 523.25, 0.095, 0.14],
      [0.15, 659.25, 0.075, 0.33],
    ]) {
      const at = start + offset;
      tone.frequency.setValueAtTime(frequency, at);
      gain.gain.setValueAtTime(0, at);
      gain.gain.linearRampToValueAtTime(peak, at + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + decay);
    }
    const ended = new Promise<void>((resolve) => { tone.onended = () => resolve(); });
    tone.start(start);
    tone.stop(start + 0.5);
    await ended;
  } catch {
    // Audio support and playback permissions are optional.
  } finally {
    void audio?.close().catch(() => {});
  }
}
