class Pixel {
    constructor(r, g, b) {
        this.red = r;
        this.green = g;
        this.blue = b;
    }

    hex (n, d) {
        let s = [];
        for (let i = d - 1; i >= 0; i--, n >>= 4)
            s[i] = "0123456789ABCDEF"[n & 0xF];
        return s.join('');
    };

    getCode () {
        return '#' + this.hex(this.red,2) + this.hex(this.green,2) + this.hex(this.blue,2);
    }
}

export default Pixel;
