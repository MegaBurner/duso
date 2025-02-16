class Tool {
    static randomNumber(min, max) {
        return Math.floor(Math.random() * (max - min + 1) + min);
    }

    static randomColorRGB() {
        return `rgb(${this.randomNumber(0, 255)}, ${this.randomNumber(0, 255)}, ${this.randomNumber(0, 255)})`;
    }

    static randomColorHSL(hue, saturation, lightness) {
        return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    }

    static gradientColor(ctx, cr, cg, cb, ca, x, y, r) {
        const col = `${cr},${cg},${cb}`;
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, `rgba(${col}, ${ca * 1})`);
        g.addColorStop(0.5, `rgba(${col}, ${ca * 0.5})`);
        g.addColorStop(1, `rgba(${col}, ${ca * 0})`);
        return g;
    }
}

class Angle {
    constructor(a) {
        this.a = a;
        this.rad = (this.a * Math.PI) / 180;
    }

    incDec(num) {
        this.a += num;
        this.rad = (this.a * Math.PI) / 180;
    }
}

// Globale Variablen für das Phasen-Management
// "assembled" = das Herz ist vollständig aufgebaut (statisch)
// "flying" = die einzelnen Herzen fliegen
let phase = "assembled";
let phaseStartTime = performance.now();

let canvas;
let offCanvas;

class Canvas {
    constructor(bool) {
        this.canvas = document.createElement("canvas");
        if (bool === true) {
            this.canvas.style.position = "relative";
            this.canvas.style.display = "block";
            this.canvas.style.top = 0;
            this.canvas.style.left = 0;
            document.body.appendChild(this.canvas);
        }
        // Setze willReadFrequently, um die getImageData-Performance zu optimieren
        this.ctx = this.canvas.getContext("2d", { willReadFrequently: true });
        this.width = this.canvas.width = window.innerWidth;
        this.height = this.canvas.height = window.innerHeight;
        this.width < 768 ? (this.heartSize = 180) : (this.heartSize = 250);
        this.mouseX = null;
        this.mouseY = null;
        this.hearts = [];
        this.offHeartNum = 1;
        this.offHearts = [];
        this.data = null;
    }

    onInit() {
        let index = 0;
        for (let i = 0; i < this.height; i += 12) {
            for (let j = 0; j < this.width; j += 12) {
                let oI = (j + i * this.width) * 4 + 3;
                if (this.data[oI] > 0) {
                    index++;
                    const h = new Heart(
                        canvas.ctx,
                        j + Tool.randomNumber(-3, 3),
                        i + Tool.randomNumber(-3, 3),
                        Tool.randomNumber(6, 12),
                        index
                    );
                    canvas.hearts.push(h);
                }
            }
        }
    }

    offInit() {
        // Erzeuge einen (oder mehr) "offHearts", um das Herz zu formen
        for (let i = 0; i < this.offHeartNum; i++) {
            const s = new Heart(
                this.ctx,
                this.width / 2,
                this.height / 2.3,
                this.heartSize
            );
            this.offHearts.push(s);
        }
        // Zeichne die OffHearts (als Grundlage für das komplette Herz)
        for (let i = 0; i < this.offHearts.length; i++) {
            this.offHearts[i].offRender(i);
        }
        this.data = this.ctx.getImageData(0, 0, this.width, this.height).data;
        // Mit diesen Daten wird das Herz vollständig aufgebaut
        this.onInit();
    }

    render() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        // Zeichne alle Herzen
        for (let i = 0; i < this.hearts.length; i++) {
            if (phase === "flying") {
                this.hearts[i].updateParams();
                this.hearts[i].updatePosition();
            }
            this.hearts[i].draw();
        }

        // Phasen-Management:
        if (phase === "assembled") {
            // Im assembled-Zustand wird nur kurz gewartet bevor der Flugmodus startet; z.B. 500ms statt 3000ms
            if (performance.now() - phaseStartTime > 50) {
                phase = "flying";
                phaseStartTime = performance.now();
            }
        } else if (phase === "flying") {
            // Prüfen, ob alle Herzen den sichtbaren Bereich verlassen haben (x > canvas.width * 1.5)
            let allGone = this.hearts.every(heart => heart.x > this.width * 1.5);
            if (allGone) {
                phase = "assembled";
                phaseStartTime = performance.now();
                this.hearts = []; // Leere die Herzliste, um neu zu laden
                offCanvas.offInit(); // Baue das Herz neu zusammen
            }
        }
    }

    resize() {
        this.offHearts = [];
        this.hearts = [];
        this.width = this.canvas.width = window.innerWidth;
        this.height = this.canvas.height = window.innerHeight;
        this.width < 768 ? (this.heartSize = 180) : (this.heartSize = 250);
    }
}

class Heart {
    constructor(ctx, x, y, r, i) {
        this.ctx = ctx;
        this.init(x, y, r, i);
    }

    init(x, y, r, i) {
        this.x = x;
        this.xi = x;
        this.y = y;
        this.yi = y;
        this.r = r;
        this.i = i * 0.5 + 200;
        this.l = this.i;
        this.c = Tool.randomColorHSL(Tool.randomNumber(-5, 5), 80, 60);
        this.a = new Angle(Tool.randomNumber(0, 360));
        this.v = {
            x: Math.random(),
            y: -Math.random(),
        };
        this.ga = Math.random();
    }

    draw() {
        const ctx = this.ctx;
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        ctx.globalAlpha = this.ga;
        ctx.beginPath();
        ctx.fillStyle = this.c;
        ctx.moveTo(this.x, this.y + this.r);
        ctx.bezierCurveTo(
            this.x - this.r - this.r / 5,
            this.y + this.r / 1.5,
            this.x - this.r,
            this.y - this.r,
            this.x,
            this.y - this.r / 5
        );
        ctx.bezierCurveTo(
            this.x + this.r,
            this.y - this.r,
            this.x + this.r + this.r / 5,
            this.y + this.r / 1.5,
            this.x,
            this.y + this.r
        );
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    updateParams() {
        this.a.incDec(1);
        Math.sin(this.a.rad) < 0
            ? (this.r = -Math.sin(this.a.rad) * 20)
            : (this.r = Math.sin(this.a.rad) * 20);
    }

    updatePosition() {
        this.l -= 1;
        if (this.l < 0) {
            this.v.y -= 0.01;
            this.v.x += 0.02;
            this.y += this.v.y;
            this.x += this.v.x;
        }
    }

    wrapPosition() {
        // Keine automatische Reinitialisierung hier; das globale Phasen-Management übernimmt den Reset.
        if (phase === "flying" && this.x > canvas.width * 1.5) {
            // Nichts tun
        }
    }

    render() {
        this.wrapPosition();
        this.updateParams();
        this.updatePosition();
        this.draw();
    }

    offRender(i) {
        this.draw();
    }
}

(function () {
    "use strict";
    window.addEventListener("load", function () {
        offCanvas = new Canvas(false);
        canvas = new Canvas(true);

        // Beim ersten Laden: baue das Herz sofort zusammen
        offCanvas.offInit();
        phaseStartTime = performance.now();

        function render() {
            window.requestAnimationFrame(function () {
                canvas.render();
                render();
            });
        }

        render();

        window.addEventListener(
            "resize",
            function () {
                canvas.resize();
                offCanvas.resize();
                offCanvas.offInit();
            },
            false
        );
    });
})();
