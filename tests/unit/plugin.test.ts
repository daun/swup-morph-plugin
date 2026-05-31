import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';

import Swup, { type Visit } from 'swup';

import SwupMorphPlugin from '../../src/index.js';

/** Parse an HTML string into a Document, as swup does for the incoming page. */
function doc(html: string): Document {
	return new window.DOMParser().parseFromString(html, 'text/html');
}

describe('SwupMorphPlugin', () => {
	let swup: Swup;

	beforeEach(() => {
		document.body.innerHTML = '<div id="swup"></div>';
		swup = new Swup();
	});

	afterEach(() => {
		swup.destroy();
	});

	/** Create a plugin, register it with swup and return it. */
	function mount(options: ConstructorParameters<typeof SwupMorphPlugin>[0] = {}) {
		const plugin = new SwupMorphPlugin(options);
		swup.use(plugin);
		return plugin;
	}

	/** Create a fresh visit object for the given destination. */
	function createVisit(): Visit {
		// @ts-ignore - createVisit is marked internal
		return swup.createVisit({ to: '/' });
	}

	describe('metadata', () => {
		it('has a name', () => {
			expect(mount().name).toBe('SwupMorphPlugin');
		});

		it('requires a compatible swup version', () => {
			expect(mount().requires).toEqual({ swup: '>=4.6' });
		});
	});

	describe('options', () => {
		it('defaults to empty containers and callbacks', () => {
			const plugin = mount();
			expect(plugin.options.containers).toEqual([]);
			expect(plugin.options.updateCallbacks).toEqual([]);
		});

		it('merges provided options with the defaults', () => {
			const callback = () => true;
			const plugin = mount({ containers: ['#nav'], updateCallbacks: [callback] });
			expect(plugin.options.containers).toEqual(['#nav']);
			expect(plugin.options.updateCallbacks).toEqual([callback]);
		});
	});

	describe('container selectors', () => {
		it('collects explicit selectors from the containers option', () => {
			const plugin = mount({ containers: ['#nav', '#footer'] });
			expect((plugin as any).getContainerSelectors()).toEqual(['#nav', '#footer']);
		});

		it('collects implicit selectors from data-swup-morph attributes', () => {
			document.body.innerHTML = `
				<nav data-swup-morph="nav"></nav>
				<aside data-swup-morph="sidebar"></aside>
				<div id="swup"></div>
			`;
			const plugin = mount();
			expect((plugin as any).getContainerSelectors()).toEqual([
				"[data-swup-morph='nav']",
				"[data-swup-morph='sidebar']"
			]);
		});

		it('ignores empty data-swup-morph attributes', () => {
			document.body.innerHTML = '<nav data-swup-morph=""></nav><div id="swup"></div>';
			const plugin = mount();
			expect((plugin as any).getContainerSelectors()).toEqual([]);
		});

		it('combines explicit and implicit selectors without duplicates', () => {
			document.body.innerHTML = '<nav data-swup-morph="nav"></nav><div id="swup"></div>';
			const plugin = mount({ containers: ['#header', "[data-swup-morph='nav']"] });
			expect((plugin as any).getContainerSelectors()).toEqual([
				'#header',
				"[data-swup-morph='nav']"
			]);
		});
	});

	describe('container validation', () => {
		it('removes morph containers from the list of swup containers', () => {
			const plugin = mount({ containers: ['#nav'] });
			const visit = createVisit();
			visit.containers = ['#swup', '#nav'];

			(plugin as any).validateContainers(visit);

			expect(visit.containers).toEqual(['#swup']);
		});

		it('leaves unrelated containers untouched', () => {
			const plugin = mount({ containers: ['#nav'] });
			const visit = createVisit();
			visit.containers = ['#swup', '#main'];

			(plugin as any).validateContainers(visit);

			expect(visit.containers).toEqual(['#swup', '#main']);
		});
	});

	describe('morphing', () => {
		it('morphs configured containers from the incoming document', () => {
			document.body.innerHTML =
				'<nav id="nav" class="en"><a href="/en">Home</a></nav><div id="swup"></div>';
			const plugin = mount({ containers: ['#nav'] });

			const visit = createVisit();
			visit.to.document = doc('<nav id="nav" class="de"><a href="/de">Start</a></nav>');

			(plugin as any).morphContainers(visit);

			const nav = document.querySelector('#nav')!;
			expect(nav.className).toBe('de');
			expect(nav.querySelector('a')?.getAttribute('href')).toBe('/de');
			expect(nav.querySelector('a')?.textContent).toBe('Start');
		});

		it('passes update callbacks through to the morph', () => {
			document.body.innerHTML =
				'<nav id="nav"><a class="old">old</a></nav><div id="swup"></div>';
			const callback = vi.fn(() => true);
			const plugin = mount({ containers: ['#nav'], updateCallbacks: [callback] });

			const visit = createVisit();
			visit.to.document = doc('<nav id="nav"><a class="new">new</a></nav>');

			(plugin as any).morphContainers(visit);

			expect(callback).toHaveBeenCalled();
			expect(document.querySelector('#nav a')?.className).toBe('new');
		});

		it('warns when a configured container is missing from the page', () => {
			document.body.innerHTML = '<div id="swup"></div>';
			const plugin = mount({ containers: ['#nav'] });
			const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

			const visit = createVisit();
			visit.to.document = doc('<div id="swup"></div>');

			(plugin as any).morphContainers(visit);

			expect(warn).toHaveBeenCalledWith(expect.stringContaining('#nav'));
		});

		it('does not warn for implicit data-swup-morph containers', () => {
			document.body.innerHTML = '<nav data-swup-morph="nav"></nav><div id="swup"></div>';
			const plugin = mount();
			const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

			const visit = createVisit();
			// Incoming page is missing the morph container
			visit.to.document = doc('<div id="swup"></div>');

			(plugin as any).morphContainers(visit);

			expect(warn).not.toHaveBeenCalled();
		});
	});

	describe('content:replace hook', () => {
		it('validates and morphs containers when the hook runs', async () => {
			document.body.innerHTML =
				'<nav id="nav" class="en"></nav><div id="swup"></div>';
			mount({ containers: ['#nav'] });

			const visit = createVisit();
			visit.containers = ['#nav', '#swup'];
			visit.to.document = doc('<nav id="nav" class="de"></nav><div id="swup"></div>');

			await swup.hooks.call('content:replace', visit, {
				// @ts-ignore - minimal page payload for the hook
				page: { url: '/', html: '' }
			});

			// validateContainers dropped the morph container from the swap list
			expect(visit.containers).toEqual(['#swup']);
			// morphContainers updated the morph container in place
			expect(document.querySelector('#nav')?.className).toBe('de');
		});
	});
});
