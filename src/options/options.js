// Options page: user preferences and (from Fetta 5) the translation provider.
import { getSettings, updateSettings, TARGET_LANGUAGES } from "../shared/settings.js";
import { LANGUAGE_LABELS } from "../content/toolbar-ui.js";

const langSelect = document.querySelector("[data-role='target-lang']");
const status = document.querySelector("[data-role='status']");

for (const code of TARGET_LANGUAGES) {
  const option = document.createElement("option");
  option.value = code;
  option.textContent = LANGUAGE_LABELS[code] ?? code;
  langSelect.append(option);
}

async function init() {
  const settings = await getSettings();
  langSelect.value = settings.targetLang;
}

langSelect.addEventListener("change", async () => {
  await updateSettings({ targetLang: langSelect.value });
  status.textContent = "Saved.";
});

init();
