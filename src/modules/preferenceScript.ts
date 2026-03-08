import { config } from "../../package.json";
import { getPref, setPref } from "../utils/prefs";
import { listenKeyboardKeys } from "./utils";

export async function registerPrefsScripts(_window: Window) {
  // This function is called when the prefs window is opened
  // See addon/content/preferences.xhtml onpaneload
  if (!addon.data.prefs) {
    addon.data.prefs = {
      window: _window,
      columns: [],
      rows: [],
    };
  } else {
    addon.data.prefs.window = _window;
  }
  updatePrefsUI();
  bindPrefEvents();
}

async function updatePrefsUI() {}

function bindPrefEvents() {
  addon.data
    .prefs!.window.document?.querySelector(
      `#zotero-prefpane-${config.addonRef}-enable-copy-shortcut`,
    )
    ?.addEventListener("command", (e: Event) => {
      addon.data.prefs!.window.alert(
        `Successfully changed to ${(e.target as XUL.Checkbox).checked ? "enabled" : "disabled"}!`,
      );
    });

  let stopListen: () => void;
  const registerButton = addon.data.prefs!.window.document?.querySelector(
    `#zotero-prefpane-${config.addonRef}-register-shortcut-button`,
  ) as HTMLButtonElement;
  const confirmButton = addon.data.prefs!.window.document?.querySelector(
    `#zotero-prefpane-${config.addonRef}-confirm-shortcut-button`,
  ) as HTMLButtonElement;
  const cancelButton = addon.data.prefs!.window.document?.querySelector(
    `#zotero-prefpane-${config.addonRef}-Cancel-shortcut-button`,
  ) as HTMLButtonElement;

  const copyShortcutLabel = addon.data.prefs!.window.document?.querySelector(
    `#zotero-prefpane-${config.addonRef}-copy-shortcut`,
  ) as HTMLSpanElement;

  copyShortcutLabel.textContent = getPref("copy-shortcut");
  let oldShortcut: string;
  const newShortcutKeys: string[] = [];
  const confirmCallback = (keyInfo: KeyboardEvent) => {
    // copyShortcutLabel.textContent = `${keyInfo.key}${keyInfo.ctrlKey ? "+Ctrl" : ""}${keyInfo.shiftKey ? "+Shift" : ""}${keyInfo.altKey ? "+Alt" : ""}${keyInfo.metaKey ? "+Meta" : ""}`;
    newShortcutKeys.push(keyInfo.key);
    copyShortcutLabel.textContent = newShortcutKeys.join("+");
  };

  registerButton?.addEventListener("click", (e: Event) => {
    stopListen = listenKeyboardKeys(addon.data.prefs!.window, confirmCallback);
    registerButton.style.display = "none";
    confirmButton.style.display = "inline-block";
    cancelButton.style.display = "inline-block";

    oldShortcut = copyShortcutLabel.textContent || "";
  });

  confirmButton?.addEventListener("click", (e: Event) => {
    stopListen();
    registerButton.style.display = "inline-block";
    confirmButton.style.display = "none";
    cancelButton.style.display = "none";

    const newShortcut = newShortcutKeys.join(",");
    copyShortcutLabel.textContent = newShortcut;
    setPref(`copy-shortcut`, newShortcut);

    newShortcutKeys.length = 0;
  });

  cancelButton?.addEventListener("click", (e: Event) => {
    stopListen();
    registerButton.style.display = "inline-block";
    confirmButton.style.display = "none";
    cancelButton.style.display = "none";
    copyShortcutLabel.textContent = oldShortcut;

    newShortcutKeys.length = 0;
  });
}
