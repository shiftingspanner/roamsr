import { removeSelector } from "../core/helperFunctions";
import { markAsConnected } from "../core/connectionExplorer";

// Get the counter for high eFactor cards
export const getConnectionCounter = (cards) => {
	const cardCount = cards ? cards.length : 0;

	var counter = Object.assign(document.createElement("div"), {
		className: "roamsr-connection-counter",
		innerHTML: `<span style="color: purple; padding-right: 8px">` + cardCount + ` high eFactor cards</span>`,
	});
	return counter;
};

export const updateConnectionCounters = (cards) => {
	document.querySelectorAll(".roamsr-connection-counter").forEach((counter) => {
		counter.innerHTML = getConnectionCounter(cards).innerHTML;
	});
};

// CONTAINER
export const addConnectionContainer = (cards, currentIndex) => {
	if (!document.querySelector(".roamsr-connection-container")) {
		var wrapper = Object.assign(document.createElement("div"), {
			className: "flex-h-box roamsr-connection-wrapper",
		});
		var container = Object.assign(document.createElement("div"), {
			className: "flex-v-box roamsr-connection-container",
		});

		// Display current card info
		const currentCard = cards[currentIndex];
		const cardInfo = Object.assign(document.createElement("div"), {
			className: "roamsr-connection-card-info",
			innerHTML: `
				<div style="text-align: center; margin-bottom: 10px;">
					<div style="font-size: 14px; color: #888;">Card ${currentIndex + 1} of ${cards.length}</div>
					<div style="font-size: 18px; font-weight: bold; color: purple;">eFactor: ${currentCard.eFactor.toFixed(2)}</div>
				</div>
			`,
		});

		var buttonContainer = Object.assign(document.createElement("div"), {
			className: "flex-h-box roamsr-connection-button-container",
		});

		var markConnectedButton = Object.assign(document.createElement("button"), {
			className: "bp3-button roamsr-button",
			innerHTML: "Mark as Connected",
			onclick: async () => {
				await markAsConnected(currentCard);
				window.roamsr.connectionExplorer.stepToNext();
			},
		});

		var skipButton = Object.assign(document.createElement("button"), {
			className: "bp3-button roamsr-button",
			innerHTML: "Skip",
			onclick: () => {
				window.roamsr.connectionExplorer.stepToNext();
			},
		});

		buttonContainer.style.cssText = "justify-content: space-between; margin-top: 10px;";
		buttonContainer.append(markConnectedButton, skipButton);

		container.append(cardInfo, getConnectionCounter(cards), buttonContainer);
		wrapper.append(container);

		var bodyDiv = document.querySelector(".roam-body-main");
		bodyDiv.append(wrapper);
	}
};

export const removeConnectionContainer = () => {
	removeSelector(".roamsr-connection-wrapper");
};

// RETURN BUTTON
export const addConnectionReturnButton = () => {
	var returnButtonClass = "roamsr-connection-return-button-container";
	if (document.querySelector("." + returnButtonClass)) return;

	var main = document.querySelector(".roam-main");
	var body = document.querySelector(".roam-body-main");
	var returnButtonContainer = Object.assign(document.createElement("div"), {
		className: "flex-h-box " + returnButtonClass,
	});
	var returnButton = Object.assign(document.createElement("button"), {
		className: "bp3-button bp3-large roamsr-connection-return-button",
		innerText: "Return to Card",
		onclick: () => {
			if (window.roamsr.connectionExplorer && window.roamsr.connectionExplorer.goToCurrentCard) {
				window.roamsr.connectionExplorer.goToCurrentCard();
			}
		},
	});
	returnButtonContainer.append(returnButton);
	main.insertBefore(returnButtonContainer, body);
};

export const removeConnectionReturnButton = () => {
	removeSelector(".roamsr-connection-return-button-container");
};

// Add styles for connection explorer
export const addConnectionExplorerStyles = () => {
	if (document.getElementById("roamsr-connection-explorer-css")) return;

	const css = `
.roamsr-connection-wrapper {
	pointer-events: none;
	position: relative;
	bottom: 180px;
	justify-content: center;
}

.roamsr-connection-container {
	width: 100%;
	max-width: 600px;
	justify-content: center;
	align-items: center;
	padding: 15px 20px;
	background-color: rgba(255, 255, 255, 0.95);
	border-radius: 8px;
	box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.roamsr-connection-button-container {
	width: 100%;
	pointer-events: all;
}

.roamsr-connection-card-info {
	width: 100%;
	margin-bottom: 10px;
}

.roamsr-connection-return-button-container {
	z-index: 100000;
	margin: 5px 0px 5px 45px;
}

.roamsr-connection-counter {
	text-align: center;
	padding: 8px;
	font-weight: bold;
}
	`;

	var styles = Object.assign(document.createElement("style"), {
		id: "roamsr-connection-explorer-css",
		innerHTML: css,
	});
	document.getElementsByTagName("head")[0].appendChild(styles);
};

export const removeConnectionExplorerStyles = () => {
	const element = document.getElementById("roamsr-connection-explorer-css");
	if (element) element.remove();
};
