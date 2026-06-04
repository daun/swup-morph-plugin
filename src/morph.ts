import { morph as morphlex } from 'morphlex';

/**
 * Callback to decide whether an element should be morphed.
 * Return `false` to prevent morphing of this element and its subtree.
 */
export type UpdateCallback = (fromEl: HTMLElement, toEl: HTMLElement) => boolean;

/**
 * Returns false for elements that should not be morphed.
 * Elements inside a `[data-morph-persist]` container are left completely untouched.
 */
function isElementMorphable(fromEl: HTMLElement): boolean {
	return !fromEl.closest('[data-morph-persist]');
}

const builtInCallbacks: UpdateCallback[] = [isElementMorphable];

/**
 * Morph DOM nodes using morphlex.
 */
function morph(
	from: ChildNode,
	to: ChildNode | string,
	updateCallbacks: UpdateCallback[] = []
): void {
	const callbacks = [...builtInCallbacks, ...updateCallbacks];

	morphlex(from, to, {
		preserveChanges: true,
		beforeNodeVisited: (fromNode, toNode) => {
			if (!(fromNode instanceof HTMLElement) || !(toNode instanceof HTMLElement)) {
				return true;
			}

			// Only morph if no callback cancels it
			return callbacks
				.filter((cb) => typeof cb === 'function')
				.every((cb) => cb(fromNode, toNode) !== false);
		}
	});
}

export default morph;
