declare namespace World {}

// Server perspective - events sent to socket server
declare namespace ServerOut {
  interface ToSocket {
    // Cron
    ['cron.register-event']: (id: string, data: CronData) => void;
  }

  interface ToClient {}
}
