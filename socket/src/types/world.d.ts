// Socket perspective - what the socket server receives
declare namespace SocketIn {
  interface FromClient {
    'world.request-sync': () => void;
    'world.update-state': (name: string, patch: Record<string, unknown>) => void;
    'world.update-transform': (name: string, coords: Vector3Format, rotation: Vector3Format) => void;
  }
}

// Socket perspective - what the socket server sends
declare namespace SocketOut {
  interface ToClient {
    // Forwarded through the generic `__client__` pattern:
    // 'world.track-object', 'world.untrack-object', 'world.state-changed', 'world.transform-changed'

    // Cron Events
    'world.geyser-show': (data: World.GeyserShowSteps) => void;
    'world.meteor-shower': () => void;
  }
}
