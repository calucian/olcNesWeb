class Mapper
{
	constructor(prgBanks, chrBanks) {
		this.nPRGBanks = prgBanks;
		this.nCHRBanks = chrBanks;

		this.reset();
	}

	cpuMapRead(addr) {
		return false;
	}

	cpuMapWrite(addr, data) {

		return false;
	}

	ppuMapRead(addr) {
		// There is no mapping required for PPU
		// PPU Address Bus          CHR ROM
		// 0x0000 -> 0x1FFF: Map    0x0000 -> 0x1FFF
		if (addr >= 0x0000 && addr <= 0x1FFF) {
			return addr;
		}

		return false;
	}

	ppuMapWrite(addr) {
		if (addr >= 0x0000 && addr <= 0x1FFF) {
			if (this.nCHRBanks === 0) {
				// Treat as RAM
				return addr;
			}
		}

		return false;
	}


	reset() {}
}

export default Mapper;
