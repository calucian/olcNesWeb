/*
	olc::NES - System Bus
	"Thanks Dad for believing computers were gonna be a big deal..." - javidx9

	License (OLC-3)
	~~~~~~~~~~~~~~~

	Copyright 2018-2019 OneLoneCoder.com

	Redistribution and use in source and binary forms, with or without
	modification, are permitted provided that the following conditions
	are met:

	1. Redistributions or derivations of source code must retain the above
	copyright notice, this list of conditions and the following disclaimer.

	2. Redistributions or derivative works in binary form must reproduce
	the above copyright notice. This list of conditions and the following
	disclaimer must be reproduced in the documentation and/or other
	materials provided with the distribution.

	3. Neither the name of the copyright holder nor the names of its
	contributors may be used to endorse or promote products derived
	from this software without specific prior written permission.

	THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
	"AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
	LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
	A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
	HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
	SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
	LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
	DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
	THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
	(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
	OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.


	Relevant Video: https://youtu.be/xdzOvpYPmGE

	Links
	~~~~~
	YouTube:	https://www.youtube.com/javidx9
				https://www.youtube.com/javidx9extra
	Discord:	https://discord.gg/WhwHUMV
	Twitter:	https://www.twitter.com/javidx9
	Twitch:		https://www.twitch.tv/javidx9
	GitHub:		https://www.github.com/onelonecoder
	Patreon:	https://www.patreon.com/javidx9
	Homepage:	https://www.onelonecoder.com

	Author
	~~~~~~
	David Barr, aka javidx9, �OneLoneCoder 2019
*/

class Bus {
	constructor (cpu, ppu, apu) {
		this.cpu = cpu;
		// The 2C02 Picture Processing Unit
		this.ppu = ppu;

		this.apu = apu;
		// The Cartridge or "GamePak"
		this.cart = null;
		// 2KB of RAM
		this.cpuRam = Array(2048).fill(0x00);
		// Controllers
		this.controller = [];

		this.nSystemClockCounter = 0;
		this.controller_state = [];

		this.dma_page = 0x00;
		this._dma_addr = 0x00;
		this.dma_data = 0x00;

		this.dma_dummy = true;
		this.dma_transfer = false;

		this.audioTimePerNESClock = 0;
		this.audioTimePerSystemSample = 0 ;
		this.audioTime = 0;
	}

	set dma_addr (value) {
		this._dma_addr = value & 0xFF;
	}

	get dma_addr () {
		return this._dma_addr;
	}

	cpuWrite(addr, data) {
		if (this.cart.cpuWrite(addr, data) !== false) {
			// The cartridge "sees all" and has the facility to veto
			// the propagation of the bus transaction if it requires.
			// This allows the cartridge to map any address to some
			// other data, including the facility to divert transactions
			// with other physical devices. The NES does not do this
			// but I figured it might be quite a flexible way of adding
			// "custom" hardware to the NES in the future!
		} else if (addr >= 0x0000 && addr <= 0x1FFF) {
			// System RAM Address Range. The range covers 8KB, though
			// there is only 2KB available. That 2KB is "mirrored"
			// the bottom 11 bits is the same as addr % 2048.
			// through this address range. Using bitwise AND to mask
			this.cpuRam[addr & 0x07FF] = data;

		} else if (addr >= 0x2000 && addr <= 0x3FFF) {
			// PPU Address range. The PPU only has 8 primary registers
			// and these are repeated throughout this range. We can
			// use bitwise AND operation to mask the bottom 3 bits,
			// which is the equivalent of addr % 8.
			this.ppu.cpuWrite(addr & 0x0007, data);
		} else if ((addr >= 0x4000 && addr <= 0x4013) || addr === 0x4015 || addr === 0x4017) {
			this.apu.cpuWrite(addr, data);
		} else if (addr === 0x4014) {
			// A write to this address initiates a DMA transfer
			this.dma_page = data;
			this.dma_addr = 0x00;
			this.dma_transfer = true;
		} else if (addr >= 0x4016 && addr <= 0x4017) {
			// "Lock In" controller state at this time
			this.controller_state[addr & 0x0001] = this.controller[addr & 0x0001];
		}

	}

	insertCartridge(cartridge)
	{
		// Connects cartridge to both Main Bus and CPU Bus
		this.cart = cartridge;
		this.ppu.ConnectCartridge(cartridge);
	}

	cpuRead(addr, bReadOnly) {
		let data = 0x00;
		let temp = this.cart.cpuRead(addr, data);

		if (temp !== false) {
			data = temp;
			// Cartridge Address Range
		} else if (addr >= 0x0000 && addr <= 0x1FFF) {
			// System RAM Address Range, mirrored every 2048
			data = this.cpuRam[addr & 0x07FF];
		} else if (addr >= 0x2000 && addr <= 0x3FFF) {
			// PPU Address range, mirrored every 8
			data = this.ppu.cpuRead(addr & 0x0007, bReadOnly);
		} else if (addr >= 0x4016 && addr <= 0x4017) {
			// Read out the MSB of the controller status word
			data = (this.controller_state[addr & 0x0001] & 0x80) > 0;

			this.controller_state[addr & 0x0001] <<= 1;
		}


		return data;
	}

	setSampleFrequency (sample_rate) {
		this.audioTimePerSystemSample = 1000 / sample_rate;
		this.audioTimePerNESClock = 0.000186243393;
	}

	reset()
	{
		this.cart.reset();
		this.cpu.reset();
		this.ppu.reset();
		this.nSystemClockCounter = 0;
		this.dma_page = 0x00;
		this.dma_addr = 0x00;
		this.dma_data = 0x00;
		this.dma_dummy = true;
		this.dma_transfer = false;
	}

	clock()
	{
		// Clocking. The heart and soul of an emulator. The running
		// frequency is controlled by whatever calls this function.
		// So here we "divide" the clock as necessary and call
		// the peripheral devices clock() function at the correct
		// times.

		// The fastest clock frequency the digital system cares
		// about is equivalent to the PPU clock. So the PPU is clocked
		// each time this function is called.
		this.ppu.clock();
		//this.apu.clock();

		// The CPU runs 3 times slower than the PPU so we only call its
		// clock() function every 3 times this function is called. We
		// have a global counter to keep track of this.
		if (this.nSystemClockCounter % 3 === 0)
		{
			// Is the system performing a DMA transfer form CPU memory to
			// OAM memory on PPU?...
			if (this.dma_transfer)
			{
				// ...Yes! We need to wait until the next even CPU clock cycle
				// before it starts...
				if (this.dma_dummy)
				{
					// ...So hang around in here each clock until 1 or 2 cycles
					// have elapsed...
					if (this.nSystemClockCounter % 2 === 1)
					{
						// ...and finally allow DMA to start
						this.dma_dummy = false;
					}
				}
				else
				{
					// DMA can take place!
					if (this.nSystemClockCounter % 2 === 0)
					{
						// On even clock cycles, read from CPU bus
						this.dma_data = this.cpuRead(this.dma_page << 8 | this.dma_addr);

					}
					else
					{
						// On odd clock cycles, write to PPU OAM
						this.ppu.OAMWrite(this.dma_addr, this.dma_data);
						// Increment the lo byte of the address
						this.dma_addr++;
						// If this wraps around, we know that 256
						// bytes have been written, so end the DMA
						// transfer, and proceed as normal
						if (this.dma_addr === 0x00)
						{
							this.dma_transfer = false;
							this.dma_dummy = true;
						}
					}
				}
			}
			else
			{
				// No DMA happening, the CPU is in control of its
				// own destiny. Go forth my friend and calculate
				// awesomeness for many generations to come...
				this.cpu.clock();
			}
		}

		/*let audioSampleReady = false;
		this.audioTime += this.audioTimePerNESClock;
		if (this.audioTime >= this.audioTimePerSystemSample) {
			this.audioTime -= this.audioTimePerSystemSample;
			this.audioSample = {...this.apu.pulse1_osc};

			audioSampleReady = true;
		}*/

		// The PPU is capable of emitting an interrupt to indicate the
		// vertical blanking period has been entered. If it has, we need
		// to send that irq to the CPU.
		if (this.ppu.nmi)
		{
			this.ppu.nmi = false;
			this.cpu.nmi();
		}

		this.nSystemClockCounter++;

		//return audioSampleReady;
	}

}

export default Bus;
