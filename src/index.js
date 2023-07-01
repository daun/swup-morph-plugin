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

		this.validateContainers = this.validateContainers.bind(this);
		this.morphContainers = this.morphContainers.bind(this);
	}

	mount() {
		this.swup.hooks.before('replaceContent', this.validateContainers);
		this.swup.hooks.on('replaceContent', this.morphContainers);
	}

	unmount() {
		this.swup.hooks.off('replaceContent', this.validateContainers);
		this.swup.hooks.off('replaceContent', this.morphContainers);
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

	validateContainers(context, args) {
    // Filter out containers that are already managed by the morph plugin
		args.containers = args.containers.filter(selector => !this.options.containers.includes(selector));
	}

	morphContainers(context, { page }) {
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
}
