/**
 * Standalone Connection Explorer for Roam Research
 *
 * Displays spaced repetition blocks with eFactor > 3.0 one-by-one,
 * allowing you to explore connections in your knowledge graph.
 *
 * Configuration:
 * - MIN_EFACTOR: Minimum eFactor value (default: 3.0)
 * - SR_TAGS: Tags used for spaced repetition (default: ["sr"])
 * - CONNECTED_TAG: Tag to mark explored blocks (default: ".connected")
 *
 * Usage:
 * 1. Paste this code into a {{[[roam/js]]}} code block
 * 2. Click "🔗 Explore Connections" button in the sidebar
 * 3. Explore each block and click "Mark as Connected" or "Skip"
 */

(function() {
	'use strict';

	// Configuration
	const CONFIG = {
		MIN_EFACTOR: 3.0,
		SR_TAGS: ["sr"],
		CONNECTED_TAG: ".connected",
	};

	// State
	let explorerState = {
		cards: [],
		currentIndex: 0,
		isActive: false,
	};

	// Utility Functions
	const sleep = (ms = 100) => new Promise(resolve => setTimeout(resolve, ms));

	const goToUid = (uid) => {
		if (uid) {
			window.location.hash = `/page/${uid}`;
		} else {
			window.location.hash = `/page/${window.roamAlphaAPI.util.dateToPageUid(new Date())}`;
		}
	};

	const removeSelector = (selector) => {
		document.querySelectorAll(selector).forEach(el => el.remove());
	};

	// Extract eFactor from a block's children (looks for "eFactor:: 3.5" pattern)
	const extractEFactorFromChildren = (children) => {
		if (!children) return null;

		for (const child of children) {
			const match = child.string?.match(/^eFactor::\s*(\d+\.?\d*)/i);
			if (match) {
				return parseFloat(match[1]);
			}
		}
		return null;
	};

	// Find the highest eFactor from all references to a block
	const findHighestEFactor = (references) => {
		if (!references || references.length === 0) return null;

		let maxEFactor = null;

		for (const ref of references) {
			const eFactor = extractEFactorFromChildren(ref.children);
			if (eFactor !== null) {
				console.log('Found eFactor:', eFactor, 'in reference:', ref.uid);
				if (maxEFactor === null || eFactor > maxEFactor) {
					maxEFactor = eFactor;
				}
			}
		}

		return maxEFactor;
	};

	// Create query to find SR blocks and their references
	const createSRBlocksQuery = () => {
		const srTagsClause = "(or " + CONFIG.SR_TAGS.map(tag =>
			`[?srPage :node/title "${tag}"]`
		).join("\n") + ")";

		return `[
			:find (pull ?card [
				:block/string
				:block/uid
				{:block/refs [:node/title]}
			])
			:where
				${srTagsClause}
				[?card :block/refs ?srPage]
				(not-join [?card]
					[?connectedPage :node/title "${CONFIG.CONNECTED_TAG}"]
					[?card :block/refs ?connectedPage])
		]`;
	};

	// Create query to find all references to a specific block UID
	const createReferencesQuery = (uid) => {
		return `[
			:find (pull ?ref [
				:block/uid
				{:block/children [:block/string]}
			])
			:where
				[?card :block/uid "${uid}"]
				[?ref :block/refs ?card]
		]`;
	};

	// Load high eFactor cards
	const loadHighEFactorCards = async () => {
		// Step 1: Find all SR blocks
		const srQuery = createSRBlocksQuery();
		console.log('Finding SR blocks...');
		const srResults = await window.roamAlphaAPI.q(srQuery);
		console.log('Found', srResults.length, 'SR blocks');

		const cards = [];

		// Step 2: For each SR block, find its references and extract eFactor
		for (const result of srResults) {
			const srBlock = result[0];
			console.log('Checking SR block:', srBlock.uid, srBlock.string);

			// Find all references to this SR block
			const refsQuery = createReferencesQuery(srBlock.uid);
			const refsResults = await window.roamAlphaAPI.q(refsQuery);
			console.log('  Found', refsResults.length, 'references');

			const references = refsResults.map(r => r[0]);
			const eFactor = findHighestEFactor(references);

			if (eFactor !== null && eFactor > CONFIG.MIN_EFACTOR) {
				console.log('  ✓ Card accepted! eFactor:', eFactor);
				cards.push({
					uid: srBlock.uid,
					string: srBlock.string,
					eFactor: eFactor,
				});
			} else {
				console.log('  ✗ Filtered out - eFactor:', eFactor, 'threshold:', CONFIG.MIN_EFACTOR);
			}
		}

		console.log('Total cards after filtering:', cards.length);

		// Sort by eFactor (highest first)
		cards.sort((a, b) => b.eFactor - a.eFactor);

		return cards;
	};

	// Mark card as connected
	const markAsConnected = async (card) => {
		await window.roamAlphaAPI.updateBlock({
			block: {
				uid: card.uid,
				string: card.string + " #" + CONFIG.CONNECTED_TAG,
			},
		});
		await sleep();
	};

	// UI Functions
	const addStyles = () => {
		if (document.getElementById('connection-explorer-styles')) return;

		const css = `
			.ce-widget {
				padding: 8px 12px;
				margin: 8px 20px;
				background-color: rgba(138, 43, 226, 0.1);
				border-radius: 4px;
				cursor: pointer;
				display: flex;
				align-items: center;
				justify-content: center;
				font-weight: 500;
				color: #8a2be2;
			}
			.ce-widget:hover {
				background-color: rgba(138, 43, 226, 0.2);
			}
			.ce-wrapper {
				pointer-events: none;
				position: relative;
				bottom: 180px;
				display: flex;
				justify-content: center;
			}
			.ce-container {
				width: 100%;
				max-width: 600px;
				padding: 20px;
				background-color: rgba(255, 255, 255, 0.98);
				border-radius: 8px;
				box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
				border: 2px solid #8a2be2;
			}
			.ce-info {
				text-align: center;
				margin-bottom: 15px;
			}
			.ce-info-secondary {
				font-size: 12px;
				color: #666;
				margin-bottom: 5px;
			}
			.ce-info-primary {
				font-size: 20px;
				font-weight: bold;
				color: #8a2be2;
			}
			.ce-buttons {
				display: flex;
				justify-content: space-between;
				gap: 10px;
				pointer-events: all;
			}
			.ce-button {
				flex: 1;
				padding: 10px;
				border: none;
				border-radius: 4px;
				font-weight: 500;
				cursor: pointer;
				transition: all 0.2s;
			}
			.ce-button-primary {
				background-color: #8a2be2;
				color: white;
			}
			.ce-button-primary:hover {
				background-color: #9932cc;
			}
			.ce-button-secondary {
				background-color: #e0e0e0;
				color: #333;
			}
			.ce-button-secondary:hover {
				background-color: #d0d0d0;
			}
			.ce-return-button-container {
				z-index: 100000;
				margin: 5px 0px 5px 45px;
			}
			.ce-return-button {
				padding: 8px 16px;
			}
		`;

		const style = document.createElement('style');
		style.id = 'connection-explorer-styles';
		style.innerHTML = css;
		document.head.appendChild(style);
	};

	const addWidget = () => {
		if (document.querySelector('.ce-widget')) return;

		const sidebar = document.querySelector('.roam-sidebar-content');
		if (!sidebar) return;

		const widget = document.createElement('div');
		widget.className = 'ce-widget';
		widget.innerHTML = '🔗 Explore Connections';
		widget.onclick = startSession;

		const starredPages = document.querySelector('.starred-pages-wrapper');
		if (starredPages) {
			sidebar.insertBefore(widget, starredPages);
		} else {
			sidebar.appendChild(widget);
		}
	};

	const addContainer = () => {
		if (document.querySelector('.ce-container')) return;

		const card = explorerState.cards[explorerState.currentIndex];
		if (!card) return;

		const wrapper = document.createElement('div');
		wrapper.className = 'ce-wrapper';

		const container = document.createElement('div');
		container.className = 'ce-container';

		const info = document.createElement('div');
		info.className = 'ce-info';
		info.innerHTML = `
			<div class="ce-info-secondary">Card ${explorerState.currentIndex + 1} of ${explorerState.cards.length}</div>
			<div class="ce-info-primary">eFactor: ${card.eFactor.toFixed(2)}</div>
		`;

		const buttons = document.createElement('div');
		buttons.className = 'ce-buttons';

		const markButton = document.createElement('button');
		markButton.className = 'ce-button ce-button-primary';
		markButton.innerHTML = '✓ Mark as Connected';
		markButton.onclick = async () => {
			await markAsConnected(card);
			stepToNext();
		};

		const skipButton = document.createElement('button');
		skipButton.className = 'ce-button ce-button-secondary';
		skipButton.innerHTML = '→ Skip';
		skipButton.onclick = stepToNext;

		buttons.appendChild(markButton);
		buttons.appendChild(skipButton);

		container.appendChild(info);
		container.appendChild(buttons);
		wrapper.appendChild(container);

		document.querySelector('.roam-body-main').appendChild(wrapper);
	};

	const removeContainer = () => {
		removeSelector('.ce-wrapper');
	};

	const addReturnButton = () => {
		if (document.querySelector('.ce-return-button-container')) return;

		const container = document.createElement('div');
		container.className = 'flex-h-box ce-return-button-container';

		const button = document.createElement('button');
		button.className = 'bp3-button bp3-large ce-return-button';
		button.innerText = 'Return to Card';
		button.onclick = goToCurrentCard;

		container.appendChild(button);

		const main = document.querySelector('.roam-main');
		const body = document.querySelector('.roam-body-main');
		main.insertBefore(container, body);
	};

	const removeReturnButton = () => {
		removeSelector('.ce-return-button-container');
	};

	// Session Management
	const startSession = async () => {
		console.log('Starting Connection Explorer...');

		// Show loading
		const widget = document.querySelector('.ce-widget');
		if (widget) {
			const originalContent = widget.innerHTML;
			widget.innerHTML = '⏳ Loading...';
			widget.onclick = null;

			const cards = await loadHighEFactorCards();

			if (cards.length === 0) {
				alert(`No high eFactor cards found.\n\nLooking for:\n- Cards tagged with #${CONFIG.SR_TAGS.join(' or #')}\n- With eFactor > ${CONFIG.MIN_EFACTOR}\n- Not tagged with #${CONFIG.CONNECTED_TAG}\n\nNote: Cards must have "eFactor:: X.X" as a child block.`);
				widget.innerHTML = originalContent;
				widget.onclick = startSession;
				return;
			}

			explorerState.cards = cards;
			explorerState.currentIndex = 0;
			explorerState.isActive = true;

			console.log(`Found ${cards.length} high eFactor cards.`);

			widget.innerHTML = '✕ End Explorer';
			widget.onclick = endSession;
		}

		await goToCurrentCard();
	};

	const endSession = async () => {
		console.log('Ending Connection Explorer.');

		explorerState.isActive = false;
		window.onhashchange = null;

		removeContainer();
		removeReturnButton();

		goToUid();

		await sleep(200);

		const widget = document.querySelector('.ce-widget');
		if (widget) {
			widget.innerHTML = '🔗 Explore Connections';
			widget.onclick = startSession;
		}
	};

	const goToCurrentCard = async () => {
		const card = explorerState.cards[explorerState.currentIndex];
		if (!card) return;

		window.onhashchange = null;
		removeReturnButton();

		const doStuff = async () => {
			goToUid(card.uid);
			await sleep(100);
			addContainer();
		};

		await doStuff();
		await sleep(200);
		await doStuff();

		window.onhashchange = () => {
			removeContainer();
			addReturnButton();
			window.onhashchange = null;
		};
	};

	const stepToNext = async () => {
		// Remove current card from list
		explorerState.cards.splice(explorerState.currentIndex, 1);

		if (explorerState.cards.length === 0) {
			alert('All cards explored!');
			await endSession();
		} else {
			// If at last card, go back one
			if (explorerState.currentIndex >= explorerState.cards.length) {
				explorerState.currentIndex = explorerState.cards.length - 1;
			}
			await goToCurrentCard();
		}
	};

	// Initialize
	const init = () => {
		console.log('🔗 Connection Explorer loaded.');
		addStyles();
		addWidget();
	};

	// Run on load and when sidebar changes
	init();

	// Re-add widget if sidebar is rebuilt
	const observer = new MutationObserver(() => {
		if (document.querySelector('.roam-sidebar-content') && !document.querySelector('.ce-widget')) {
			addWidget();
		}
	});

	observer.observe(document.body, { childList: true, subtree: true });
})();
