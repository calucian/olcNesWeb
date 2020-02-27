import Mapper from "./Mapper";

class Mapper000 extends Mapper
{
	constructor(prgBanks, chrBanks) {
	    super(prgBanks, chrBanks);

		this.reset();
	}

	cpuMapRead(addr) {
		// if PRGROM is 16KB
		//     CPU Address Bus          PRG ROM
		//     0x8000 -> 0xBFFF: Map    0x0000 -> 0x3FFF
		//     0xC000 -> 0xFFFF: Mirror 0x0000 -> 0x3FFF
		// if PRGROM is 32KB
		//     CPU Address Bus          PRG ROM
		//     0x8000 -> 0xFFFF: Map    0x0000 -> 0x7FFF
		if (addr >= 0x8000 && addr <= 0xFFFF) {
			return addr & (this.nPRGBanks > 1 ? 0x7FFF : 0x3FFF);
		}

		return false;
	}

	cpuMapWrite(addr, data) {
		if (addr >= 0x8000 && addr <= 0xFFFF) {
			return addr & (this.nPRGBanks > 1 ? 0x7FFF : 0x3FFF);
		}

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


	reset() {

	}
}

export default Mapper000;
