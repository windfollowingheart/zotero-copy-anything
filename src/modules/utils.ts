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

export { copyFiles, getBinaryFilePath, downloadBinaryFile, copyItems };
