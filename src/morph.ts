import { morph as morphlex } from 'morphlex';

/**
 * Callback to decide whether an element should be morphed.
 * Return `false` to prevent morphing of this element and its subtree.
 */
export type UpdateCallback = (fromEl: HTMLElement, toEl: HTMLElement) => boolean;

const formInputTags: Record<string, boolean> = {
	INPUT: true,
	TEXTAREA: true,
	SELECT: true
};

const textLikeInputTypes: Record<string, boolean> = {
	'datetime-local': true,
	'select-multiple': true,
	'select-one': true,
	'color': true,
	'date': true,
	'datetime': true,
	'email': true,
	'month': true,
	'number': true,
	'password': true,
	'range': true,
	'search': true,
	'tel': true,
	'text': true,
	'time': true,
	'url': true,
	'week': true
};

function isTextInput(el: HTMLElement): boolean {
	return formInputTags[el.tagName] && textLikeInputTypes[(el as HTMLInputElement).type];
}

/**
 * Returns `false` for elements that should not be morphed:
 *
 * 1. Elements inside a `[data-morph-persist]` container — leave the subtree untouched.
 * 2. The currently focused text input — sync non-value attributes from the incoming
 *    DOM so the element stays up-to-date, but skip morphlex processing so the user's
 *    typed value and cursor position are preserved.
 */
function isElementMorphable(fromEl: HTMLElement, toEl: HTMLElement): boolean {
	if (fromEl.closest('[data-morph-persist]')) {
		return false;
	}

	if (isTextInput(fromEl) && fromEl === document.activeElement) {
		for (const { name, value } of toEl.attributes) {
			if (name !== 'value') fromEl.setAttribute(name, value);
		}
		return false;
	}

	return true;
}

const builtInCallbacks: UpdateCallback[] = [isElementMorphable];

/**
 * Morph DOM nodes using morphlex.
 */
function morph(from: ChildNode, to: ChildNode | string, updateCallbacks: UpdateCallback[] = []): void {
	const callbacks = [...builtInCallbacks, ...updateCallbacks];

	morphlex(from, to, {
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
