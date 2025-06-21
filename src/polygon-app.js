class PolygonApp extends HTMLElement {
	constructor() {
		super();
		const shadow = this.attachShadow({ mode: "open" });
		shadow.innerHTML = `
      <style>
        :host {
          display: block;
          font-family: Arial, sans-serif;
          background: #fff;
          min-height: 100vh;
        }
        .title {
          font-size: 1.3em;
          font-weight: bold;
          margin-bottom: 10px;
        }
        .container {
          margin: 10px;
        }
      </style>
      <div class="container">
        <div class="title">Интерфейс приложения:</div>
        <polygon-controls></polygon-controls>
        <polygon-buffer></polygon-buffer>
        <polygon-workspace></polygon-workspace>
      </div>
    `;
	}

	connectedCallback() {
		this.buffer = this.shadowRoot.querySelector("polygon-buffer");
		this.workspace = this.shadowRoot.querySelector("polygon-workspace");
		this.controls = this.shadowRoot.querySelector("polygon-controls");
		this.controls.shadowRoot
			.getElementById("save")
			.addEventListener("click", this.handleSave);
		this.controls.shadowRoot
			.getElementById("reset")
			.addEventListener("click", this.handleReset);
		this.loadState();
	}

	disconnectedCallback() {
		this.controls.shadowRoot
			.getElementById("save")
			.removeEventListener("click", this.handleSave);
		this.controls.shadowRoot
			.getElementById("reset")
			.removeEventListener("click", this.handleReset);
	}

	handleSave = () => {
		const bufferPolys = this.buffer.polygons;
		const workspacePolys = this.workspace.polygons;
		const state = {
			buffer: bufferPolys,
			workspace: workspacePolys,
		};
		localStorage.setItem("polygon-app-state", JSON.stringify(state));
	};

	handleReset = () => {
		localStorage.removeItem("polygon-app-state");
		if (this.buffer) this.buffer.polygons = [];
		if (this.workspace) this.workspace.polygons = [];
		if (this.buffer) this.buffer.renderPolygons();
		if (this.workspace) this.workspace.renderPolygons();
	};

	loadState() {
		const stateStr = localStorage.getItem("polygon-app-state");
		if (stateStr) {
			try {
				const state = JSON.parse(stateStr);
				if (this.buffer && Array.isArray(state.buffer)) {
					this.buffer.polygons = state.buffer;
					this.buffer.renderPolygons();
				}
				if (this.workspace && Array.isArray(state.workspace)) {
					this.workspace.polygons = state.workspace;
					this.workspace.renderPolygons();
				}
			} catch (e) {
				// ignore
			}
		}
	}
}
customElements.define("polygon-app", PolygonApp);
