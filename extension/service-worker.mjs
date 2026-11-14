const DEFAULT_TITLE = "Toggle X-ray Inspector on this page";
const FAILURE_TITLE = "X-ray cannot inspect this browser-managed or restricted page";

async function setFailureFeedback(tabId, api, schedule) {
  await Promise.all([
    api.action.setBadgeBackgroundColor({ tabId, color: '#9b1c1c' }),
    api.action.setBadgeText({ tabId, text: 'NO' }),
    api.action.setTitle({ tabId, title: FAILURE_TITLE }),
  ]);
  schedule(() => {
    void api.action.setBadgeText({ tabId, text: '' });
    void api.action.setTitle({ tabId, title: DEFAULT_TITLE });
  }, 3000);
}

/** Inject only after a toolbar click; the default target is the isolated main frame. */
export async function activateXRay(tab, api = globalThis.chrome, schedule = setTimeout) {
  if (!Number.isInteger(tab?.id)) return { ok: false, reason: 'missing-tab' };

  try {
    const results = await api.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js'],
    });
    await Promise.all([
      api.action.setBadgeText({ tabId: tab.id, text: '' }),
      api.action.setTitle({ tabId: tab.id, title: DEFAULT_TITLE }),
    ]);
    return { ok: true, state: results?.[0]?.result ?? 'unknown' };
  } catch {
    await setFailureFeedback(tab.id, api, schedule);
    return { ok: false, reason: 'injection-denied' };
  }
}

globalThis.chrome?.action?.onClicked.addListener((tab) => {
  void activateXRay(tab);
});
