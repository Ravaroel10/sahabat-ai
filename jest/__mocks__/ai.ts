/**
 * Jest mock for the `ai` package.
 *
 * The real `ai` package ships ESM-only and `jsdom` (the default Jest
 * environment in this project) does not expose a global `Response`,
 * so any test that imports `ai` directly throws
 *   SyntaxError: Cannot use import statement outside a module
 *   ReferenceError: Response is not defined
 * This shim implements just the symbols our unit tests touch
 * (`createUIMessageStream`, `createUIMessageStreamResponse`) with a
 * minimal CommonJS-compatible, duck-typed surface.
 *
 * The returned "Response" object intentionally avoids the real Web
 * `Response` class so tests run in any environment (Node, jsdom,
 * happy-dom) without polyfills. Tests assert on `.status` and `.text()`
 * properties, both of which we expose.
 */

type StreamEvent =
  | { type: 'text-start'; id: string }
  | { type: 'text-delta'; id: string; delta: string }
  | { type: 'text-end'; id: string }
  | { type: 'finish'; finishReason: string };

class MockUIStreamWriter {
  public events: StreamEvent[] = [];
  write(event: StreamEvent) {
    this.events.push(event);
  }
}

export function createUIMessageStream({
  execute,
}: {
  execute: ({
    writer,
  }: {
    writer: MockUIStreamWriter;
  }) => void | Promise<void>;
}) {
  const writer = new MockUIStreamWriter();
  return {
    writer,
    run: async () => {
      await execute({ writer });
      return writer.events;
    },
  };
}

export function createUIMessageStreamResponse({
  stream,
}: {
  stream: { run: () => Promise<StreamEvent[]> };
}) {
  // Pre-materialize the stream so `.text()` on the returned duck-typed
  // object resolves to the same JSON-encoded event list each call.
  const recordedPromise: Promise<string> = stream
    .run()
    .then((events) => events.map((e) => JSON.stringify(e)).join('\n'));
  return {
    status: 200,
    headers: {
      get: (_name: string): string | null => 'text/plain; charset=utf-8',
    },
    text: async (): Promise<string> => {
      return recordedPromise;
    },
  };
}
