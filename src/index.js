import Plugin from '@swup/plugin';
import morph from './morph';

export default class SwupMorphPlugin extends Plugin {
	name = 'SwupMorphPlugin';

	requires = { swup: '>=4' };

	defaults = {
		containers: [],
		updateCallbacks: []
	};

	constructor(options) {
		super();
		this.options = { ...this.defaults, ...options };
	}

	mount() {
		this.before('content:replace', this.validateContainers, { priority: 1 });
		this.on('content:replace', this.morphContainers);
	}

	validateContainers(visit) {
    // Filter out containers that are already managed by the morph plugin
		context.containers = context.containers.filter(selector => !this.options.containers.includes(selector));
	}

	morphContainers(visit, { page }) {
		const containers = this.getContainers();
		const newContainers = this.getNewContainers(page);
		const callbacks = this.options.updateCallbacks || [];

		containers.forEach(({ element }, index) => {
			const { element: newElement } = newContainers[index];
			if (element && newElement) {
				morph(element, newElement, callbacks);
			}
		});
	}

	getContainers(doc = document) {
		return this.options.containers.map((selector) => {
			const element = doc.querySelector(selector);
			return { element, selector };
		});
	}

	getNewContainers({ html }) {
		const doc = new DOMParser().parseFromString(html, 'text/html');
		return this.getContainers(doc);
	}
}
