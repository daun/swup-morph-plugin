import morphdom from 'morphdom';

/**
 * Morph dom nodes using morphdom, adding helpers and callbacks
 */

const inputTags = {
	INPUT: true,
	TEXTAREA: true,
	SELECT: true
};

const mutableTags = {
	INPUT: true,
	TEXTAREA: true,
	OPTION: true
};

const textInputTypes = {
	'datetime-local': true,
	'select-multiple': true,
	'select-one': true,
	color: true,
	date: true,
	datetime: true,
	email: true,
	month: true,
	number: true,
	password: true,
	range: true,
	search: true,
	tel: true,
	text: true,
	textarea: true,
	time: true,
	url: true,
	week: true
};

const permanentAttributeName = 'data-morph-persist';

export const isMutableElement = (el) => mutableTags[el.tagName];

export const isTextInput = (el) => inputTags[el.tagName] && textInputTypes[el.type];

const verifyNotMutable = (fromEl, toEl) => {
	// Skip nodes that are equal:
	// https://github.com/patrick-steele-idem/morphdom#can-i-make-morphdom-blaze-through-the-dom-tree-even-faster-yes
	if (!isMutableElement(fromEl) && fromEl.isEqualNode(toEl)) return false;
	return true;
};

const verifyNotPermanent = (fromEl, toEl) => {
	const permanent = fromEl.closest(`[${permanentAttributeName}]`);

	// only morph attributes on the active non-permanent text input
	if (!permanent && isTextInput(fromEl) && fromEl === document.activeElement) {
		const ignore = { value: true };
		Array.from(toEl.attributes).forEach((attribute) => {
			if (!ignore[attribute.name]) fromEl.setAttribute(attribute.name, attribute.value);
		});
		return false;
	}

	return !permanent;
};

export const shouldMorphCallbacks = [verifyNotMutable, verifyNotPermanent];

const shouldMorph = (fromEl, toEl, callbacks = []) => {
	const callbackResults = callbacks.map((callback) => {
		return typeof callback === 'function' ? callback(fromEl, toEl) : true;
	});
	return !callbackResults.includes(false);
};

const morph = (from, to, updateCallbacks = []) => {
	const callbacks = [...shouldMorphCallbacks, ...updateCallbacks];
	morphdom(from, to, {
		onBeforeElUpdated: (fromEl, toEl) => shouldMorph(fromEl, toEl, callbacks)
	});
};

export default morph;
