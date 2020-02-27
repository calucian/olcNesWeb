
/**
 * A 6502 processor emulator
 *
 * This is not the CPU that Javidx built as I could not get
 * the code to work well in javascript
 * Original source code: https://github.com/ScullinSteel/cpu6502
 */
class Cpu6502 {
	constructor() {

		this.pc = 0; // Program counter

		this.A = 0; this.X = 0; this.Y = 0; this.S = 0; // Registers
		this.N = 0; this.Z = 1; this.C = 0; this.V = 0; // ALU flags
		this.I = 0; this.D = 0; // Other flags

		 // IRQ lines

		this.tmp = 0; this.addr = 0; // Temporary registers
		this.opcode = 0; // Current opcode
		this.cycles = 0; // Cycles counter
		this.clock_count = 0;

		this.lookup = [];
		/*  BRK     */ this.lookup[0x00] = [ this.imp, this.brk, ];
		/*  ORA izx */ this.lookup[0x01] = [ this.izx, this.ora, ];
		/* *KIL     */ this.lookup[0x02] = [ this.imp, this.kil, ];
		/* *SLO izx */ this.lookup[0x03] = [ this.izx, this.slo, this.rmw, ];
		/* *NOP zp  */ this.lookup[0x04] = [ this.zp, this.nop, ];
		/*  ORA zp  */ this.lookup[0x05] = [ this.zp, this.ora, ];
		/*  ASL zp  */ this.lookup[0x06] = [ this.zp, this.asl, this.rmw, ];
		/* *SLO zp  */ this.lookup[0x07] = [ this.zp, this.slo, this.rmw, ];
		/*  PHP     */ this.lookup[0x08] = [ this.imp, this.php, ];
		/*  ORA imm */ this.lookup[0x09] = [ this.imm, this.ora, ];
		/*  ASL     */ this.lookup[0x0A] = [ this.imp, this.asla, ];
		/* *ANC imm */ this.lookup[0x0B] = [ this.imm, this.anc, ];
		/* *NOP abs */ this.lookup[0x0C] = [ this.abs, this.nop, ];
		/*  ORA abs */ this.lookup[0x0D] = [ this.abs, this.ora, ];
		/*  ASL abs */ this.lookup[0x0E] = [ this.abs, this.asl, this.rmw, ];
		/* *SLO abs */ this.lookup[0x0F] = [ this.abs, this.slo, this.rmw, ];

		/*  BPL rel */ this.lookup[0x10] = [ this.rel, this.bpl, ];
		/*  ORA izy */ this.lookup[0x11] = [ this.izy, this.ora, ];
		/* *KIL     */ this.lookup[0x12] = [ this.imp, this.kil, ];
		/* *SLO izy */ this.lookup[0x13] = [ this.izy, this.slo, this.rmw, ];
		/* *NOP zpx */ this.lookup[0x14] = [ this.zpx, this.nop, ];
		/*  ORA zpx */ this.lookup[0x15] = [ this.zpx, this.ora, ];
		/*  ASL zpx */ this.lookup[0x16] = [ this.zpx, this.asl, this.rmw, ];
		/* *SLO zpx */ this.lookup[0x17] = [ this.zpx, this.slo, this.rmw, ];
		/*  CLC     */ this.lookup[0x18] = [ this.imp, this.clc, ];
		/*  ORA aby */ this.lookup[0x19] = [ this.aby, this.ora, ];
		/* *NOP     */ this.lookup[0x1A] = [ this.imp, this.nop, ];
		/* *SLO aby */ this.lookup[0x1B] = [ this.aby, this.slo, this.rmw, ];
		/* *NOP abx */ this.lookup[0x1C] = [ this.abx, this.nop, ];
		/*  ORA abx */ this.lookup[0x1D] = [ this.abx, this.ora, ];
		/*  ASL abx */ this.lookup[0x1E] = [ this.abxp, this.asl, this.rmw, ];
		/* *SLO abx */ this.lookup[0x1F] = [ this.abx, this.slo, this.rmw, ];

		/*  JSR abs */ this.lookup[0x20] = [ this.abs, this.jsr, ];
		/*  AND izx */ this.lookup[0x21] = [ this.izx, this.and, ];
		/* *KIL     */ this.lookup[0x22] = [ this.imp, this.kil, ];
		/* *RLA izx */ this.lookup[0x23] = [ this.izx, this.rla, this.rmw, ];
		/*  BIT zp  */ this.lookup[0x24] = [ this.zp, this.bit, ];
		/*  AND zp  */ this.lookup[0x25] = [ this.zp, this.and, ];
		/*  ROL zp  */ this.lookup[0x26] = [ this.zp, this.rol, this.rmw, ];
		/* *RLA zp  */ this.lookup[0x27] = [ this.zp, this.rla, this.rmw, ];
		/*  PLP     */ this.lookup[0x28] = [ this.imp, this.plp, ];
		/*  AND imm */ this.lookup[0x29] = [ this.imm, this.and, ];
		/*  ROL     */ this.lookup[0x2A] = [ this.imp, this.rla, ];
		/* *ANC imm */ this.lookup[0x2B] = [ this.imm, this.anc, ];
		/*  BIT abs */ this.lookup[0x2C] = [ this.abs, this.bit, ];
		/*  AND abs */ this.lookup[0x2D] = [ this.abs, this.and, ];
		/*  ROL abs */ this.lookup[0x2E] = [ this.abs, this.rol, this.rmw, ];
		/* *RLA abs */ this.lookup[0x2F] = [ this.abs, this.rla, this.rmw, ];

		/*  BMI rel */ this.lookup[0x30] = [ this.rel, this.bmi, ];
		/*  AND izy */ this.lookup[0x31] = [ this.izy, this.and, ];
		/* *KIL     */ this.lookup[0x32] = [ this.imp, this.kil, ];
		/* *RLA izy */ this.lookup[0x33] = [ this.izy, this.rla, this.rmw, ];
		/* *NOP zpx */ this.lookup[0x34] = [ this.zpx, this.nop, ];
		/*  AND zpx */ this.lookup[0x35] = [ this.zpx, this.and, ];
		/*  ROL zpx */ this.lookup[0x36] = [ this.zpx, this.rol, this.rmw, ];
		/* *RLA zpx */ this.lookup[0x37] = [ this.zpx, this.rla, this.rmw, ];
		/*  SEC     */ this.lookup[0x38] = [ this.imp, this.sec, ];
		/*  AND aby */ this.lookup[0x39] = [ this.aby, this.and, ];
		/* *NOP     */ this.lookup[0x3A] = [ this.imp, this.nop, ];
		/* *RLA aby */ this.lookup[0x3B] = [ this.aby, this.rla, this.rmw, ];
		/* *NOP abx */ this.lookup[0x3C] = [ this.abx, this.nop, ];
		/*  AND abx */ this.lookup[0x3D] = [ this.abx, this.and, ];
		/*  ROL abx */ this.lookup[0x3E] = [ this.abxp, this.rol, this.rmw, ];
		/* *RLA abx */ this.lookup[0x3F] = [ this.abx, this.rla, this.rmw, ];

		/*  RTI     */ this.lookup[0x40] = [ this.imp, this.rti, ];
		/*  EOR izx */ this.lookup[0x41] = [ this.izx, this.eor, ];
		/* *KIL     */ this.lookup[0x42] = [ this.imp, this.kil, ];
		/* *SRE izx */ this.lookup[0x43] = [ this.izx, this.sre, this.rmw, ];
		/* *NOP zp  */ this.lookup[0x44] = [ this.zp, this.nop, ];
		/*  EOR zp  */ this.lookup[0x45] = [ this.zp, this.eor, ];
		/*  LSR zp  */ this.lookup[0x46] = [ this.zp, this.lsr, this.rmw, ];
		/* *SRE zp  */ this.lookup[0x47] = [ this.zp, this.sre, this.rmw, ];
		/*  PHA     */ this.lookup[0x48] = [ this.imp, this.pha, ];
		/*  EOR imm */ this.lookup[0x49] = [ this.imm, this.eor, ];
		/*  LSR     */ this.lookup[0x4A] = [ this.imp, this.lsra, ];
		/* *ALR imm */ this.lookup[0x4B] = [ this.imm, this.alr, ];
		/*  JMP abs */ this.lookup[0x4C] = [ this.abs, this.jmp, ];
		/*  EOR abs */ this.lookup[0x4D] = [ this.abs, this.eor, ];
		/*  LSR abs */ this.lookup[0x4E] = [ this.abs, this.lsr, this.rmw, ];
		/* *SRE abs */ this.lookup[0x4F] = [ this.abs, this.sre, this.rmw, ];

		/*  BVC rel */ this.lookup[0x50] = [ this.rel, this.bvc, ];
		/*  EOR izy */ this.lookup[0x51] = [ this.izy, this.eor, ];
		/* *KIL     */ this.lookup[0x52] = [ this.imp, this.kil, ];
		/* *SRE izy */ this.lookup[0x53] = [ this.izy, this.sre, this.rmw, ];
		/* *NOP zpx */ this.lookup[0x54] = [ this.zpx, this.nop, ];
		/*  EOR zpx */ this.lookup[0x55] = [ this.zpx, this.eor, ];
		/*  LSR zpx */ this.lookup[0x56] = [ this.zpx, this.lsr, this.rmw, ];
		/* *SRE zpx */ this.lookup[0x57] = [ this.zpx, this.sre, this.rmw, ];
		/*  CLI     */ this.lookup[0x58] = [ this.imp, this.cli, ];
		/*  EOR aby */ this.lookup[0x59] = [ this.aby, this.eor, ];
		/* *NOP     */ this.lookup[0x5A] = [ this.imp, this.nop, ];
		/* *SRE aby */ this.lookup[0x5B] = [ this.aby, this.sre, this.rmw, ];
		/* *NOP abx */ this.lookup[0x5C] = [ this.abx, this.nop, ];
		/*  EOR abx */ this.lookup[0x5D] = [ this.abx, this.eor, ];
		/*  LSR abx */ this.lookup[0x5E] = [ this.abxp, this.lsr, this.rmw, ];
		/* *SRE abx */ this.lookup[0x5F] = [ this.abx, this.sre, this.rmw, ];

		/*  RTS     */ this.lookup[0x60] = [ this.imp, this.rts, ];
		/*  ADC izx */ this.lookup[0x61] = [ this.izx, this.adc, ];
		/* *KIL     */ this.lookup[0x62] = [ this.imp, this.kil, ];
		/* *RRA izx */ this.lookup[0x63] = [ this.izx, this.rra, this.rmw, ];
		/* *NOP zp  */ this.lookup[0x64] = [ this.zp, this.nop, ];
		/*  ADC zp  */ this.lookup[0x65] = [ this.zp, this.adc, ];
		/*  ROR zp  */ this.lookup[0x66] = [ this.zp, this.ror, this.rmw, ];
		/* *RRA zp  */ this.lookup[0x67] = [ this.zp, this.rra, this.rmw, ];
		/*  PLA     */ this.lookup[0x68] = [ this.imp, this.pla, ];
		/*  ADC imm */ this.lookup[0x69] = [ this.imm, this.adc, ];
		/*  ROR     */ this.lookup[0x6A] = [ this.imp, this.rra, ];
		/* *ARR imm */ this.lookup[0x6B] = [ this.imm, this.arr, ];
		/*  JMP ind */ this.lookup[0x6C] = [ this.ind, this.jmp, ];
		/*  ADC abs */ this.lookup[0x6D] = [ this.abs, this.adc, ];
		/*  ROR abs */ this.lookup[0x6E] = [ this.abs, this.ror, this.rmw, ];
		/* *RRA abs */ this.lookup[0x6F] = [ this.abs, this.rra, this.rmw, ];

		/*  BVS rel */ this.lookup[0x70] = [ this.rel, this.bvs, ];
		/*  ADC izy */ this.lookup[0x71] = [ this.izy, this.adc, ];
		/* *KIL     */ this.lookup[0x72] = [ this.imp, this.kil, ];
		/* *RRA izy */ this.lookup[0x73] = [ this.izy, this.rra, this.rmw, ];
		/* *NOP zpx */ this.lookup[0x74] = [ this.zpx, this.nop, ];
		/*  ADC zpx */ this.lookup[0x75] = [ this.zpx, this.adc, ];
		/*  ROR zpx */ this.lookup[0x76] = [ this.zpx, this.ror, this.rmw, ];
		/* *RRA zpx */ this.lookup[0x77] = [ this.zpx, this.rra, this.rmw, ];
		/*  SEI     */ this.lookup[0x78] = [ this.imp, this.sei, ];
		/*  ADC aby */ this.lookup[0x79] = [ this.aby, this.adc, ];
		/* *NOP     */ this.lookup[0x7A] = [ this.imp, this.nop, ];
		/* *RRA aby */ this.lookup[0x7B] = [ this.aby, this.rra, this.rmw, ];
		/* *NOP abx */ this.lookup[0x7C] = [ this.abx, this.nop, ];
		/*  ADC abx */ this.lookup[0x7D] = [ this.abx, this.adc, ];
		/*  ROR abx */ this.lookup[0x7E] = [ this.abxp, this.ror, this.rmw, ];
		/* *RRA abx */ this.lookup[0x7F] = [ this.abx, this.rra, this.rmw, ];

		/* *NOP imm */ this.lookup[0x80] = [ this.imm, this.nop, ];
		/*  STA izx */ this.lookup[0x81] = [ this.izx, this.sta, ];
		/* *NOP imm */ this.lookup[0x82] = [ this.imm, this.nop, ];
		/* *SAX izx */ this.lookup[0x83] = [ this.izx, this.imp, ];
		/*  STY zp  */ this.lookup[0x84] = [ this.zp, this.sty, ];
		/*  STA zp  */ this.lookup[0x85] = [ this.zp, this.sta, ];
		/*  STX zp  */ this.lookup[0x86] = [ this.zp, this.stx, ];
		/* *SAX zp  */ this.lookup[0x87] = [ this.zp, this.imp, ];
		/*  DEY     */ this.lookup[0x88] = [ this.imp, this.dey, ];
		/* *NOP imm */ this.lookup[0x89] = [ this.imm, this.nop, ];
		/*  TXA     */ this.lookup[0x8A] = [ this.imp, this.txa, ];
		/* *XAA imm */ this.lookup[0x8B] = [ this.imm, this.imp, ];
		/*  STY abs */ this.lookup[0x8C] = [ this.abs, this.sty, ];
		/*  STA abs */ this.lookup[0x8D] = [ this.abs, this.sta, ];
		/*  STX abs */ this.lookup[0x8E] = [ this.abs, this.stx, ];
		/* *SAX abs */ this.lookup[0x8F] = [ this.abs, this.imp, ];

		/*  BCC rel */ this.lookup[0x90] = [ this.rel, this.bcc, ];
		/*  STA izy */ this.lookup[0x91] = [ this.izyp, this.sta, ];
		/* *KIL     */ this.lookup[0x92] = [ this.imp, this.kil, ];
		/* *AHX izy */ this.lookup[0x93] = [ this.izy, this.ahx, ];
		/*  STY zpx */ this.lookup[0x94] = [ this.zpx, this.sty, ];
		/*  STA zpx */ this.lookup[0x95] = [ this.zpx, this.sta, ];
		/*  STX zpy */ this.lookup[0x96] = [ this.zpy, this.stx, ];
		/* *SAX zpy */ this.lookup[0x97] = [ this.zpy, this.imp, ];
		/*  TYA     */ this.lookup[0x98] = [ this.imp, this.tya, ];
		/*  STA aby */ this.lookup[0x99] = [ this.abyp, this.sta, ];
		/*  TXS     */ this.lookup[0x9A] = [ this.imp, this.txs, ];
		/* *TAS aby */ this.lookup[0x9B] = [ this.aby, this.imp, ];
		/* *SHY abx */ this.lookup[0x9C] = [ this.abx, this.shy, ];
		/*  STA abx */ this.lookup[0x9D] = [ this.abxp, this.sta, ];
		/* *SHX aby */ this.lookup[0x9E] = [ this.aby, this.shx, ];
		/* *AHX aby */ this.lookup[0x9F] = [ this.aby, this.ahx, ];

		/*  LDY imm */ this.lookup[0xA0] = [ this.imm, this.ldy, ];
		/*  LDA izx */ this.lookup[0xA1] = [ this.izx, this.lda, ];
		/*  LDX imm */ this.lookup[0xA2] = [ this.imm, this.ldx, ];
		/* *LAX izx */ this.lookup[0xA3] = [ this.izx, this.lax, ];
		/*  LDY zp  */ this.lookup[0xA4] = [ this.zp, this.ldy, ];
		/*  LDA zp  */ this.lookup[0xA5] = [ this.zp, this.lda, ];
		/*  LDX zp  */ this.lookup[0xA6] = [ this.zp, this.ldx, ];
		/* *LAX zp  */ this.lookup[0xA7] = [ this.zp, this.lax, ];
		/*  TAY     */ this.lookup[0xA8] = [ this.imp, this.tay, ];
		/*  LDA imm */ this.lookup[0xA9] = [ this.imm, this.lda, ];
		/*  TAX     */ this.lookup[0xAA] = [ this.imp, this.tax, ];
		/* *LAX imm */ this.lookup[0xAB] = [ this.imm, this.lax, ];
		/*  LDY abs */ this.lookup[0xAC] = [ this.abs, this.ldy, ];
		/*  LDA abs */ this.lookup[0xAD] = [ this.abs, this.lda, ];
		/*  LDX abs */ this.lookup[0xAE] = [ this.abs, this.ldx, ];
		/* *LAX abs */ this.lookup[0xAF] = [ this.abs, this.lax, ];

		/*  BCS rel */ this.lookup[0xB0] = [ this.rel, this.bcs, ];
		/*  LDA izy */ this.lookup[0xB1] = [ this.izy, this.lda, ];
		/* *KIL     */ this.lookup[0xB2] = [ this.imp, this.kil, ];
		/* *LAX izy */ this.lookup[0xB3] = [ this.izy, this.lax, ];
		/*  LDY zpx */ this.lookup[0xB4] = [ this.zpx, this.ldy, ];
		/*  LDA zpx */ this.lookup[0xB5] = [ this.zpx, this.lda, ];
		/*  LDX zpy */ this.lookup[0xB6] = [ this.zpy, this.ldx, ];
		/* *LAX zpy */ this.lookup[0xB7] = [ this.zpy, this.lax, ];
		/*  CLV     */ this.lookup[0xB8] = [ this.imp, this.clv, ];
		/*  LDA aby */ this.lookup[0xB9] = [ this.aby, this.lda, ];
		/*  TSX     */ this.lookup[0xBA] = [ this.imp, this.tsx, ];
		/* *LAS aby */ this.lookup[0xBB] = [ this.aby, this.las, ];
		/*  LDY abx */ this.lookup[0xBC] = [ this.abx, this.ldy, ];
		/*  LDA abx */ this.lookup[0xBD] = [ this.abx, this.lda, ];
		/*  LDX aby */ this.lookup[0xBE] = [ this.aby, this.ldx, ];
		/* *LAX aby */ this.lookup[0xBF] = [ this.aby, this.lax, ];

		/*  CPY imm */ this.lookup[0xC0] = [ this.imm, this.cpy, ];
		/*  CMP izx */ this.lookup[0xC1] = [ this.izx, this.cmp, ];
		/* *NOP imm */ this.lookup[0xC2] = [ this.imm, this.nop, ];
		/* *DCP izx */ this.lookup[0xC3] = [ this.izx, this.dcp, this.rmw, ];
		/*  CPY zp  */ this.lookup[0xC4] = [ this.zp, this.cpy, ];
		/*  CMP zp  */ this.lookup[0xC5] = [ this.zp, this.cmp, ];
		/*  DEC zp  */ this.lookup[0xC6] = [ this.zp, this.dec, this.rmw, ];
		/* *DCP zp  */ this.lookup[0xC7] = [ this.zp, this.dcp, this.rmw, ];
		/*  INY     */ this.lookup[0xC8] = [ this.imp, this.iny, ];
		/*  CMP imm */ this.lookup[0xC9] = [ this.imm, this.cmp, ];
		/*  DEX     */ this.lookup[0xCA] = [ this.imp, this.dex, ];
		/* *AXS imm */ this.lookup[0xCB] = [ this.imm, this.axs, ];
		/*  CPY abs */ this.lookup[0xCC] = [ this.abs, this.cpy, ];
		/*  CMP abs */ this.lookup[0xCD] = [ this.abs, this.cmp, ];
		/*  DEC abs */ this.lookup[0xCE] = [ this.abs, this.dec, this.rmw, ];
		/* *DCP abs */ this.lookup[0xCF] = [ this.abs, this.dcp, this.rmw, ];

		/*  BNE rel */ this.lookup[0xD0] = [ this.rel, this.bne, ];
		/*  CMP izy */ this.lookup[0xD1] = [ this.izy, this.cmp, ];
		/* *KIL     */ this.lookup[0xD2] = [ this.imp, this.kil, ];
		/* *DCP izy */ this.lookup[0xD3] = [ this.izy, this.dcp, this.rmw, ];
		/* *NOP zpx */ this.lookup[0xD4] = [ this.zpx, this.nop, ];
		/*  CMP zpx */ this.lookup[0xD5] = [ this.zpx, this.cmp, ];
		/*  DEC zpx */ this.lookup[0xD6] = [ this.zpx, this.dec, this.rmw, ];
		/* *DCP zpx */ this.lookup[0xD7] = [ this.zpx, this.dcp, this.rmw, ];
		/*  CLD     */ this.lookup[0xD8] = [ this.imp, this.cld, ];
		/*  CMP aby */ this.lookup[0xD9] = [ this.aby, this.cmp, ];
		/* *NOP     */ this.lookup[0xDA] = [ this.imp, this.nop, ];
		/* *DCP aby */ this.lookup[0xDB] = [ this.aby, this.dcp, this.rmw, ];
		/* *NOP abx */ this.lookup[0xDC] = [ this.abx, this.nop, ];
		/*  CMP abx */ this.lookup[0xDD] = [ this.abx, this.cmp, ];
		/*  DEC abx */ this.lookup[0xDE] = [ this.abxp, this.dec, this.rmw, ];
		/* *DCP abx */ this.lookup[0xDF] = [ this.abx, this.dcp, this.rmw, ];

		/*  CPX imm */ this.lookup[0xE0] = [ this.imm, this.cpx, ];
		/*  SBC izx */ this.lookup[0xE1] = [ this.izx, this.sbc, ];
		/* *NOP imm */ this.lookup[0xE2] = [ this.imm, this.nop, ];
		/* *ISC izx */ this.lookup[0xE3] = [ this.izx, this.isc, this.rmw, ];
		/*  CPX zp  */ this.lookup[0xE4] = [ this.zp, this.cpx, ];
		/*  SBC zp  */ this.lookup[0xE5] = [ this.zp, this.sbc, ];
		/*  INC zp  */ this.lookup[0xE6] = [ this.zp, this.inc, this.rmw, ];
		/* *ISC zp  */ this.lookup[0xE7] = [ this.zp, this.isc, this.rmw, ];
		/*  INX     */ this.lookup[0xE8] = [ this.imp, this.inx, ];
		/*  SBC imm */ this.lookup[0xE9] = [ this.imm, this.sbc, ];
		/*  NOP     */ this.lookup[0xEA] = [ this.imp, this.nop, ];
		/* *SBC imm */ this.lookup[0xEB] = [ this.imm, this.sbc, ];
		/*  CPX abs */ this.lookup[0xEC] = [ this.abs, this.cpx, ];
		/*  SBC abs */ this.lookup[0xED] = [ this.abs, this.sbc, ];
		/*  INC abs */ this.lookup[0xEE] = [ this.abs, this.inc, this.rmw, ];
		/* *ISC abs */ this.lookup[0xEF] = [ this.abs, this.isc, this.rmw, ];

		/*  BEQ rel */ this.lookup[0xF0] = [ this.rel, this.beq, ];
		/*  SBC izy */ this.lookup[0xF1] = [ this.izy, this.sbc, ];
		/* *KIL     */ this.lookup[0xF2] = [ this.imp, this.kil, ];
		/* *ISC izy */ this.lookup[0xF3] = [ this.izy, this.isc, this.rmw, ];
		/* *NOP zpx */ this.lookup[0xF4] = [ this.zpx, this.nop, ];
		/*  SBC zpx */ this.lookup[0xF5] = [ this.zpx, this.sbc, ];
		/*  INC zpx */ this.lookup[0xF6] = [ this.zpx, this.inc, this.rmw, ];
		/* *ISC zpx */ this.lookup[0xF7] = [ this.zpx, this.isc, this.rmw, ];
		/*  SED     */ this.lookup[0xF8] = [ this.imp, this.sed, ];
		/*  SBC aby */ this.lookup[0xF9] = [ this.aby, this.sbc, ];
		/* *NOP     */ this.lookup[0xFA] = [ this.imp, this.nop, ];
		/* *ISC aby */ this.lookup[0xFB] = [ this.aby, this.isc, this.rmw, ];
		/* *NOP abx */ this.lookup[0xFC] = [ this.abx, this.nop, ];
		/*  SBC abx */ this.lookup[0xFD] = [ this.abx, this.sbc, ];
		/*  INC abx */ this.lookup[0xFE] = [ this.abxp, this.inc, this.rmw, ];
		/* *ISC abx */ this.lookup[0xFF] = [ this.abx, this.isc, this.rmw, ];


		this.ASMlookup = [
			["brk", this.brk, this.imm, 7], ["ora", this.ora, this.izx, 6], ["???", this.xxx, this.imp, 2], ["???", this.xxx, this.imp, 8], ["???", this.nop, this.imp, 3], ["ora", this.ora, this.zp, 3], ["asl", this.asl, this.zp, 5], ["???", this.xxx, this.imp, 5], ["php", this.php, this.imp, 3], ["ora", this.ora, this.imm, 2], ["asl", this.asl, this.imp, 2], ["???", this.xxx, this.imp, 2], ["???", this.nop, this.imp, 4], ["ora", this.ora, this.abs, 4], ["asl", this.asl, this.abs, 6], ["???", this.xxx, this.imp, 6],
			["bpl", this.bpl, this.rel, 2], ["ora", this.ora, this.izy, 5], ["???", this.xxx, this.imp, 2], ["???", this.xxx, this.imp, 8], ["???", this.nop, this.imp, 4], ["ora", this.ora, this.zpx, 4], ["asl", this.asl, this.zpx, 6], ["???", this.xxx, this.imp, 6], ["clc", this.clc, this.imp, 2], ["ora", this.ora, this.aby, 4], ["???", this.nop, this.imp, 2], ["???", this.xxx, this.imp, 7], ["???", this.nop, this.imp, 4], ["ora", this.ora, this.abx, 4], ["asl", this.asl, this.abx, 7], ["???", this.xxx, this.imp, 7],
			["jsr", this.jsr, this.abs, 6], ["and", this.and, this.izx, 6], ["???", this.xxx, this.imp, 2], ["???", this.xxx, this.imp, 8], ["bit", this.bit, this.zp,  3], ["and", this.and, this.zp,  3], ["rol", this.rol, this.zp,  5], ["???", this.xxx, this.imp, 5], ["plp", this.plp, this.imp, 4], ["and", this.and, this.imm, 2], ["rol", this.rol, this.imp, 2], ["???", this.xxx, this.imp, 2], ["bit", this.bit, this.abs, 4], ["and", this.and, this.abs, 4], ["rol", this.rol, this.abs, 6], ["???", this.xxx, this.imp, 6],
			["bmi", this.bmi, this.rel, 2], ["and", this.and, this.izy, 5], ["???", this.xxx, this.imp, 2], ["???", this.xxx, this.imp, 8], ["???", this.nop, this.imp, 4], ["and", this.and, this.zpx, 4], ["rol", this.rol, this.zpx, 6], ["???", this.xxx, this.imp, 6], ["sec", this.sec, this.imp, 2], ["and", this.and, this.aby, 4], ["???", this.nop, this.imp, 2], ["???", this.xxx, this.imp, 7], ["???", this.nop, this.imp, 4], ["and", this.and, this.abx, 4], ["rol", this.rol, this.abx, 7], ["???", this.xxx, this.imp, 7],
			["rti", this.rti, this.imp, 6], ["eor", this.eor, this.izx, 6], ["???", this.xxx, this.imp, 2], ["???", this.xxx, this.imp, 8], ["???", this.nop, this.imp, 3], ["eor", this.eor, this.zp , 3], ["lsr", this.lsr, this.zp , 5], ["???", this.xxx, this.imp, 5], ["pha", this.pha, this.imp, 3], ["eor", this.eor, this.imm, 2], ["lsr", this.lsr, this.imp, 2], ["???", this.xxx, this.imp, 2], ["jmp", this.jmp, this.abs, 3], ["eor", this.eor, this.abs, 4], ["lsr", this.lsr, this.abs, 6], ["???", this.xxx, this.imp, 6],
			["bvc", this.bvc, this.rel, 2], ["eor", this.eor, this.izy, 5], ["???", this.xxx, this.imp, 2], ["???", this.xxx, this.imp, 8], ["???", this.nop, this.imp, 4], ["eor", this.eor, this.zpx, 4], ["lsr", this.lsr, this.zpx, 6], ["???", this.xxx, this.imp, 6], ["cli", this.cli, this.imp, 2], ["eor", this.eor, this.aby, 4], ["???", this.nop, this.imp, 2], ["???", this.xxx, this.imp, 7], ["???", this.nop, this.imp, 4], ["eor", this.eor, this.abx, 4], ["lsr", this.lsr, this.abx, 7], ["???", this.xxx, this.imp, 7],
			["rts", this.rts, this.imp, 6], ["adc", this.adc, this.izx, 6], ["???", this.xxx, this.imp, 2], ["???", this.xxx, this.imp, 8], ["???", this.nop, this.imp, 3], ["adc", this.adc, this.zp , 3], ["ror", this.ror, this.zp , 5], ["???", this.xxx, this.imp, 5], ["pla", this.pla, this.imp, 4], ["adc", this.adc, this.imm, 2], ["ror", this.ror, this.imp, 2], ["???", this.xxx, this.imp, 2], ["jmp", this.jmp, this.ind, 5], ["adc", this.adc, this.abs, 4], ["ror", this.ror, this.abs, 6], ["???", this.xxx, this.imp, 6],
			["bvs", this.bvs, this.rel, 2], ["adc", this.adc, this.izy, 5], ["???", this.xxx, this.imp, 2], ["???", this.xxx, this.imp, 8], ["???", this.nop, this.imp, 4], ["adc", this.adc, this.zpx, 4], ["ror", this.ror, this.zpx, 6], ["???", this.xxx, this.imp, 6], ["sei", this.sei, this.imp, 2], ["adc", this.adc, this.aby, 4], ["???", this.nop, this.imp, 2], ["???", this.xxx, this.imp, 7], ["???", this.nop, this.imp, 4], ["adc", this.adc, this.abx, 4], ["ror", this.ror, this.abx, 7], ["???", this.xxx, this.imp, 7],
			["???", this.nop, this.imp, 2], ["sta", this.sta, this.izx, 6], ["???", this.nop, this.imp, 2], ["???", this.xxx, this.imp, 6], ["sty", this.sty, this.zp , 3], ["sta", this.sta, this.zp , 3], ["stx", this.stx, this.zp , 3], ["???", this.xxx, this.imp, 3], ["dey", this.dey, this.imp, 2], ["???", this.nop, this.imp, 2], ["txa", this.txa, this.imp, 2], ["???", this.xxx, this.imp, 2], ["sty", this.sty, this.abs, 4], ["sta", this.sta, this.abs, 4], ["stx", this.stx, this.abs, 4], ["???", this.xxx, this.imp, 4],
			["bcc", this.bcc, this.rel, 2], ["sta", this.sta, this.izy, 6], ["???", this.xxx, this.imp, 2], ["???", this.xxx, this.imp, 6], ["sty", this.sty, this.zpx, 4], ["sta", this.sta, this.zpx, 4], ["stx", this.stx, this.zpy, 4], ["???", this.xxx, this.imp, 4], ["tya", this.tya, this.imp, 2], ["sta", this.sta, this.aby, 5], ["txs", this.txs, this.imp, 2], ["???", this.xxx, this.imp, 5], ["???", this.nop, this.imp, 5], ["sta", this.sta, this.abx, 5], ["???", this.xxx, this.imp, 5], ["???", this.xxx, this.imp, 5],
			["ldy", this.ldy, this.imm, 2], ["lda", this.lda, this.izx, 6], ["ldx", this.ldx, this.imm, 2], ["???", this.xxx, this.imp, 6], ["ldy", this.ldy, this.zp , 3], ["lda", this.lda, this.zp , 3], ["ldx", this.ldx, this.zp , 3], ["???", this.xxx, this.imp, 3], ["tay", this.tay, this.imp, 2], ["lda", this.lda, this.imm, 2], ["tax", this.tax, this.imp, 2], ["???", this.xxx, this.imp, 2], ["ldy", this.ldy, this.abs, 4], ["lda", this.lda, this.abs, 4], ["ldx", this.ldx, this.abs, 4], ["???", this.xxx, this.imp, 4],
			["bcs", this.bcs, this.rel, 2], ["lda", this.lda, this.izy, 5], ["???", this.xxx, this.imp, 2], ["???", this.xxx, this.imp, 5], ["ldy", this.ldy, this.zpx, 4], ["lda", this.lda, this.zpx, 4], ["ldx", this.ldx, this.zpy, 4], ["???", this.xxx, this.imp, 4], ["clv", this.clv, this.imp, 2], ["lda", this.lda, this.aby, 4], ["tsx", this.tsx, this.imp, 2], ["???", this.xxx, this.imp, 4], ["ldy", this.ldy, this.abx, 4], ["lda", this.lda, this.abx, 4], ["ldx", this.ldx, this.aby, 4], ["???", this.xxx, this.imp, 4],
			["cpy", this.cpy, this.imm, 2], ["cmp", this.cmp, this.izx, 6], ["???", this.nop, this.imp, 2], ["???", this.xxx, this.imp, 8], ["cpy", this.cpy, this.zp , 3], ["cmp", this.cmp, this.zp , 3], ["dec", this.dec, this.zp , 5], ["???", this.xxx, this.imp, 5], ["iny", this.iny, this.imp, 2], ["cmp", this.cmp, this.imm, 2], ["dex", this.dex, this.imp, 2], ["???", this.xxx, this.imp, 2], ["cpy", this.cpy, this.abs, 4], ["cmp", this.cmp, this.abs, 4], ["dec", this.dec, this.abs, 6], ["???", this.xxx, this.imp, 6],
			["bne", this.bne, this.rel, 2], ["cmp", this.cmp, this.izy, 5], ["???", this.xxx, this.imp, 2], ["???", this.xxx, this.imp, 8], ["???", this.nop, this.imp, 4], ["cmp", this.cmp, this.zpx, 4], ["dec", this.dec, this.zpx, 6], ["???", this.xxx, this.imp, 6], ["cld", this.cld, this.imp, 2], ["cmp", this.cmp, this.aby, 4], ["nop", this.nop, this.imp, 2], ["???", this.xxx, this.imp, 7], ["???", this.nop, this.imp, 4], ["cmp", this.cmp, this.abx, 4], ["dec", this.dec, this.abx, 7], ["???", this.xxx, this.imp, 7],
			["cpx", this.cpx, this.imm, 2], ["sbc", this.sbc, this.izx, 6], ["???", this.nop, this.imp, 2], ["???", this.xxx, this.imp, 8], ["cpx", this.cpx, this.zp , 3], ["sbc", this.sbc, this.zp , 3], ["inc", this.inc, this.zp , 5], ["???", this.xxx, this.imp, 5], ["inx", this.inx, this.imp, 2], ["sbc", this.sbc, this.imm, 2], ["nop", this.nop, this.imp, 2], ["???", this.sbc, this.imp, 2], ["cpx", this.cpx, this.abs, 4], ["sbc", this.sbc, this.abs, 4], ["inc", this.inc, this.abs, 6], ["???", this.xxx, this.imp, 6],
			["beq", this.beq, this.rel, 2], ["sbc", this.sbc, this.izy, 5], ["???", this.xxx, this.imp, 2], ["???", this.xxx, this.imp, 8], ["???", this.nop, this.imp, 4], ["sbc", this.sbc, this.zpx, 4], ["inc", this.inc, this.zpx, 6], ["???", this.xxx, this.imp, 6], ["sed", this.sed, this.imp, 2], ["sbc", this.sbc, this.aby, 4], ["nop", this.nop, this.imp, 2], ["???", this.xxx, this.imp, 7], ["???", this.nop, this.imp, 4], ["sbc", this.sbc, this.abx, 4], ["inc", this.inc, this.abx, 7], ["???", this.xxx, this.imp, 7],
		];

		this.ASMlookup = this.ASMlookup.map(item => ({
			name:     item[0],
			operate:  item[1],
			addrmode: item[2],
			cycles:   item[3]
		}));
	}

	GetFlag (flag) {
		if (flag === olc6502.FLAGS6502.U) {
			return this.U;
		}
		if (flag === olc6502.FLAGS6502.B) {
			return this.B;
		}
		if (flag === olc6502.FLAGS6502.C) {
			return this.C;
		}
		if (flag === olc6502.FLAGS6502.D) {
			return this.D;
		}
		if (flag === olc6502.FLAGS6502.I) {
			return this.I;
		}
	}

	ConnectBus (bus) {
		this.bus = bus;
		bus.cpu = this;
	}

	complete() {
		return this.cycles === 0;
	}

	irq() {
		// If interrupts are allowed
		if (this.I === 0) {
			// Push the program counter to the stack. It's 16-bits dont
			// forget so that takes two pushes
			this.write(0x0100 + this.S, (this.pc >> 8) & 0x00FF);
			this.S--;
			this.write(0x0100 + this.S, this.pc & 0x00FF);
			this.S--;

			// Then Push the status register to the stack
			this.B = 0;
			this.U = 1;
			this.I = 1;
			var v = this.N << 7;
			v |= this.V << 6;
			v |= 3 << 4;
			v |= this.D << 3;
			v |= this.I << 2;
			v |= this.Z << 1;
			v |= this.C;
			this.write(0x0100 + this.S, v);
			this.S--;

			// Read new program counter location from fixed address
			this.addr = 0xFFFE;
			let lo = this.read(this.addr + 0);
			let hi = this.read(this.addr + 1);
			this.pc = (hi << 8) | lo;

			// IRQs take time
			this.cycles = 7;
		}
	}


// A Non-Maskable Interrupt cannot be ignored. It behaves in exactly the
// same way as a regular IRQ, but reads the new program counter address
// form location 0xFFFA.
	nmi() {
		this.write(0x0100 + this.S, (this.pc >> 8) & 0x00FF);
		this.S--;
		this.write(0x0100 + this.S, this.pc & 0x00FF);
		this.S--;

		this.B = 0;
		this.U = 1;
		this.I = 1;
		var v = this.N << 7;
		v |= this.V << 6;
		v |= 3 << 4;
		v |= this.D << 3;
		v |= this.I << 2;
		v |= this.Z << 1;
		v |= this.C;
		this.write(0x0100 + this.S, v);
		this.S--;

		this.addr = 0xFFFA;
		let lo = this.read(this.addr + 0);
		let hi = this.read(this.addr + 1);
		this.pc = (hi << 8) | lo;

		this.cycles = 8;
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
			let pcode = this.bus.cpuRead(addr, true) || 0;
			addr++;

			sInst += this.ASMlookup[pcode].name + " ";

			// Get oprands from desired locations, and form the
			// instruction based upon its addressing mode. These
			// routines mimmick the actual fetch routine of the
			// 6502 in order to get accurate data as part of the
			// instruction
			if (this.ASMlookup[pcode].addrmode === this.imp) {
				sInst += " {IMP}";
			} else if (this.ASMlookup[pcode].addrmode === this.imm) {
				value = this.bus.cpuRead(addr, true);
				addr++;
				sInst += "#$" + hex(value, 2) + " {IMM}";
			} else if (this.ASMlookup[pcode].addrmode === this.zp) {
				lo = this.bus.cpuRead(addr, true);
				addr++;
				hi = 0x00;
				sInst += "$" + hex(lo, 2) + " {zp }";
			} else if (this.ASMlookup[pcode].addrmode === this.zpx) {
				lo = this.bus.cpuRead(addr, true);
				addr++;
				hi = 0x00;
				sInst += "$" + hex(lo, 2) + ", X {ZPX}";
			} else if (this.ASMlookup[pcode].addrmode === this.zpy) {
				lo = this.bus.cpuRead(addr, true);
				addr++;
				hi = 0x00;
				sInst += "$" + hex(lo, 2) + ", Y {ZPY}";
			} else if (this.ASMlookup[pcode].addrmode === this.izx) {
				lo = this.bus.cpuRead(addr, true);
				addr++;
				hi = 0x00;
				sInst += "($" + hex(lo, 2) + ", X) {IZX}";
			} else if (this.ASMlookup[pcode].addrmode === this.izy) {
				lo = this.bus.cpuRead(addr, true);
				addr++;
				hi = 0x00;
				sInst += "($" + hex(lo, 2) + "), Y {IZY}";
			} else if (this.ASMlookup[pcode].addrmode === this.abs) {
				lo = this.bus.cpuRead(addr, true);
				addr++;
				hi = this.bus.cpuRead(addr, true);
				addr++;
				sInst += "$" + hex((hi << 8) | lo, 4) + " {ABS}";
			} else if (this.ASMlookup[pcode].addrmode === this.abx) {
				lo = this.bus.cpuRead(addr, true);
				addr++;
				hi = this.bus.cpuRead(addr, true);
				addr++;
				sInst += "$" + hex((hi << 8) | lo, 4) + ", X {ABX}";
			} else if (this.ASMlookup[pcode].addrmode === this.aby) {
				lo = this.bus.cpuRead(addr, true);
				addr++;
				hi = this.bus.cpuRead(addr, true);
				addr++;
				sInst += "$" + hex((hi << 8) | lo, 4) + ", Y {ABY}";
			} else if (this.ASMlookup[pcode].addrmode === this.ind) {
				lo = this.bus.cpuRead(addr, true);
				addr++;
				hi = this.bus.cpuRead(addr, true);
				addr++;
				sInst += "($" + hex((hi << 8) | lo, 4) + ") {IND}";
			} else if (this.ASMlookup[pcode].addrmode === this.rel) {
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

	////////////////////////////////////////////////////////////////////////////////
	// CPU control
	////////////////////////////////////////////////////////////////////////////////

	/**
	 * Reset the processor
	 */
	reset() {

		this.A = 0; this.X = 0; this.Y = 0; this.S = 0;
		this.N = 0; this.Z = 1; this.C = 0; this.V = 0;
		this.I = 0; this.D = 0;

		this.pc = (this.read(0xFFFD) << 8) | this.read(0xFFFC);
	}

	/**
	 * Execute a single opcode
	 */
	step() {
		this.opcode = this.read( this.pc++ );
		this.lookup[ this.opcode ].operate.bind( this );
		this.lookup[ this.opcode ].addrmode.bind( this );
	}

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
			this.opcode = this.read(this.pc++) || 0;

			// Always set the unused status flag bit to 1
			this.U = 1;

			// Increment program counter, we read the opcode byte
			//this.pc++;

			// Get Starting number of cycles
			//this.cycles = this.lookup[this.opcode].cycles;

			// Perform fetch of intermmediate data using the
			// required addressing mode
			for (let i in this.lookup[this.opcode]) {

				try {
					this.lookup[this.opcode][i].bind(this)()
				} catch (e)  {
					//debugger;
				}
			}
			//let additional_cycle1 = (;

			// Perform operation
			//let additional_cycle2 = (this.lookup[this.opcode].operate).bind(this)();

			// The addressmode and opcode may have altered the number
			// of cycles this instruction requires before its completed
			//this.cycles += (additional_cycle1 & additional_cycle2);

			// Always set the unused status flag bit to 1
			this.U = 1;

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

	/**
	 * Log the current cycle count and all registers to console.log
	 */
	log(){
		var msg = "nPC=" + this.pc.toString(16);
		msg += " cyc=" + this.cycles;
		msg += " [" + this.opcode.toString(16) + "] ";
		msg += ( this.C ? "C" : "-");
		msg += ( this.N ? "N" : "-");
		msg += ( this.Z ? "Z" : "-");
		msg += ( this.V ? "V" : "-");
		msg += ( this.D ? "D" : "-");
		msg += ( this.I ? "I" : "-");
		msg += " A=" + this.A.toString(16);
		msg += " X=" + this.X.toString(16);
		msg += " Y=" + this.Y.toString(16);
		msg += " S=" + this.S.toString(16);
	}

	/**
	 * Read a memory location. This function must be overridden with a custom implementation.
	 * @param {number} addr - The address to read from.
	 */
	read(addr){
		return this.bus.cpuRead(addr, false);
	}

	/**
	 * Writa a value to a memory location. This function must be overridden with a custom implementation.
	 * @param {number} addr - The address to write to.
	 * @param {number} value - The value to write.
	 */
	write(addr, value){
		this.bus.cpuWrite(addr, value);
	}

	////////////////////////////////////////////////////////////////////////////////
	// Subroutines - addressing modes & flags
	////////////////////////////////////////////////////////////////////////////////

	kil() {
		return 0;
	}

	izx() {
		var a = (this.read(this.pc++) + this.X) & 0xFF;
		this.addr = (this.read((a + 1) & 0xFF) << 8) | this.read(a);
		this.cycles += 6;
	}

	izy() {
		let t = this.read(this.pc++);

		let lo = this.read(t & 0x00FF);
		let hi = this.read((t + 1) & 0x00FF);

		this.addr = (hi << 8) | lo;
		this.addr = (this.addr + this.Y) & 0xFFFF;

		if ((this.addr & 0xFF00) !== (hi << 8))
			this.cycles += 6;
		else
			this.cycles += 5;

		/*
		var a = this.read(this.pc++);
		var paddr = (this.read((a + 1) & 0xFF) << 8) | this.read(a);
		this.addr = (paddr + this.Y) & 0xFF;
		if ( (paddr & 0x100) !== (this.addr & 0x100) ) {
			this.cycles += 6;
		} else {
			this.cycles += 5;
		}*/
	}

	izyp() {
		var a = this.read(this.pc++);
		var paddr = (this.read((a+1) & 0xFF) << 8) | this.read(a);
		this.addr = (paddr + this.Y);
		this.cycles += 6;
	}


	ind() {
		var a = this.read(this.pc++);
		a |= (this.read(this.pc++) << 8);
		this.addr = this.read(a);
		this.addr |= (this.read( (a & 0xFF00) | ((a + 1) & 0xFF) ) << 8);
		this.cycles += 6;
	}

	zp() {
		this.addr = this.read(this.pc++);
		this.cycles += 3;
	}

	zpx() {
		this.addr = (this.read(this.pc++) + this.X) & 0xFF;
		this.cycles += 4;
	}

	zpy() {
		this.addr = (this.read(this.pc++) + this.Y) & 0xFF;
		this.cycles += 4;
	}

	imp() {
		this.cycles += 2;
	}

	imm() {
		this.addr = this.pc++;
		this.cycles += 2;
	}

	abs() {
		this.addr = this.read(this.pc++);
		this.addr |= (this.read(this.pc++) << 8);
		this.cycles += 4;
	}

	abx() {
		var paddr = this.read(this.pc++);
		paddr |= (this.read(this.pc++) << 8);
		this.addr = (paddr + this.X);
		if ( (paddr & 0x100) != (this.addr & 0x100) ) {
			this.cycles += 5;
		} else {
			this.cycles += 4;
		}
	}

	abxp() {
		var paddr = this.read(this.pc++);
		paddr |= (this.read(this.pc++) << 8);
		this.addr = (paddr + this.X);
		this.cycles += 5;
	}

	aby() {
		var paddr = this.read(this.pc++);
		paddr |= (this.read(this.pc++) << 8);
		this.addr = (paddr + this.Y) & 0xFFFF;
		if ( (paddr & 0x100) != (this.addr & 0x100) ) {
			this.cycles += 5;
		} else {
			this.cycles += 4;
		}
	}

	abyp() {
		var paddr = this.read(this.pc++);
		paddr |= (this.read(this.pc++) << 8);
		this.addr = (paddr + this.Y) & 0xFFFF;
		this.cycles += 5;
	}


	rel() {
		this.addr = this.read(this.pc++);
		if (this.addr & 0x80) {
			this.addr -= 0x100;
		}
		this.addr += this.pc;
		this.cycles += 2;
	}

	rmw() {
		this.write(this.addr, this.tmp & 0xFF);
		this.cycles += 2;
	}

	fnz(v) {
		this.Z = ((v & 0xFF) == 0) ? 1 : 0;
		this.N = ((v & 0x80) != 0) ? 1 : 0;
	}

	// Borrow
	fnzb(v) {
		this.Z = ((v & 0xFF) == 0) ? 1 : 0;
		this.N = ((v & 0x80) != 0) ? 1 : 0;
		this.C = ((v & 0x100) != 0) ? 0 : 1;
	}

	// Carry
	fnzc(v) {
		this.Z = ((v & 0xFF) == 0) ? 1 : 0;
		this.N = ((v & 0x80) != 0) ? 1 : 0;
		this.C = ((v & 0x100) != 0) ? 1 : 0;
	}

	branch(v) {
		if (v) {
			if ( (this.addr & 0x100) != (this.pc & 0x100) ) {
				this.cycles += 2;
			} else {
				this.cycles += 1;
			}
			this.pc = this.addr;
		}
	}

	////////////////////////////////////////////////////////////////////////////////
	// Subroutines - instructions
	////////////////////////////////////////////////////////////////////////////////
	adc() {
		var v = this.read(this.addr);
		var c = this.C;
		var r = this.A + v + c;
		this.Z = ((r & 0xFF) == 0) ? 1 : 0;
		this.N = ((r & 0x80) != 0) ? 1 : 0;
		this.V = ((~(this.A ^ v) & (this.A ^ r) & 0x80) != 0) ? 1 : 0;
		this.C = ((r & 0x100) != 0) ? 1 : 0;
		this.A = r & 0xFF;
		/*
		if (this.D) {
			var al = (this.A & 0x0F) + (v & 0x0F) + c;
			if (al > 9) al += 6;
			var ah = (this.A >> 4) + (v >> 4) + ((al > 15) ? 1 : 0);
			this.Z = ((r & 0xFF) == 0) ? 1 : 0;
			this.N = ((ah & 8) != 0) ? 1 : 0;
			this.V = ((~(this.A ^ v) & (this.A ^ (ah << 4)) & 0x80) != 0) ? 1 : 0;
			if (ah > 9) ah += 6;
			this.C = (ah > 15) ? 1 : 0;
			this.A = ((ah << 4) | (al & 15)) & 0xFF;
		} else {

		}*/
	}

	ahx() {
		this.tmp = ((this.addr >> 8) + 1) & this.A & this.X;
		this.write(this.addr, this.tmp & 0xFF);
	}

	alr() {
		this.tmp = this.read(this.addr) & this.A;
		this.tmp = ((this.tmp & 1) << 8) | (this.tmp >> 1);
		this.fnzc(this.tmp);
		this.A = this.tmp & 0xFF;
	}

	anc() {
		this.tmp = this.read(this.addr);
		this.tmp |= ((this.tmp & 0x80) & (this.A & 0x80)) << 1;
		this.fnzc(this.tmp);
		this.A = this.tmp & 0xFF;
	}

	and() {
		this.A &= this.read(this.addr);
		this.fnz(this.A);
	}

	ane() {
		this.tmp = this.read(this.addr) & this.A & (this.A | 0xEE);
		this.fnz(this.tmp);
		this.A = this.tmp & 0xFF;
	}

	arr() {
		this.tmp = this.read(this.adfdr) & this.A;
		this.C = ((this.tmp & 0x80) != 0);
		this.V = ((((this.tmp >> 7) & 1) ^ ((this.tmp >> 6) & 1)) != 0);
		if (this.D) {
			var al = (this.tmp & 0x0F) + (this.tmp & 1);
			if (al > 5) al += 6;
			var ah = ((this.tmp >> 4) & 0x0F) + ((this.tmp >> 4) & 1);
			if (ah > 5) {
				al += 6;
				this.C = true;
			} else {
				this.C = false;
			}
			this.tmp = (ah << 4) | al;
		}
		this.fnz(this.tmp);
		this.A = this.tmp & 0xFF;
	}

	asl() {
		this.tmp = this.read(this.addr) << 1;
		this.fnzc(this.tmp);
		this.tmp &= 0xFF;
	}
	asla() {
		this.tmp = this.A << 1;
		this.fnzc(this.tmp);
		this.A = this.tmp & 0xFF;
	}

	bit() {
		this.tmp = this.read(this.addr);
		this.N = ((this.tmp & 0x80) != 0) ? 1 : 0;
		this.V = ((this.tmp & 0x40) != 0) ? 1 : 0;
		this.Z = ((this.tmp & this.A) == 0) ? 1 : 0;
	}

	brk() {
		this.pc++;
		this.write(this.S + 0x100, this.pc >> 8);
		this.S = (this.S - 1) & 0xFF;
		this.write(this.S + 0x100, this.pc & 0xFF);
		this.S = (this.S - 1) & 0xFF;
		var v = this.N << 7;
		v |= this.V << 6;
		v |= 3 << 4;
		v |= this.D << 3;
		v |= this.I << 2;
		v |= this.Z << 1;
		v |= this.C;
		this.write(this.S + 0x100, v);
		this.S = (this.S - 1) & 0xFF;
		this.I = 1;
		this.D = 0;
		this.pc = (this.read(0xFFFF) << 8) | this.read(0xFFFE);
		this.cycles += 5;
	}

	bcc() { this.branch( this.C == 0 ); }
	bcs() { this.branch( this.C == 1 ); }
	beq() { this.branch( this.Z == 1 ); }
	bne() { this.branch( this.Z == 0 ); }
	bmi() { this.branch( this.N == 1 ); }
	bpl() { this.branch( this.N == 0 ); }
	bvc() { this.branch( this.V == 0 ); }
	bvs() { this.branch( this.V == 1 ); }


	clc() { this.C = 0; }
	cld() { this.D = 0; }
	cli() { this.I = 0; }
	clv() { this.V = 0; }

	cmp() {
		this.fnzb( this.A - this.read(this.addr) );
	}

	cpx() {
		this.fnzb( this.X - this.read(this.addr) );
	}

	cpy() {
		this.fnzb( this.Y - this.read(this.addr) );
	}

	dcp() {
		this.tmp = (this.read(this.addr) - 1) & 0xFF;
		this.tmp = this.A - this.tmp;
		this.fnz(this.tmp);
	}

	dec() {
		this.tmp = (this.read(this.addr) - 1) & 0xFF;
		this.fnz(this.tmp);
	}

	dex() {
		this.X = (this.X - 1) & 0xFF;
		this.fnz(this.X);
	}

	dey() {
		this.Y = (this.Y - 1) & 0xFF;
		this.fnz(this.Y);
	}

	eor() {
		this.A ^= this.read(this.addr);
		this.fnz(this.A);
	}

	inc() {
		this.tmp = (this.read(this.addr) + 1) & 0xFF;
		this.fnz(this.tmp);
	}

	inx() {
		this.X = (this.X + 1) & 0xFF;
		this.fnz(this.X);
	}

	iny() {
		this.Y = (this.Y + 1) & 0xFF;
		this.fnz(this.Y);
	}

	isc() {
		var v = (this.read(this.addr) + 1) & 0xFF;
		var c = 1 - (this.C ? 1 : 0);
		var r = this.A - v - c;
		if (this.D) {
			var al = (this.A & 0x0F) - (v & 0x0F) - c;
			if (al > 0x80) al -= 6;
			var ah = (this.A >> 4) - (v >> 4) - ((al > 0x80) ? 1 : 0);
			this.Z = ((r & 0xFF) == 0);
			this.N = ((r & 0x80) != 0);
			this.V = (((this.A ^ v) & (this.A ^ r) & 0x80) != 0);
			this.C = ((this.r & 0x100) != 0) ? 0 : 1;
			if (ah > 0x80) ah -= 6;
			this.A = ((ah << 4) | (al & 15)) & 0xFF;
		} else {
			this.Z = ((r & 0xFF) == 0);
			this.N = ((r & 0x80) != 0);
			this.V = (((this.A ^ v) & (this.A ^ r) & 0x80) != 0);
			this.C = ((r & 0x100) != 0) ? 0 : 1;
			this.A = r & 0xFF;
		}
	}

	jmp() {
		this.pc = this.addr;
		this.cycles--;
	}

	jsr() {
		this.write(this.S + 0x100, (this.pc - 1) >> 8);
		this.S = (this.S - 1) & 0xFF;
		this.write(this.S + 0x100, (this.pc - 1) & 0xFF);
		this.S = (this.S - 1) & 0xFF;
		this.pc = this.addr;
		this.cycles += 2;
	}

	las() {
		this.S = this.X = this.A = this.read(this.addr) & this.S;
		this.fnz(this.A);
	}

	lax() {
		this.X = this.A = this.read(this.addr);
		this.fnz(this.A);
	}

	lda() {
		this.A = this.read(this.addr);
		this.fnz(this.A);
	}

	ldx() {
		this.X = this.read(this.addr);
		this.fnz(this.X);
	}

	ldy() {
		this.Y = this.read(this.addr);
		this.fnz(this.Y);
	}

	ora() {
		this.A |= this.read(this.addr);
		this.fnz(this.A);
	}

	rol() {
		this.tmp = (this.read(this.addr) << 1) | this.C;
		this.fnzc(this.tmp);
		this.tmp &= 0xFF;
	}
	rla() {
		this.tmp = (this.A << 1) | this.C;
		this.fnzc(this.tmp);
		this.A = this.tmp & 0xFF;
	}

	ror() {
		this.tmp = this.read(this.addr);
		this.tmp = ((this.tmp & 1) << 8) | (this.C << 7) | (this.tmp >> 1);
		this.fnzc(this.tmp);
		this.tmp &= 0xFF;
	}
	rra() {
		this.tmp = ((this.A & 1) << 8) | (this.C << 7) | (this.A >> 1);
		this.fnzc(this.tmp);
		this.A = this.tmp & 0xFF;
	}


	lsr() {
		this.tmp = this.read(this.addr);
		this.tmp = ((this.tmp & 1) << 8) | (this.tmp >> 1);
		this.fnzc(this.tmp);
		this.tmp &= 0xFF;
	}
	lsra() {
		this.tmp = ((this.A & 1) << 8) | (this.A >> 1);
		this.fnzc(this.tmp);
		this.A = this.tmp & 0xFF;
	}


	nop() { }

	pha() {
		this.write(this.S + 0x100, this.A);
		this.S = (this.S - 1) & 0xFF;
		this.cycles++;
	}

	php() {
		var v = this.N << 7;
		v |= this.V << 6;
		v |= 3 << 4;
		v |= this.D << 3;
		v |= this.I << 2;
		v |= this.Z << 1;
		v |= this.C;
		this.write(this.S + 0x100, v);
		this.S = (this.S - 1) & 0xFF;
		this.cycles++;
	}

	pla() {
		this.S = (this.S + 1) & 0xFF;
		this.A = this.read(this.S + 0x100);
		this.fnz(this.A);
		this.cycles += 2;
	}

	plp() {
		this.S = (this.S + 1) & 0xFF;
		this.tmp = this.read(this.S + 0x100);
		this.N = ((this.tmp & 0x80) != 0) ? 1 : 0;
		this.V = ((this.tmp & 0x40) != 0) ? 1 : 0;
		this.D = ((this.tmp & 0x08) != 0) ? 1 : 0;
		this.I = ((this.tmp & 0x04) != 0) ? 1 : 0;
		this.Z = ((this.tmp & 0x02) != 0) ? 1 : 0;
		this.C = ((this.tmp & 0x01) != 0) ? 1 : 0;
		this.cycles += 2;
	}

	rti() {
		this.S = (this.S + 1) & 0xFF;
		this.tmp = this.read(this.S + 0x100);
		this.N = ((this.tmp & 0x80) != 0) ? 1 : 0;
		this.V = ((this.tmp & 0x40) != 0) ? 1 : 0;
		this.D = ((this.tmp & 0x08) != 0) ? 1 : 0;
		this.I = ((this.tmp & 0x04) != 0) ? 1 : 0;
		this.Z = ((this.tmp & 0x02) != 0) ? 1 : 0;
		this.C = ((this.tmp & 0x01) != 0) ? 1 : 0;
		this.S = (this.S + 1) & 0xFF;
		this.pc = this.read(this.S + 0x100);
		this.S = (this.S + 1) & 0xFF;
		this.pc |= this.read(this.S + 0x100) << 8;
		this.cycles += 4;
	}

	rts() {
		this.S = (this.S + 1) & 0xFF;
		this.pc = this.read(this.S + 0x100);
		this.S = (this.S + 1) & 0xFF;
		this.pc |= this.read(this.S + 0x100) << 8;
		this.pc++;
		this.cycles += 4;
	}

	sbc() {
		var v = this.read(this.addr);
		var c = 1 - this.C;
		var r = this.A - v - c;
		if (this.D) {
			var al = (this.A & 0x0F) - (v & 0x0F) - c;
			if (al < 0) al -= 6;
			var ah = (this.A >> 4) - (v >> 4) - ((al < 0) ? 1 : 0);
			this.Z = ((r & 0xFF) == 0) ? 1 : 0;
			this.N = ((r & 0x80) != 0) ? 1 : 0;
			this.V = (((this.A ^ v) & (this.A ^ r) & 0x80) != 0) ? 1 : 0;
			this.C = ((r & 0x100) != 0) ? 0 : 1;
			if (ah < 0) ah -= 6;
			this.A = ((ah << 4) | (al & 15)) & 0xFF;
		} else {
			this.Z = ((r & 0xFF) == 0) ? 1 : 0;
			this.N = ((r & 0x80) != 0) ? 1 : 0;
			this.V = (((this.A ^ v) & (this.A ^ r) & 0x80) != 0) ? 1 : 0;
			this.C = ((r & 0x100) != 0) ? 0 : 1;
			this.A = r & 0xFF;
		}
	}

	sbx() {
		this.tmp = this.read(this.addr) - (this.A & this.X);
		this.fnzb(this.tmp);
		this.X = (this.tmp & 0xFF);
	}

	sec() { this.C = 1; }
	sed() { this.D = 1; }
	sei() { this.I = 1; }

	shs() {
		this.tmp = ((this.addr >> 8) + 1) & this.A & this.X;
		this.write(this.addr, this.tmp & 0xFF);
		this.S = (this.tmp & 0xFF);
	}

	shx() {
		this.tmp = ((this.addr >> 8) + 1) & this.X;
		this.write(this.addr, this.tmp & 0xFF);
	}

	shy() {
		this.tmp = ((this.addr >> 8) + 1) & this.Y;
		this.write(this.addr, this.tmp & 0xFF);
	}

	slo() {
		this.tmp = this.read(this.addr) << 1;
		this.tmp |= this.A;
		this.fnzc(this.tmp);
		this.A = this.tmp & 0xFF;
	}

	sre() {
		var v = this.read(this.addr);
		this.tmp = ((v & 1) << 8) | (v >> 1);
		this.tmp ^= this.A;
		this.fnzc(this.tmp);
		this.A = this.tmp & 0xFF;
	}

	sta() {
		this.write(this.addr, this.A);
	}

	stx() {
		this.write(this.addr, this.X);
	}

	sty() {
		this.write(this.addr, this.Y);
	}

	tax() {
		this.X = this.A;
		this.fnz(this.X);
	}

	tay() {
		this.Y = this.A;
		this.fnz(this.Y);
	}

	tsx() {
		this.X = this.S;
		this.fnz(this.X);
	}

	txa() {
		this.A = this.X;
		this.fnz(this.A);
	}

	txs() {
		this.S = this.X;
	}

	tya() {
		this.A = this.Y;
		this.fnz(this.A);
	}

	xxx() {
		return 0;
	}
}

export default Cpu6502;
