export const isNullOrBlank = (value: string | null | undefined) => {
  return !value || value.trim() === "";
};
