const rawFlag = (() => {
  try {
    const metaEnv = (import.meta as any)?.env ?? {};
    const fromMeta = metaEnv.VITE_NEW_PUBLISH_FLOW ?? metaEnv.NEW_PUBLISH_FLOW;
    if (typeof fromMeta === 'string') return fromMeta;
    if (typeof fromMeta === 'boolean') return fromMeta ? 'true' : 'false';
  } catch {
    // noop - import.meta may not exist in non-browser contexts
  }

  if (typeof process !== 'undefined' && process?.env) {
    const fromProcess = process.env.NEW_PUBLISH_FLOW ?? process.env.VITE_NEW_PUBLISH_FLOW;
    if (typeof fromProcess === 'string') return fromProcess;
  }

  return 'false';
})();

const normalised = String(rawFlag).trim().toLowerCase();

export const NEW_PUBLISH_FLOW_ENABLED = normalised === 'true' || normalised === '1';

export function isNewPublishFlowEnabled(): boolean {
  return NEW_PUBLISH_FLOW_ENABLED;
}
