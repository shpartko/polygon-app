class PolygonBuffer extends HTMLElement {
	constructor() {
		super();
		this.shadow = this.attachShadow({ mode: "open" });
		this.shadow.innerHTML = `
      <style>
        .buffer {
          background: #2d2d2d;
          min-height: 200px;
          margin-bottom: 8px;
		  padding: 10px;
          display: flex;
          flex-wrap: wrap;
          align-items: flex-start;
          justify-content: flex-start;
          gap: 16px;
          border-radius: 2px;
        }
      </style>
      <div class="buffer"></div>
    `;
		this.bufferDiv = this.shadow.querySelector(".buffer");
		this.polygons = [];
	}

	connectedCallback() {
		window.addEventListener("polygon-create", this.generatePolygons);
		window.addEventListener("polygon-drop-to-buffer", this.handleDropToBuffer);
		this.renderPolygons();
		this.bufferDiv.addEventListener("dragover", this.handleDragOver);
		this.bufferDiv.addEventListener("drop", this.handleDrop);
	}

	disconnectedCallback() {
		window.removeEventListener("polygon-create", this.generatePolygons);
		window.removeEventListener(
			"polygon-drop-to-buffer",
			this.handleDropToBuffer,
		);
		this.bufferDiv.removeEventListener("dragover", this.handleDragOver);
		this.bufferDiv.removeEventListener("drop", this.handleDrop);
	}

	generatePolygons = () => {
		this.polygons = [];
		const count = Math.floor(Math.random() * 16) + 5;
		for (let i = 0; i < count; i++) {
			this.polygons.push(this.createRandomPolygonData());
		}
		this.renderPolygons();
	};

	createRandomPolygonData() {
		const w = 100,
			h = 100;
		const n = Math.floor(Math.random() * 4) + 5;
		const cx = w / 2,
			cy = h / 2,
			r = 40;
		const points = [];
		for (let i = 0; i < n; i++) {
			const angle = (2 * Math.PI * i) / n + Math.random() * 0.3;
			const px = cx + r * Math.cos(angle) * (0.8 + Math.random() * 0.4);
			const py = cy + r * Math.sin(angle) * (0.8 + Math.random() * 0.4);
			points.push([px, py]);
		}
		return {
			id: crypto.randomUUID(),
			w,
			h,
			points,
			fill: "#900025",
		};
	}

	renderPolygons() {
		this.bufferDiv.innerHTML = "";
		for (const poly of this.polygons) {
			const wrapper = document.createElement("div");
			wrapper.setAttribute("draggable", "true");
			wrapper.style.display = "inline-block";
			wrapper.style.width = poly.w + "px";
			wrapper.style.height = poly.h + "px";
			wrapper.style.cursor = "grab";
			wrapper.style.background = "none";
			wrapper.style.border = "none";
			wrapper.style.padding = "0";
			wrapper.style.margin = "0";
			wrapper.style.boxShadow = "none";
			wrapper.style.userSelect = "none";

			const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
			svg.setAttribute("width", poly.w);
			svg.setAttribute("height", poly.h);
			svg.setAttribute("viewBox", `0 0 ${poly.w} ${poly.h}`);
			svg.style.background = "none";
			svg.innerHTML = `<polygon points="${poly.points
				.map((p) => p.join(","))
				.join(" ")}" fill="${poly.fill}" />`;

			wrapper.appendChild(svg);
			wrapper.addEventListener("dragstart", (e) =>
				this.handleDragStart(e, poly.id),
			);
			wrapper.addEventListener("dragend", this.handleDragEnd);
			this.bufferDiv.appendChild(wrapper);
		}
		const maxBottom = Math.max(
			...this.polygons.map((p) => (p.y || 0) + p.h),
			200,
		);
		this.bufferDiv.style.height = maxBottom + 20 + "px";
	}

	handleDragStart(e, id) {
		e.dataTransfer.effectAllowed = "move";
		e.dataTransfer.setData("application/polygon-id", id);
		window._draggedPolygonId = id;

		const poly = this.polygons.find((p) => p.id === id);
		if (poly) {
			const svgStr = `<svg xmlns="http://www.w3.org/2000/svg" width="${
				poly.w
			}" height="${poly.h}" viewBox="0 0 ${poly.w} ${poly.h}">
				<polygon points="${poly.points.map((p) => p.join(",")).join(" ")}" fill="${
				poly.fill
			}" />
			</svg>`;
			const img = document.createElement("img");
			img.src = "data:image/svg+xml;base64," + btoa(svgStr);
			img.style.opacity = "1";
			document.body.appendChild(img);
			e.dataTransfer.setDragImage(img, poly.w / 2, poly.h / 2);
			setTimeout(() => document.body.removeChild(img), 0);
		}
	}

	handleDragEnd(e) {
		e.target.style.opacity = "";
	}

	handleDropToBuffer = (event) => {
		const { polygon } = event.detail;
		this.polygons.push(polygon);
		this.renderPolygons();
		if (workspace && typeof workspace.resetPan === "function") {
			workspace.resetPan();
		}
	};

	removePolygonById(id) {
		this.polygons = this.polygons.filter((p) => p.id !== id);
		this.renderPolygons();
	}

	getPolygonById(id) {
		return this.polygons.find((p) => p.id === id);
	}

	handleDragOver = (e) => {
		e.preventDefault();
		e.dataTransfer.dropEffect = "move";
	};

	handleDrop = (e) => {
		e.preventDefault();
		const id = e.dataTransfer.getData("application/polygon-id");
		if (id) {
			const app = document.querySelector("polygon-app");
			let workspace = null;
			if (app && app.shadowRoot) {
				workspace = app.shadowRoot.querySelector("polygon-workspace");
			}
			if (workspace) {
				const polygon = workspace.getPolygonById(id);
				if (polygon) {
					workspace.removePolygonById(id);
					delete polygon.x;
					delete polygon.y;
					this.polygons.push(polygon);
					this.renderPolygons();
					const mouseUpEvent = new MouseEvent("mouseup", { bubbles: true });
					window.dispatchEvent(mouseUpEvent);
					if (workspace && typeof workspace.resetPan === "function") {
						workspace.resetPan();
					}
				}
			}
		}
	};
}
customElements.define("polygon-buffer", PolygonBuffer);
