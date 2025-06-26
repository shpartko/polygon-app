class PolygonWorkspace extends HTMLElement {
	constructor() {
		super();
		const shadow = this.attachShadow({ mode: "open" });
		shadow.innerHTML = `
      <style>
        .workspace {
          background: #2d2d2d;
          min-height: 300px;
          border-radius: 2px;
          position: relative;
          overflow: hidden;
          width: 100%;
          height: 400px;
        }
        .scale-svg {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 1;
        }
        .scale-svg, .scale-svg text {
          user-select: none;
          -webkit-user-select: none;
          -ms-user-select: none;
        }
        .polygons-layer {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          height: 100%;
          z-index: 2;
        }
        svg, polygon {
          pointer-events: all;
          user-drag: none;
          -webkit-user-drag: none;
        }
        .draggable-polygon:active, .draggable-polygon:focus {
          outline: none !important;
          box-shadow: none !important;
          filter: none !important;
        }
      </style>
      <div class="workspace">
        <svg class="scale-svg"></svg>
        <div class="polygons-layer"></div>
      </div>
    `;
		this.workspaceDiv = shadow.querySelector(".workspace");
		this.scaleSvg = shadow.querySelector(".scale-svg");
		this.polygonsLayer = shadow.querySelector(".polygons-layer");
		this.polygons = [];
		this.scale = 1;
		this.offsetX = 0;
		this.offsetY = 0;
		this.isPanning = false;
		this.panStart = { x: 0, y: 0 };
	}

	connectedCallback() {
		this.workspaceDiv.addEventListener("dragover", this.handleDragOver);
		this.workspaceDiv.addEventListener("drop", this.handleDrop);
		window.addEventListener(
			"polygon-drop-to-workspace",
			this.handleDropToWorkspace,
		);
		this.workspaceDiv.addEventListener("wheel", this.handleWheel, {
			passive: false,
		});
		this.workspaceDiv.addEventListener("mousedown", this.handleMouseDown);
		window.addEventListener("mousemove", this.handleMouseMove);
		window.addEventListener("mouseup", this.handleMouseUp);
		this.renderAll();
	}

	disconnectedCallback() {
		this.workspaceDiv.removeEventListener("dragover", this.handleDragOver);
		this.workspaceDiv.removeEventListener("drop", this.handleDrop);
		window.removeEventListener(
			"polygon-drop-to-workspace",
			this.handleDropToWorkspace,
		);
		this.workspaceDiv.removeEventListener("wheel", this.handleWheel);
		this.workspaceDiv.removeEventListener("mousedown", this.handleMouseDown);
		window.removeEventListener("mousemove", this.handleMouseMove);
		window.removeEventListener("mouseup", this.handleMouseUp);
	}

	renderAll() {
		this.renderScale();
		this.renderPolygons();
	}

	renderScale() {
		const width = this.workspaceDiv.clientWidth;
		const height = this.workspaceDiv.clientHeight;
		const scale = this.scale;
		const offsetX = this.offsetX;
		const offsetY = this.offsetY;
		const step = 50 * scale;
		let svg = `<g>`;
		for (let x = offsetX % step; x < width; x += step) {
			svg += `<line x1="${x}" y1="0" x2="${x}" y2="${height}" stroke="#888" stroke-width="1" />`;
			if (x > 0)
				svg += `<text x="${
					x + 2
				}" y="12" font-size="10" fill="#aaa">${Math.round(
					(x - offsetX) / scale,
				)}</text>`;
		}
		for (let y = offsetY % step; y < height; y += step) {
			svg += `<line x1="0" y1="${y}" x2="${width}" y2="${y}" stroke="#888" stroke-width="1" />`;
			if (y > 0)
				svg += `<text x="2" y="${
					y - 2
				}" font-size="10" fill="#aaa">${Math.round(
					(y - offsetY) / scale,
				)}</text>`;
		}
		svg += `</g>`;
		this.scaleSvg.setAttribute("width", width);
		this.scaleSvg.setAttribute("height", height);
		this.scaleSvg.innerHTML = svg;
	}

	renderPolygons() {
		this.polygonsLayer.innerHTML = "";
		for (const poly of this.polygons) {
			const wrapper = document.createElement("div");
			wrapper.className = "draggable-polygon";
			wrapper.setAttribute("draggable", "true");
			wrapper.setAttribute("data-id", poly.id);
			wrapper.style.position = "absolute";
			const x = (poly.x || 0) * this.scale + this.offsetX;
			const y = (poly.y || 0) * this.scale + this.offsetY;
			wrapper.style.left = x + "px";
			wrapper.style.top = y + "px";
			wrapper.style.width = poly.w * this.scale + "px";
			wrapper.style.height = poly.h * this.scale + "px";
			wrapper.style.cursor = "grab";
			wrapper.style.background = "none";
			wrapper.style.border = "none";
			wrapper.style.padding = "0";
			wrapper.style.margin = "0";
			wrapper.style.boxShadow = "none";
			wrapper.style.userSelect = "none";
			const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
			svg.setAttribute("width", poly.w * this.scale);
			svg.setAttribute("height", poly.h * this.scale);
			svg.setAttribute("viewBox", `0 0 ${poly.w} ${poly.h}`);
			svg.style.background = "none";
			const polygon = document.createElementNS(
				"http://www.w3.org/2000/svg",
				"polygon",
			);
			polygon.setAttribute(
				"points",
				poly.points.map((p) => p.join(",")).join(" "),
			);
			polygon.setAttribute("fill", poly.fill);
			svg.appendChild(polygon);
			wrapper.appendChild(svg);
			wrapper.addEventListener("dragstart", (e) =>
				this.handleDragStart(e, poly.id),
			);
			wrapper.addEventListener("dragend", this.handleDragEnd);
			this.polygonsLayer.appendChild(wrapper);
		}
	}

	handleDragOver = (e) => {
		e.preventDefault();
		e.dataTransfer.dropEffect = "move";
	};

	handleDrop = (e) => {
		console.log("drop event");
		e.preventDefault();
		const id = e.dataTransfer.getData("application/polygon-id");
		if (id) {
			const app = document.querySelector("polygon-app");
			let buffer = null;
			if (app && app.shadowRoot) {
				buffer = app.shadowRoot.querySelector("polygon-buffer");
			}
			if (buffer) {
				const polygon = buffer.getPolygonById(id);
				if (polygon) {
					const rect = this.workspaceDiv.getBoundingClientRect();
					const mouseX = e.clientX - rect.left;
					const mouseY = e.clientY - rect.top;
					const x = (mouseX - this.offsetX) / this.scale - polygon.w / 2;
					const y = (mouseY - this.offsetY) / this.scale - polygon.h / 2;
					polygon.x = x;
					polygon.y = y;
					this.polygons.push(polygon);
					this.renderPolygons();
					buffer.removePolygonById(id);
				}
			}
		}
	};

	handleDragStart(e, id) {
		console.log("dragstart workspace", id);
		e.dataTransfer.effectAllowed = "move";
		e.dataTransfer.setData("application/polygon-id", id);
		this.isPanning = false;
	}

	handleDragEnd(e) {
		console.log("dragend workspace");
		this.isPanning = false;
	}

	handleDropToWorkspace = (event) => {
		const { polygon } = event.detail;
		this.polygons.push(polygon);
		this.renderPolygons();
	};

	removePolygonById(id) {
		this.polygons = this.polygons.filter((p) => p.id !== id);
		this.renderPolygons();
	}

	getPolygonById(id) {
		return this.polygons.find((p) => p.id === id);
	}

	handleWheel = (e) => {
		e.preventDefault();
		const prevScale = this.scale;
		const delta = e.deltaY < 0 ? 1.1 : 0.9;
		const mouseX = e.offsetX;
		const mouseY = e.offsetY;
		this.scale *= delta;
		this.scale = Math.max(0.2, Math.min(this.scale, 5));
		this.offsetX = mouseX - (mouseX - this.offsetX) * (this.scale / prevScale);
		this.offsetY = mouseY - (mouseY - this.offsetY) * (this.scale / prevScale);
		this.renderAll();
	};

	handleMouseDown = (e) => {
		if (e.button !== 0) return;
		if (e.target.closest(".draggable-polygon")) return;
		this.isPanning = true;
		this.panStart = {
			x: e.clientX,
			y: e.clientY,
			ox: this.offsetX,
			oy: this.offsetY,
		};
	};

	handleMouseMove = (e) => {
		if (!this.isPanning) return;
		const dx = e.clientX - this.panStart.x;
		const dy = e.clientY - this.panStart.y;
		this.offsetX = this.panStart.ox + dx;
		this.offsetY = this.panStart.oy + dy;
		this.renderAll();
	};

	handleMouseUp = (e) => {
		this.isPanning = false;
	};
}
customElements.define("polygon-workspace", PolygonWorkspace);
