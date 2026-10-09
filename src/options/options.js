// Options page: user preferences and the translation provider credentials.
import {
  getSecret,
  getSettings,
  setSecret,
  TARGET_LANGUAGES,
  updateSettings,
} from "../shared/settings.js";
import { LANGUAGE_LABELS } from "../content/toolbar-ui.js";

const langSelect = document.querySelector("[data-role='target-lang']");
const keyInput = document.querySelector("[data-role='api-key']");
const endpointInput = document.querySelector("[data-role='endpoint-url']");
const status = document.querySelector("[data-role='status']");

const t = (key) => chrome.i18n.getMessage(key) || key;
for (const el of document.querySelectorAll("[data-i18n]")) {
  el.textContent = t(el.dataset.i18n);
}

for (const code of TARGET_LANGUAGES) {
  const option = document.createElement("option");
  option.value = code;
  option.textContent = LANGUAGE_LABELS[code] ?? code;
  langSelect.append(option);
}

async function init() {
  const settings = await getSettings();
  const secret = await getSecret();
  langSelect.value = settings.targetLang;
  keyInput.value = secret.deeplKey;
  endpointInput.value = secret.endpointUrl;
}

langSelect.addEventListener("change", async () => {
  await updateSettings({ targetLang: langSelect.value });
  status.textContent = t("optionsSaved");
});

keyInput.addEventListener("change", async () => {
  await setSecret({ deeplKey: keyInput.value });
  status.textContent = t("optionsSaved");
});

endpointInput.addEventListener("change", async () => {
  const secret = await setSecret({ endpointUrl: endpointInput.value });
  endpointInput.value = secret.endpointUrl;
  status.textContent = t("optionsSaved");
});

init();
