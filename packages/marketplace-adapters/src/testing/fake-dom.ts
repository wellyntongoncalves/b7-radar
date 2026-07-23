import type { ElementLike, ParentLike } from '../adapter.js';

/**
 * Minimal fake DOM for fixtures. It does NOT implement CSS matching; instead it
 * maps exact selector strings (as declared in the selector registry) to text
 * values. This keeps fixtures dependency-free while still exercising the
 * adapter's parsing and normalization paths.
 */
export class FakeElement implements ElementLike, ParentLike {
  constructor(
    public textContent: string | null,
    private readonly attrs: Record<string, string> = {},
    private readonly children: Record<string, FakeElement> = {},
  ) {}

  getAttribute(name: string): string | null {
    return this.attrs[name] ?? null;
  }

  querySelector(sel: string): ElementLike | null {
    return this.children[sel] ?? null;
  }

  querySelectorAll(sel: string): ArrayLike<ElementLike> {
    const list = this.childrenList[sel];
    return list ?? [];
  }

  childrenList: Record<string, FakeElement[]> = {};
}

export class FakeRoot implements ParentLike {
  constructor(
    private readonly map: Record<string, FakeElement>,
    private readonly lists: Record<string, FakeElement[]> = {},
  ) {}

  querySelector(sel: string): ElementLike | null {
    return this.map[sel] ?? null;
  }

  querySelectorAll(sel: string): ArrayLike<ElementLike> {
    return this.lists[sel] ?? [];
  }
}
