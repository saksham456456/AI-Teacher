// Renders a sequence of "blocks" onto a two-layer canvas so it looks like a
// teacher progressively writing/drawing on a whiteboard.
//
// Layer 1 (ink)    — permanent marks, only ever added to or copied when the
//                     board grows taller. Never cleared except on reset().
// Layer 2 (cursor) — a small moving pen-tip dot, cleared and redrawn every
//                     animation frame. Keeps the ink layer simple.

const FONT_FAMILY = "'Patrick Hand', cursive";
const HEADING_FONT_FAMILY = "'Kalam', cursive";

const INK_COLORS = {
  heading: '#173a76',
  text: '#2b2b2e',
  bullet: '#2b2b2e',
  equation: '#1e5fbf',
  diagram: '#2b2b2e',
  emphasize: '#d94f30'
};

export class Whiteboard {
  constructor(container) {
    this.container = container;
    this.padding = 44;
    this.lineHeight = 38;
    this.width = Math.max(320, container.clientWidth);
    this.height = 1400;
    this.dpr = Math.max(1, window.devicePixelRatio || 1);

    this.inkCanvas = document.createElement('canvas');
    this.inkCanvas.className = 'ink-layer';
    this.cursorCanvas = document.createElement('canvas');
    this.cursorCanvas.className = 'cursor-layer';

    container.appendChild(this.inkCanvas);
    container.appendChild(this.cursorCanvas);

    this._sizeCanvas(this.inkCanvas);
    this._sizeCanvas(this.cursorCanvas);

    this.ictx = this.inkCanvas.getContext('2d');
    this.cctx = this.cursorCanvas.getContext('2d');
    this._applyScale(this.ictx);
    this._applyScale(this.cctx);

    this.cursorY = this.padding;
    this.lastBBox = null;
    this._cancelled = false;
  }

  _sizeCanvas(canvas) {
    canvas.width = this.width * this.dpr;
    canvas.height = this.height * this.dpr;
    canvas.style.width = this.width + 'px';
    canvas.style.height = this.height + 'px';
  }

  _applyScale(ctx) {
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  reset() {
    this.height = 1400;
    this._sizeCanvas(this.inkCanvas);
    this._sizeCanvas(this.cursorCanvas);
    this.ictx = this.inkCanvas.getContext('2d');
    this.cctx = this.cursorCanvas.getContext('2d');
    this._applyScale(this.ictx);
    this._applyScale(this.cctx);
    this.cursorY = this.padding;
    this.lastBBox = null;
    this._cancelled = false;
    this.container.scrollTop = 0;
  }

  cancel() {
    this._cancelled = true;
  }

  _grow(minHeight) {
    if (minHeight <= this.height) return;

    const snapshot = document.createElement('canvas');
    snapshot.width = this.inkCanvas.width;
    snapshot.height = this.inkCanvas.height;
    snapshot.getContext('2d').drawImage(this.inkCanvas, 0, 0);

    this.height = minHeight + 800;
    this._sizeCanvas(this.inkCanvas);
    this._sizeCanvas(this.cursorCanvas);
    this.ictx = this.inkCanvas.getContext('2d');
    this.cctx = this.cursorCanvas.getContext('2d');

    this.ictx.setTransform(1, 0, 0, 1, 0, 0);
    this.ictx.drawImage(snapshot, 0, 0);
    this._applyScale(this.ictx);
    this._applyScale(this.cctx);
  }

  async runBlocks(blocks) {
    this._cancelled = false;
    for (const block of blocks) {
      if (this._cancelled) break;
      await this._runBlock(block);
      await this._sleep(260);
    }
  }

  _sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async _runBlock(block) {
    switch (block.type) {
      case 'heading':
        await this._writeParagraph(block.text || '', 'heading');
        break;
      case 'text':
        await this._writeParagraph(block.text || '', 'text');
        break;
      case 'bullet':
        await this._writeParagraph('•  ' + (block.text || ''), 'bullet');
        break;
      case 'equation':
        await this._writeParagraph(block.text || '', 'equation');
        break;
      case 'diagram':
        await this._drawDiagram(block.shape, block.text || '');
        break;
      case 'emphasize':
        await this._drawEmphasis(block.shape || 'underline');
        break;
      default:
        break;
    }
  }

  _fontFor(kind) {
    if (kind === 'heading') return `32px ${HEADING_FONT_FAMILY}`;
    if (kind === 'equation') return `26px ${FONT_FAMILY}`;
    return `24px ${FONT_FAMILY}`;
  }

  _wrapLines(text, font, maxWidth) {
    this.ictx.font = font;
    const words = text.split(' ');
    const lines = [];
    let current = '';
    for (const word of words) {
      const test = current ? current + ' ' + word : word;
      if (this.ictx.measureText(test).width > maxWidth && current) {
        lines.push(current);
        current = word;
      } else {
        current = test;
      }
    }
    if (current) lines.push(current);
    return lines.length ? lines : [''];
  }

  async _writeParagraph(text, kind) {
    const font = this._fontFor(kind);
    const color = INK_COLORS[kind] || INK_COLORS.text;
    const maxWidth = this.width - this.padding * 2;
    const lines = this._wrapLines(text, font, maxWidth);
    const lh = kind === 'heading' ? 46 : this.lineHeight;

    this._grow(this.cursorY + lh * (lines.length + 2));

    const startY = this.cursorY;
    let maxLineWidth = 0;

    for (const line of lines) {
      if (this._cancelled) break;
      await this._animateLine(line, this.padding, this.cursorY, font, color);
      this.ictx.font = font;
      maxLineWidth = Math.max(maxLineWidth, this.ictx.measureText(line).width);
      this.cursorY += lh;
      this._scrollIntoView();
    }

    this.lastBBox = {
      x: this.padding,
      y: startY - lh + 14,
      width: maxLineWidth,
      height: this.cursorY - startY
    };
    this.cursorY += 10;
  }

  async _animateLine(line, x, y, font, color) {
    this.ictx.font = font;
    this.ictx.fillStyle = color;
    this.ictx.textBaseline = 'alphabetic';
    let cx = x;
    for (let i = 0; i < line.length; i++) {
      if (this._cancelled) return;
      const ch = line[i];
      const jitterY = (Math.random() - 0.5) * 1.6;
      const jitterRot = (Math.random() - 0.5) * 0.05;
      this.ictx.save();
      this.ictx.translate(cx, y + jitterY);
      this.ictx.rotate(jitterRot);
      this.ictx.fillText(ch, 0, 0);
      this.ictx.restore();
      cx += this.ictx.measureText(ch).width;
      this._drawPenTip(cx, y - 8, color);
      await this._sleep(14 + Math.random() * 16);
    }
    this._clearPenTip();
  }

  _drawPenTip(x, y, color) {
    this.cctx.clearRect(0, 0, this.width, this.height);
    this.cctx.beginPath();
    this.cctx.arc(x, y, 4, 0, Math.PI * 2);
    this.cctx.fillStyle = color;
    this.cctx.globalAlpha = 0.85;
    this.cctx.fill();
    this.cctx.globalAlpha = 1;
  }

  _clearPenTip() {
    this.cctx.clearRect(0, 0, this.width, this.height);
  }

  _scrollIntoView() {
    const target = this.cursorY - this.container.clientHeight + 160;
    if (target > this.container.scrollTop) {
      this.container.scrollTo({ top: target, behavior: 'smooth' });
    }
  }

  async _animatePolyline(points) {
    const segs = 16;
    for (let s = 0; s < points.length - 1; s++) {
      const [x1, y1] = points[s];
      const [x2, y2] = points[s + 1];
      for (let i = 1; i <= segs; i++) {
        if (this._cancelled) return;
        const t = i / segs;
        this.ictx.beginPath();
        this.ictx.moveTo(x1, y1);
        this.ictx.lineTo(x1 + (x2 - x1) * t, y1 + (y2 - y1) * t);
        this.ictx.stroke();
        await this._sleep(9);
      }
    }
  }

  async _drawDiagram(shape, caption) {
    const size = 70;
    const cx = this.width / 2;
    const topY = this.cursorY + 20;
    const centerY = topY + size / 2;

    this._grow(this.cursorY + size + 110);
    this._scrollIntoView();

    this.ictx.strokeStyle = INK_COLORS.diagram;
    this.ictx.lineWidth = 2.4;
    this.ictx.lineCap = 'round';

    if (shape === 'circle') {
      const steps = 26;
      for (let i = 1; i <= steps; i++) {
        if (this._cancelled) return;
        this.ictx.beginPath();
        this.ictx.arc(cx, centerY, size / 2, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * i) / steps);
        this.ictx.stroke();
        await this._sleep(12);
      }
    } else if (shape === 'box') {
      await this._animatePolyline([
        [cx - size / 2, topY],
        [cx + size / 2, topY],
        [cx + size / 2, topY + size],
        [cx - size / 2, topY + size],
        [cx - size / 2, topY]
      ]);
    } else if (shape === 'triangle') {
      await this._animatePolyline([
        [cx, topY],
        [cx + size / 2, topY + size],
        [cx - size / 2, topY + size],
        [cx, topY]
      ]);
    } else if (shape === 'line') {
      await this._animatePolyline([
        [cx - size, centerY],
        [cx + size, centerY]
      ]);
    } else if (shape === 'arrow') {
      await this._animatePolyline([
        [cx - size, centerY],
        [cx + size, centerY]
      ]);
      await this._animatePolyline([
        [cx + size, centerY],
        [cx + size - 14, centerY - 10]
      ]);
      await this._animatePolyline([
        [cx + size, centerY],
        [cx + size - 14, centerY + 10]
      ]);
    }

    this.cursorY = topY + size + 16;
    this.lastBBox = { x: cx - size / 2 - 10, y: topY - 10, width: size + 20, height: size + 20 };

    if (caption) {
      await this._writeParagraph(caption, 'text');
    }
  }

  async _drawEmphasis(shape) {
    if (!this.lastBBox || this._cancelled) return;
    const b = this.lastBBox;

    this.ictx.strokeStyle = INK_COLORS.emphasize;
    this.ictx.lineWidth = 2.6;
    this.ictx.lineCap = 'round';

    if (shape === 'box') {
      const pad = 8;
      await this._animatePolyline([
        [b.x - pad, b.y - pad],
        [b.x + b.width + pad, b.y - pad],
        [b.x + b.width + pad, b.y + b.height + pad],
        [b.x - pad, b.y + b.height + pad],
        [b.x - pad, b.y - pad]
      ]);
    } else if (shape === 'circle') {
      const cx = b.x + b.width / 2;
      const cy = b.y + b.height / 2;
      const rx = b.width / 2 + 16;
      const ry = b.height / 2 + 12;
      const steps = 30;
      for (let i = 1; i <= steps; i++) {
        if (this._cancelled) return;
        this.ictx.beginPath();
        this.ictx.ellipse(cx, cy, rx, ry, 0, 0, (Math.PI * 2 * i) / steps);
        this.ictx.stroke();
        await this._sleep(9);
      }
    } else {
      const y = b.y + b.height + 4;
      await this._animatePolyline([
        [b.x, y],
        [b.x + b.width, y]
      ]);
    }
  }
}
