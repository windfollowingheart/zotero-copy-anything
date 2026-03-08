async function copyFiles(filePaths: string[]) {
  const binaryFileInfo = await getBinaryFilePath();
  if (!binaryFileInfo.isExist) {
    new ztoolkit.ProgressWindow(addon.data.config.addonName)
      .createLine({
        text: "❌ Copy Failed! Please download the binary file first.",
        type: "error",
        progress: 100,
      })
      .show();
  }
  const binaryFilePath = binaryFileInfo.saveFilePath;

  if (await Zotero.Utilities.Internal.exec(binaryFilePath, filePaths)) {
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

async function getBinaryFilePath(): Promise<BinaryFileInfo> {
  let downloadUrl = "";
  const binaryFileInfo: BinaryFileInfo = {
    downloadUrl: "",
    saveFilePath: "",
    isExist: false,
  };

  const saveDir = PathUtils.join(
    Zotero.DataDirectory.dir,
    "storage",
    "zotero-copy-anything",
  );
  let saveFilePath = "";
  if (Zotero.isWin) {
    downloadUrl =
      "https://gitee.com/windheartyolo/zotero-copy-anything/releases/download/binary/copyfiles.exe";
    saveFilePath = PathUtils.join(saveDir, "copyfiles.exe");
  } else if (Zotero.isMac) {
    downloadUrl =
      "https://gitee.com/windheartyolo/zotero-copy-anything/releases/download/binary/copyfiles-mac";
    saveFilePath = PathUtils.join(saveDir, "copyfiles-mac");
  } else if (Zotero.isLinux) {
    downloadUrl =
      "https://gitee.com/windheartyolo/zotero-copy-anything/releases/download/binary/copyfiles-linux";
    saveFilePath = PathUtils.join(saveDir, "copyfiles-linux");
  } else {
    console.log("Unsupported platform");
    throw new Error("Unsupported platform");
  }
  binaryFileInfo.isExist = await IOUtils.exists(saveFilePath);
  binaryFileInfo.downloadUrl = downloadUrl;
  binaryFileInfo.saveFilePath = saveFilePath;
  return binaryFileInfo;
}

async function downloadBinaryFile(): Promise<boolean> {
  const binaryFileInfo = await getBinaryFilePath();
  if (binaryFileInfo.isExist) {
    console.log("Binary file already exist");
    return true;
  }
  const downloadUrl = binaryFileInfo.downloadUrl;
  const saveFilePath = binaryFileInfo.saveFilePath;
  const response = await fetch(downloadUrl);
  if (!response.ok) {
    console.log("Download binary file failed");
    return false;
  }

  const arrayBuffer = await response.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);
  if (await IOUtils.write(saveFilePath, uint8Array)) {
    if (Zotero.isMac || Zotero.isLinux) {
      const chmodPaths = ["/bin/chmod", "/usr/sbin/chmod", "/usr/bin/chmod"];
      let chmodPath = "";
      for (const chmodPath_ of chmodPaths) {
        if (await IOUtils.exists(chmodPath_)) {
          chmodPath = chmodPath_;
          break;
        }
      }
      if (chmodPath === "") {
        console.log("Chmod command not found");
        return false;
      }
      console.log(`Set binary file permission by ${chmodPath}`);
      if (
        !(await Zotero.Utilities.Internal.exec(chmodPath, [
          "777",
          saveFilePath,
        ]))
      ) {
        console.log("Set binary file permission failed");
        return false;
      }
    }
    console.log("Save binary file successfully");
    return true;
  } else {
    console.log("Save binary file failed");
    return false;
  }
}

async function copyItems(items: Zotero.Item[]) {
  const copyList: string[] = [];
  for (const item of items) {
    if (item.isAttachment()) {
      copyList.push(item.getFilePath() as string);
    } else {
      const attachmentIds = item.getAttachments();
      for (const attachmentId of attachmentIds) {
        const attachmentItem = Zotero.Items.get(attachmentId);
        if (attachmentItem.isAttachment()) {
          copyList.push(attachmentItem.getFilePath() as string);
        }
      }
    }
  }
  // console.log(copyList);
  // 过滤掉不是.pdf的
  // const pdfList = copyList.filter((item) => item.endsWith(".pdf"));
  const pdfList = copyList;
  // 判断文件是否在本地存在
  const existList = (
    await Promise.all(
      pdfList.map(async (item) => ({
        path: item,
        exists: await IOUtils.exists(item),
      })),
    )
  )
    .filter(({ exists }) => exists)
    .map(({ path }) => path);
  console.log(existList);
  // 复制文件
  await copyFiles(existList);
}

/**
 * 纯键盘按键监听函数 - 仅监听并输出按下的按键信息
 * 无注册逻辑，实时反馈按下的所有键（修饰键+普通键）
 */
function listenKeyboardKeys(
  win: Window,
  callback: (keyInfo: KeyboardEvent) => void,
) {
  // 键盘按下事件处理函数
  const handleKeyDown = (ev: KeyboardEvent) => {
    // 1. 基础按键信息
    const keyInfo = {
      // 原始按键名（区分大小写，如 "L"、"S"、"Enter"）
      rawKey: ev.key,
      // 小写按键名（统一格式）
      key: ev.key.toLowerCase(),
      // 修饰键状态
      modifiers: {
        shift: ev.shiftKey, // Shift键是否按下
        ctrl: ev.ctrlKey, // Ctrl键是否按下
        alt: ev.altKey, // Alt键是否按下
        meta: ev.metaKey, // Meta键（Win/Command）是否按下
      },
      // 按键码（兼容老浏览器）
      keyCode: ev.keyCode,
      // 是否是功能键（F1-F12）
      isFunctionKey: ev.key.startsWith("F") && !isNaN(Number(ev.key.slice(1))),
    } as any;

    // 2. 格式化输出（方便查看）
    const pressedModifiers = [];
    if (keyInfo.modifiers.ctrl) pressedModifiers.push("Ctrl");
    if (keyInfo.modifiers.shift) pressedModifiers.push("Shift");
    if (keyInfo.modifiers.alt) pressedModifiers.push("Alt");
    if (keyInfo.modifiers.meta) pressedModifiers.push("Meta(Win/Command)");

    // 拼接最终提示文本
    let logText = `按下了：`;
    if (pressedModifiers.length > 0) {
      logText += `${pressedModifiers.join("+")}+${keyInfo.rawKey}`;
    } else {
      logText += keyInfo.rawKey;
    }

    // 3. 控制台输出（清晰易读）
    // console.log("=== 键盘按键信息 ===");
    // console.log(logText);
    // console.log("完整信息：", keyInfo);
    // console.log("--------------------");

    callback(keyInfo);

    // 可选：阻止默认行为（如不想让Ctrl+S触发浏览器保存，可取消注释）
    // ev.preventDefault();
  };

  // 绑定键盘按下事件（监听整个文档）
  // Zotero.getMainWindow().document.addEventListener("keydown", handleKeyDown);
  win.document.addEventListener("keydown", handleKeyDown);

  // 返回取消监听的函数（方便后续停止监听）
  return function stopListening() {
    // Zotero.getMainWindow().document.removeEventListener(
    //   "keydown",
    //   handleKeyDown,
    // );
    win.document.removeEventListener("keydown", handleKeyDown);
    // console.log("已停止监听键盘按键");
  };
}

export {
  copyFiles,
  getBinaryFilePath,
  downloadBinaryFile,
  copyItems,
  listenKeyboardKeys,
};
