'use strict';

const FLAGS6502 = {
	C: (1 << 0),	// Carry Bit
	Z: (1 << 1),	// Zero
	I: (1 << 2),	// Disable Interrupts
	D: (1 << 3),	// Decimal Mode (unused in this implementation)
	B: (1 << 4),	// Break
	U: (1 << 5),	// Unused
	V: (1 << 6),	// Overflow
	N: (1 << 7),	// Negative
};

class olc6502 {
	constructor(bus) {
		this.bus = bus;

		this.a = 0x00;		// Accumulator Register
		this.x = 0x00;		// X Register
		this.y = 0x00;		// Y Register
		this.stkp = 0x00;		// Stack Pointer (points to location on bus)
		this.pc = 0x0000;	// Program Counter
		this.status = 0x00;		// Status Register

		this.fetched = 0x00;   // Represents the working input value to the ALU
		this.temp = 0x0000; // A convenience variable used everywhere
		this.addr_abs = 0x0000; // All used memory addresses end up in here
		this.addr_rel = 0x00;   // Represents absolute address following a branch
		this.pcode = 0x00;   // Is the instruction byte
		this.cycles = 0;	   // Counts how many cycles the instruction has remaining
		this.clock_count = 0;	   // A global accumulation of the number of clocks

		// Set it
		this.pc = 0x000;

		this.lookup = [
			["BRK", this.BRK, this.IMM, 7], ["ORA", this.ORA, this.IZX, 6], ["???", this.XXX, this.IMP, 2], ["???", this.XXX, this.IMP, 8], ["???", this.NOP, this.IMP, 3], ["ORA", this.ORA, this.ZP0, 3], ["ASL", this.ASL, this.ZP0, 5], ["???", this.XXX, this.IMP, 5], ["PHP", this.PHP, this.IMP, 3], ["ORA", this.ORA, this.IMM, 2], ["ASL", this.ASL, this.IMP, 2], ["???", this.XXX, this.IMP, 2], ["???", this.NOP, this.IMP, 4], ["ORA", this.ORA, this.ABS, 4], ["ASL", this.ASL, this.ABS, 6], ["???", this.XXX, this.IMP, 6],
			["BPL", this.BPL, this.REL, 2], ["ORA", this.ORA, this.IZY, 5], ["???", this.XXX, this.IMP, 2], ["???", this.XXX, this.IMP, 8], ["???", this.NOP, this.IMP, 4], ["ORA", this.ORA, this.ZPX, 4], ["ASL", this.ASL, this.ZPX, 6], ["???", this.XXX, this.IMP, 6], ["CLC", this.CLC, this.IMP, 2], ["ORA", this.ORA, this.ABY, 4], ["???", this.NOP, this.IMP, 2], ["???", this.XXX, this.IMP, 7], ["???", this.NOP, this.IMP, 4], ["ORA", this.ORA, this.ABX, 4], ["ASL", this.ASL, this.ABX, 7], ["???", this.XXX, this.IMP, 7],
			["JSR", this.JSR, this.ABS, 6], ["AND", this.AND, this.IZX, 6], ["???", this.XXX, this.IMP, 2], ["???", this.XXX, this.IMP, 8], ["BIT", this.BIT, this.ZP0, 3], ["AND", this.AND, this.ZP0, 3], ["ROL", this.ROL, this.ZP0, 5], ["???", this.XXX, this.IMP, 5], ["PLP", this.PLP, this.IMP, 4], ["AND", this.AND, this.IMM, 2], ["ROL", this.ROL, this.IMP, 2], ["???", this.XXX, this.IMP, 2], ["BIT", this.BIT, this.ABS, 4], ["AND", this.AND, this.ABS, 4], ["ROL", this.ROL, this.ABS, 6], ["???", this.XXX, this.IMP, 6],
			["BMI", this.BMI, this.REL, 2], ["AND", this.AND, this.IZY, 5], ["???", this.XXX, this.IMP, 2], ["???", this.XXX, this.IMP, 8], ["???", this.NOP, this.IMP, 4], ["AND", this.AND, this.ZPX, 4], ["ROL", this.ROL, this.ZPX, 6], ["???", this.XXX, this.IMP, 6], ["SEC", this.SEC, this.IMP, 2], ["AND", this.AND, this.ABY, 4], ["???", this.NOP, this.IMP, 2], ["???", this.XXX, this.IMP, 7], ["???", this.NOP, this.IMP, 4], ["AND", this.AND, this.ABX, 4], ["ROL", this.ROL, this.ABX, 7], ["???", this.XXX, this.IMP, 7],
			["RTI", this.RTI, this.IMP, 6], ["EOR", this.EOR, this.IZX, 6], ["???", this.XXX, this.IMP, 2], ["???", this.XXX, this.IMP, 8], ["???", this.NOP, this.IMP, 3], ["EOR", this.EOR, this.ZP0, 3], ["LSR", this.LSR, this.ZP0, 5], ["???", this.XXX, this.IMP, 5], ["PHA", this.PHA, this.IMP, 3], ["EOR", this.EOR, this.IMM, 2], ["LSR", this.LSR, this.IMP, 2], ["???", this.XXX, this.IMP, 2], ["JMP", this.JMP, this.ABS, 3], ["EOR", this.EOR, this.ABS, 4], ["LSR", this.LSR, this.ABS, 6], ["???", this.XXX, this.IMP, 6],
			["BVC", this.BVC, this.REL, 2], ["EOR", this.EOR, this.IZY, 5], ["???", this.XXX, this.IMP, 2], ["???", this.XXX, this.IMP, 8], ["???", this.NOP, this.IMP, 4], ["EOR", this.EOR, this.ZPX, 4], ["LSR", this.LSR, this.ZPX, 6], ["???", this.XXX, this.IMP, 6], ["CLI", this.CLI, this.IMP, 2], ["EOR", this.EOR, this.ABY, 4], ["???", this.NOP, this.IMP, 2], ["???", this.XXX, this.IMP, 7], ["???", this.NOP, this.IMP, 4], ["EOR", this.EOR, this.ABX, 4], ["LSR", this.LSR, this.ABX, 7], ["???", this.XXX, this.IMP, 7],
			["RTS", this.RTS, this.IMP, 6], ["ADC", this.ADC, this.IZX, 6], ["???", this.XXX, this.IMP, 2], ["???", this.XXX, this.IMP, 8], ["???", this.NOP, this.IMP, 3], ["ADC", this.ADC, this.ZP0, 3], ["ROR", this.ROR, this.ZP0, 5], ["???", this.XXX, this.IMP, 5], ["PLA", this.PLA, this.IMP, 4], ["ADC", this.ADC, this.IMM, 2], ["ROR", this.ROR, this.IMP, 2], ["???", this.XXX, this.IMP, 2], ["JMP", this.JMP, this.IND, 5], ["ADC", this.ADC, this.ABS, 4], ["ROR", this.ROR, this.ABS, 6], ["???", this.XXX, this.IMP, 6],
			["BVS", this.BVS, this.REL, 2], ["ADC", this.ADC, this.IZY, 5], ["???", this.XXX, this.IMP, 2], ["???", this.XXX, this.IMP, 8], ["???", this.NOP, this.IMP, 4], ["ADC", this.ADC, this.ZPX, 4], ["ROR", this.ROR, this.ZPX, 6], ["???", this.XXX, this.IMP, 6], ["SEI", this.SEI, this.IMP, 2], ["ADC", this.ADC, this.ABY, 4], ["???", this.NOP, this.IMP, 2], ["???", this.XXX, this.IMP, 7], ["???", this.NOP, this.IMP, 4], ["ADC", this.ADC, this.ABX, 4], ["ROR", this.ROR, this.ABX, 7], ["???", this.XXX, this.IMP, 7],
			["???", this.NOP, this.IMP, 2], ["STA", this.STA, this.IZX, 6], ["???", this.NOP, this.IMP, 2], ["???", this.XXX, this.IMP, 6], ["STY", this.STY, this.ZP0, 3], ["STA", this.STA, this.ZP0, 3], ["STX", this.STX, this.ZP0, 3], ["???", this.XXX, this.IMP, 3], ["DEY", this.DEY, this.IMP, 2], ["???", this.NOP, this.IMP, 2], ["TXA", this.TXA, this.IMP, 2], ["???", this.XXX, this.IMP, 2], ["STY", this.STY, this.ABS, 4], ["STA", this.STA, this.ABS, 4], ["STX", this.STX, this.ABS, 4], ["???", this.XXX, this.IMP, 4],
			["BCC", this.BCC, this.REL, 2], ["STA", this.STA, this.IZY, 6], ["???", this.XXX, this.IMP, 2], ["???", this.XXX, this.IMP, 6], ["STY", this.STY, this.ZPX, 4], ["STA", this.STA, this.ZPX, 4], ["STX", this.STX, this.ZPY, 4], ["???", this.XXX, this.IMP, 4], ["TYA", this.TYA, this.IMP, 2], ["STA", this.STA, this.ABY, 5], ["TXS", this.TXS, this.IMP, 2], ["???", this.XXX, this.IMP, 5], ["???", this.NOP, this.IMP, 5], ["STA", this.STA, this.ABX, 5], ["???", this.XXX, this.IMP, 5], ["???", this.XXX, this.IMP, 5],
			["LDY", this.LDY, this.IMM, 2], ["LDA", this.LDA, this.IZX, 6], ["LDX", this.LDX, this.IMM, 2], ["???", this.XXX, this.IMP, 6], ["LDY", this.LDY, this.ZP0, 3], ["LDA", this.LDA, this.ZP0, 3], ["LDX", this.LDX, this.ZP0, 3], ["???", this.XXX, this.IMP, 3], ["TAY", this.TAY, this.IMP, 2], ["LDA", this.LDA, this.IMM, 2], ["TAX", this.TAX, this.IMP, 2], ["???", this.XXX, this.IMP, 2], ["LDY", this.LDY, this.ABS, 4], ["LDA", this.LDA, this.ABS, 4], ["LDX", this.LDX, this.ABS, 4], ["???", this.XXX, this.IMP, 4],
			["BCS", this.BCS, this.REL, 2], ["LDA", this.LDA, this.IZY, 5], ["???", this.XXX, this.IMP, 2], ["???", this.XXX, this.IMP, 5], ["LDY", this.LDY, this.ZPX, 4], ["LDA", this.LDA, this.ZPX, 4], ["LDX", this.LDX, this.ZPY, 4], ["???", this.XXX, this.IMP, 4], ["CLV", this.CLV, this.IMP, 2], ["LDA", this.LDA, this.ABY, 4], ["TSX", this.TSX, this.IMP, 2], ["???", this.XXX, this.IMP, 4], ["LDY", this.LDY, this.ABX, 4], ["LDA", this.LDA, this.ABX, 4], ["LDX", this.LDX, this.ABY, 4], ["???", this.XXX, this.IMP, 4],
			["CPY", this.CPY, this.IMM, 2], ["CMP", this.CMP, this.IZX, 6], ["???", this.NOP, this.IMP, 2], ["???", this.XXX, this.IMP, 8], ["CPY", this.CPY, this.ZP0, 3], ["CMP", this.CMP, this.ZP0, 3], ["DEC", this.DEC, this.ZP0, 5], ["???", this.XXX, this.IMP, 5], ["INY", this.INY, this.IMP, 2], ["CMP", this.CMP, this.IMM, 2], ["DEX", this.DEX, this.IMP, 2], ["???", this.XXX, this.IMP, 2], ["CPY", this.CPY, this.ABS, 4], ["CMP", this.CMP, this.ABS, 4], ["DEC", this.DEC, this.ABS, 6], ["???", this.XXX, this.IMP, 6],
			["BNE", this.BNE, this.REL, 2], ["CMP", this.CMP, this.IZY, 5], ["???", this.XXX, this.IMP, 2], ["???", this.XXX, this.IMP, 8], ["???", this.NOP, this.IMP, 4], ["CMP", this.CMP, this.ZPX, 4], ["DEC", this.DEC, this.ZPX, 6], ["???", this.XXX, this.IMP, 6], ["CLD", this.CLD, this.IMP, 2], ["CMP", this.CMP, this.ABY, 4], ["NOP", this.NOP, this.IMP, 2], ["???", this.XXX, this.IMP, 7], ["???", this.NOP, this.IMP, 4], ["CMP", this.CMP, this.ABX, 4], ["DEC", this.DEC, this.ABX, 7], ["???", this.XXX, this.IMP, 7],
			["CPX", this.CPX, this.IMM, 2], ["SBC", this.SBC, this.IZX, 6], ["???", this.NOP, this.IMP, 2], ["???", this.XXX, this.IMP, 8], ["CPX", this.CPX, this.ZP0, 3], ["SBC", this.SBC, this.ZP0, 3], ["INC", this.INC, this.ZP0, 5], ["???", this.XXX, this.IMP, 5], ["INX", this.INX, this.IMP, 2], ["SBC", this.SBC, this.IMM, 2], ["NOP", this.NOP, this.IMP, 2], ["???", this.SBC, this.IMP, 2], ["CPX", this.CPX, this.ABS, 4], ["SBC", this.SBC, this.ABS, 4], ["INC", this.INC, this.ABS, 6], ["???", this.XXX, this.IMP, 6],
			["BEQ", this.BEQ, this.REL, 2], ["SBC", this.SBC, this.IZY, 5], ["???", this.XXX, this.IMP, 2], ["???", this.XXX, this.IMP, 8], ["???", this.NOP, this.IMP, 4], ["SBC", this.SBC, this.ZPX, 4], ["INC", this.INC, this.ZPX, 6], ["???", this.XXX, this.IMP, 6], ["SED", this.SED, this.IMP, 2], ["SBC", this.SBC, this.ABY, 4], ["NOP", this.NOP, this.IMP, 2], ["???", this.XXX, this.IMP, 7], ["???", this.NOP, this.IMP, 4], ["SBC", this.SBC, this.ABX, 4], ["INC", this.INC, this.ABX, 7], ["???", this.XXX, this.IMP, 7],
		];

		this.lookup = this.lookup.map(item => ({
			name:     item[0],
			operate:  item[1],
			addrmode: item[2],
			cycles:   item[3]
		}));
	}

	ConnectBus (bus) {
		this.bus = bus;
	}

///////////////////////////////////////////////////////////////////////////////
// BUS CONNECTIVITY

// Reads an 8-bit byte from the bus, located at the specified 16-bit address
	read(a) {
		// In normal operation "read only" is set to false. This may seem odd. Some
		// devices on the bus may change state when they are read from, and this
		// is intentional under normal circumstances. However the disassembler will
		// want to read the data at an address without changing the state of the
		// devices on the bus
		return this.bus.cpuRead(a, false);
	}

	// Writes a byte to the bus at the specified address
	write(a, d) {
		this.bus.cpuWrite(a, d);
	}


///////////////////////////////////////////////////////////////////////////////
// EXTERNAL INPUTS

// Forces the 6502 into a known state. This is hard-wired inside the CPU. The
// registers are set to 0x00, the status register is cleared except for unused
// bit which remains at 1. An absolute address is read from location 0xFFFC
// which contains a second address that the program counter is set to. This
// allows the programmer to jump to a known and programmable location in the
// memory to start executing from. Typically the programmer would set the value
// at location 0xFFFC at compile time.
	reset() {
		// Get address to set program counter to
		this.addr_abs = 0xFFFC;
		let lo = this.read(this.addr_abs + 0);
		let hi = this.read(this.addr_abs + 1);

		// Set it
		this.pc = (hi << 8) | lo;

		// Reset internal registers
		this.a = 0;
		this.x = 0;
		this.y = 0;
		this.stkp = 0xFD;
		this.status = 0x00 | FLAGS6502.U;

		// Clear internal helper variables
		this.addr_rel = 0x0000;
		this.addr_abs = 0x0000;
		this.fetched = 0x00;

		// Reset takes time
		this.cycles = 8;
	}


// Interrupt requests are a complex operation and only happen if the
// "disable interrupt" flag is 0. IRQs can happen at any time, but
// you dont want them to be destructive to the operation of the running
// program. Therefore the current instruction is allowed to finish
// (which I facilitate by doing the whole thing when cycles == 0) and
// then the current program counter is stored on the stack. Then the
// current status register is stored on the stack. When the routine
// that services the interrupt has finished, the status register
// and program counter can be restored to how they where before it
// occurred. This is impemented by the "RTI" instruction. Once the IRQ
// has happened, in a similar way to a reset, a programmable address
// is read form hard coded location 0xFFFE, which is subsequently
// set to the program counter.
	irq() {
		// If interrupts are allowed
		if (this.GetFlag(FLAGS6502.I) === 0) {
			// Push the program counter to the stack. It's 16-bits dont
			// forget so that takes two pushes
			this.write(0x0100 + this.stkp, (this.pc >> 8) & 0x00FF);
			this.stkp--;
			this.write(0x0100 + this.stkp, this.pc & 0x00FF);
			this.stkp--;

			// Then Push the status register to the stack
			this.SetFlag(B, 0);
			this.SetFlag(U, 1);
			this.SetFlag(I, 1);
			this.write(0x0100 + this.stkp, this.status);
			this.stkp--;

			// Read new program counter location from fixed address
			this.addr_abs = 0xFFFE;
			let lo = this.read(this.addr_abs + 0);
			let hi = this.read(this.addr_abs + 1);
			this.pc = (hi << 8) | lo;

			// IRQs take time
			this.cycles = 7;
		}
	}


// A Non-Maskable Interrupt cannot be ignored. It behaves in exactly the
// same way as a regular IRQ, but reads the new program counter address
// form location 0xFFFA.
	nmi() {
		this.write(0x0100 + this.stkp, (this.pc >> 8) & 0x00FF);
		this.stkp--;
		this.write(0x0100 + this.stkp, this.pc & 0x00FF);
		this.stkp--;

		this.SetFlag(FLAGS6502.B, 0);
		this.SetFlag(FLAGS6502.U, 1);
		this.SetFlag(FLAGS6502.I, 1);
		var v = this.GetFlag(FLAGS6502.N) << 7;
		v |= this.GetFlag(FLAGS6502.V) << 6;
		v |= 3 << 4;
		v |= this.GetFlag(FLAGS6502.D) << 3;
		v |= this.GetFlag(FLAGS6502.I) << 2;
		v |= this.GetFlag(FLAGS6502.Z) << 1;
		v |= this.GetFlag(FLAGS6502.C);
		this.write(0x0100 + this.stkp, v);
		this.stkp--;

		this.addr_abs = 0xFFFA;
		let lo = this.read(this.addr_abs + 0);
		let hi = this.read(this.addr_abs + 1);
		this.pc = (hi << 8) | lo;

		this.cycles = 8;
	}

// Perform one clock cycles worth of emulation
	clock() {
		// Each instruction requires a variable number of clock cycles to execute.
		// In my emulation, I only care about the final result and so I perform
		// the entire computation in one hit. In hardware, each clock cycle would
		// perform "microcode" style transformations of the CPUs state.
		//
		// To remain compliant with connected devices, it's important that the
		// emulation also takes "time" in order to execute instructions, so I
		// implement that delay by simply counting down the cycles required by
		// the instruction. When it reaches 0, the instruction is complete, and
		// the next one is ready to be executed.
		if (this.cycles === 0) {
			// Read next instruction byte. This 8-bit value is used to index
			// the translation table to get the relevant information about
			// how to implement the instruction
			this.opcode = this.read(this.pc) || 0;

			// Always set the unused status flag bit to 1
			this.SetFlag(FLAGS6502.U, true);

			// Increment program counter, we read the opcode byte
			this.pc++;

			// Get Starting number of cycles
			this.cycles = this.lookup[this.opcode].cycles;

			// Perform fetch of intermmediate data using the
			// required addressing mode
			let additional_cycle1 = (this.lookup[this.opcode].addrmode).bind(this)();

			// Perform operation
			let additional_cycle2 = (this.lookup[this.opcode].operate).bind(this)();

			// The addressmode and opcode may have altered the number
			// of cycles this instruction requires before its completed
			this.cycles += (additional_cycle1 & additional_cycle2);

			// Always set the unused status flag bit to 1
			this.SetFlag(FLAGS6502.U, true);

			/*#ifdef LOGMODE
			// This logger dumps every cycle the entire processor state for analysis.
			// This can be used for debugging the emulation, but has little utility
			// during emulation. Its also very slow, so only use if you have to.
			if (logfile == nullptr)	logfile = fopen("olc6502.txt", "wt");
			if (logfile != nullptr)
			{
				fprintf(logfile, "%10d:%02d PC:%04X %s A:%02X X:%02X Y:%02X %s%s%s%s%s%s%s%s STKP:%02X\n",
					clock_count, 0, log_pc, "XXX", a, x, y,
					GetFlag(N) ? "N" : ".",	GetFlag(V) ? "V" : ".",	GetFlag(U) ? "U" : ".",
					GetFlag(B) ? "B" : ".",	GetFlag(D) ? "D" : ".",	GetFlag(I) ? "I" : ".",
					GetFlag(Z) ? "Z" : ".",	GetFlag(C) ? "C" : ".",	stkp);
			}
			#endif*/
		}

		// Increment global clock count - This is actually unused unless logging is enabled
		// but I've kept it in because its a handy watch variable for debugging
		this.clock_count++;

		// Decrement the number of cycles remaining for this instruction
		this.cycles--;
	}


	///////////////////////////////////////////////////////////////////////////////
	// FLAG FUNCTIONS

	// Returns the value of a specific bit of the status register
	GetFlag(f) {
		return ((this.status & f) > 0) ? 1 : 0;
	}

	// Sets or clears a specific bit of the status register
	SetFlag(f, v) {
		if (!!v)
			this.status |= f;
		else
			this.status &= ~f;
	}


	///////////////////////////////////////////////////////////////////////////////
	// ADDRESSING MODES

	// The 6502 can address between 0x0000 - 0xFFFF. The high byte is often referred
	// to as the "page", and the low byte is the offset into that page. This implies
	// there are 256 pages, each containing 256 bytes.
	//
	// Several addressing modes have the potential to require an additional clock
	// cycle if they cross a page boundary. This is combined with several instructions
	// that enable this additional clock cycle. So each addressing function returns
	// a flag saying it has potential, as does each instruction. If both instruction
	// and address function return 1, then an additional clock cycle is required.


	// Address Mode: Implied
	// There is no additional data required for this instruction. The instruction
	// does something very simple like like sets a status bit. However, we will
	// target the accumulator, for instructions like PHA
	IMP() {
		this.fetched = this.a;
		return 0;
	}


	// Address Mode: Immediate
	// The instruction expects the next byte to be used as a value, so we'll prep
	// the read address to point to the next byte
	IMM() {
		this.addr_abs = this.pc++;
		return 0;
	}


	// Address Mode: Zero Page
	// To save program bytes, zero page addressing allows you to absolutely address
	// a location in first 0xFF bytes of address range. Clearly this only requires
	// one byte instead of the usual two.
	ZP0() {
		this.addr_abs = this.read(this.pc) & 0xFF;
		this.pc++;

		return 0;
	}


// Address Mode: Zero Page with X Offset
// Fundamentally the same as Zero Page addressing, but the contents of the X Register
// is added to the supplied single byte address. This is useful for iterating through
// ranges within the first page.
	ZPX() {
		this.addr_abs = (this.read(this.pc) + this.x) & 0xFF;
		this.pc++;

		return 0;
	}


	// Address Mode: Zero Page with Y Offset
	// Same as above but uses Y Register for offset
	ZPY() {
		this.addr_abs = (this.read(this.pc) + this.y) & 0xFF;
		this.pc++;
		//this.addr_abs &= 0x00FF;
		return 0;
	}


	// Address Mode: Relative
	// This address mode is exclusive to branch instructions. The address
	// must reside within -128 to +127 of the branch instruction, i.e.
	// you cant directly branch to any address in the addressable range.
	REL() {
		this.addr_rel = this.read(this.pc);
		this.pc++;
		if (this.addr_rel & 0x80) {
			this.addr_rel -= 0x100;
		}
		/*if (this.addr_rel & 0x80) {
			this.addr_rel -= 0x100;
		}*/
		return 0;
	}


	// Address Mode: Absolute
	// A full 16-bit address is loaded and used
	ABS() {
		let lo = this.read(this.pc);
		this.pc++;
		let hi = this.read(this.pc);
		this.pc++;

		this.addr_abs = (hi << 8) | lo;

		return 0;
	}


	// Address Mode: Absolute with X Offset
	// Fundamentally the same as absolute addressing, but the contents of the X Register
	// is added to the supplied two byte address. If the resulting address changes
	// the page, an additional clock cycle is required
	ABX() {
		let lo = this.read(this.pc);
		this.pc++;
		let hi = this.read(this.pc);
		this.pc++;

		this.addr_abs = (hi << 8) | lo;
		this.addr_abs = (this.addr_abs + this.x) & 0xFFFF;

		if ((this.addr_abs & 0xFF00) !== (hi << 8))
			return 1;
		else
			return 0;
	}


	// Address Mode: Absolute with Y Offset
	// Fundamentally the same as absolute addressing, but the contents of the Y Register
	// is added to the supplied two byte address. If the resulting address changes
	// the page, an additional clock cycle is required
	ABY() {
		let lo = this.read(this.pc);
		this.pc++;
		let hi = this.read(this.pc);
		this.pc++;

		this.addr_abs = (hi << 8) | lo;
		this.addr_abs = (this.addr_abs + this.y) & 0xFFFF;

		if ((this.addr_abs & 0xFF00) !== (hi << 8))
			return 1;
		else
			return 0;
	}

// Note: The next 3 address modes use indirection (aka Pointers!)

// Address Mode: Indirect
// The supplied 16-bit address is read to get the actual 16-bit address. This is
// instruction is unusual in that it has a bug in the hardware! To emulate its
// function accurately, we also need to emulate this bug. If the low byte of the
// supplied address is 0xFF, then to read the high byte of the actual address
// we need to cross a page boundary. This doesnt actually work on the chip as
// designed, instead it wraps back around in the same page, yielding an
// invalid actual address
	IND() {
		let a = this.read(this.pc++);
		a |= (this.read(this.pc++) << 8);
		this.addr_abs = this.read(a);
		this.addr_abs |= (this.read( (a & 0xFF00) | ((a + 1) & 0xFF) ) << 8);

		/*this.cycles += 6;

		let ptr_lo = this.read(this.pc);
		this.pc++;
		let ptr_hi = this.read(this.pc);
		this.pc++;

		let ptr = (ptr_hi << 8) | ptr_lo;

		if (ptr_lo === 0x00FF) // Simulate page boundary hardware bug
		{
			this.addr_abs = (this.read(ptr & 0xFF00) << 8) | this.read(ptr + 0);
		} else // Behave normally
		{
			this.addr_abs = (this.read((ptr + 1) & 0xFF) << 8) | this.read(ptr + 0);
		}*/

		return 0;
	}


// Address Mode: Indirect X
// The supplied 8-bit address is offset by X Register to index
// a location in page 0x00. The actual 16-bit address is read
// from this location
	IZX() {
		/*let t = this.read(this.pc);
		this.pc++;

		let lo = this.read((t + this.x) & 0x00FF);
		let hi = this.read((t + this.x + 1) & 0xFF);

		this.addr_abs = (hi << 8) | lo;*/

		var a = (this.read(this.pc++) + this.x) & 0xFF;
		this.addr_abs = (this.read((a + 1) & 0xFF) << 8) | this.read(a);

		return 0;
	}


// Address Mode: Indirect Y
// The supplied 8-bit address indexes a location in page 0x00. From
// here the actual 16-bit address is read, and the contents of
// Y Register is added to it to offset it. If the offset causes a
// change in page then an additional clock cycle is required.
	IZY() {
		let t = this.read(this.pc);
		this.pc++;

		let lo = this.read(t & 0x00FF);
		let hi = this.read((t + 1) & 0x00FF);

		this.addr_abs = (hi << 8) | lo;
		this.addr_abs = (this.addr_abs + this.y) & 0xFFFF;

		if ((this.addr_abs & 0xFF00) !== (hi << 8))
			return 1;
		else
			return 0;
	}


// This function sources the data used by the instruction into
// a convenient numeric variable. Some instructions dont have to
// fetch data as the source is implied by the instruction. For example
// "INX" increments the X register. There is no additional data
// required. For all other addressing modes, the data resides at
// the location held within this.addr_abs, so it is read from there.
// Immediate adress mode exploits this slightly, as that has
// set this.addr_abs = this.pc + 1, so it fetches the data from the
// next byte for example "LDA $FF" just loads the accumulator with
// 256, i.e. no far reaching memory fetch is required. "this.fetched"
// is a variable global to the CPU, and is set by calling this
// function. It also returns it for convenience.
	fetch() {
		if (!(this.lookup[this.pcode].addrmode === this.IMP))
			this.fetched = this.read(this.addr_abs);
		return this.fetched;
	}


///////////////////////////////////////////////////////////////////////////////
// INSTRUCTION IMPLEMENTATIONS

// Note: Ive started with the two most complicated instructions to emulate, which
// ironically is addition and subtraction! Ive tried to include a detailed
// explanation as to why they are so complex, yet so fundamental. Im also NOT
// going to do this through the explanation of 1 and 2's complement.

// Instruction: Add with Carry In
// Function:    A = A + M + C
// Flags Out:   C, V, N, Z
//
// Explanation:
// The purpose of this function is to add a value to the accumulator and a carry bit. If
// the result is > 255 there is an overflow setting the carry bit. Ths allows you to
// chain together ADC instructions to add numbers larger than 8-bits. This in itself is
// simple, however the 6502 supports the concepts of Negativity/Positivity and Signed Overflow.
//
// 10000100 = 128 + 4 = 132 in normal circumstances, we know this as unsigned and it allows
// us to represent numbers between 0 and 255 (given 8 bits). The 6502 can also interpret
// this word as something else if we assume those 8 bits represent the range -128 to +127,
// i.e. it has become signed.
//
// Since 132 > 127, it effectively wraps around, through -128, to -124. This wraparound is
// called overflow, and this is a useful to know as it indicates that the calculation has
// gone outside the permissable range, and therefore no longer makes numeric sense.
//
// Note the implementation of ADD is the same in binary, this is just about how the numbers
// are represented, so the word 10000100 can be both -124 and 132 depending upon the
// context the programming is using it in. We can prove this!
//
//  10000100 =  132  or  -124
// +00010001 = + 17      + 17
//  ========    ===       ===     See, both are valid additions, but our interpretation of
//  10010101 =  149  or  -107     the context changes the value, not the hardware!
//
// In principle under the -128 to 127 range:
// 10000000 = -128, 11111111 = -1, 00000000 = 0, 00000000 = +1, 01111111 = +127
// therefore negative numbers have the most significant set, positive numbers do not
//
// To assist us, the 6502 can set the overflow flag, if the result of the addition has
// wrapped around. V <- ~(A^M) & A^(A+M+C) :D lol, let's work out why!
//
// Let's suppose we have A = 30, M = 10 and C = 0
//          A = 30 = 00011110
//          M = 10 = 00001010+
//     RESULT = 40 = 00101000
//
// Here we have not gone out of range. The resulting significant bit has not changed.
// So let's make a truth table to understand when overflow has occurred. Here I take
// the MSB of each component, where R is RESULT.
//
// A  M  R | V | A^R | A^M |~(A^M) |
// 0  0  0 | 0 |  0  |  0  |   1   |
// 0  0  1 | 1 |  1  |  0  |   1   |
// 0  1  0 | 0 |  0  |  1  |   0   |
// 0  1  1 | 0 |  1  |  1  |   0   |  so V = ~(A^M) & (A^R)
// 1  0  0 | 0 |  1  |  1  |   0   |
// 1  0  1 | 0 |  0  |  1  |   0   |
// 1  1  0 | 1 |  1  |  0  |   1   |
// 1  1  1 | 0 |  0  |  0  |   1   |
//
// We can see how the above equation calculates V, based on A, M and R. V was chosen
// based on the following hypothesis:
//       Positive Number + Positive Number = Negative Result . Overflow
//       Negative Number + Negative Number = Positive Result . Overflow
//       Positive Number + Negative Number = Either Result . Cannot Overflow
//       Positive Number + Positive Number = Positive Result . OK! No Overflow
//       Negative Number + Negative Number = Negative Result . OK! NO Overflow

	ADC() {
		var v = this.read(this.addr_abs);
		var c = this.c;
		var r = this.a + v + c;

		// Grab the data that we are adding to the accumulator
		this.fetch();

		// Add is performed in 16-bit domain for emulation to capture any
		// carry bit, which will exist in bit 8 of the 16-bit word
		//this.temp = this.a + this.fetched + this.GetFlag(FLAGS6502.C);

		// The carry flag out exists in the high byte bit 0
		this.SetFlag(FLAGS6502.C, ((r & 0x100) != 0) ? 1 : 0);

		// The Zero flag is set if the result is 0
		this.SetFlag(FLAGS6502.Z, ((r & 0xFF) == 0) ? 1 : 0);

		// The signed Overflow flag is set based on all that up there! :D
		this.SetFlag(FLAGS6502.V, ((~(this.a ^ v) & (this.a ^ r) & 0x80) != 0) ? 1 : 0);

		// The negative flag is set to the most significant bit of the result
		this.SetFlag(FLAGS6502.N, ((r & 0x80) != 0) ? 1 : 0);

		// Load the result into the accumulator (it's 8-bit dont forget!)
		//this.a = this.temp & 0x00FF;
		this.a = r & 0xFF;

		// This instruction has the potential to require an additional clock cycle
		return 1;
	}


// Instruction: Subtraction with Borrow In
// Function:    A = A - M - (1 - C)
// Flags Out:   C, V, N, Z
//
// Explanation:
// Given the explanation for ADC above, we can reorganise our data
// to use the same computation for addition, for subtraction by multiplying
// the data by -1, i.e. make it negative
//
// A = A - M - (1 - C)  .  A = A + -1 * (M - (1 - C))  .  A = A + (-M + 1 + C)
//
// To make a signed positive number negative, we can invert the bits and add 1
// (OK, I lied, a little bit of 1 and 2s complement :P)
//
//  5 = 00000101
// -5 = 11111010 + 00000001 = 11111011 (or 251 in our 0 to 255 range)
//
// The range is actually unimportant, because if I take the value 15, and add 251
// to it, given we wrap around at 256, the result is 10, so it has effectively
// subtracted 5, which was the original intention. (15 + 251) % 256 = 10
//
// Note that the equation above used (1-C), but this got converted to + 1 + C.
// This means we already have the +1, so all we need to do is invert the bits
// of M, the data(!) therfore we can simply add, exactly the same way we did
// before.

	SBC() {
		var v = this.read(this.addr_abs);
		var c = 1 - this.GetFlag(FLAGS6502.C);
		var r = this.a - v - c;

		this.SetFlag(FLAGS6502.Z, ((r & 0xFF) == 0) ? 1 : 0);
		this.SetFlag(FLAGS6502.N, ((r & 0x80) != 0) ? 1 : 0);
		this.SetFlag(FLAGS6502.V, (((this.a ^ v) & (this.a ^ r) & 0x80) != 0) ? 1 : 0);
		this.SetFlag(FLAGS6502.C, ((r & 0x100) != 0) ? 0 : 1);
		this.a = r & 0xFF;

		/*
		this.fetch();

		// Operating in 16-bit domain to capture carry out

		// We can invert the bottom 8 bits with bitwise xor
		let value = (this.fetched) ^ 0x00FF;

		// Notice this is exactly the same as addition from here!
		this.temp = this.a + value + this.GetFlag(FLAGS6502.C);
		this.SetFlag(FLAGS6502.C, (this.temp & 0xFF00) !== 0);
		this.SetFlag(FLAGS6502.Z, ((this.temp & 0x00FF) === 0));
		this.SetFlag(FLAGS6502.V, ((this.temp ^ this.a) & (this.temp ^ value) & 0x0080) !== 0);
		this.SetFlag(FLAGS6502.N, (this.temp & 0x0080) !== 0);
		this.a = this.temp & 0x00FF;
		return 1;*/
	}

// OK! Complicated operations are done! the following are much simpler
// and conventional. The typical order of events is:
// 1) Fetch the data you are working with
// 2) Perform calculation
// 3) Store the result in desired place
// 4) Set Flags of the status register
// 5) Return if instruction has potential to require additional
//    clock cycle


// Instruction: Bitwise Logic AND
// Function:    A = A & M
// Flags Out:   N, Z
	AND() {
		this.fetch();
		this.a = this.a & this.fetched;
		this.SetFlag(FLAGS6502.Z, this.a === 0x00);
		this.SetFlag(FLAGS6502.N, (this.a & 0x80) !== 0);
		return 1;
	}


// Instruction: Arithmetic Shift Left
// Function:    A = C <- (A << 1) <- 0
// Flags Out:   N, Z, C
	ASL() {
		this.fetch();
		this.temp = this.fetched << 1;
		this.SetFlag(FLAGS6502.C, (this.temp & 0xFF00) > 0);
		this.SetFlag(FLAGS6502.Z, (this.temp & 0x00FF) === 0x00);
		this.SetFlag(FLAGS6502.N, (this.temp & 0x80) !== 0);
		this.temp &= 0xFF;
		if (this.lookup[this.pcode].addrmode === this.IMP)
			this.a = this.temp & 0x00FF;
		else
			this.write(this.addr_abs, this.temp & 0x00FF);
		return 0;
	}


// Instruction: Branch if Carry Clear
// Function:    if(C === 0) this.pc = address
	BCC() {
		if (this.GetFlag(FLAGS6502.C) === 0) {
			this.cycles++;
			this.addr_abs = (this.pc + this.addr_rel) & 0xFFFF;

			if ((this.addr_abs & 0xFF00) !== (this.pc & 0xFF00))
				this.cycles++;

			this.pc = this.addr_abs;
		}
		return 0;
	}


// Instruction: Branch if Carry Set
// Function:    if(C === 1) this.pc = address
	BCS() {
		if (this.GetFlag(FLAGS6502.C) === 1) {
			this.cycles++;
			this.addr_abs = (this.pc + this.addr_rel) & 0xFFFF;

			if ((this.addr_abs & 0xFF00) !== (this.pc & 0xFF00))
				this.cycles++;

			this.pc = this.addr_abs;
		}
		return 0;
	}


// Instruction: Branch if Equal
// Function:    if(Z === 1) this.pc = address
	BEQ() {
		if (this.GetFlag(FLAGS6502.Z) === 1) {
			this.cycles++;
			this.addr_abs = (this.pc + this.addr_rel) & 0xFFFF;

			if ((this.addr_abs & 0xFF00) !== (this.pc & 0xFF00))
				this.cycles++;

			this.pc = this.addr_abs;
		}
		return 0;
	}

	BIT() {
		this.fetch();
		this.temp = this.a & this.fetched;
		this.SetFlag(FLAGS6502.Z, (this.temp & 0x00FF) === 0x00);
		this.SetFlag(FLAGS6502.N, (this.fetched & (1 << 7)) !== 0);
		this.SetFlag(FLAGS6502.V, (this.fetched & (1 << 6)) !== 0);
		return 0;
	}


// Instruction: Branch if Negative
// Function:    if(N === 1) this.pc = address
	BMI() {
		if (this.GetFlag(FLAGS6502.N) === 1) {
			this.cycles++;
			this.addr_abs = (this.pc + this.addr_rel) & 0xFFFF;

			if ((this.addr_abs & 0xFF00) !== (this.pc & 0xFF00))
				this.cycles++;

			this.pc = this.addr_abs;
		}
		return 0;
	}


// Instruction: Branch if Not Equal
// Function:    if(Z === 0) this.pc = address
	BNE() {
		if (this.GetFlag(FLAGS6502.Z) === 0) {
			this.cycles++;
			this.addr_abs = (this.pc + this.addr_rel) & 0xFFFF;

			if ((this.addr_abs & 0xFF00) !== (this.pc & 0xFF00))
				this.cycles++;

			this.pc = this.addr_abs;
		}
		return 0;
	}


// Instruction: Branch if Positive
// Function:    if(N === 0) this.pc = address
	BPL() {
		if (this.GetFlag(FLAGS6502.N) === 0) {
			this.cycles++;
			this.addr_abs = (this.pc + this.addr_rel) & 0xFFFF;

			if ((this.addr_abs & 0xFF00) !== (this.pc & 0xFF00))
				this.cycles++;

			this.pc = this.addr_abs;
		}
		return 0;
	}

// Instruction: Break
// Function:    Program Sourced Interrupt
	BRK() {
		this.pc++;

		this.SetFlag(FLAGS6502.I, 1);
		this.write(0x0100 + this.stkp, (this.pc >> 8) & 0x00FF);
		this.stkp = (this.stkp - 1) & 0xFF;
		this.write(0x0100 + this.stkp, this.pc & 0x00FF);
		this.stkp = (this.stkp - 1) & 0xFF;

		this.SetFlag(FLAGS6502.B, 1);
		this.write(0x0100 + this.stkp, this.status);
		this.stkp = (this.stkp - 1) & 0xFF;
		this.SetFlag(FLAGS6502.B, 0);

		this.pc = this.read(0xFFFE) | (this.read(0xFFFF) << 8);
		return 0;
	}


// Instruction: Branch if Overflow Clear
// Function:    if(V === 0) this.pc = address
	BVC() {
		if (this.GetFlag(FLAGS6502.V) === 0) {
			this.cycles++;
			this.addr_abs = (this.pc + this.addr_rel) & 0xFFFF;

			if ((this.addr_abs & 0xFF00) !== (this.pc & 0xFF00))
				this.cycles++;

			this.pc = this.addr_abs;
		}
		return 0;
	}


// Instruction: Branch if Overflow Set
// Function:    if(V === 1) this.pc = address
	BVS() {
		if (this.GetFlag(FLAGS6502.V) === 1) {
			this.cycles++;
			this.addr_abs = (this.pc + this.addr_rel) & 0xFFFF;

			if ((this.addr_abs & 0xFF00) !== (this.pc & 0xFF00))
				this.cycles++;

			this.pc = this.addr_abs;
		}
		return 0;
	}


// Instruction: Clear Carry Flag
// Function:    C = 0
	CLC() {
		this.SetFlag(FLAGS6502.C, false);
		return 0;
	}


// Instruction: Clear Decimal Flag
// Function:    D = 0
	CLD() {
		this.SetFlag(FLAGS6502.D, false);
		return 0;
	}


// Instruction: Disable Interrupts / Clear Interrupt Flag
// Function:    I = 0
	CLI() {
		this.SetFlag(FLAGS6502.I, false);
		return 0;
	}


// Instruction: Clear Overflow Flag
// Function:    V = 0
	CLV() {
		this.SetFlag(FLAGS6502.V, false);
		return 0;
	}

// Instruction: Compare Accumulator
// Function:    C <- A >= M      Z <- (A - M) === 0
// Flags Out:   N, C, Z
	CMP() {
		this.fetch();
		this.temp = this.a - this.fetched;
		this.SetFlag(FLAGS6502.C, (this.temp & 0x100) !== 0);
		this.SetFlag(FLAGS6502.Z, (this.temp & 0x00FF) === 0x0000);
		this.SetFlag(FLAGS6502.N, (this.temp & 0x0080) !== 0);
		return 1;
	}


// Instruction: Compare X Register
// Function:    C <- X >= M      Z <- (X - M) === 0
// Flags Out:   N, C, Z
	CPX() {
		this.fetch();
		this.temp = this.x - this.fetched;
		this.SetFlag(FLAGS6502.C, (this.temp & 0x100) !== 0);
		this.SetFlag(FLAGS6502.Z, (this.temp & 0x00FF) === 0x0000);
		this.SetFlag(FLAGS6502.N, (this.temp & 0x0080) !== 0);
		return 0;
	}


// Instruction: Compare Y Register
// Function:    C <- Y >= M      Z <- (Y - M) === 0
// Flags Out:   N, C, Z
	CPY() {
		this.fetch();
		this.temp = this.y - this.fetched;
		this.SetFlag(FLAGS6502.C, (this.temp & 0x100) !== 0);
		this.SetFlag(FLAGS6502.Z, (this.temp & 0x00FF) === 0x0000);
		this.SetFlag(FLAGS6502.N, (this.temp & 0x0080) !== 0);
		return 0;
	}


// Instruction: Decrement Value at Memory Location
// Function:    M = M - 1
// Flags Out:   N, Z
	DEC() {
		this.fetch();
		this.temp = (this.fetched - 1) & 0xFF;
		this.write(this.addr_abs, this.temp & 0x00FF);
		this.SetFlag(FLAGS6502.Z, (this.temp & 0x00FF) === 0x0000);
		this.SetFlag(FLAGS6502.N, (this.temp & 0x0080) !== 0);
		return 0;
	}


// Instruction: Decrement X Register
// Function:    X = X - 1
// Flags Out:   N, Z
	DEX() {
		this.x = (this.x - 1) & 0xFF;

		this.SetFlag(FLAGS6502.Z, (this.x & 0xFF) === 0x00);
		this.SetFlag(FLAGS6502.N, (this.x & 0x80) !== 0);
		return 0;
	}


// Instruction: Decrement Y Register
// Function:    Y = Y - 1
// Flags Out:   N, Z
	DEY() {
		this.y = (this.y - 1) & 0xFF;

		this.SetFlag(FLAGS6502.Z, (this.y & 0xFF) === 0x00);
		this.SetFlag(FLAGS6502.N, (this.y & 0x80) !== 0);
		return 0;
	}


// Instruction: Bitwise Logic XOR
// Function:    A = A xor M
// Flags Out:   N, Z
	EOR() {
		this.fetch();
		this.a = this.a ^ this.fetched;
		this.SetFlag(FLAGS6502.Z, (this.a & 0xFF) === 0x00);
		this.SetFlag(FLAGS6502.N, (this.a & 0x80) !== 0);
		return 1;
	}


// Instruction: Increment Value at Memory Location
// Function:    M = M + 1
// Flags Out:   N, Z
	INC() {
		this.fetch();
		this.temp = (this.fetched + 1) & 0xFF;
		this.write(this.addr_abs, this.temp & 0x00FF);
		this.SetFlag(FLAGS6502.Z, (this.temp & 0x00FF) === 0x0000);
		this.SetFlag(FLAGS6502.N, (this.temp & 0x0080) !== 0);
		return 0;
	}


// Instruction: Increment X Register
// Function:    X = X + 1
// Flags Out:   N, Z
	INX() {
		this.x = (this.x + 1) & 0xFF;

		this.SetFlag(FLAGS6502.Z, (this.x & 0xFF) === 0x00);
		this.SetFlag(FLAGS6502.N, (this.x & 0x80) !== 0);
		return 0;
	}


// Instruction: Increment Y Register
// Function:    Y = Y + 1
// Flags Out:   N, Z
	INY() {
		this.y = (this.y + 1) & 0xFF;

		this.SetFlag(FLAGS6502.Z, (this.y & 0xFF) === 0x00);
		this.SetFlag(FLAGS6502.N, (this.y & 0x80) !== 0);
		return 0;
	}


// Instruction: Jump To Location
// Function:    this.pc = address
	JMP() {
		this.pc = this.addr_abs;
		return 0;
	}


// Instruction: Jump To Sub-Routine
// Function:    Push current this.pc to stack, this.pc = address
	JSR() {
		this.pc--;

		this.write(0x0100 + this.stkp, (this.pc >> 8) & 0x00FF);
		this.stkp = (this.stkp - 1) & 0xFF;
		this.write(0x0100 + this.stkp, this.pc & 0x00FF);
		this.stkp = (this.stkp - 1) & 0xFF;

		this.pc = this.addr_abs;
		return 0;
	}


// Instruction: Load The Accumulator
// Function:    A = M
// Flags Out:   N, Z
	LDA() {
		this.fetch();
		this.a = this.fetched;
		this.SetFlag(FLAGS6502.Z, (this.a & 0xFF) === 0x00);
		this.SetFlag(FLAGS6502.N, (this.a & 0x80) !== 0);
		return 1;
	}


// Instruction: Load The X Register
// Function:    X = M
// Flags Out:   N, Z
	LDX() {
		this.fetch();
		this.x = this.fetched;
		this.SetFlag(FLAGS6502.Z, (this.x & 0xFF) === 0x00);
		this.SetFlag(FLAGS6502.N, (this.x & 0x80) !== 0);
		return 1;
	}


// Instruction: Load The Y Register
// Function:    Y = M
// Flags Out:   N, Z
	LDY() {
		this.fetch();
		this.y = this.fetched;
		this.SetFlag(FLAGS6502.Z, (this.y & 0xFF) === 0x00);
		this.SetFlag(FLAGS6502.N, (this.y & 0x80) !== 0);
		return 1;
	}

	LSR() {
		this.fetch();
		this.SetFlag(FLAGS6502.C, (this.fetched & 0x0001) !== 0);
		this.temp = this.fetched >> 1;
		this.SetFlag(FLAGS6502.Z, (this.temp & 0x00FF) === 0x0000);
		this.SetFlag(FLAGS6502.N, (this.temp & 0x0080) !== 0);
		if (this.lookup[this.opcode].addrmode === this.IMP)
			this.a = this.temp & 0x00FF;
		else
			this.write(this.addr_abs, this.temp & 0x00FF);

		return 0;
	}

	NOP() {
		switch (this.pcode) {
			case 0x1C:
			case 0x3C:
			case 0x5C:
			case 0x7C:
			case 0xDC:
			case 0xFC:
				return 1;
				break;
		}
		return 0;
	}


// Instruction: Bitwise Logic OR
// Function:    A = A | M
// Flags Out:   N, Z
	ORA() {
		this.fetch();
		this.a = this.a | this.fetched;
		this.SetFlag(FLAGS6502.Z, (this.a & 0xFF) === 0x00);
		this.SetFlag(FLAGS6502.N, (this.a & 0x80) !== 0);
		return 1;
	}


// Instruction: Push Accumulator to Stack
// Function:    A . stack
	PHA() {
		this.write(0x0100 + this.stkp, this.a);
		this.stkp = (this.stkp - 1) & 0xFF;
		return 0;
	}


// Instruction: Push Status Register to Stack
// Function:    status . stack
// Note:        Break flag is set to 1 before push
	PHP() {
		this.write(0x0100 + this.stkp, this.status | FLAGS6502.B | FLAGS6502.U);
		this.SetFlag(FLAGS6502.B, 0);
		this.SetFlag(FLAGS6502.U, 0);
		this.stkp = (this.stkp - 1) & 0xFF;

		return 0;
	}


// Instruction: Pop Accumulator off Stack
// Function:    A <- stack
// Flags Out:   N, Z
	PLA() {
		this.stkp = (this.stkp + 1) & 0xFF;
		this.a = this.read(0x0100 + this.stkp);
		this.SetFlag(FLAGS6502.Z, (this.a & 0xFF) === 0x00);
		this.SetFlag(FLAGS6502.N, (this.a & 0x80) !== 0);
		return 0;
	}


// Instruction: Pop Status Register off Stack
// Function:    Status <- stack
	PLP() {
		this.stkp = (this.stkp + 1) & 0xFF;
		this.status = this.read(0x0100 + this.stkp);
		this.SetFlag(FLAGS6502.U, 1);
		return 0;
	}

	ROL() {
		this.fetch();
		this.temp = (this.fetched << 1) | this.GetFlag(FLAGS6502.C);
		this.SetFlag(FLAGS6502.C, (this.temp & 0xFF00) !== 0);
		this.SetFlag(FLAGS6502.Z, (this.temp & 0x00FF) === 0x0000);
		this.SetFlag(FLAGS6502.N, (this.temp & 0x0080) !== 0);
		if (this.lookup[this.pcode].addrmode === this.IMP)
			this.a = this.temp & 0x00FF;
		else
			this.write(this.addr_abs, this.temp & 0x00FF);
		return 0;
	}

	ROR() {
		this.fetch();
		this.temp = (this.GetFlag(FLAGS6502.C) << 7) | (this.fetched >> 1);
		this.SetFlag(FLAGS6502.C, (this.fetched & 0x01) !== 0);
		this.SetFlag(FLAGS6502.Z, (this.temp & 0x00FF) === 0x00);
		this.SetFlag(FLAGS6502.N, (this.temp & 0x0080) !== 0);
		if (this.lookup[this.pcode].addrmode === this.IMP)
			this.a = this.temp & 0x00FF;
		else
			this.write(this.addr_abs, this.temp & 0x00FF);
		return 0;
	}

	RTI() {
		this.stkp = (this.stkp + 1) & 0xFF;
		this.status = this.read(0x0100 + this.stkp);
		this.status &= ~FLAGS6502.B;
		this.status &= ~FLAGS6502.U;

		this.stkp = (this.stkp + 1) & 0xFF;
		this.pc = this.read(0x0100 + this.stkp);
		this.stkp = (this.stkp + 1) & 0xFF;
		this.pc |= this.read(0x0100 + this.stkp) << 8;
		return 0;
	}

	RTS() {
		this.stkp = (this.stkp + 1) & 0xFF;
		this.pc = this.read(0x0100 + this.stkp);
		this.stkp = (this.stkp + 1) & 0xFF;
		this.pc |= this.read(0x0100 + this.stkp) << 8;

		this.pc++;
		return 0;
	}


// Instruction: Set Carry Flag
// Function:    C = 1
	SEC() {
		this.SetFlag(FLAGS6502.C, true);
		return 0;
	}


// Instruction: Set Decimal Flag
// Function:    D = 1
	SED() {
		this.SetFlag(FLAGS6502.D, true);
		return 0;
	}


// Instruction: Set Interrupt Flag / Enable Interrupts
// Function:    I = 1
	SEI() {
		this.SetFlag(FLAGS6502.I, true);
		return 0;
	}


// Instruction: Store Accumulator at Address
// Function:    M = A
	STA() {
		this.write(this.addr_abs, this.a);
		return 0;
	}


// Instruction: Store X Register at Address
// Function:    M = X
	STX() {
		this.write(this.addr_abs, this.x);
		return 0;
	}


// Instruction: Store Y Register at Address
// Function:    M = Y
	STY() {
		this.write(this.addr_abs, this.y);
		return 0;
	}


// Instruction: Transfer Accumulator to X Register
// Function:    X = A
// Flags Out:   N, Z
	TAX() {
		this.x = this.a;
		this.SetFlag(FLAGS6502.Z, (this.x & 0xFF) === 0x00);
		this.SetFlag(FLAGS6502.N, (this.x & 0x80) !== 0);
		return 0;
	}


// Instruction: Transfer Accumulator to Y Register
// Function:    Y = A
// Flags Out:   N, Z
	TAY() {
		this.y = this.a;
		this.SetFlag(FLAGS6502.Z, (this.y & 0xFF) === 0x00);
		this.SetFlag(FLAGS6502.N, (this.y & 0x80) !== 0);
		return 0;
	}


// Instruction: Transfer Stack Pointer to X Register
// Function:    X = stack pointer
// Flags Out:   N, Z
	TSX() {
		this.x = this.stkp;
		this.SetFlag(FLAGS6502.Z, (this.x & 0xFF) === 0x00);
		this.SetFlag(FLAGS6502.N, (this.x & 0x80) !== 0);
		return 0;
	}


// Instruction: Transfer X Register to Accumulator
// Function:    A = X
// Flags Out:   N, Z
	TXA() {
		this.a = this.x;
		this.SetFlag(FLAGS6502.Z, (this.a & 0xFF) === 0x00);
		this.SetFlag(FLAGS6502.N, (this.a & 0x80) !== 0);
		return 0;
	}


// Instruction: Transfer X Register to Stack Pointer
// Function:    stack pointer = X
	TXS() {
		this.stkp = this.x;
		return 0;
	}


// Instruction: Transfer Y Register to Accumulator
// Function:    A = Y
// Flags Out:   N, Z
	TYA() {
		this.a = this.y;
		this.SetFlag(FLAGS6502.Z, (this.a & 0xFF) === 0x00);
		this.SetFlag(FLAGS6502.N, (this.a & 0x80) !== 0);
		return 0;
	}


// This function captures illegal this.pcodes
	XXX() {
		return 0;
	}


///////////////////////////////////////////////////////////////////////////////
// HELPER FUNCTIONS

	complete() {
		return this.cycles === 0;
	}

// This is the disassembly function. Its workings are not required for emulation.
// It is merely a convenience function to turn the binary instruction code into
// human readable form. Its included as part of the emulator because it can take
// advantage of many of the CPUs internal operations to do this.
	disassemble(nStart, nStop) {
		let addr = nStart;
		let value = 0x00, lo = 0x00, hi = 0x00;
		let mapLines = [];
		let line_addr = 0;

		// A convenient utility to convert variables into
		// hex strings because "modern C++"'s method with
		// streams is atrocious
		let hex = (n, d) => {
			let s = [];
			for (let i = d - 1; i >= 0; i--, n >>= 4)
				s[i] = "0123456789ABCDEF"[n & 0xF];
			return s.join('');
		};

		// Starting at the specified address we read an instruction
		// byte, which in turn yields information from the lookup table
		// as to how many additional bytes we need to read and what the
		// addressing mode is. I need this info to assemble human readable
		// syntax, which is different depending upon the addressing mode

		// As the instruction is decoded, a std::string is assembled
		// with the readable output
		while (addr <= nStop) {
			line_addr = addr;

			// Prefix line with instruction address
			let sInst = "$" + hex(addr, 4) + ": ";

			// Read instruction, and get its readable name
			let pcode = this.bus.cpuRead(addr, true);
			addr++;

			if (!this.lookup[pcode]) {
				continue;
			}

			sInst += this.lookup[pcode].name + " ";

			// Get oprands from desired locations, and form the
			// instruction based upon its addressing mode. These
			// routines mimmick the actual fetch routine of the
			// 6502 in order to get accurate data as part of the
			// instruction
			if (this.lookup[pcode].addrmode === this.IMP) {
				sInst += " {IMP}";
			} else if (this.lookup[pcode].addrmode === this.IMM) {
				value = this.bus.cpuRead(addr, true);
				addr++;
				sInst += "#$" + hex(value, 2) + " {IMM}";
			} else if (this.lookup[pcode].addrmode === this.ZP0) {
				lo = this.bus.cpuRead(addr, true);
				addr++;
				hi = 0x00;
				sInst += "$" + hex(lo, 2) + " {ZP0}";
			} else if (this.lookup[pcode].addrmode === this.ZPX) {
				lo = this.bus.cpuRead(addr, true);
				addr++;
				hi = 0x00;
				sInst += "$" + hex(lo, 2) + ", X {ZPX}";
			} else if (this.lookup[pcode].addrmode === this.ZPY) {
				lo = this.bus.cpuRead(addr, true);
				addr++;
				hi = 0x00;
				sInst += "$" + hex(lo, 2) + ", Y {ZPY}";
			} else if (this.lookup[pcode].addrmode === this.IZX) {
				lo = this.bus.cpuRead(addr, true);
				addr++;
				hi = 0x00;
				sInst += "($" + hex(lo, 2) + ", X) {IZX}";
			} else if (this.lookup[pcode].addrmode === this.IZY) {
				lo = this.bus.cpuRead(addr, true);
				addr++;
				hi = 0x00;
				sInst += "($" + hex(lo, 2) + "), Y {IZY}";
			} else if (this.lookup[pcode].addrmode === this.ABS) {
				lo = this.bus.cpuRead(addr, true);
				addr++;
				hi = this.bus.cpuRead(addr, true);
				addr++;
				sInst += "$" + hex((hi << 8) | lo, 4) + " {ABS}";
			} else if (this.lookup[pcode].addrmode === this.ABX) {
				lo = this.bus.cpuRead(addr, true);
				addr++;
				hi = this.bus.cpuRead(addr, true);
				addr++;
				sInst += "$" + hex((hi << 8) | lo, 4) + ", X {ABX}";
			} else if (this.lookup[pcode].addrmode === this.ABY) {
				lo = this.bus.cpuRead(addr, true);
				addr++;
				hi = this.bus.cpuRead(addr, true);
				addr++;
				sInst += "$" + hex((hi << 8) | lo, 4) + ", Y {ABY}";
			} else if (this.lookup[pcode].addrmode === this.IND) {
				lo = this.bus.cpuRead(addr, true);
				addr++;
				hi = this.bus.cpuRead(addr, true);
				addr++;
				sInst += "($" + hex((hi << 8) | lo, 4) + ") {IND}";
			} else if (this.lookup[pcode].addrmode === this.REL) {
				value = this.bus.cpuRead(addr, true);
				addr++;
				sInst += "$" + hex(value, 2) + " [$" + hex(addr + value, 4) + "] {REL}";
			}

			// Add the formed string to a std::map, using the instruction's
			// address as the key. This makes it convenient to look for later
			// as the instructions are variable in length, so a straight up
			// incremental index is not sufficient.
			mapLines[line_addr] = sInst;
		}

		return mapLines;
	}

}

olc6502.FLAGS6502 = FLAGS6502;

export default olc6502;
