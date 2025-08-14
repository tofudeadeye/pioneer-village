const EventBus = {
  on<T>(event: string, callback: (e: T) => void) {
    const handler = (e: Event) => {
      // For native DOM events like keyup, pass the event directly
      // For custom events, pass the detail
      if (e instanceof CustomEvent) {
        callback(e.detail as T);
      } else {
        callback(e as unknown as T);
      }
    };
    window.addEventListener(event, handler);
    // Store the handler so we can remove it later
    (callback as any).__eventBusHandler = handler;
  },
  dispatch<T>(event: string, data?: T) {
    document.dispatchEvent(new CustomEvent<T>(event, { detail: data }));
  },
  off(event: string, callback: (e: unknown) => void) {
    const handler = (callback as any).__eventBusHandler;
    if (handler) {
      window.removeEventListener(event, handler);
      delete (callback as any).__eventBusHandler;
    }
  },
};
export default EventBus;
