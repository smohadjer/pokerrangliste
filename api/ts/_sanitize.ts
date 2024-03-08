export const sanitize = (item) => {
  if (item && typeof item === 'string') {
    return item.trim();
  } else {
    return item;
  }
};
