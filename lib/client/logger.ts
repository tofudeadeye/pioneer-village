import { emitUI } from '@lib/client/comms/ui';

const consoleLog = console.log;

let LOG_METHOD: 'console' | 'ui' | 'both' | string = 'ui';

const DEV_ENV = true;
console.log = (...messages: any[]) => {
  if (!DEV_ENV) return;

  if (LOG_METHOD === 'both' || LOG_METHOD === 'console') {
    consoleLog(...messages);
  }

  if (LOG_METHOD === 'both' || LOG_METHOD === 'ui') {
    emitUI('log.message', {
      resource: GetCurrentResourceName(),
      message: messages
        .map((item) => {
          if (typeof item === 'object') {
            if (
              item &&
              'toString' in item &&
              typeof item.toString === 'function' &&
              item.toString() !== '[object Object]'
            ) {
              return item.toString();
            }
            return JSON.stringify(item, null, 2);
          }
          return item;
        })
        .join(' '),
    });
  }
};
