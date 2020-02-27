import Bus from "./src/Bus";
import Cartridge from "./src/Cartridge";
import Cpu6502 from "./src/Cpu6502";
import olc2C02 from "./src/olc2C02";

class App {
    constructor (displayCanvas, debugCanvas) {
        this.displayCanvas = displayCanvas;
        this.debugCanvas = debugCanvas;

        this.nes = new Bus();
        this.ppu = new olc2C02(displayCanvas);
        this.cpu = new Cpu6502();

        this.cpu.ConnectBus(this.nes);
        this.ppu.ConnectBus(this.nes);

        this.cartridge = new Cartridge();

        this.bEmulationRun = false;
        this.fElapsedTime = 0;
        this.fResidualTime = 0;
        this.mapAsm = [];

        this.keys = {
            a: false,
            b: false,
            select: false,
            start: false,
            up: false,
            down: false,
            left: false,
            right: false,
        };

        this.keyMapping = {
            x: 'a',
            z: 'b',
            s: 'start',
            a: 'select',
            ArrowUp: 'up',
            ArrowDown: 'down',
            ArrowLeft: 'left',
            ArrowRight: 'right',
        };

        window.addEventListener("keydown",  (event) => {
            if (this.keyMapping[event.key]) {
                this.keys[this.keyMapping[event.key]] = true;

                event.preventDefault();
            }
        }, true);

        window.addEventListener("keyup",  (event) => {
            if (this.keyMapping[event.key]) {
                this.keys[this.keyMapping[event.key]] = false;

                event.preventDefault();
            }
        }, true);

        // Just JS things!
        this.step = this.step.bind(this);
    }

    hex (n, d)
    {
        let s = [];
        for (let i = d - 1; i >= 0; i--, n >>= 4)
            s[i] = "0123456789ABCDEF"[n & 0xF];
        return s.join('');
    }

    DrawString (x, y, string, color) {
        this.debugCanvas.fillStyle = color || '#FFFFFF';
        this.debugCanvas.fillText(string, x, y);
    }

    DrawRect (x, y, w, h, color) {
        if (color instanceof Pixel) {
            this.debugCanvas.fillStyle = color.getCode();
        } else
            this.debugCanvas.fillStyle = color || '#FFFFFF';

        this.debugCanvas.fillRect( x, y, w, h );
    }

    DrawCpu (x, y) {
        let status = "STATUS: ";
        this.DrawString(x  + 64, y, "N", this.nes.cpu.GetFlag(Cpu6502.FLAGS6502.N) ? '#00FF00' : '#FF0000');
        this.DrawString(x  + 80, y , "V", this.nes.cpu.GetFlag(Cpu6502.FLAGS6502.V) ? '#00FF00' : '#FF0000');
        this.DrawString(x  + 96, y , "-", this.nes.cpu.GetFlag(Cpu6502.FLAGS6502.U) ? '#00FF00' : '#FF0000');
        this.DrawString(x  + 112, y , "B", this.nes.cpu.GetFlag(Cpu6502.FLAGS6502.B) ? '#00FF00' : '#FF0000');
        this.DrawString(x  + 128, y , "D", this.nes.cpu.GetFlag(Cpu6502.FLAGS6502.D) ? '#00FF00' : '#FF0000');
        this.DrawString(x  + 144, y , "I", this.nes.cpu.GetFlag(Cpu6502.FLAGS6502.I) ? '#00FF00' : '#FF0000');
        this.DrawString(x  + 160, y , "Z", this.nes.cpu.GetFlag(Cpu6502.FLAGS6502.Z) ? '#00FF00' : '#FF0000');
        this.DrawString(x  + 178, y , "C", this.nes.cpu.GetFlag(Cpu6502.FLAGS6502.C) ? '#00FF00' : '#FF0000');
        this.DrawString(x , y + 10, "PC: $" + this.hex(this.nes.cpu.pc, 4));
        this.DrawString(x , y + 20, "A: $" +  this.hex(this.nes.cpu.a || this.nes.cpu.A, 2) + "  [" + this.nes.cpu.a + "]");
        this.DrawString(x , y + 30, "X: $" +  this.hex(this.nes.cpu.x || this.nes.cpu.X, 2) + "  [" + this.nes.cpu.x + "]");
        this.DrawString(x , y + 40, "Y: $" +  this.hex(this.nes.cpu.y || this.nes.cpu.Y, 2) + "  [" + this.nes.cpu.y + "]");
        this.DrawString(x , y + 50, "Stack P: $" + this.hex(this.nes.cpu.stkp, 4));
    }

    DrawCode (x, y, nLines) {
        let it_a = this.nes.cpu.pc;
        let nLineY = (nLines >> 1) * 10 + y;

        if (it_a !== this.mapAsm.length)
        {
            this.DrawString(x, nLineY, this.mapAsm[it_a], '#FF0000');
            while (nLineY < (nLines * 10) + y && it_a < mapAsm.length)
            {
                if (++it_a !== this.mapAsm.length && this.mapAsm[it_a])
                {
                    nLineY += 10;
                    this.DrawString(x, nLineY, this.mapAsm[it_a]);
                }
            }
        }

        it_a = this.nes.cpu.pc;
        nLineY = (nLines >> 1) * 10 + y;
        if (it_a !== this.mapAsm.length)
        {
            while (nLineY > y && it_a > 0)
            {
                if (--it_a !== this.mapAsm.length && this.mapAsm[it_a])
                {
                    nLineY -= 10;
                    this.DrawString(x, nLineY, this.mapAsm[it_a]);
                }
            }
        }
    }

    handleFile (file) {
        this.cartridge.loadFile(file, () => {
            this.nes.insertCartridge(this.cartridge);

            this.nes.reset();

            this.mapAsm = this.nes.cpu.disassemble(0x0000, 0xFFFF);
        });
    }

    start () {
        this.bEmulationRun = !this.bEmulationRun;

        this.step();
    }

    reset () {
        this.nes.reset();
    }

    stepLine () {
        do { this.nes.clock(); } while (!this.nes.cpu.complete());
    }

    debug () {
        this.debugCanvas.fillStyle = '#000099';
        this.debugCanvas.fillRect(0, 0, 500, 500);
        this.DrawCpu(0, 50);
        this.DrawCode(200, 72, 26);

        // Draw OAM Contents (first 26 out of 64) ======================================
        for (let i = 0; i < 26; i++)
        {
            let s = this.hex(i, 2) + ": (" + this.nes.ppu.OAM[i].x
                + ", " + this.nes.ppu.OAM[i].y + ") "
                + "ID: " + hex(this.nes.ppu.OAM[i].id, 2)
                +" AT: " + hex(this.nes.ppu.OAM[i].attribute, 2);
            this.DrawString(0, 172 + i * 10, s);
        }

        // Draw Palettes & Pattern Tables ==============================================
        const nSwatchSize = 8;
        let nSelectedPalette = 0;

        //DrawRect(20 + nSelectedPalette * (nSwatchSize * 5) - 1, 20, (nSwatchSize * 4), nSwatchSize, '#ffffff');
        for (let p = 0; p < 8; p++) // For each palette
            for(let s = 0; s < 4; s++) // For each index
                this.DrawRect(
                    20 + p * (nSwatchSize * 5) + s * nSwatchSize, 20,
                    nSwatchSize, nSwatchSize, this.ppu.GetColourFromPaletteRam(p, s));

        // Draw selection reticule around selected palette


        // Generate Pattern Tables
        this.debugCanvas.putImageData(this.ppu.GetPatternTable(0, nSelectedPalette).ctx, 150, 360);
        this.debugCanvas.putImageData(this.ppu.GetPatternTable(1, nSelectedPalette).ctx, 300, 360);

        // Draw rendered output ========================================================
    }

    step () {
        var n = Date.now();

        if (!this.nes.cart) {
            setTimeout(this.step, 1000 / 24);

            return;
        }

        // Handle input for controller in port #1
        this.nes.controller[0] = 0x00;
        this.nes.controller[0] |= this.keys.a ? 0x80 : 0x00;     // A Button
        this.nes.controller[0] |= this.keys.b ? 0x40 : 0x00;     // B Button
        this.nes.controller[0] |= this.keys.select ? 0x20 : 0x00;     // Select
        this.nes.controller[0] |= this.keys.start ? 0x10 : 0x00;     // Start
        this.nes.controller[0] |= this.keys.up ? 0x08 : 0x00;
        this.nes.controller[0] |= this.keys.down ? 0x04 : 0x00;
        this.nes.controller[0] |= this.keys.left ? 0x02 : 0x00;
        this.nes.controller[0] |= this.keys.right ? 0x01 : 0x00;

        this.fElapsedTime++;
        if (this.bEmulationRun)
        {
            do { this.nes.clock(); } while (!this.nes.ppu.frame_complete);
            //do { nes.clock(); } while (nes.ppu.cycle !== -1);

            this.nes.ppu.frame_complete = false;

            if (this.fResidualTime > 0.0)
                this.fResidualTime -= this.fElapsedTime;
            else
            {
                this.fResidualTime += (1.0 / 60.0) - this.fElapsedTime;
            }
        }

        this.displayCanvas.putImageData(this.nes.ppu.GetScreen().ctx, 0, 0);

        //setTimeout(this.step, (20 - (Date.now() - n)));

        return true;
    };

}

window.App = App;
