// SPDX-FileCopyrightText: NOI Techpark <digital@noi.bz.it>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import "./polygon-app.js";
import "./polygon-controls.js";
import "./polygon-buffer.js";
import "./polygon-workspace.js";

window.addEventListener("DOMContentLoaded", () => {
	// Очищаю body и добавляю приложение
	document.body.innerHTML = "";
	const app = document.createElement("polygon-app");
	document.body.appendChild(app);
});

class HelloWorld extends HTMLElement {
	constructor() {
		super();

		this.shadow = this.attachShadow({ mode: "open" });
	}

	static get observedAttributes() {
		return ["title"];
	}

	attributeChangedCallback(propName, oldValue, newValue) {
		console.log(`Changing "${propName}" from "${oldValue}" to "${newValue}"`);
		if (propName === "title") {
			this.render();
		}
	}

	get title() {
		return this.getAttribute("title");
	}

	set title(newTitle) {
		this.setAttribute("title", newTitle);
	}

	connectedCallback() {
		this.render();
	}

	render() {
		this.shadow.innerHTML = `
            <style>
                h1 {
                    color: red;
                }
            </style>
            <h1>
                ${this.title}
            </h1>
        `;
	}
}

customElements.define("hello-world", HelloWorld);
