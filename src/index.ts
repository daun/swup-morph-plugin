import type { Handler, PageData } from 'swup';
import Plugin from '@swup/plugin';

import morph, { type UpdateCallback } from './morph.js';

type RequireKeys<T extends object, K extends keyof T> = Required<Pick<T, K>> & Omit<T, K>;

type Options = {
	containers: string[],
	updateCallbacks: UpdateCallback[]
};

type InitOptions = RequireKeys<Options, 'containers'>;

export default class SwupMorphPlugin extends Plugin {
	name = 'SwupMorphPlugin';

	requires = { swup: '>=4' };

	defaults: Options = {
		containers: [],
		updateCallbacks: []
	};
	options: Options;

	constructor(options: InitOptions) {
		super();
		this.options = { ...this.defaults, ...options };
	}

	mount() {
		this.before('content:replace', this.validateContainers, { priority: 1 });
		this.on('content:replace', this.morphContainers);
	}

	validateContainers: Handler<'content:replace'> = (visit) => {
    // Filter out containers that are already managed by the morph plugin
		visit.containers = visit.containers.filter(selector => !this.options.containers.includes(selector));
	}

	morphContainers: Handler<'content:replace'> = (visit, { page }) => {
		const containers = this.getContainers();
		const newContainers = this.getNewContainers(page);
		const callbacks = this.options.updateCallbacks || [];

		containers.forEach(({ element, selector }, index) => {
			const { element: newElement } = newContainers[index];
			if (element && newElement) {
				morph(element, newElement, callbacks);
			} else {
				console.warn(`SwupMorphPlugin: No container found for selector: ${selector}`);
			}
		});
	}

	getContainers(doc = document) {
		return this.options.containers.map((selector) => {
			const element = doc.querySelector(selector);
			return { element, selector };
		});
	}

	getNewContainers({ html }: PageData) {
		const doc = new DOMParser().parseFromString(html, 'text/html');
		return this.getContainers(doc);
	}
}
