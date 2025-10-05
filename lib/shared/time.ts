export const Minutes = (minutes: number): number => {
  return 60 * minutes;
};

export const Hours = (hours: number): number => {
  return Minutes(60 * hours);
};

export const Days = (days: number): number => {
  return Hours(24 * days);
};

export const Weeks = (weeks: number): number => {
  return Days(7 * weeks);
};

export const Months = (months: number): number => {
  return Weeks(4 * months);
};

export const GetSeconds = (ms: number): number => {
  return Math.floor(ms / 1000);
};

export const GetMinutes = (ms: number): number => {
  return Math.floor(ms / (1000 * 60));
};

export const GetHours = (ms: number): number => {
  return Math.floor(ms / (1000 * 60 * 60));
};

export const GetDays = (ms: number): number => {
  return Math.floor(ms / (1000 * 60 * 60 * 24));
};

export const GetWeeks = (ms: number): number => {
  return Math.floor(ms / (1000 * 60 * 60 * 24 * 7));
};

export const GetMonths = (ms: number): number => {
  return Math.floor(ms / (1000 * 60 * 60 * 24 * 30));
};
