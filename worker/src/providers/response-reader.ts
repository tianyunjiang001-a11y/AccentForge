/** Bound untrusted upstream payloads before allocating the full response. */
export async function readProviderText(response: Response, maxBytes: number) {
  if (!response.body) throw new Error("Empty upstream response");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let received = 0;
  let result = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      received += value.byteLength;
      if (received > maxBytes) {
        void reader.cancel();
        throw new Error("Upstream response too large");
      }
      result += decoder.decode(value, { stream: true });
    }
    result += decoder.decode();
    return result;
  } finally {
    reader.releaseLock();
  }
}
