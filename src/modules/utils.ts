async function copyFiles(filePaths: string[]) {
  if (
    await Zotero.Utilities.Internal.exec(
      "D:\\VScode\\code\\js\\zotero\\zotero-copy-anything-test\\win-go\\copyfiles.exe",
      filePaths,
    )
  ) {
    new ztoolkit.ProgressWindow(addon.data.config.addonName)
      .createLine({
        text: "✅ Copied Successfully!",
        type: "success",
        progress: 100,
      })
      .show();
  } else {
    new ztoolkit.ProgressWindow(addon.data.config.addonName)
      .createLine({
        text: "❌ Copy Failed!",
        type: "error",
        progress: 100,
      })
      .show();
  }
}

export { copyFiles };
