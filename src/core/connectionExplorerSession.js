import { loadHighEFactorCards } from "./connectionExplorer";
import { goToUid, sleep } from "./helperFunctions";
import {
	addConnectionContainer,
	removeConnectionContainer,
	addConnectionReturnButton,
	removeConnectionReturnButton,
	updateConnectionCounters,
	addConnectionExplorerStyles,
	removeConnectionExplorerStyles,
} from "../ui/connectionExplorerUI";
import { hideLeftSidebar, showLeftSidebar } from "../ui/hiding-sidebar";
import { setLoading } from "../ui/uiElements";

let connectionExplorerState = {
	cards: [],
	currentIndex: 0,
	isActive: false,
};

export const initConnectionExplorer = () => {
	if (!window.roamsr.connectionExplorer) {
		window.roamsr.connectionExplorer = {
			startSession: startConnectionExplorerSession,
			endSession: endConnectionExplorerSession,
			stepToNext: stepToNextCard,
			goToCurrentCard: goToCurrentConnectionCard,
			state: connectionExplorerState,
		};
	}
};

export const startConnectionExplorerSession = async () => {
	console.log("Starting Connection Explorer session...");

	setLoading(true);

	// Load high eFactor cards
	const cards = await loadHighEFactorCards(
		window.roamsr.settings,
		window.roamAlphaAPI.q,
		3.0 // eFactor threshold
	);

	setLoading(false);

	if (cards.length === 0) {
		alert("No cards with eFactor > 3.0 found (excluding already connected cards).");
		return;
	}

	connectionExplorerState.cards = cards;
	connectionExplorerState.currentIndex = 0;
	connectionExplorerState.isActive = true;

	console.log(`Found ${cards.length} high eFactor cards to explore.`);
	console.log(cards);

	// Add styles
	addConnectionExplorerStyles();

	// Hide left sidebar if configured
	if (window.roamsr.settings.closeLeftSideBar) {
		hideLeftSidebar();
	}

	// Go to first card
	await goToCurrentConnectionCard();

	// Update widget to show "End Session" button
	var widget = document.querySelector(".roamsr-widget");
	if (widget) {
		widget.innerHTML =
			"<div class='flex-h-box' style='padding: 5px 0px; width: 100%; height: 100%; align-items: center; justify-content: space-around'><div><span class='bp3-icon bp3-icon-cross'></span> END CONNECTION EXPLORER</div></div>";
		widget.firstChild.onclick = endConnectionExplorerSession;
	}
};

export const endConnectionExplorerSession = async () => {
	console.log("Ending Connection Explorer session.");

	connectionExplorerState.isActive = false;
	window.onhashchange = () => {};

	setLoading(true);

	// Remove UI elements
	var doStuff = async () => {
		removeConnectionContainer();
		removeConnectionReturnButton();
		removeConnectionExplorerStyles();
		await showLeftSidebar();
		goToUid();
	};

	await doStuff();
	await sleep(200);
	await doStuff(); // Again to make sure

	setLoading(false);

	// Reload cards to update count
	const cards = await loadHighEFactorCards(
		window.roamsr.settings,
		window.roamAlphaAPI.q,
		3.0
	);
	connectionExplorerState.cards = cards;
};

export const getCurrentConnectionCard = () => {
	return connectionExplorerState.cards[connectionExplorerState.currentIndex];
};

export const stepToNextCard = async () => {
	// Remove current card from the list
	connectionExplorerState.cards.splice(connectionExplorerState.currentIndex, 1);

	if (connectionExplorerState.cards.length === 0) {
		alert("All cards explored! Session ending.");
		await endConnectionExplorerSession();
	} else {
		// If we were at the last card, go back to the previous one
		if (connectionExplorerState.currentIndex >= connectionExplorerState.cards.length) {
			connectionExplorerState.currentIndex = connectionExplorerState.cards.length - 1;
		}
		await goToCurrentConnectionCard();
	}

	updateConnectionCounters(connectionExplorerState.cards);
};

export const goToCurrentConnectionCard = async () => {
	const currentCard = getCurrentConnectionCard();
	if (!currentCard) return;

	window.onhashchange = () => {};
	removeConnectionReturnButton();

	var doStuff = async () => {
		goToUid(currentCard.uid);
		await sleep(50);
		addConnectionContainer(connectionExplorerState.cards, connectionExplorerState.currentIndex);
	};

	await doStuff();
	await sleep(200);
	await doStuff(); // Again for reliability

	window.onhashchange = () => {
		removeConnectionContainer();
		addConnectionReturnButton();
		window.onhashchange = () => {};
	};
};
