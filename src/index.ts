import { BasicTool } from "zotero-plugin-toolkit";
import Addon from "./addon";
import { config } from "../package.json";

const basicTool = new BasicTool();

// @ts-expect-error - Plugin instance is not typed
if (!basicTool.getGlobal("Zotero")[config.addonInstance]) {
  _globalThis.addon = new Addon();
  defineGlobal("ztoolkit", () => {
    return _globalThis.addon.data.ztoolkit;
  });

  _globalThis.console = basicTool.getGlobal("console");
  _globalThis.window = basicTool.getGlobal("window");
  _globalThis.alert = basicTool.getGlobal("alert");
  _globalThis.Zotero_Tabs = basicTool.getGlobal("Zotero_Tabs");
  _globalThis.FormData = basicTool.getGlobal("FormData");
  _globalThis.AbortController = basicTool.getGlobal("AbortController");
  _globalThis.setImmediate = basicTool.getGlobal("setImmediate");
  _globalThis.navigator = basicTool.getGlobal("navigator");
  _globalThis.ClipboardItem = basicTool.getGlobal("ClipboardItem");

  // @ts-expect-error - Plugin instance is not typed
  Zotero[config.addonInstance] = addon;
}

function defineGlobal(name: Parameters<BasicTool["getGlobal"]>[0]): void;
function defineGlobal(name: string, getter: () => any): void;
function defineGlobal(name: string, getter?: () => any) {
  Object.defineProperty(_globalThis, name, {
    get() {
      return getter ? getter() : basicTool.getGlobal(name);
    },
  });
}
