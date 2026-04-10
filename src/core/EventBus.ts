export type EventHandler<T = unknown> = (payload: T) => void;

export class EventBus {
  private listeners = new Map<string, EventHandler[]>();

  on<T = unknown>(event: string, handler: EventHandler<T>): void {
    const handlers = this.listeners.get(event) ?? [];
    handlers.push(handler as EventHandler);
    this.listeners.set(event, handlers);
  }

  off<T = unknown>(event: string, handler: EventHandler<T>): void {
    const handlers = this.listeners.get(event);
    if (!handlers) return;
    const idx = handlers.indexOf(handler as EventHandler);
    if (idx !== -1) handlers.splice(idx, 1);
  }

  emit<T = unknown>(event: string, payload: T): void {
    const handlers = this.listeners.get(event);
    if (!handlers) return;
    for (const handler of handlers) {
      handler(payload);
    }
  }

  clear(): void {
    this.listeners.clear();
  }
}
