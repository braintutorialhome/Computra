/**
 * Unified Download & Export Utility for Web and Android/Mobile WebView APKs.
 * 
 * In Android WebViews (APK wrappers):
 * 1. Standard `blob:` URLs often fail silently because WebView's native DownloadListener
 *    only intercepts http:// and https:// URLs.
 * 2. Modern Android System WebViews support the Web Share API with files:
 *    `navigator.share({ files: [new File([blob], fileName, { type })] })`
 *    which opens the native Android system dialog (Save to device/Downloads/Drive/etc.).
 * 3. Many APK wrappers inject an Android JavaScript interface (e.g., `window.Android.downloadFile`).
 * 4. This utility cascades through all mechanisms to ensure 100% reliable PDF and CSV downloads.
 */

// Helper to check if running inside a mobile browser or WebView
export function isMobileOrWebView(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const isMobile = /android|iphone|ipad|ipod|mobile/i.test(ua);
  const isWebView = /wv|webview|version\/[0-9\.]+\s+chrome\/[0-9\.]+\s+mobile/i.test(ua) || 
                    Boolean((window as any).Android) || 
                    Boolean((window as any).AndroidInterface) ||
                    Boolean((window as any).JSBridge);
  return isMobile || isWebView;
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

// Check if Android Native JavaScript Bridge is available in the APK
export async function tryAndroidBridge(blob: Blob, fileName: string, mimeType: string): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  const win = window as any;
  const bridge = win.Android || win.AndroidInterface || win.JSBridge;
  if (!bridge) return false;

  try {
    const dataUri = await blobToBase64(blob);
    const pureBase64 = dataUri.includes(',') ? dataUri.split(',')[1] : dataUri;

    if (typeof bridge.downloadFile === 'function') {
      bridge.downloadFile(pureBase64, mimeType, fileName);
      return true;
    }
    if (typeof bridge.saveFile === 'function') {
      bridge.saveFile(pureBase64, mimeType, fileName);
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

// Try Web Share API (Primary mobile & Android WebView path for saving files to device)
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
    // If the user cancelled or closed the native share dialog, that's normal
    if (err && err.name === 'AbortError') {
      return true;
    }
    console.warn('[downloadHelper] Web Share API file share failed:', err);
  }
  return false;
}

// Standard Browser Anchor Download with Blob URL
export function triggerAnchorDownload(blob: Blob, fileName: string): boolean {
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
        document.body.removeChild(link);
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
        document.body.removeChild(link);
      } catch {}
    }, 4000);
    return true;
  } catch (err) {
    console.warn('[downloadHelper] Data URI download failed:', err);
    return false;
  }
}

// Interactive Toast Banner on Mobile & WebView to provide Save / Share / Open / Copy
export function showExportSuccessToast(options: {
  fileName: string;
  blob: Blob;
  mimeType: string;
  csvText?: string;
}) {
  if (typeof document === 'undefined') return;

  const { fileName, blob, mimeType, csvText } = options;
  const existing = document.getElementById('utc-export-toast');
  if (existing) {
    existing.remove();
  }

  const toast = document.createElement('div');
  toast.id = 'utc-export-toast';
  toast.className = 'fixed bottom-5 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-50 bg-slate-900/95 backdrop-blur-md border border-indigo-500/40 text-white p-4 rounded-2xl shadow-2xl flex flex-col gap-3 transition-all duration-300';
  
  // Header row
  const header = document.createElement('div');
  header.className = 'flex items-center justify-between gap-2';

  const titleGroup = document.createElement('div');
  titleGroup.className = 'flex items-center gap-2 overflow-hidden';
  titleGroup.innerHTML = `
    <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0 animate-pulse"></span>
    <div class="overflow-hidden">
      <div class="text-xs font-black uppercase tracking-wider text-emerald-400">Export Ready</div>
      <div class="text-xs font-medium text-slate-300 truncate max-w-[240px]" title="${fileName}">${fileName}</div>
    </div>
  `;
  header.appendChild(titleGroup);

  const closeBtn = document.createElement('button');
  closeBtn.innerHTML = '✕';
  closeBtn.className = 'text-slate-400 hover:text-white text-sm px-2 py-1 cursor-pointer font-bold';
  closeBtn.onclick = () => toast.remove();
  header.appendChild(closeBtn);
  toast.appendChild(header);

  // Action buttons
  const actionRow = document.createElement('div');
  actionRow.className = 'flex items-center gap-2 pt-1';

  // Share / Save Button
  const shareBtn = document.createElement('button');
  shareBtn.className = 'flex-1 py-2 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer';
  shareBtn.innerHTML = `<span>Save / Share</span>`;
  shareBtn.onclick = async () => {
    const shared = await tryWebShare(blob, fileName, mimeType);
    if (!shared) {
      triggerAnchorDownload(blob, fileName);
    }
  };
  actionRow.appendChild(shareBtn);

  // Open / View Button
  const openBtn = document.createElement('button');
  openBtn.className = 'py-2 px-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer';
  openBtn.innerHTML = 'Open';
  openBtn.onclick = async () => {
    try {
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch {
      const dataUri = await blobToBase64(blob);
      window.open(dataUri, '_blank');
    }
  };
  actionRow.appendChild(openBtn);

  // If CSV, provide Copy to Clipboard option
  if (csvText) {
    const copyBtn = document.createElement('button');
    copyBtn.className = 'py-2 px-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer';
    copyBtn.innerHTML = 'Copy';
    copyBtn.onclick = async () => {
      try {
        await navigator.clipboard.writeText(csvText);
        copyBtn.innerHTML = '✓ Copied';
        copyBtn.className = 'py-2 px-3 bg-emerald-600/30 text-emerald-300 rounded-xl text-xs font-bold';
        setTimeout(() => {
          copyBtn.innerHTML = 'Copy';
          copyBtn.className = 'py-2 px-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold';
        }, 2000);
      } catch (e) {
        console.warn('Clipboard write failed', e);
      }
    };
    actionRow.appendChild(copyBtn);
  }

  toast.appendChild(actionRow);
  document.body.appendChild(toast);

  // Auto dismiss after 9 seconds
  setTimeout(() => {
    try {
      if (document.body.contains(toast)) {
        toast.remove();
      }
    } catch {}
  }, 9000);
}

/**
 * Universal File Download & Export Function.
 * Seamlessly handles:
 * 1. Android APK WebViews (via Web Share API or Android native bridge)
 * 2. Mobile browsers (iOS Safari, Android Chrome)
 * 3. Desktop browsers
 */
export async function exportFile(options: {
  blob: Blob;
  fileName: string;
  mimeType: string;
  csvText?: string;
}): Promise<{ success: boolean; method: string }> {
  const { blob, fileName, mimeType, csvText } = options;
  const isMobile = isMobileOrWebView();

  // 1. If an Android native bridge is present, prioritize it
  const bridgeSuccess = await tryAndroidBridge(blob, fileName, mimeType);
  if (bridgeSuccess) {
    showExportSuccessToast({ fileName, blob, mimeType, csvText });
    return { success: true, method: 'android-bridge' };
  }

  // 2. If on Mobile or WebView, try Web Share API with File
  // This triggers Android's native system dialog to "Save to device", "Downloads", "Drive", etc.
  if (isMobile) {
    const shareSuccess = await tryWebShare(blob, fileName, mimeType);
    if (shareSuccess) {
      showExportSuccessToast({ fileName, blob, mimeType, csvText });
      return { success: true, method: 'web-share' };
    }
  }

  // 3. Trigger standard Blob Anchor download
  const anchorSuccess = triggerAnchorDownload(blob, fileName);

  // 4. If mobile / WebView and anchor was triggered, also attempt Data URI if blob might be blocked
  if (isMobile && !anchorSuccess) {
    const dataUriSuccess = await triggerDataUriDownload(blob, fileName);
    showExportSuccessToast({ fileName, blob, mimeType, csvText });
    return { success: dataUriSuccess, method: 'data-uri' };
  }

  // Show interactive helper toast on mobile or WebView to guarantee user can save/open
  if (isMobile) {
    showExportSuccessToast({ fileName, blob, mimeType, csvText });
  }

  return { success: anchorSuccess, method: 'blob-anchor' };
}

/**
 * Universal CSV Export Helper
 * Prepends UTF-8 BOM (\uFEFF) so Microsoft Excel, Google Sheets, and mobile spreadsheet viewers
 * render Indian Rupee (₹) and all special characters without garbled text.
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
