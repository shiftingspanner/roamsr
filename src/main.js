/* roam/sr - Spaced Repetition in Roam Research
   Author: Adam Krivka
   v1.1.0
   https://github.com/aidam38/roamsr
 */

import { loadSettings, loadState } from "./core/sessions";
import { buttonClickHandler } from "./ui/srButton";
import { standbyState } from "./core/state";
import { addBasicStyles } from "./ui/styles";
import { addDelimiter, addWidget } from "./ui/uiElements";
import { initConnectionExplorer } from "./core/connectionExplorerSession";

export const init = () => {
	var VERSION = "v1.1.0";

	if (!window.roamsr) window.roamsr = { state: {}, settings: {} };

	console.log("🗃️ Loading roam/sr " + VERSION + ".");

	standbyState();

	document.addEventListener("click", buttonClickHandler, false);

	loadSettings();
	addBasicStyles();
	loadState(-1).then(() => {
		addDelimiter();
		addWidget();
		initConnectionExplorer();
	});

	console.log("🗃️ Successfully loaded roam/sr " + VERSION + ".");
};

init();
