import { describe, expect, it } from "vitest";
import {
  canRedo,
  canUndo,
  createEditHistory,
  currentEdit,
  pushEdit,
  redoEdit,
  undoEdit,
} from "./edit-history-pure.js";

describe("edit-history-pure", () => {
  it("starts with one entry", () => {
    const h = createEditHistory("a");
    expect(currentEdit(h)).toBe("a");
    expect(canUndo(h)).toBe(false);
    expect(canRedo(h)).toBe(false);
  });

  it("push then undo/redo", () => {
    let h = createEditHistory("a", 0);
    h = pushEdit(h, "ab", { now: 1000, coalesceMs: 400 });
    h = pushEdit(h, "abc", { now: 2000, coalesceMs: 400 });
    expect(currentEdit(h)).toBe("abc");
    expect(canUndo(h)).toBe(true);

    const u = undoEdit(h)!;
    expect(currentEdit(u)).toBe("ab");
    const u2 = undoEdit(u)!;
    expect(currentEdit(u2)).toBe("a");
    expect(undoEdit(u2)).toBeNull();

    const r = redoEdit(u2)!;
    expect(currentEdit(r)).toBe("ab");
    const r2 = redoEdit(r)!;
    expect(currentEdit(r2)).toBe("abc");
    expect(redoEdit(r2)).toBeNull();
  });

  it("coalesces rapid pushes into one tip", () => {
    let h = createEditHistory("a", 0);
    h = pushEdit(h, "ab", { now: 100, coalesceMs: 400 });
    h = pushEdit(h, "abc", { now: 200, coalesceMs: 400 });
    h = pushEdit(h, "abcd", { now: 300, coalesceMs: 400 });
    expect(h.entries).toEqual(["a", "abcd"]);
    expect(currentEdit(h)).toBe("abcd");
    const u = undoEdit(h)!;
    expect(currentEdit(u)).toBe("a");
  });

  it("truncates redo branch on new push", () => {
    let h = createEditHistory("a", 0);
    h = pushEdit(h, "b", { now: 1000 });
    h = pushEdit(h, "c", { now: 2000 });
    h = undoEdit(h)!;
    expect(currentEdit(h)).toBe("b");
    h = pushEdit(h, "x", { now: 3000 });
    expect(currentEdit(h)).toBe("x");
    expect(canRedo(h)).toBe(false);
    expect(h.entries).toEqual(["a", "b", "x"]);
  });

  it("no-op when content unchanged", () => {
    const h0 = createEditHistory("a", 0);
    const h1 = pushEdit(h0, "a", { now: 100 });
    expect(h1).toBe(h0);
  });
});
