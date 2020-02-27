class Sprite {
    constructor(canvas, width, height) {
        this.width = width;
        this.height = height;

        if (typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope) {
            postMessage({ op: 'ctxInit', width: this.width, height: this.height });
        } else {
            this.ctx = canvas.createImageData(this.width, this.height);
        }
    }

    FillPixel (x, y, color) {
        let cord = ((y * this.width) + x) * 4;

        //this.ctx.fillStyle = "rgba("+color.r+","+color.g+","+color.b+",255)";
        this.ctx.data[cord] = color.red;  // R value
        this.ctx.data[cord + 1] = color.green;  // R value
        this.ctx.data[cord + 2] = color.blue;  // R value
        this.ctx.data[cord + 3] = 255;  // R value
        //this.ctx.fillRect( x, y, 1, 1 );
    }

    SetPixel(x, y, color) {
        if (x > this.width || y > this.height || y < 0) {
            return;
        }

        this.FillPixel(x,y, color);
    };
}

export default Sprite;
