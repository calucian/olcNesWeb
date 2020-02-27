import Mapper from "./Mapper";

class Mapper001 extends  Mapper
{
    constructor (prgBanks, chrBanks, mirrorMode) {
        super(prgBanks, chrBanks);

        this.nCHRBankSelect4Lo = 0x00;
        this.nCHRBankSelect4Hi = 0x00;
        this.nCHRBankSelect8 = 0x00;

        this.nPRGBankSelect16Lo = 0x00;
        this.nPRGBankSelect16Hi = 0x00;
        this.nPRGBankSelect32 = 0x00;

        this.nLoadRegister = 0x00;
        this.nLoadRegisterCount = 0x00;
        this.nControlRegister = 0x00;

        this.mirrormode = mirrorMode;

        this.vRAMStatic = [];

        this.reset();
    }

    cpuMapRead(addr, data) {
        if (addr >= 0x6000 && addr <= 0x7FFF)
        {
            data.data = this.vRAMStatic[addr & 0x1FFF];
            // Read is from static ram on cartridge
            return 0xFFFFFFFF;
        }

        if (addr >= 0x8000)
        {
            if (this.nControlRegister & 0b01000)
            {
                // 16K Mode
                if (addr >= 0x8000 && addr <= 0xBFFF)
                {
                    return this.nPRGBankSelect16Lo * 0x4000 + (addr & 0x3FFF);
                }

                if (addr >= 0xC000 && addr <= 0xFFFF)
                {
                    return this.nPRGBankSelect16Hi * 0x4000 + (addr & 0x3FFF);
                }
            }
            else
            {
                // 32K Mode
                return this.nPRGBankSelect32 * 0x8000 + (addr & 0x7FFF);
            }
        }

        return false;
    }

    cpuMapWrite(addr, data) {
        if (addr >= 0x6000 && addr <= 0x7FFF)
        {
            this.vRAMStatic[addr & 0x1FFF] = data;
            // Write is to static ram on cartridge
            return 0xFFFFFFFF;
        }

        if (addr >= 0x8000)
        {
            if (data & 0x80)
            {
                // MSB is set, so reset serial loading
                this.nLoadRegister = 0x00;
                this.nLoadRegisterCount = 0;
                this.nControlRegister = this.nControlRegister | 0x0C;
            }
            else
            {
                // Load data in serially into load register
                // It arrives LSB first, so implant this at
                // bit 5. After 5 writes, the register is ready
                this.nLoadRegister >>= 1;
                this.nLoadRegister |= (data & 0x01) << 4;
                this.nLoadRegisterCount++;

                if (this.nLoadRegisterCount === 5)
                {
                    // Get Mapper Target Register, by examining
                    // bits 13 & 14 of the address
                    let nTargetRegister = (addr >> 13) & 0x03;

                    if (nTargetRegister === 0) // 0x8000 - 0x9FFF
                    {
                        // Set Control Register
                        this.nControlRegister = this.nLoadRegister & 0x1F;

                        switch (this.nControlRegister & 0x03)
                        {
                            case 0:	this.mirrormode = Cartridge.ONESCREEN_LO; break;
                            case 1: this.mirrormode = Cartridge.ONESCREEN_HI; break;
                            case 2: this.mirrormode = Cartridge.VERTICAL;     break;
                            case 3:	this.mirrormode = Cartridge.HORIZONTAL;   break;
                        }
                    }
                    else if (nTargetRegister === 1) // 0xA000 - 0xBFFF
                    {
                        // Set CHR Bank Lo
                        if (this.nControlRegister & 0b10000)
                        {
                            // 4K CHR Bank at PPU 0x0000
                            this.nCHRBankSelect4Lo = this.nLoadRegister & 0x1F;
                        }
                        else
                        {
                            // 8K CHR Bank at PPU 0x0000
                            this.nCHRBankSelect8 = this.nLoadRegister & 0x1E;
                        }
                    }
                    else if (nTargetRegister === 2) // 0xC000 - 0xDFFF
                    {
                        // Set CHR Bank Hi
                        if (this.nControlRegister & 0b10000)
                        {
                            // 4K CHR Bank at PPU 0x1000
                            this.nCHRBankSelect4Hi = this.nLoadRegister & 0x1F;
                        }
                    }
                    else if (nTargetRegister === 3) // 0xE000 - 0xFFFF
                    {
                        // Configure PRG Banks
                        let nPRGMode = (this.nControlRegister >> 2) & 0x03;

                        if (nPRGMode === 0 || nPRGMode === 1)
                        {
                            // Set 32K PRG Bank at CPU 0x8000
                            this.nPRGBankSelect32 = (this.nLoadRegister & 0x0E) >> 1;
                        }
                        else if (nPRGMode === 2)
                        {
                            // Fix 16KB PRG Bank at CPU 0x8000 to First Bank
                            this.nPRGBankSelect16Lo = 0;
                            // Set 16KB PRG Bank at CPU 0xC000
                            this.nPRGBankSelect16Hi = this.nLoadRegister & 0x0F;
                        }
                        else if (nPRGMode === 3)
                        {
                            // Set 16KB PRG Bank at CPU 0x8000
                            this.nPRGBankSelect16Lo = this.nLoadRegister & 0x0F;
                            // Fix 16KB PRG Bank at CPU 0xC000 to Last Bank
                            this.nPRGBankSelect16Hi = this.nPRGBanks - 1;
                        }
                    }

                    // 5 bits were written, and decoded, so
                    // reset load register
                    this.nLoadRegister = 0x00;
                    this.nLoadRegisterCount = 0;
                }

            }

        }

        return false;
    }

    ppuMapRead(addr) {
        if (addr < 0x2000)
        {
            if (this.nCHRBanks === 0)
            {
                return addr;
            }
            else
            {
                if (this.nControlRegister & 0b10000)
                {
                    // 4K CHR Bank Mode
                    if (addr >= 0x0000 && addr <= 0x0FFF)
                    {
                        return this.nCHRBankSelect4Lo * 0x1000 + (addr & 0x0FFF);
                    }

                    if (addr >= 0x1000 && addr <= 0x1FFF)
                    {
                        return this.nCHRBankSelect4Hi * 0x1000 + (addr & 0x0FFF);
                    }
                }
                else
                {
                    // 8K CHR Bank Mode
                    return this.nCHRBankSelect8 * 0x2000 + (addr & 0x1FFF);
                }
            }
        }

        return false;
    }

    ppuMapWrite(addr) {
        if (addr < 0x2000)
        {
            if (this.nCHRBanks === 0)
            {
                return addr;
            }

            return true;
        }

        return false;
    }


    reset() {
        this.nControlRegister = 0x1C;
        this.nLoadRegister = 0x00;
        this.nLoadRegisterCount = 0x00;

        this.nCHRBankSelect4Lo = 0;
        this.nCHRBankSelect4Hi = 0;
        this.nCHRBankSelect8 = 0;

        this.nPRGBankSelect32 = 0;
        this.nPRGBankSelect16Lo = 0;
        this.nPRGBankSelect16Hi = this.nPRGBanks - 1;
    }
}

export default Mapper001;
