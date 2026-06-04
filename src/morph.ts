import { morph as morphlex } from 'morphlex';

export type UpdateCallback = (fromEl: HTMLElement, toEl: HTMLElement) => boolean;

type ElementPropertyMap = {
	[key: string]: boolean;
};

/**
 * Morph dom nodes using morphlex, adding helpers and callbacks
 */

const inputTags: ElementPropertyMap = {
	INPUT: true,
	TEXTAREA: true,
	SELECT: true
};

const textInputTypes: ElementPropertyMap = {
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
	'textarea': true,
	'time': true,
	'url': true,
	'week': true
};

const permanentAttributeName = 'data-morph-persist';

function isTextInput(el: HTMLElement): boolean {
	return inputTags[el.tagName] && textInputTypes[(el as HTMLInputElement).type];
}

function verifyNotPermanent(fromEl: HTMLElement, toEl: HTMLElement): boolean {
	const permanent = fromEl.closest(`[${permanentAttributeName}]`);

	// only morph attributes on the active non-permanent text input
	if (!permanent && isTextInput(fromEl) && fromEl === document.activeElement) {
		const ignore: ElementPropertyMap = { value: true };
		Array.from(toEl.attributes).forEach((attribute) => {
			if (!ignore[attribute.name]) fromEl.setAttribute(attribute.name, attribute.value);
		});
		return false;
	}

	return !permanent;
}

function verifyNotContentEditable(fromEl: HTMLElement, toEl: HTMLElement): boolean {
	if (fromEl === document.activeElement && fromEl.isContentEditable) return false;
	return true;
}

const shouldMorphCallbacks = [verifyNotPermanent, verifyNotContentEditable];

function shouldMorph(fromEl: HTMLElement, toEl: HTMLElement, callbacks: UpdateCallback[]): boolean {
	const callbackResults = callbacks.map((callback) => {
		return typeof callback === 'function' ? callback(fromEl, toEl) : true;
	});
	return !callbackResults.includes(false);
}

function morph(from: ChildNode, to: ChildNode | string, updateCallbacks: UpdateCallback[] = []): void {
	const callbacks = [...shouldMorphCallbacks, ...updateCallbacks];
	return morphlex(from, to, {
		beforeNodeVisited: (fromNode, toNode) => {
			// Only run element callbacks for element nodes, skip text/comment nodes
			if (!(fromNode instanceof HTMLElement) || !(toNode instanceof HTMLElement)) {
				return true;
			}
			return shouldMorph(fromNode, toNode, callbacks);
		}
	});
}

export default morph;
