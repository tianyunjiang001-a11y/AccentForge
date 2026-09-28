import type { Accent, Voice } from "../types";

const accentFrequencies: Record<Accent, number> = {
  British: 392,
  American: 440,
  Australian: 494,
  Canadian: 523,
};

function writeAscii(view: DataView, offset: number, value: string) {
  for (let index = 0; index < value.length; index += 1) {
    view.setUint8(offset + index, value.charCodeAt(index));
  }
}

export function createMockAudioUrl(accent: Accent, voice: Voice) {
  const sampleRate = 12_000;
  const durationSeconds = 1.6;
  const sampleCount = Math.floor(sampleRate * durationSeconds);
  const bytesPerSample = 2;
  const dataLength = sampleCount * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataLength);
  const view = new DataView(buffer);
  const baseFrequency = accentFrequencies[accent];
  const voiceFactor = voice === "Female" ? 1.12 : 0.84;

  writeAscii(view, 0, "RIFF");
  view.setUint32(4, 36 + dataLength, true);
  writeAscii(view, 8, "WAVE");
  writeAscii(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * bytesPerSample, true);
  view.setUint16(32, bytesPerSample, true);
  view.setUint16(34, 16, true);
  writeAscii(view, 36, "data");
  view.setUint32(40, dataLength, true);

  for (let index = 0; index < sampleCount; index += 1) {
    const time = index / sampleRate;
    const envelope = Math.sin(Math.PI * (index / sampleCount)) ** 2;
    const phrase = index < sampleCount / 2 ? 1 : 1.25;
    const sample =
      Math.sin(2 * Math.PI * baseFrequency * voiceFactor * phrase * time) *
      envelope *
      0.1;
    view.setInt16(44 + index * bytesPerSample, sample * 0x7fff, true);
  }

  return URL.createObjectURL(new Blob([buffer], { type: "audio/wav" }));
}
