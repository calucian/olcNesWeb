class Struct {
    constructor (struct) {
        this.struct = [];
        this.totalLength = 0;
        this.bytes = 0;

        Object.keys(struct).forEach((key) => {
            this.totalLength++;
            this[key] = 0;
            this.bytes += struct[key];

            this.struct.push({
                key: key,
                bytes: struct[key]
            });
        });
    }

    get reg () {
        let reg = 0;
        let shift = 0;

        for (let i = 0; i < this.totalLength; i++) {
            reg |= this[this.struct[i].key] << shift;
            shift += this.struct[i].bytes;
        }

        return reg;
    }

    set reg (value) {
        let shift = this.bytes;

        for (let i = (this.totalLength - 1); i >= 0; i--) {
            shift -= this.struct[i].bytes;
            let val = value >> shift;
            value &= ~(1 << shift);

            this[this.struct[i].key] = val;
        }
    }

    setReg (value) {
        value = value.toString(2);

        for (let i = 0; i < this.totalLength; i++) {
            let val = value.substring(value.length - this.struct[i].bytes);
            value = value.substring(0, value.length - this.struct[i].bytes);
            this[this.struct[i].key] = parseInt(val || 0, 2);
        }
    }
}

export default Struct;
