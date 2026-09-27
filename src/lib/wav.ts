// Gemini TTS audio handling.
//
// Historically the TTS models returned headerless raw PCM (audio/L16), so we
// prepended a WAV header ourselves. Newer TTS models (e.g. gemini-3.8-flash-tts)
// return a complete `audio/wav` payload with a RIFF header already present —
// wrapping that again produces a corrupt file that the browser refuses to play.

/** True when the decoded bytes already start with a RIFF/WAVE container. */
export function isWavPayload(base64: string): boolean {
  if (base64.length < 12) return false;
  const head = Buffer.from(base64.slice(0, 16), "base64");
  return (
    head.length >= 12 &&
    head.toString("ascii", 0, 4) === "RIFF" &&
    head.toString("ascii", 8, 12) === "WAVE"
  );
}

/** Wraps raw PCM16 little-endian audio in a WAV header. */
export function pcmBase64ToWavBase64(
  pcmBase64: string,
  sampleRate = 24000,
  channels = 1,
  bitsPerSample = 16,
): string {
  const pcmBuffer = Buffer.from(pcmBase64, "base64");
  const byteRate = (sampleRate * channels * bitsPerSample) / 8;
  const blockAlign = (channels * bitsPerSample) / 8;
  const dataSize = pcmBuffer.length;
  const header = Buffer.alloc(44);

  header.write("RIFF", 0, "ascii");
  header.writeUInt32LE(36 + dataSize, 4);
  header.write("WAVE", 8, "ascii");
  header.write("fmt ", 12, "ascii");
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write("data", 36, "ascii");
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, pcmBuffer]).toString("base64");
}

/**
 * Returns browser-playable WAV base64, only adding a header when the payload is
 * still raw PCM.
 */
export function toPlayableWavBase64(
  base64: string,
  mimeType?: string,
): { audioBase64: string; mimeType: string } {
  if (isWavPayload(base64) || (mimeType ?? "").includes("wav")) {
    return { audioBase64: base64, mimeType: "audio/wav" };
  }
  return {
    audioBase64: pcmBase64ToWavBase64(base64),
    mimeType: "audio/wav",
  };
}
