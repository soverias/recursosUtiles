/**
 * Copy text to the clipboard with a fallback for non-secure contexts.
 *
 * The modern `navigator.clipboard.writeText()` API requires a secure
 * context (HTTPS or localhost). On plain HTTP from an IP — like our
 * deployment at http://192.168.1.101:5015 — `navigator.clipboard` is
 * undefined and the modern path throws.
 *
 * Fallback: temporary hidden `<textarea>` + `document.execCommand('copy')`.
 * Deprecated but supported everywhere we care about (Chrome, Safari, Firefox,
 * including iOS and Android) and works in insecure contexts.
 *
 * Must be invoked from a user-initiated event (click, touch) for the
 * fallback to work — browsers block programmatic copy outside gestures.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (!text) return false;

  // Modern path — only available in secure context
  if (typeof navigator !== 'undefined' && navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // fall through to legacy path
    }
  }

  // Legacy path — works in any context within a user gesture
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.top = '0';
  textarea.style.left = '0';
  textarea.style.width = '2em';
  textarea.style.height = '2em';
  textarea.style.padding = '0';
  textarea.style.border = 'none';
  textarea.style.outline = 'none';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);

  // iOS Safari requires the textarea to be both editable and selectable
  const selection = document.getSelection();
  const previousRange = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
  textarea.focus();
  textarea.select();
  textarea.setSelectionRange(0, text.length);

  let ok = false;
  try {
    ok = document.execCommand('copy');
  } catch {
    ok = false;
  }

  document.body.removeChild(textarea);
  if (previousRange && selection) {
    selection.removeAllRanges();
    selection.addRange(previousRange);
  }
  return ok;
}
