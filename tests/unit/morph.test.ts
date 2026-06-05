import { describe, expect, it, vi } from 'vitest';

import morph from '../../src/morph.js';

/** Render an HTML string into a detached element we can morph. */
function el(html: string): HTMLElement {
	const wrapper = document.createElement('div');
	wrapper.innerHTML = html.trim();
	return wrapper.firstElementChild as HTMLElement;
}

describe('morph', () => {
	it('updates attributes and text content in place', () => {
		const from = el('<nav id="nav" class="en"><a href="/en">Home</a></nav>');
		const to = el('<nav id="nav" class="de"><a href="/de">Start</a></nav>');

		morph(from, to);

		expect(from.className).toBe('de');
		expect(from.querySelector('a')?.getAttribute('href')).toBe('/de');
		expect(from.querySelector('a')?.textContent).toBe('Start');
	});

	it('preserves the original node identity and event listeners', () => {
		const from = el('<nav id="nav"><button>Toggle</button></nav>');
		const to = el('<nav id="nav"><button>Toggle</button></nav>');

		const button = from.querySelector('button')!;
		const onClick = vi.fn();
		button.addEventListener('click', onClick);

		morph(from, to);

		// The same button node is kept, so its listener survives the morph
		expect(from.querySelector('button')).toBe(button);
		button.dispatchEvent(new window.Event('click'));
		expect(onClick).toHaveBeenCalledTimes(1);
	});

	it('accepts an HTML string as the morph target', () => {
		const from = el('<nav id="nav" class="en"></nav>');

		morph(from, '<nav id="nav" class="de"></nav>');

		expect(from.className).toBe('de');
	});

	it('skips elements marked with data-swup-morph-ignore', () => {
		const from = el('<nav id="nav"><span data-swup-morph-ignore class="keep">old</span></nav>');
		const to = el('<nav id="nav"><span data-swup-morph-ignore class="changed">new</span></nav>');

		morph(from, to);

		const persisted = from.querySelector('[data-swup-morph-ignore]')!;
		expect(persisted.className).toBe('keep');
		expect(persisted.textContent).toBe('old');
	});

	it('skips elements nested inside a data-swup-morph-ignore container', () => {
		const from = el('<nav id="nav" data-swup-morph-ignore><a class="old">old</a></nav>');
		const to = el('<nav id="nav" data-swup-morph-ignore><a class="new">new</a></nav>');

		morph(from, to);

		expect(from.querySelector('a')?.className).toBe('old');
	});

	it('runs custom update callbacks and aborts the update when one returns false', () => {
		const from = el('<nav id="nav"><a class="old">old</a></nav>');
		const to = el('<nav id="nav"><a class="new">new</a></nav>');

		const callback = vi.fn((fromEl: HTMLElement) => {
			// Veto updates to anchors
			return fromEl.tagName !== 'A';
		});

		morph(from, to, [callback]);

		expect(callback).toHaveBeenCalled();
		// Anchor update was vetoed, so it keeps its old class and text
		expect(from.querySelector('a')?.className).toBe('old');
		expect(from.querySelector('a')?.textContent).toBe('old');
	});

	it('lets custom callbacks mutate the incoming element to persist attributes', () => {
		const from = el('<nav id="nav"><button aria-pressed="true">x</button></nav>');
		const to = el('<nav id="nav"><button>y</button></nav>');

		const persistAriaPressed = (fromEl: HTMLElement, toEl: HTMLElement) => {
			if (fromEl.hasAttribute('aria-pressed')) {
				toEl.setAttribute('aria-pressed', fromEl.getAttribute('aria-pressed')!);
			}
			return true;
		};

		morph(from, to, [persistAriaPressed]);

		expect(from.querySelector('button')?.getAttribute('aria-pressed')).toBe('true');
		expect(from.querySelector('button')?.textContent).toBe('y');
	});

	it('preserves the value of a focused text input', () => {
		document.body.innerHTML = '<form id="form"><input type="text" name="q" /></form>';
		const from = document.getElementById('form') as HTMLFormElement;
		const input = from.querySelector('input')!;
		input.value = 'user typed';
		input.focus();

		const to = el('<form id="form"><input type="text" name="q" value="server" /></form>');

		morph(from, to);

		// The active input keeps the user's value instead of the server value
		expect(input.value).toBe('user typed');
	});
});
