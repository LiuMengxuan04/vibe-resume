/* HTML DOM adaptation for PPT Master's live-preview shell. */
(function () {
    "use strict";
    window.ResumeCanvas = class {
        constructor(container, callbacks) {
            this.container = container;
            this.callbacks = callbacks;
            this.frame = null;
            this.observer = null;
            this.generation = 0;
            this.resize = new ResizeObserver(() => this.fit());
            this.resize.observe(container.parentElement);
        }
        document() { return this.frame?.contentDocument || document.implementation.createHTMLDocument(""); }
        async load(content, base, index) {
            const generation = ++this.generation;
            this.observer?.disconnect();
            const doc = new DOMParser().parseFromString(content, "text/html");
            const baseTag = doc.createElement("base");
            baseTag.href = new URL(base, location.origin).href;
            doc.querySelectorAll("base").forEach((node) => node.remove());
            doc.head.prepend(baseTag);
            const csp = doc.createElement("meta");
            csp.httpEquiv = "Content-Security-Policy";
            csp.content = "default-src 'none'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; script-src 'none'; form-action 'none'";
            doc.head.prepend(csp);
            doc.querySelectorAll("script,iframe,object,embed,meta[http-equiv=refresh]").forEach((node) => node.remove());
            doc.querySelectorAll("*").forEach((node) => {
                for (const attribute of [...node.attributes]) if (attribute.name.toLowerCase().startsWith("on")) node.removeAttribute(attribute.name);
            });
            const pages = [...doc.querySelectorAll(".resume-page")];
            const roots = pages.length ? pages : [...doc.querySelectorAll(".page")];
            roots.forEach((node, page) => { if (page !== index) node.style.setProperty("display", "none", "important"); });
            const width = parseFloat(doc.documentElement.dataset.exportWidth || doc.body.dataset.exportWidth) || 1080;
            const style = doc.createElement("style");
            style.textContent = `html,body{background:#fff!important;margin:0!important;padding:0!important;width:${width}px!important;overflow:hidden!important} .toolbar{display:none!important} .page,.resume-book,.resume-page{margin:0!important;border:0!important;box-shadow:none!important;width:${width}px!important} .page{min-height:0!important;overflow:visible!important} [id].svg-selectable:hover{outline:2px solid #4a9eff;outline-offset:2px;cursor:pointer} .svg-selected{outline:2px solid #4a9eff!important;outline-offset:2px;cursor:move!important} .svg-annotated{outline:2px solid #f59e0b!important;outline-offset:2px} .svg-selected.svg-annotated{outline-color:#4a9eff!important}`;
            doc.head.appendChild(style);
            this.width = width;
            this.frame = document.createElement("iframe");
            this.frame.title = "Resume page preview";
            // Same-origin DOM access, but no scripts, forms, popups or navigation.
            this.frame.setAttribute("sandbox", "allow-same-origin");
            this.frame.style.cssText = `width:${width}px;border:0;display:block;transform-origin:top left;`;
            const ready = new Promise((resolve) => this.frame.addEventListener("load", resolve, { once: true }));
            this.frame.srcdoc = "<!doctype html>" + doc.documentElement.outerHTML;
            this.container.replaceChildren(this.frame);
            await ready;
            if (generation !== this.generation) return false;
            await this.document().fonts.ready;
            if (generation !== this.generation) return false;
            const currentRoots = this.document().querySelectorAll(pages.length ? ".resume-page" : ".page");
            this.page = currentRoots[index];
            if (!this.page) throw new Error("Resume page not found");
            this.attach();
            this.observer = new ResizeObserver(() => this.fit());
            this.observer.observe(this.page);
            this.fit();
            return true;
        }
        fit() {
            if (!this.frame || !this.page) return;
            this.height = Math.ceil(Math.max(this.page.getBoundingClientRect().height, this.page.scrollHeight));
            const scale = Math.min(1, Math.max(0.1, (this.container.parentElement.clientWidth - 48) / this.width));
            this.frame.style.height = `${this.height}px`;
            this.frame.style.transform = `scale(${scale})`;
            this.container.style.width = `${this.width * scale}px`;
            this.container.style.height = `${this.height * scale}px`;
        }
        pick(target) {
            if (!target?.closest || target.closest("defs,symbol,style")) return null;
            const icon = target.closest("svg");
            return icon || target.closest("[id]");
        }
        attach() {
            const doc = this.document();
            [this.page, ...this.page.querySelectorAll("[id]")].forEach((element) => {
                if (!element.closest("defs,symbol") && (!element.closest("svg") || element.tagName.toLowerCase() === "svg")) element.classList.add("svg-selectable");
            });
            let suppressClick = false;
            doc.addEventListener("click", (event) => {
                event.preventDefault();
                if (suppressClick) { suppressClick = false; return; }
                let target = this.pick(event.target);
                if (event.altKey) target = target?.parentElement?.closest("[id]");
                if (target && (this.page.contains(target) || target === this.page)) this.callbacks.select(target, event.ctrlKey || event.metaKey || event.shiftKey);
                else this.callbacks.clear();
            });
            doc.addEventListener("keydown", (event) => this.callbacks.key(event));
            doc.addEventListener("contextmenu", (event) => {
                event.preventDefault();
                const elements = [];
                for (const hit of doc.elementsFromPoint(event.clientX, event.clientY)) {
                    const target = this.pick(hit);
                    if (target && this.page.contains(target) && !elements.includes(target)) elements.push(target);
                }
                this.showOverlap(elements, event.clientX, event.clientY);
            });
            let drag = null;
            doc.addEventListener("pointerdown", (event) => {
                if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
                const selected = this.callbacks.elements();
                const picked = this.pick(event.target);
                if (!selected.some((element) => element === picked || element.contains(picked))) return;
                drag = { x: event.clientX, y: event.clientY, elements: selected.map((element) => ({ element, value: this.translation(element), old: element.getAttribute("style") })) };
                event.preventDefault();
            });
            doc.addEventListener("pointermove", (event) => {
                if (!drag) return;
                const x = event.clientX - drag.x, y = event.clientY - drag.y;
                if (Math.hypot(x, y) < 3 && !drag.moved) return;
                drag.moved = true;
                for (const item of drag.elements) {
                    const styles = this.moveStyles(item.element, item.value[0] + x, item.value[1] + y);
                    for (const [key, value] of Object.entries(styles)) item.element.style.setProperty(key, value, "important");
                }
            });
            const end = () => {
                if (!drag) return;
                const finished = drag; drag = null;
                if (!finished.moved) return;
                suppressClick = true;
                for (const item of finished.elements) this.callbacks.move(item.element, this.moveStyles(item.element, ...this.translation(item.element)), item.old);
            };
            doc.addEventListener("pointerup", end);
            doc.addEventListener("pointercancel", () => {
                if (drag) for (const item of drag.elements) { if (item.old === null) item.element.removeAttribute("style"); else item.element.setAttribute("style", item.old); }
                drag = null;
            });
            doc.addEventListener("pointerleave", end);
        }
        translation(element) {
            const style = element.ownerDocument.defaultView.getComputedStyle(element);
            if (style.position === "static") return [0, 0];
            return [parseFloat(style.left) || 0, parseFloat(style.top) || 0];
        }
        moveStyles(element, x, y) {
            const position = element.ownerDocument.defaultView.getComputedStyle(element).position;
            return { position: position === "static" ? "relative" : position, left: `${Math.round(x * 1000) / 1000}px`, top: `${Math.round(y * 1000) / 1000}px` };
        }
        showOverlap(elements, x, y) {
            this.document().querySelector(".overlap-picker")?.remove();
            if (elements.length < 2) { if (elements[0]) this.callbacks.select(elements[0], false); return; }
            const menu = this.document().createElement("div");
            menu.className = "overlap-picker";
            menu.style.cssText = `position:fixed;left:${Math.min(x, this.width - 250)}px;top:${y}px;background:#16162a;color:#fff;z-index:99999;padding:8px;border-radius:6px;max-width:250px;`;
            for (const element of elements) {
                const button = this.document().createElement("button");
                button.style.cssText = "display:block;width:100%;padding:8px;background:transparent;color:inherit;border:0;text-align:left;cursor:pointer";
                button.textContent = `<${element.tagName.toLowerCase()}> ${element.textContent.trim().slice(0, 24) || element.id}`;
                button.onclick = (event) => { event.stopPropagation(); this.callbacks.select(element, false); menu.remove(); };
                menu.appendChild(button);
            }
            this.document().body.appendChild(menu);
            this.document().addEventListener("pointerdown", (event) => { if (!menu.contains(event.target)) menu.remove(); }, { once: true });
        }
    };
})();
