class PolygonControls extends HTMLElement {
	constructor() {
		super();
		const shadow = this.attachShadow({ mode: "open" });
		shadow.innerHTML = `
      <style>
        .controls {
          display: flex;
          justify-content: space-between;
          background: #444;
          padding: 12px 24px;
          border-radius: 4px;
          margin-bottom: 12px;
        }
        button {
          background: #aaa;
          border: none;
          border-radius: 4px;
          padding: 8px 24px;
          font-size: 1em;
          cursor: pointer;
          margin-left: 8px;
        }
        button:active {
          background: #888;
        }
      </style>
      <div class="controls">
        <div>
          <button id="create">Создать</button>
        </div>
        <div>
          <button id="save">Сохранить</button>
          <button id="reset">Сбросить</button>
        </div>
      </div>
    `;
	}

	connectedCallback() {
		this.shadowRoot
			.getElementById("create")
			.addEventListener("click", this.handleCreate);
	}

	disconnectedCallback() {
		this.shadowRoot
			.getElementById("create")
			.removeEventListener("click", this.handleCreate);
	}

	handleCreate = () => {
		window.dispatchEvent(new CustomEvent("polygon-create"));
	};
}
customElements.define("polygon-controls", PolygonControls);
