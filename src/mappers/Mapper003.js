import Mapper from "./Mapper";

class Mapper003 extends Mapper
{
	constructor(prgBanks, chrBanks) {
        super(prgBanks, chrBanks);

		this.nCHRBankSelect = 0;

		this.reset();
	}

	cpuMapRead(addr) {
        if (addr >= 0x8000 && addr <= 0xFFFF)
        {
            if (this.nPRGBanks === 1) // 16K ROM
                return addr & 0x3FFF;

            if (this.nPRGBanks === 2) // 32K ROM
                return addr & 0x7FFF;
        }

		return false;
	}

	cpuMapWrite(addr, data) {
		if (addr >= 0x8000 && addr <= 0xFFFF) {
            this.nCHRBankSelect = data & 0x03;

            return true;
		}

		return false;
	}

	ppuMapRead(addr) {
        if (addr < 0x2000)
        {
            return this.nCHRBankSelect * 0x2000 + addr;
        }

        return false;
	}

	ppuMapWrite(addr) {
		return false;
	}


	reset() {
        this.nCHRBankSelect = 0;
	}
}

export default Mapper003;
