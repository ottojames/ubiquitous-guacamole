export async function getWithDevFallback(pathWithQuery: string, signal?: AbortSignal) {
  const relUrl = `${pathWithQuery.startsWith("/") ? "" : "/"}${pathWithQuery}`;
  try {
    const response = await fetch(relUrl, { signal });
    return { response, url: relUrl, via: "relative" as const };
  } catch (error) {
    if ((error as any)?.name === "AbortError") throw error;
    const direct = `http://localhost:5174${relUrl}`;
    try {
      const response = await fetch(direct, { signal });
      return { response, url: direct, via: "direct" as const };
    } catch (directError) {
      if ((directError as any)?.name === "AbortError") throw directError;
      (directError as any).url = direct;
      (directError as any).via = "direct";
      throw directError;
    }
  }
}
