export default function debounce<T extends (...args: any[]) => void>(fn: T, wait = 0) {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  return (...args: Parameters<T>): void => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => {
      fn(...args);
    }, wait);
  };
}
