/**
 * Unified Download & Export Utility for Web Browsers and Android APK / Mobile WebViews.
 * 
 * In Android APKs (WebViews, Capacitor, Cordova, Android Studio WebView wrappers):
 * 1. Standard `blob:` URLs in anchor tags are often silently ignored by WebView DownloadListeners.
 * 2. Navigation to `data:` URLs is blocked by modern Android System WebViews.
 * 3. Modern Android System WebViews support the Web Share API (`navigator.share({ files: [...] })`)
 *    which natively opens Android's system share sheet (Save to Downloads, Google Drive, WhatsApp, Files, etc.).
 * 4. Hybrid APK frameworks inject native bridges (e.g. `window.Android`, `window.Capacitor`, `window.cordova`).
 * 
 * In Web Browsers (Desktop & Mobile Chrome, Safari, Firefox, Edge):
 * 1. Standard `<a download>` with Blob Object URLs provides instant, direct downloads to the Downloads folder.
 * 
 * This utility seamlessly orchestrates:
 * - Direct native browser downloads for Web Browsers
 * - Capacitor & Cordova native filesystem plugins for hybrid APKs
 * - Android JavaScriptInterface bridge detection for custom WebView APKs
 * - Web Share API with File objects for Android System Share/Save
 * - Floating Export Action Bottom Sheet for APK/Mobile users (Save, Share, Direct Download, Preview, Copy)
 * - In-App PDF & CSV Preview Modals so users can always access their documents
 */

// Helper to check if running inside a mobile browser or touch device
export function isMobile(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent || '';
  return /android|iphone|ipad|ipod|mobile|touch/i.test(ua);
}

// Helper to check if running specifically in Android
export function isAndroid(): boolean {
  if (typeof window === 'undefined') return false;
  return /android/i.test(navigator.userAgent || '');
}

// Helper to detect if running inside an APK app or Android WebView
export function isApkApp(): boolean {
  if (typeof window === 'undefined') return false;
  const win = window as any;
  const ua = navigator.userAgent || '';

  // Android WebView fingerprints: '; wv' or 'Version/X.X Chrome/... Mobile' without standard Chrome browser standalone markers
  const isWebViewUa = /; wv\b/i.test(ua) || 
                      (/Version\/[0-9\.]+/i.test(ua) && /Chrome\/[0-9\.]+\s+Mobile/i.test(ua));

  // Native app bridge objects commonly injected into WebViews
  const hasBridge = Boolean(
    win.Android || 
    win.AndroidInterface || 
    win.JSBridge || 
    win.AppInterface || 
    win.App || 
    win.NativeApp || 
    win.Capacitor || 
    win.cordova || 
    win.ReactNativeWebView
  );

  return isWebViewUa || hasBridge;
}

// Backward compatible helper for existing callers
export function isMobileOrWebView(): boolean {
  return isMobile() || isApkApp();
}

// Convert Blob to Base64 Data URI
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve(reader.result as string);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Check and invoke Capacitor native plugins if app is wrapped with Capacitor
export async function tryCapacitor(blob: Blob, fileName: string, mimeType: string): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  const win = window as any;
  if (!win.Capacitor) return false;

  try {
    const dataUri = await blobToBase64(blob);
    const pureBase64 = dataUri.includes(',') ? dataUri.split(',')[1] : dataUri;

    // Try Filesystem plugin
    if (win.Capacitor.Plugins?.Filesystem) {
      const fs = win.Capacitor.Plugins.Filesystem;
      const saveResult = await fs.writeFile({
        path: fileName,
        data: pureBase64,
        directory: 'DOCUMENTS',
        recursive: true
      });

      // If Share plugin is also installed, offer native share
      if (win.Capacitor.Plugins?.Share && saveResult?.uri) {
        await win.Capacitor.Plugins.Share.share({
          title: fileName,
          text: `Exported ${fileName}`,
          url: saveResult.uri,
          dialogTitle: `Save ${fileName}`
        });
      }
      return true;
    }

    // Try Capacitor Share plugin directly
    if (win.Capacitor.Plugins?.Share) {
      const file = new File([blob], fileName, { type: mimeType, lastModified: Date.now() });
      await win.Capacitor.Plugins.Share.share({
        title: fileName,
        text: `Exported ${fileName}`,
        files: [file]
      });
      return true;
    }
  } catch (err) {
    console.warn('[downloadHelper] Capacitor export failed:', err);
  }
  return false;
}

// Check and invoke Cordova native file plugins if wrapped with Cordova
export async function tryCordova(blob: Blob, fileName: string): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  const win = window as any;
  if (!win.cordova) return false;

  try {
    if (win.resolveLocalFileSystemURL && win.cordova.file?.externalDataDirectory) {
      return new Promise((resolve) => {
        win.resolveLocalFileSystemURL(win.cordova.file.externalDataDirectory, (dirEntry: any) => {
          dirEntry.getFile(fileName, { create: true, exclusive: false }, (fileEntry: any) => {
            fileEntry.createWriter((fileWriter: any) => {
              fileWriter.onwriteend = () => resolve(true);
              fileWriter.onerror = () => resolve(false);
              fileWriter.write(blob);
            });
          }, () => resolve(false));
        }, () => resolve(false));
      });
    }
  } catch (err) {
    console.warn('[downloadHelper] Cordova export failed:', err);
  }
  return false;
}

// Check and invoke Android Native JavaScript Bridge (e.g. WebViewGold, Hermit, custom Android Studio WebView)
export async function tryAndroidBridge(blob: Blob, fileName: string, mimeType: string): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  const win = window as any;
  const bridge = win.Android || win.AndroidInterface || win.JSBridge || win.AppInterface || win.App || win.NativeApp;
  if (!bridge) return false;

  try {
    const dataUri = await blobToBase64(blob);
    const pureBase64 = dataUri.includes(',') ? dataUri.split(',')[1] : dataUri;

    // Check common APK bridge method signatures
    if (typeof bridge.downloadFile === 'function') {
      bridge.downloadFile(pureBase64, mimeType, fileName);
      return true;
    }
    if (typeof bridge.saveFile === 'function') {
      bridge.saveFile(pureBase64, mimeType, fileName);
      return true;
    }
    if (typeof bridge.saveBase64 === 'function') {
      bridge.saveBase64(pureBase64, mimeType, fileName);
      return true;
    }
    if (typeof bridge.shareFile === 'function') {
      bridge.shareFile(pureBase64, mimeType, fileName);
      return true;
    }
    if (typeof bridge.onDownloadStart === 'function') {
      bridge.onDownloadStart(dataUri, fileName, mimeType);
      return true;
    }
    if (typeof bridge.postMessage === 'function') {
      bridge.postMessage(JSON.stringify({ 
        action: 'download', 
        data: pureBase64, 
        mimeType, 
        fileName 
      }));
      return true;
    }
  } catch (err) {
    console.warn('[downloadHelper] Android bridge call failed:', err);
  }
  return false;
}

// Try Web Share API (Natively opens Android System Share Sheet to Save to Downloads/Drive/WhatsApp/Files)
export async function tryWebShare(blob: Blob, fileName: string, mimeType: string): Promise<boolean> {
  const nav = typeof navigator !== 'undefined' ? (navigator as any) : null;
  if (!nav || typeof nav.share !== 'function') {
    return false;
  }

  try {
    const file = new File([blob], fileName, { type: mimeType, lastModified: Date.now() });

    if (typeof nav.canShare === 'function' && nav.canShare({ files: [file] })) {
      await nav.share({
        files: [file],
        title: fileName,
        text: `Exported: ${fileName}`
      });
      return true;
    }
  } catch (err: any) {
    // If the user dismissed or cancelled the native Android share dialog, it succeeded in opening
    if (err && (err.name === 'AbortError' || err.name === 'NotAllowedError')) {
      return true;
    }
    console.warn('[downloadHelper] Web Share API file share failed:', err);
  }
  return false;
}

// Standard Web Browser Anchor Download with Blob URL
export function triggerAnchorDownload(blob: Blob, fileName: string): boolean {
  if (typeof document === 'undefined') return false;
  try {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      try {
        if (document.body.contains(link)) {
          document.body.removeChild(link);
        }
        URL.revokeObjectURL(url);
      } catch {}
    }, 4000);
    return true;
  } catch (err) {
    console.warn('[downloadHelper] Anchor download failed:', err);
    return false;
  }
}

// Fallback: Data URI download
export async function triggerDataUriDownload(blob: Blob, fileName: string): Promise<boolean> {
  if (typeof document === 'undefined') return false;
  try {
    const dataUri = await blobToBase64(blob);
    const link = document.createElement('a');
    link.href = dataUri;
    link.setAttribute('download', fileName);
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      try {
        if (document.body.contains(link)) {
          document.body.removeChild(link);
        }
      } catch {}
    }, 4000);
    return true;
  } catch (err) {
    console.warn('[downloadHelper] Data URI download failed:', err);
    return false;
  }
}

// In-App PDF Preview & Print Modal (Allows APK users to read & print PDF directly in-app)
export function openPdfViewerModal(blob: Blob, fileName: string) {
  if (typeof document === 'undefined') return;

  const existingModal = document.getElementById('utc-pdf-viewer-modal');
  if (existingModal) existingModal.remove();

  const blobUrl = URL.createObjectURL(blob);

  const modal = document.createElement('div');
  modal.id = 'utc-pdf-viewer-modal';
  modal.className = 'fixed inset-0 z-[9999] bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-3 sm:p-6 animate-fadeIn';

  const container = document.createElement('div');
  container.className = 'w-full max-w-5xl h-[92vh] bg-slate-900 border border-indigo-500/30 rounded-3xl flex flex-col overflow-hidden shadow-2xl';

  // Modal Header
  const header = document.createElement('div');
  header.className = 'px-6 py-4 bg-slate-950/80 border-b border-white/10 flex items-center justify-between gap-4 shrink-0';

  const titleGroup = document.createElement('div');
  titleGroup.className = 'flex items-center gap-3 overflow-hidden';
  titleGroup.innerHTML = `
    <div class="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center shrink-0 font-black text-xs">
      PDF
    </div>
    <div class="overflow-hidden">
      <h3 class="text-sm font-bold text-white truncate max-w-[280px] sm:max-w-md">${fileName}</h3>
      <p class="text-[11px] text-slate-400">Institutional Student Dossier • Ready to View & Save</p>
    </div>
  `;
  header.appendChild(titleGroup);

  const btnGroup = document.createElement('div');
  btnGroup.className = 'flex items-center gap-2';

  // Share / Save button
  const shareBtn = document.createElement('button');
  shareBtn.className = 'px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-lg active:scale-95';
  shareBtn.innerHTML = `<span>Save / Share</span>`;
  shareBtn.onclick = async () => {
    const shared = await tryWebShare(blob, fileName, 'application/pdf');
    if (!shared) triggerAnchorDownload(blob, fileName);
  };
  btnGroup.appendChild(shareBtn);

  // Close button
  const closeBtn = document.createElement('button');
  closeBtn.className = 'w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center text-sm font-bold transition-all cursor-pointer';
  closeBtn.innerHTML = '✕';
  closeBtn.onclick = () => {
    modal.remove();
    URL.revokeObjectURL(blobUrl);
  };
  btnGroup.appendChild(closeBtn);

  header.appendChild(btnGroup);
  container.appendChild(header);

  // Modal Body - PDF Object / iframe
  const body = document.createElement('div');
  body.className = 'flex-1 bg-slate-950 p-2 relative flex flex-col items-center justify-center overflow-hidden';

  const pdfObject = document.createElement('object');
  pdfObject.data = blobUrl;
  pdfObject.type = 'application/pdf';
  pdfObject.className = 'w-full h-full rounded-2xl border border-white/5';
  
  // Fallback inside object if browser/WebView doesn't render PDF embedded
  pdfObject.innerHTML = `
    <div class="flex flex-col items-center justify-center h-full p-6 text-center text-slate-400 space-y-4">
      <div class="text-4xl">📄</div>
      <p class="text-sm font-bold text-white">PDF Document Ready</p>
      <p class="text-xs max-w-sm">Tap below to save or open this dossier in your device's PDF viewer.</p>
      <button id="utc-pdf-fallback-save" class="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-xs font-black uppercase tracking-wider">
        Save / Open Document
      </button>
    </div>
  `;

  body.appendChild(pdfObject);
  container.appendChild(body);
  modal.appendChild(container);
  document.body.appendChild(modal);

  // Bind fallback save button if rendered
  setTimeout(() => {
    const fallbackBtn = document.getElementById('utc-pdf-fallback-save');
    if (fallbackBtn) {
      fallbackBtn.onclick = async () => {
        const shared = await tryWebShare(blob, fileName, 'application/pdf');
        if (!shared) triggerAnchorDownload(blob, fileName);
      };
    }
  }, 300);
}

// Format bytes into readable string (e.g., 24.5 KB)
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// Universal Interactive Export Bottom Sheet & Toast
export function showExportSuccessToast(options: {
  fileName: string;
  blob: Blob;
  mimeType: string;
  csvText?: string;
  isDesktopBrowser?: boolean;
}) {
  if (typeof document === 'undefined') return;

  const { fileName, blob, mimeType, csvText, isDesktopBrowser } = options;
  const existing = document.getElementById('utc-export-toast');
  if (existing) existing.remove();

  const isPdf = mimeType.includes('pdf') || fileName.toLowerCase().endsWith('.pdf');
  const isCsv = mimeType.includes('csv') || fileName.toLowerCase().endsWith('.csv');
  const fileSize = formatBytes(blob.size);

  // If on standard desktop browser, a compact elegant toast is ideal because the browser already initiated download
  if (isDesktopBrowser) {
    const miniToast = document.createElement('div');
    miniToast.id = 'utc-export-toast';
    miniToast.className = 'fixed bottom-6 right-6 z-[9998] bg-slate-900/95 backdrop-blur-md border border-emerald-500/40 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 animate-slideUp transition-all duration-300';
    miniToast.innerHTML = `
      <div class="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 font-black text-xs">
        ✓
      </div>
      <div>
        <div class="text-xs font-black uppercase tracking-wider text-emerald-400">Download Initiated</div>
        <div class="text-xs text-slate-300 truncate max-w-[260px] font-medium" title="${fileName}">${fileName} (${fileSize})</div>
      </div>
      <button id="utc-toast-close" class="ml-2 text-slate-400 hover:text-white text-sm font-bold cursor-pointer">✕</button>
    `;
    document.body.appendChild(miniToast);
    
    document.getElementById('utc-toast-close')?.addEventListener('click', () => miniToast.remove());
    setTimeout(() => {
      if (document.body.contains(miniToast)) miniToast.remove();
    }, 5000);
    return;
  }

  // On Mobile, APK, or Android WebView: Provide a high-clarity Action Sheet with Save, Share, Open, and Copy
  const toast = document.createElement('div');
  toast.id = 'utc-export-toast';
  toast.className = 'fixed bottom-4 left-3 right-3 sm:left-auto sm:right-6 sm:w-[420px] z-[9998] bg-slate-900/95 backdrop-blur-md border border-indigo-500/40 text-white p-4 sm:p-5 rounded-3xl shadow-2xl flex flex-col gap-3.5 transition-all duration-300 animate-slideUp';

  // Header Row
  const header = document.createElement('div');
  header.className = 'flex items-center justify-between gap-2 border-b border-white/10 pb-3';

  const badgeType = isPdf ? 'PDF' : isCsv ? 'CSV' : 'FILE';
  const badgeColor = isPdf ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';

  const titleGroup = document.createElement('div');
  titleGroup.className = 'flex items-center gap-3 overflow-hidden';
  titleGroup.innerHTML = `
    <div class="w-10 h-10 rounded-2xl ${badgeColor} border flex items-center justify-center shrink-0 font-black text-xs">
      ${badgeType}
    </div>
    <div class="overflow-hidden">
      <div class="flex items-center gap-2">
        <span class="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
          <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          Export Ready
        </span>
        <span class="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-slate-300">${fileSize}</span>
      </div>
      <div class="text-xs font-semibold text-slate-200 truncate max-w-[240px] sm:max-w-[280px]" title="${fileName}">${fileName}</div>
    </div>
  `;
  header.appendChild(titleGroup);

  const closeBtn = document.createElement('button');
  closeBtn.innerHTML = '✕';
  closeBtn.className = 'text-slate-400 hover:text-white text-sm w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center cursor-pointer font-bold transition-all';
  closeBtn.onclick = () => toast.remove();
  header.appendChild(closeBtn);
  toast.appendChild(header);

  // Subtitle explaining APK/Browser compatibility
  const subtitle = document.createElement('p');
  subtitle.className = 'text-[11px] text-slate-400 leading-snug';
  subtitle.innerHTML = 'Saved automatically in browser. On Android APK, tap <strong class="text-indigo-400">Save / Share</strong> to store in Downloads, Drive, or WhatsApp.';
  toast.appendChild(subtitle);

  // Action Buttons Grid
  const actionRow = document.createElement('div');
  actionRow.className = 'grid grid-cols-2 gap-2 pt-1';

  // Primary: Native Share / Save via Device (Essential for Android APKs & Mobile)
  const shareBtn = document.createElement('button');
  shareBtn.className = 'py-2.5 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-indigo-600/30 active:scale-95 cursor-pointer';
  shareBtn.innerHTML = `<span>Save / Share</span>`;
  shareBtn.onclick = async () => {
    const shared = await tryWebShare(blob, fileName, mimeType);
    if (!shared) {
      // If native share dialog not available or dismissed, fallback to direct anchor + data URI
      triggerAnchorDownload(blob, fileName);
    }
  };
  actionRow.appendChild(shareBtn);

  // Secondary Action: Preview / Open (for PDF) or Copy (for CSV)
  if (isPdf) {
    const viewBtn = document.createElement('button');
    viewBtn.className = 'py-2.5 px-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer';
    viewBtn.innerHTML = '<span>Open Viewer</span>';
    viewBtn.onclick = () => {
      openPdfViewerModal(blob, fileName);
    };
    actionRow.appendChild(viewBtn);
  } else if (csvText) {
    const copyBtn = document.createElement('button');
    copyBtn.className = 'py-2.5 px-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer';
    copyBtn.innerHTML = '<span>Copy Data</span>';
    copyBtn.onclick = async () => {
      try {
        await navigator.clipboard.writeText(csvText);
        copyBtn.innerHTML = '✓ Copied';
        copyBtn.className = 'py-2.5 px-3 bg-emerald-600/40 text-emerald-300 border border-emerald-500/30 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5';
        setTimeout(() => {
          copyBtn.innerHTML = '<span>Copy Data</span>';
          copyBtn.className = 'py-2.5 px-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer';
        }, 2500);
      } catch (err) {
        console.warn('Clipboard write failed:', err);
      }
    };
    actionRow.appendChild(copyBtn);
  } else {
    const downloadBtn = document.createElement('button');
    downloadBtn.className = 'py-2.5 px-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer';
    downloadBtn.innerHTML = '<span>Direct Save</span>';
    downloadBtn.onclick = () => {
      triggerAnchorDownload(blob, fileName);
    };
    actionRow.appendChild(downloadBtn);
  }

  toast.appendChild(actionRow);
  document.body.appendChild(toast);

  // Auto dismiss after 12 seconds
  setTimeout(() => {
    try {
      if (document.body.contains(toast)) {
        toast.remove();
      }
    } catch {}
  }, 12000);
}

/**
 * Universal File Download & Export Function.
 * Seamlessly handles:
 * 1. Web Browsers (Desktop & Mobile Chrome, Safari, Firefox, Edge) -> Direct Download
 * 2. Android APK apps (WebViews, Capacitor, Cordova, native Android bridges) -> File Provider / Web Share / Storage
 */
export async function exportFile(options: {
  blob: Blob;
  fileName: string;
  mimeType: string;
  csvText?: string;
}): Promise<{ success: boolean; method: string }> {
  const { blob, fileName, mimeType, csvText } = options;
  const isMobileDevice = isMobile();
  const isApk = isApkApp();

  // 1. If running inside a Capacitor-wrapped APK, write directly to device filesystem
  const capacitorSuccess = await tryCapacitor(blob, fileName, mimeType);
  if (capacitorSuccess) {
    showExportSuccessToast({ fileName, blob, mimeType, csvText, isDesktopBrowser: false });
    return { success: true, method: 'capacitor' };
  }

  // 2. If running inside a Cordova-wrapped APK, write to external storage
  const cordovaSuccess = await tryCordova(blob, fileName);
  if (cordovaSuccess) {
    showExportSuccessToast({ fileName, blob, mimeType, csvText, isDesktopBrowser: false });
    return { success: true, method: 'cordova' };
  }

  // 3. If an Android native bridge is present in the APK, invoke it
  const bridgeSuccess = await tryAndroidBridge(blob, fileName, mimeType);
  if (bridgeSuccess) {
    showExportSuccessToast({ fileName, blob, mimeType, csvText, isDesktopBrowser: false });
    return { success: true, method: 'android-bridge' };
  }

  // 4. Always trigger standard browser anchor download
  // In standard Web Browsers (Desktop Chrome, Firefox, Safari, Edge, Android Chrome, iOS Safari),
  // this immediately downloads the file to the user's Downloads folder!
  const anchorSuccess = triggerAnchorDownload(blob, fileName);

  // 5. If running on Mobile or in an APK, also trigger fallback and display interactive action sheet
  if (isMobileDevice || isApk) {
    if (!anchorSuccess) {
      await triggerDataUriDownload(blob, fileName);
    }
    // Present the floating Action Card with "Save / Share" (Android Native Share Sheet), "Open Viewer", etc.
    showExportSuccessToast({ 
      fileName, 
      blob, 
      mimeType, 
      csvText, 
      isDesktopBrowser: false 
    });
    return { success: true, method: isApk ? 'apk-action-sheet' : 'mobile-download' };
  }

  // 6. On standard Desktop Web Browser: Show sleek confirmation toast
  showExportSuccessToast({ 
    fileName, 
    blob, 
    mimeType, 
    csvText, 
    isDesktopBrowser: true 
  });

  return { success: anchorSuccess, method: 'browser-anchor' };
}

/**
 * Universal CSV Export Helper
 * Prepends UTF-8 BOM (\uFEFF) so Microsoft Excel (Desktop & Android APK), Google Sheets,
 * and mobile spreadsheet viewers render Indian Rupee (₹) and all international characters cleanly.
 */
export async function exportCsvFile(csvContent: string, fileName: string): Promise<boolean> {
  const contentWithBom = csvContent.startsWith('\uFEFF') ? csvContent : '\uFEFF' + csvContent;
  const blob = new Blob([contentWithBom], { type: 'text/csv;charset=utf-8;' });
  const result = await exportFile({
    blob,
    fileName,
    mimeType: 'text/csv',
    csvText: contentWithBom,
  });
  return result.success;
}

