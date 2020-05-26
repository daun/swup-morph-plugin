import Plugin from '@swup/plugin';
import morphdom from 'morphdom';

export default class SwupMorphPlugin extends Plugin {
	name = 'SwupMorphPlugin';

	constructor(options) {
		super();
		const defaultOptions = {
			containers: []
		};

		this.options = {
			...defaultOptions,
			...options
		};

		this.contentReplacedHandler = this.morphContainers.bind(this);
	}

	mount() {
		this.swup.on('contentReplaced', this.contentReplacedHandler);
	}

	unmount() {
		this.swup.off('contentReplaced', this.contentReplacedHandler);
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
		let newDocument = document.createElement('div');
		newDocument.innerHTML = pageContent;
		return newDocument;
	}

	morphContainers() {
		const containers = this.getContainers();
		const newContainers = this.getNewContainers();

		containers.forEach(({ element }, index) => {
			const { element: newElement } = newContainers[index];
			if (element && newElement) {
				morphdom(element, newElement);
			}
		});
	}
}
