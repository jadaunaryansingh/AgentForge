export interface ParsedSseEvent {
  event: string;
  data: string;
}

/** Parse SSE blocks (event + data lines). Supports multi-line data payloads. */
export const parseSseBlock = (block: string): ParsedSseEvent | null => {
  const trimmed = block.trim();
  if (!trimmed) return null;

  let eventName = 'message';
  const dataLines: string[] = [];

  for (const line of trimmed.split('\n')) {
    if (line.startsWith('event:')) {
      eventName = line.slice(6).trim();
    } else if (line.startsWith('data:')) {
      dataLines.push(line.slice(5).trimStart());
    }
  }

  if (dataLines.length === 0) return null;
  return { event: eventName, data: dataLines.join('\n') };
};
