importScripts('olc2C02.js',
	'CPU.js',
	'Bus.js',
	'Sound.js',
	'Cartridge.js',
	'buffer.js',
	'Mapper.js',
	'Mapper001.js',
	'Mapper002.js'
);

let ppu = new olc2C02();
let cpu = new CPU6502();
let apu = new Sound();
let nes = new Bus(cpu, ppu, apu);
let cartridge = new Cartridge();
cpu.ConnectBus(nes);
ppu.ConnectBus(nes);
nes.setSampleFrequency(440);


let mapAsm = [];

onmessage = function({ data }) {
	if (data.op === 'loadFile') {
		cartridge.loadFile(data.file, () => {
			nes.insertCartridge(cartridge);
			nes.reset();

			mapAsm = nes.cpu.disassemble(0x0000, 0xFFFF);

			postMessage({op: 'disassemble', mapAsm});

			nes.reset();
		})
	}

	if (data.op === 'setCtx') {
		nes.ppu.sprScreen.ctx = data.ctx;
	}

	if (data.op === 'clock') {
		let n = Date.now();

		nes.controller[0] = data.controller;
		do {
			if (nes.ppu.frame_complete) {
				nes.ppu.frame_complete = false;

				postMessage({ op: 'frameComplete', ctx: nes.ppu.GetScreen().ctx, frameTime: (Date.now() - n) });
			}
		} while (!nes.clock());

		postMessage({ op: 'sound', audioSample: nes.audioSample });
	}

	if (data.op === 'controller') {
		nes.controller[0] = data.controller;
	}
}
