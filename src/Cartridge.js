/*
	olc::NES - Cartridge
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


	Relevant Video: https://youtu.be/-THeUXqR3zY

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

import Mapper000 from "./mappers/Mapper000";
import Mapper001 from "./mappers/Mapper001";
import Mapper002 from "./mappers/Mapper002";
import Mapper003 from "./mappers/Mapper003";
import Mapper066 from "./mappers/Mapper066";
import parseNES from "./lib/parseNes";

class Cartridge
{
	constructor () {
		this.mirror = self.HORIZONTAL;

		this.nMapperID = 0;
		this.nPRGBanks = 0;
		this.nCHRBanks = 0;

		this.vPRGMemory = [];
		this.vCHRMemory = [];

		this.pMapper = null;

		this.bImageValid = false;
	}

	loadFile (file, cb) {
		let reader = new FileReader();
		reader.onload = (data) => {
			let info = parseNES(new buffer.Buffer(data.target.result));

			this.vPRGMemory = info.prg_rom;
			if (info.chr_rom_size)
			    this.vCHRMemory = info.chr_rom;

			let mirroring = {
			    'horizontal': 1,
                'vertical': 2,
                'vcertical': 3,
                'vecertical': 4
            };
			this.mirror = mirroring[info.mirroring];
			this.info = info;

			this.nPRGBanks = info.prg_rom_size / 16384;
			this.nCHRBanks = info.chr_rom_size / 8192;

			// Load appropriate mapper
			switch (info.mapper)
			{
				case   0: this.pMapper = new Mapper000(this.nPRGBanks, this.nCHRBanks); break;
				case   1: this.pMapper = new Mapper001(this.nPRGBanks, this.nCHRBanks, this.mirror); break;
				case   2: this.pMapper = new Mapper002(this.nPRGBanks, this.nCHRBanks); break;
				case   3: this.pMapper = new Mapper003(this.nPRGBanks, this.nCHRBanks); break;
				case  66: this.pMapper = new Mapper066(this.nPRGBanks, this.nCHRBanks); break;
			}

			cb();

			this.bImageValid = true;
		};

		reader.readAsArrayBuffer(file);
	}

	ImageValid () {
		return this.bImageValid;
	}

	/**
	 * @TODO: fix how data is passed
	 */
	cpuRead(addr)
	{
	    let data = { data: null };
		let mapped_addr = this.pMapper.cpuMapRead(addr, data);

		if (mapped_addr !== false) {
		    if (mapped_addr === 0xFFFFFFFF) {
                return data.data;
            }

			return this.vPRGMemory[mapped_addr];
		}

		return false;
	}

	cpuWrite(addr, data) {
		let mapped_addr = this.pMapper.cpuMapWrite(addr, data);

		if (mapped_addr !== false) {
			this.vPRGMemory[mapped_addr] = data;
			return true;
		}

		return false;
	}

	ppuRead (addr) {
		let mapped_addr = this.pMapper.ppuMapRead(addr);

		if (mapped_addr !== false)
		{
			return this.vCHRMemory[mapped_addr];
		}

		return false;
	}

	ppuWrite(addr, data) {
		let mapped_addr = this.pMapper.ppuMapWrite(addr, data);

		if (mapped_addr !== false) {
			this.vCHRMemory[mapped_addr] = data;
			return true;
		}

		return false;
	}

	reset () {
		if (this.pMapper) {
			this.pMapper.reset();
		}
	}
}

Cartridge.HORIZONTAL= 1;
Cartridge.VERTICAL= 2;
Cartridge.ONESCREEN_LO = 3;
Cartridge.ONESCREEN_HI = 4;


export default Cartridge;
