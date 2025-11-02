import { calcLastFactorAndInterval } from "../schedulers/ankiScheduler";
import { dailyPageUIDToCrossBrowserDate, sleep } from "./helperFunctions";

const recurDeck = (part) => {
	const result = [];
	if (part.refs) result.push(...part.refs);
	if (part._children && part._children.length > 0) result.push(...recurDeck(part._children[0]));
	return result;
};

const getDecks = (res, settings) => {
	const possibleDecks = recurDeck(res).map((deck) => deck.title);
	return possibleDecks.filter((deckTag) => settings.customDecks.map((customDeck) => customDeck.tag).includes(deckTag));
};

const getAlgorithmConfig = (res, settings) => {
	const decks = getDecks(res, settings);
	let preferredDeck;
	if (decks && decks.length > 0) {
		preferredDeck = settings.customDecks.filter((customDeck) => customDeck.tag == decks[decks.length - 1])[0];
	} else preferredDeck = settings.defaultDeck;

	return preferredDeck.config;
};

const isReviewBlock = (block) =>
	block._children &&
		block._children[0].refs
		? block._children[0].refs.map((ref2) => ref2.title).includes("roam/sr/review")
		: false;

const extractSignalFromReviewBlock = (block) => (block.refs && block.refs[0] && block.refs[0].title.slice(2));

const reviewBlockToHistoryUnit = (block) => {
	return {
		date: dailyPageUIDToCrossBrowserDate(block.page.uid),
		signal: extractSignalFromReviewBlock(block),
		uid: block.uid,
		string: block.string,
	};
};

const extractHistoryFromQueryResult = (result) => {
	if (result._refs) {
		return result._refs
			.filter(isReviewBlock)
			.map(reviewBlockToHistoryUnit)
			.sort((a, b) => a.date - b.date);
	} else return [];
};

// Calculate the eFactor for a card based on its history
const calculateEFactor = (history, config) => {
	if (!history || history.length === 0) {
		return config.defaultFactor || 2.5;
	}

	// Filter out review blocks that don't have a signal (future scheduled reviews)
	const completedHistory = history.filter(h => h.signal);

	if (completedHistory.length === 0) {
		return config.defaultFactor || 2.5;
	}

	const [eFactor, _] = calcLastFactorAndInterval(config, completedHistory);
	return eFactor;
};

const srPageTagsToClause = (tags) => "(or " + tags.map((tag) => `[?srPage :node/title "${tag}"]`).join("\n") + ")";

// Query for all cards with eFactor > 3.0 that don't have #.connected tag
const createQueryForHighEFactorCards = (settings, eFactorThreshold = 3.0) => `[
	:find (pull ?card [
		:block/string
		:block/uid
		{:block/refs [:node/title]}
		{:block/_refs
			[:block/uid :block/string
			 {:block/_children
					[:block/uid {:block/refs [:node/title]}]}
			 {:block/refs [:node/title]}
			 {:block/page [:block/uid]}]}
		{:block/_children ...}
	])
	:where
		${srPageTagsToClause(settings.mainTags)}
		[?card :block/refs ?srPage]
		(not-join [?card]
			[?connectedPage :node/title ".connected"]
			[?card :block/refs ?connectedPage])
		(not-join [?card]
			[?flagPage :node/title "${settings.flagTag}"]
			[?card :block/refs ?flagPage])
		(not-join [?card]
			[?queryPage :node/title "query"]
			[?card :block/refs ?queryPage])
]`;

export const loadHighEFactorCards = async (settings, asyncQueryFunction, eFactorThreshold = 3.0) => {
	const query = createQueryForHighEFactorCards(settings, eFactorThreshold);
	const queryResults = await asyncQueryFunction(query);

	const cards = queryResults
		.map((result) => {
			let res = result[0];
			const history = extractHistoryFromQueryResult(res);
			const config = getAlgorithmConfig(res, settings);
			const eFactor = calculateEFactor(history, config);

			return {
				uid: res.uid,
				string: res.string,
				history: history,
				eFactor: eFactor,
				decks: getDecks(res, settings),
			};
		})
		.filter((card) => card.eFactor > eFactorThreshold)
		.filter((card) => card.uid);

	// Sort by eFactor descending (highest first)
	cards.sort((a, b) => b.eFactor - a.eFactor);

	return cards;
};

// Mark a card as connected
export const markAsConnected = async (card) => {
	await window.roamAlphaAPI.updateBlock({
		block: {
			uid: card.uid,
			string: card.string + " #.connected",
		},
	});
	await sleep();
};
