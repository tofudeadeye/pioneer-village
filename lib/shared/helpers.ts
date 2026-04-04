export const OnResourceStop = (callback: () => void) => {
  on('onResourceStop', (resource: string) => {
    if (resource !== GetCurrentResourceName()) {
      return;
    }
    callback();
  });
};
