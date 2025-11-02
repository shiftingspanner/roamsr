/**
 * Standalone Connection Explorer for Roam Research
 *
 * Displays spaced repetition blocks one-by-one that are well-learned,
 * allowing you to explore connections in your knowledge graph.
 *
 * Configuration:
 * - MIN_REVIEWS: Minimum number of reviews required (default: 5)
 * - MIN_SUCCESS_RATE: Minimum success rate (Good/Easy responses) (default: 0.7 = 70%)
 * - SR_TAGS: Tags used for spaced repetition (default: ["sr"])
 *
 * Usage:
 * 1. Paste this code into a {{[[roam/js]]}} code block
 * 2. Click "Start Connection Explorer" button in the sidebar
 * 3. Explore each block and click "Mark as Connected" or "Skip"
 */

(function() {
	'use strict';

	// Configuration
	const CONFIG = {
		MIN_REVIEWS: 5,
		MIN_SUCCESS_RATE: 0.7,
		SR_TAGS: ["sr"],
		CONNECTED_TAG: ".connected",
		FLAG_TAG: "f",
	};

	// State
	let explorerState = {
		cards: [],
		currentIndex: 0,
		isActive: false,
	};

	// Utility Functions
	const sleep = (ms = 100) => new Promise(resolve => setTimeout(resolve, ms));

	const createUid = () => {
		return window.roamAlphaAPI.util.generateUID();
	};

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

	// Calculate quality score from review history
	const calculateCardQuality = (history) => {
		if (!history || history.length === 0) {
			return { score: 0, reviews: 0, successRate: 0 };
		}

		const completedReviews = history.filter(h => h.signal);
		const reviewCount = completedReviews.length;

		if (reviewCount === 0) {
			return { score: 0, reviews: 0, successRate: 0 };
		}

		// Count successful reviews (signal 3 = Good, 4 = Easy)
		const successfulReviews = completedReviews.filter(h =>
			h.signal === '3' || h.signal === '4'
		).length;

		const successRate = successfulReviews / reviewCount;

		// Quality score combines review count and success rate
		const score = reviewCount * successRate;

		return { score, reviews: reviewCount, successRate };
	};

	// Check if block is a review block
	const isReviewBlock = (block) => {
		return block._children &&
			block._children[0]?.refs?.some(ref => ref.title === "roam/sr/review");
	};

	// Extract signal from review block (r/1, r/2, r/3, r/4)
	const extractSignal = (block) => {
		return block.refs?.[0]?.title?.slice(2);
	};

	// Convert daily page UID to date
	const dailyPageUIDToDate = (uid) => {
		const month = parseInt(uid.slice(0, 2)) - 1;
		const day = parseInt(uid.slice(2, 4));
		const year = parseInt(uid.slice(4, 8));
		return new Date(year, month, day);
	};

	// Extract history from query result
	const extractHistory = (result) => {
		if (!result._refs) return [];

		return result._refs
			.filter(isReviewBlock)
			.map(block => ({
				date: dailyPageUIDToDate(block.page.uid),
				signal: extractSignal(block),
				uid: block.uid,
			}))
			.sort((a, b) => a.date - b.date);
	};

	// Create query for well-learned cards
	const createQuery = () => {
		const srTagsClause = "(or " + CONFIG.SR_TAGS.map(tag =>
			`[?srPage :node/title "${tag}"]`
		).join("\n") + ")";

		return `[
			:find (pull ?card [
				:block/string
				:block/uid
				{:block/refs [:node/title]}
				{:block/_refs [
					:block/uid
					:block/string
					{:block/_children [:block/uid {:block/refs [:node/title]}]}
					{:block/refs [:node/title]}
					{:block/page [:block/uid]}
				]}
			])
			:where
				${srTagsClause}
				[?card :block/refs ?srPage]
				(not-join [?card]
					[?connectedPage :node/title "${CONFIG.CONNECTED_TAG}"]
					[?card :block/refs ?connectedPage])
				(not-join [?card]
					[?flagPage :node/title "${CONFIG.FLAG_TAG}"]
					[?card :block/refs ?flagPage])
		]`;
	};

	// Load well-learned cards
	const loadWellLearnedCards = async () => {
		const query = createQuery();
		const results = await window.roamAlphaAPI.q(query);

		const cards = results
			.map(result => {
				const res = result[0];
				const history = extractHistory(res);
				const quality = calculateCardQuality(history);

				return {
					uid: res.uid,
					string: res.string,
					history: history,
					quality: quality,
				};
			})
			.filter(card =>
				card.uid &&
				card.quality.reviews >= CONFIG.MIN_REVIEWS &&
				card.quality.successRate >= CONFIG.MIN_SUCCESS_RATE
			);

		// Sort by quality score (highest first)
		cards.sort((a, b) => b.quality.score - a.quality.score);

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

	const removeWidget = () => {
		removeSelector('.ce-widget');
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
			<div class="ce-info-primary">
				${card.quality.reviews} reviews · ${(card.quality.successRate * 100).toFixed(0)}% success rate
			</div>
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

			const cards = await loadWellLearnedCards();

			if (cards.length === 0) {
				alert(`No well-learned cards found.\n\nCriteria:\n- At least ${CONFIG.MIN_REVIEWS} reviews\n- At least ${(CONFIG.MIN_SUCCESS_RATE * 100).toFixed(0)}% success rate\n- Not already tagged with #${CONFIG.CONNECTED_TAG}`);
				widget.innerHTML = originalContent;
				widget.onclick = startSession;
				return;
			}

			explorerState.cards = cards;
			explorerState.currentIndex = 0;
			explorerState.isActive = true;

			console.log(`Found ${cards.length} well-learned cards.`);

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
