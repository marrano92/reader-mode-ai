// Background service worker: provider calls and message routing arrive in Fetta 5.
// The echo handler keeps a working message path end to end until then.

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message && message.type === "echo") {
    sendResponse({ ok: true, payload: message.payload ?? null });
  } else {
    sendResponse({ ok: false, error: "unknown_message_type" });
  }
  return false; // synchronous response
});

chrome.runtime.onInstalled.addListener(() => {
  // Settings defaults land in Fetta 4.
});
