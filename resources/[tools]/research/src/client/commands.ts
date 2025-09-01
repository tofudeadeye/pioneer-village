RegisterCommand(
  'compare_config_flag',
  async (source: number, args: any[], rawCommand: string) => {
    // Log({ source, args, rawCommand });

    const pedOne = Number(args[0]);
    const pedTwo = Number(args[1]);

    for (let i = 1000; i--; ) {
      const flagOne = GetPedConfigFlag(pedOne, i, true);
      const flagTwo = GetPedConfigFlag(pedTwo, i, true);

      if (flagOne !== flagTwo) {
        console.log(`Flag ${i} differs: PedOne=${flagOne}, PedTwo=${flagTwo}`);
      }
    }
  },
  false,
);
