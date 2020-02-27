import Mapper from "./Mapper";

class Mapper002 extends Mapper
{
	constructor(prgBanks, chrBanks) {
        super(prgBanks, chrBanks);

		this.nPRGBankSelectLo = 1;
		this.nPRGBankSelectHi = prgBanks - 1;

		this.reset();
	}

	cpuMapRead(addr) {
        if (addr >= 0x8000 && addr <= 0xBFFF)
        {
            return this.nPRGBankSelectLo * 0x4000 + (addr & 0x3FFF);
        }

        if (addr >= 0xC000 && addr <= 0xFFFF)
        {
            return  this.nPRGBankSelectHi * 0x4000 + (addr & 0x3FFF);
        }

		return false;
	}

	cpuMapWrite(addr, data) {
		if (addr >= 0x8000 && addr <= 0xFFFF) {
            this.nPRGBankSelectLo = data & 0x0F;

            return true;
		}

		return false;
	}

	ppuMapRead(addr) {
		// There is no mapping required for PPU
		// PPU Address Bus          CHR ROM
		// 0x0000 -> 0x1FFF: Map    0x0000 -> 0x1FFF
        if (addr < 0x2000)
        {
            if (this.nCHRBanks === 0) // Treating as RAM
            {
                return addr;
            }
        }
        return false;
	}

	ppuMapWrite(addr) {
        if (addr < 0x2000)
        {
            if (this.nCHRBanks === 0) // Treating as RAM
            {
                return addr;
            }
        }

		return false;
	}


	reset() {
        this.nPRGBankSelectLo = 1;
        this.nPRGBankSelectHi = this.nPRGBanks - 1;
	}
}

export default Mapper002;
