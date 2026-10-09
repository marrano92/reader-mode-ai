// Options page: user preferences and the translation provider credentials.
import {
  DEFAULT_DEEPL_ENDPOINT_PLACEHOLDER,
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
  status.textContent = "Saved.";
});

keyInput.addEventListener("change", async () => {
  await setSecret({ deeplKey: keyInput.value });
  status.textContent = "Saved.";
});

endpointInput.addEventListener("change", async () => {
  const secret = await setSecret({ endpointUrl: endpointInput.value });
  endpointInput.value = secret.endpointUrl;
  status.textContent = "Saved.";
});

init();
