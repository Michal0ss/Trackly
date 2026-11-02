export function isNearEnd(offset: number, viewport: number, content: number, bottomInset = 0) {
  return content + bottomInset - viewport - offset <= 64;
}

export function createScrollFollow() {
  let atEnd = true;
  let pending = false;
  let dragging = false;

  return {
    endVisible(visible: boolean) { atEnd = visible; if (dragging && !visible) pending = false; },
    contentChanged() { pending ||= atEnd; },
    reveal() { atEnd = true; pending = true; },
    beginDrag() { dragging = true; pending = false; },
    endDrag() { dragging = false; },
    reset() { atEnd = true; pending = false; dragging = false; },
    takeScroll() {
      if (!pending || dragging) return false;
      pending = false;
      return true;
    },
  };
}
