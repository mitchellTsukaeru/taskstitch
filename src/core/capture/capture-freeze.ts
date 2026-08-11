const CAPTURE_FREEZE_ATTRIBUTE = 'data-taskstitch-capture-freeze';
const MAX_Z_INDEX = '2147483647';
const FREEZABLE_CONTROL_SELECTOR =
  'a[href], button, input, select, textarea, [role="button"], [role="link"], [role="tab"], [role="menuitem"], [role="checkbox"], [role="radio"], [role="switch"]';

function copyComputedStyles(source: Element, clone: Element): void {
  if (!(clone instanceof HTMLElement || clone instanceof SVGElement)) return;

  const styles = source.ownerDocument.defaultView?.getComputedStyle(source);
  if (!styles) return;

  for (let index = 0; index < styles.length; index += 1) {
    const property = styles.item(index);
    clone.style.setProperty(property, styles.getPropertyValue(property), styles.getPropertyPriority(property));
  }
}

/**
 * Keep a pixel-equivalent copy of a control visible while Chrome rasterises a
 * screenshot. Some applications remove buttons synchronously in their click
 * handlers, before captureVisibleTab has finished.
 */
export function freezeCaptureTarget(target: HTMLElement): () => void {
  if (!target.isConnected || !target.matches(FREEZABLE_CONTROL_SELECTOR)) return () => {};

  const rect = target.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return () => {};

  const clone = target.cloneNode(true) as HTMLElement;
  const sourceElements = [target, ...target.querySelectorAll('*')];
  const clonedElements = [clone, ...clone.querySelectorAll('*')];

  for (let index = 0; index < sourceElements.length; index += 1) {
    const sourceElement = sourceElements[index];
    const clonedElement = clonedElements[index];
    if (sourceElement && clonedElement) {
      copyComputedStyles(sourceElement, clonedElement);
      if (clonedElement instanceof HTMLElement || clonedElement instanceof SVGElement) {
        clonedElement.style.setProperty('pointer-events', 'none', 'important');
      }
    }
  }

  clone.setAttribute(CAPTURE_FREEZE_ATTRIBUTE, '');
  clone.setAttribute('data-mimik-ignore', '');
  clone.setAttribute('aria-hidden', 'true');
  clone.style.setProperty('position', 'fixed', 'important');
  clone.style.setProperty('inset', 'auto', 'important');
  clone.style.setProperty('left', `${rect.left}px`, 'important');
  clone.style.setProperty('top', `${rect.top}px`, 'important');
  clone.style.setProperty('width', `${rect.width}px`, 'important');
  clone.style.setProperty('height', `${rect.height}px`, 'important');
  clone.style.setProperty('margin', '0', 'important');
  clone.style.setProperty('transform', 'none', 'important');
  clone.style.setProperty('z-index', MAX_Z_INDEX, 'important');

  target.ownerDocument.documentElement.appendChild(clone);

  return () => clone.remove();
}
