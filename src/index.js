import Plugin from '@swup/plugin';
import morph from './morph';

export default class SwupMorphPlugin extends Plugin {
	name = 'SwupMorphPlugin';

	constructor(options) {
		super();
		const defaultOptions = {
			containers: [],
			updateCallbacks: []
		};

		this.options = {
			...defaultOptions,
			...options
		};

		this.contentReplacedHandler = this.morphContainers.bind(this);
	}

	mount() {
		this.validateContainers();
		this.swup.on('contentReplaced', this.contentReplacedHandler);
	}

	unmount() {
		this.swup.off('contentReplaced', this.contentReplacedHandler);
	}

	validateContainers() {
		this.swup.options.containers.forEach((entry) => {
			if (this.options.containers.includes(entry)) {
				throw new Error(
					`[swup-morph-plugin] Please remove '${entry}' from the swup main options to let morph plugin take over.`
				);
			}
		});
	}

	getContainers(doc = document) {
		return this.options.containers.map((selector) => {
			const element = doc.querySelector(selector);
			return { element, selector };
		});
	}

	getNewContainers() {
		const newDocument = this.getNewDocument();
		return this.getContainers(newDocument);
	}

	getNewDocument() {
		const pageContent = this.swup.cache.getCurrentPage().originalContent;
		const newDocument = document.createElement('div');
		newDocument.innerHTML = pageContent;
		return newDocument;
	}

	morphContainers() {
		const containers = this.getContainers();
		const newContainers = this.getNewContainers();
		const callbacks = this.options.updateCallbacks || [];

		containers.forEach(({ element }, index) => {
			const { element: newElement } = newContainers[index];
			if (element && newElement) {
				morph(element, newElement, callbacks);
			}
		});
	}
}
