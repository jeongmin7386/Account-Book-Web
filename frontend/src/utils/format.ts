export const formatCurrency = (value: number) =>
  new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0,
  }).format(value || 0);

export const formatNumber = (value: number) =>
  new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 0 }).format(value || 0);

export const todayISO = () => new Date().toISOString().slice(0, 10);

export const currentMonth = () => new Date().toISOString().slice(0, 7);
