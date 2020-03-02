import Mapper from "./Mapper";

class Mapper066 extends Mapper
{
	constructor(prgBanks, chrBanks) {
        super(prgBanks, chrBanks);

		this.nCHRBankSelect = 0;
		this.nPRGBankSelect = 0;

		this.reset();
	}

	cpuMapRead(addr) {
        if (addr >= 0x8000 && addr <= 0xFFFF)
        {
            return this.nPRGBankSelect * 0x8000 + (addr & 0x7FFF);
        }

		return false;
	}

	cpuMapWrite(addr, data) {
		if (addr >= 0x8000 && addr <= 0xFFFF) {
            this.nCHRBankSelect = data & 0x03;
            this.nPRGBankSelect = (data & 0x30) >> 4;

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
        this.nPRGBankSelectLo = 1;
        this.nPRGBankSelectHi = this.nPRGBanks - 1;
	}
}

export default Mapper066;
