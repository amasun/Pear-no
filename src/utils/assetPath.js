export const withBase = (path) => {
  const base = import.meta.env.BASE_URL || '/';
  return `${base}${String(path).replace(/^\/+/, '')}`;
};
