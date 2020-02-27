class olc2C02Simple {
	constructor() {
		this.vram_addr = null; // Active "pointer" address into nametable to extract background tile info
		this.tram_addr = {}; // Temporary store of information to be "transferred" into "pointer" at various times

		// Pixel offset horizontally
		this.fine_x = 0x00;

		// Internal communications
		this.address_latch = 0x00;
		this.ppu_data_buffer = 0xFF;

		// Pixel "dot" position information
		this.scanline = 0;
		this.cycle = 0;

		this.status = new Struct({
			unused:          5,
			sprite_overflow: 1,
			sprite_zero_hit: 1,
			vertical_blank:  1,
		});

		this.mask = new Struct({
			grayscale:              1,
			render_background_left: 1,
			render_sprites_left:    1,
			render_background:      1,
			render_sprites:         1,
			enhance_red:            1,
			enhance_green:          1,
			enhance_blue:           1,
			/*
			reg: () => {
				return 0x00000000
					| (this.status.grayscale << 1) | (this.status.render_background_left << 2)
					| (this.status.render_sprites_left << 3) | (this.status.render_background << 4)
					| (this.status.render_sprites << 5) | (this.status.enhance_red << 6)
					| (this.status.enhance_green << 7) | (this.status.enhance_blue << 8);
			}*/
		});

		this.control = new Struct({
			nametable_x:        1,
			nametable_y:        1,
			increment_mode:     1,
			pattern_sprite:     1,
			pattern_background: 1,
			sprite_size:        1,
			slave_mode:         1, // unused
			enable_nmi:         1,/*
			reg: () => {
				return 0x00000000
					| (this.status.nametable_x << 1) | (this.status.nametable_y << 2)
					| (this.status.increment_mode << 3) | (this.status.pattern_sprite << 4)
					| (this.status.pattern_background << 5) | (this.status.sprite_size << 6)
					| (this.status.slave_mode << 7) | (this.status.enable_nmi << 8);
			}*/
		});

		this.vram_addr = new Struct({
			coarse_x:    5,
			coarse_y:    5,
			nametable_x: 1,
			nametable_y: 1,
			fine_y:      3,
			unused:      1,
		});
		this.tram_addr = new Struct({
			coarse_x:    5,
			coarse_y:    5,
			nametable_x: 1,
			nametable_y: 1,
			fine_y:      3,
			unused:      1
		});

		this.OAM = Array(65).fill({
			y:         null,
			id:        null,			// ID of tile from pattern memory
			attribute: null,	// Flags define how sprite should be rendered
			x:         null			// X position of sprite
		});

		// Background rendering =========================================
		this.bg_next_tile_id = 0x00;
		this.bg_next_tile_attrib = 0x00;
		this.bg_next_tile_lsb = 0x00;
		this.bg_next_tile_msb = 0x00;
		this.bg_shifter_pattern_lo = 0x0000;
		this.bg_shifter_pattern_hi = 0x0000;
		this.bg_shifter_attrib_lo = 0x0000;
		this.bg_shifter_attrib_hi = 0x0000;

		this.tblName = [Array(4096).fill(0x00), Array(4096).fill(0x00)];
		this.tblPattern = [Array(4096).fill(0x00), Array(4096).fill(0x00)];
		this.tblPalette = [];

		let palScreen = [];
		this.sprScreen = new Sprite(256, 440);
		this.sprNameTable = [new Sprite(256, 240), new Sprite(256, 240)];
		this.sprPatternTable = [new Sprite(128, 128), new Sprite(128, 128)];

		palScreen[0x00] = new Pixel(84, 84, 84);
		palScreen[0x01] = new Pixel(0, 30, 116);
		palScreen[0x02] = new Pixel(8, 16, 144);
		palScreen[0x03] = new Pixel(48, 0, 136);
		palScreen[0x04] = new Pixel(68, 0, 100);
		palScreen[0x05] = new Pixel(92, 0, 48);
		palScreen[0x06] = new Pixel(84, 4, 0);
		palScreen[0x07] = new Pixel(60, 24, 0);
		palScreen[0x08] = new Pixel(32, 42, 0);
		palScreen[0x09] = new Pixel(8, 58, 0);
		palScreen[0x0A] = new Pixel(0, 64, 0);
		palScreen[0x0B] = new Pixel(0, 60, 0);
		palScreen[0x0C] = new Pixel(0, 50, 60);
		palScreen[0x0D] = new Pixel(0, 0, 0);
		palScreen[0x0E] = new Pixel(0, 0, 0);
		palScreen[0x0F] = new Pixel(0, 0, 0);

		palScreen[0x10] = new Pixel(152, 150, 152);
		palScreen[0x11] = new Pixel(8, 76, 196);
		palScreen[0x12] = new Pixel(48, 50, 236);
		palScreen[0x13] = new Pixel(92, 30, 228);
		palScreen[0x14] = new Pixel(136, 20, 176);
		palScreen[0x15] = new Pixel(160, 20, 100);
		palScreen[0x16] = new Pixel(152, 34, 32);
		palScreen[0x17] = new Pixel(120, 60, 0);
		palScreen[0x18] = new Pixel(84, 90, 0);
		palScreen[0x19] = new Pixel(40, 114, 0);
		palScreen[0x1A] = new Pixel(8, 124, 0);
		palScreen[0x1B] = new Pixel(0, 118, 40);
		palScreen[0x1C] = new Pixel(0, 102, 120);
		palScreen[0x1D] = new Pixel(0, 0, 0);
		palScreen[0x1E] = new Pixel(0, 0, 0);
		palScreen[0x1F] = new Pixel(0, 0, 0);

		palScreen[0x20] = new Pixel(236, 238, 236);
		palScreen[0x21] = new Pixel(76, 154, 236);
		palScreen[0x22] = new Pixel(120, 124, 236);
		palScreen[0x23] = new Pixel(176, 98, 236);
		palScreen[0x24] = new Pixel(228, 84, 236);
		palScreen[0x25] = new Pixel(236, 88, 180);
		palScreen[0x26] = new Pixel(236, 106, 100);
		palScreen[0x27] = new Pixel(212, 136, 32);
		palScreen[0x28] = new Pixel(160, 170, 0);
		palScreen[0x29] = new Pixel(116, 196, 0);
		palScreen[0x2A] = new Pixel(76, 208, 32);
		palScreen[0x2B] = new Pixel(56, 204, 108);
		palScreen[0x2C] = new Pixel(56, 180, 204);
		palScreen[0x2D] = new Pixel(60, 60, 60);
		palScreen[0x2E] = new Pixel(0, 0, 0);
		palScreen[0x2F] = new Pixel(0, 0, 0);

		palScreen[0x30] = new Pixel(236, 238, 236);
		palScreen[0x31] = new Pixel(168, 204, 236);
		palScreen[0x32] = new Pixel(188, 188, 236);
		palScreen[0x33] = new Pixel(212, 178, 236);
		palScreen[0x34] = new Pixel(236, 174, 236);
		palScreen[0x35] = new Pixel(236, 174, 212);
		palScreen[0x36] = new Pixel(236, 180, 176);
		palScreen[0x37] = new Pixel(228, 196, 144);
		palScreen[0x38] = new Pixel(204, 210, 120);
		palScreen[0x39] = new Pixel(180, 222, 120);
		palScreen[0x3A] = new Pixel(168, 226, 144);
		palScreen[0x3B] = new Pixel(152, 226, 180);
		palScreen[0x3C] = new Pixel(160, 214, 228);
		palScreen[0x3D] = new Pixel(160, 162, 160);
		palScreen[0x3E] = new Pixel(0, 0, 0);
		palScreen[0x3F] = new Pixel(0, 0, 0);

		this.palScreen = palScreen;

		this.oam_addr = 0x00;
		this.spriteScanline = Array(8).fill({
			y:         null,
			id:        null,			// ID of tile from pattern memory
			attribute: null,	// Flags define how sprite should be rendered
			x:         null			// X position of sprite
		});
		this.sprite_count = 0;
		this.sprite_shifter_pattern_lo = [];
		this.sprite_shifter_pattern_hi = [];

		// Sprite Zero Collision Flags
		this.bSpriteZeroHitPossible = false;
		this.bSpriteZeroBeingRendered = false;

		this.frame_complete = false;

	}

	ConnectCartridge(cartridge) {
		this.cart = cartridge;
	}

	reset() {
		this.fine_x = 0x00;
		this.address_latch = 0x00;
		this.ppu_data_buffer = 0x00;
		this.scanline = 0;
		this.cycle = 0;
		this.bg_next_tile_id = 0x00;
		this.bg_next_tile_attrib = 0x00;
		this.bg_next_tile_lsb = 0x00;
		this.bg_next_tile_msb = 0x00;
		this.bg_shifter_pattern_lo = 0x0000;
		this.bg_shifter_pattern_hi = 0x0000;
		this.bg_shifter_attrib_lo = 0x0000;
		this.bg_shifter_attrib_hi = 0x0000;
		this.status.reg = 0x00;
		this.mask.reg = 0x00;
		this.control.reg = 0x00;
		this.vram_addr.reg = 0x0000;
		this.tram_addr.reg = 0x0000;
	}

	set oam_addr(value) {
		this._oam_addr = value & 0xFF;
	}

	get oam_addr() {
		return this._oam_addr;
	}

	set bg_next_tile_id(value) {
		this._bg_next_tile_id = value & 0xFF;
	}

	get bg_next_tile_id() {
		return this._bg_next_tile_id;
	}

	set bg_next_tile_attrib(value) {
		this._bg_next_tile_attrib = value & 0xFF;
	}

	get bg_next_tile_attrib() {
		return this._bg_next_tile_attrib;
	}

	set bg_next_tile_lsb(value) {
		this._bg_next_tile_lsb = value & 0xFF;
	}

	get bg_next_tile_lsb() {
		return this._bg_next_tile_lsb;
	}

	set bg_next_tile_msb(value) {
		this._bg_next_tile_msb = value & 0xFF;
	}

	get bg_next_tile_msb() {
		return this._bg_next_tile_msb;
	}

	set fine_x(value) {
		this._fine_x = value & 0xFF;
	}

	get fine_x() {
		return this._fine_x;
	}

	ConnectBus(bus) {
		this.bus = bus;
	}

	GetScreen() {
		// Simply returns the current sprite holding the rendered screen
		return this.sprScreen;
	}

	GetPatternTable(i, palette) {
		// This function draw the CHR ROM for a given pattern table into
		// an olc::Sprite, using a specified palette. Pattern tables consist
		// of 16x16 "tiles or characters". It is independent of the running
		// emulation and using it does not change the systems state, though
		// it gets all the data it needs from the live system. Consequently,
		// if the game has not yet established palettes or mapped to relevant
		// CHR ROM banks, the sprite may look empty. This approach permits a
		// "live" extraction of the pattern table exactly how the NES, and
		// ultimately the player would see it.

		// A tile consists of 8x8 pixels. On the NES, pixels are 2 bits, which
		// gives an index into 4 different colours of a specific palette. There
		// are 8 palettes to choose from. Colour "0" in each palette is effectively
		// considered transparent, as those locations in memory "mirror" the global
		// background colour being used. This mechanics of this are shown in
		// detail in ppuRead() & ppuWrite()

		// Characters on NES
		// ~~~~~~~~~~~~~~~~~
		// The NES stores characters using 2-bit pixels. These are not stored sequentially
		// but in singular bit planes. For example:
		//
		// 2-Bit Pixels       LSB Bit Plane     MSB Bit Plane
		// 0 0 0 0 0 0 0 0	  0 0 0 0 0 0 0 0   0 0 0 0 0 0 0 0
		// 0 1 1 0 0 1 1 0	  0 1 1 0 0 1 1 0   0 0 0 0 0 0 0 0
		// 0 1 2 0 0 2 1 0	  0 1 1 0 0 1 1 0   0 0 1 0 0 1 0 0
		// 0 0 0 0 0 0 0 0 =  0 0 0 0 0 0 0 0 + 0 0 0 0 0 0 0 0
		// 0 1 1 0 0 1 1 0	  0 1 1 0 0 1 1 0   0 0 0 0 0 0 0 0
		// 0 0 1 1 1 1 0 0	  0 0 1 1 1 1 0 0   0 0 0 0 0 0 0 0
		// 0 0 0 2 2 0 0 0	  0 0 0 1 1 0 0 0   0 0 0 1 1 0 0 0
		// 0 0 0 0 0 0 0 0	  0 0 0 0 0 0 0 0   0 0 0 0 0 0 0 0
		//
		// The planes are stored as 8 bytes of LSB, followed by 8 bytes of MSB

		// Loop through all 16x16 tiles
		for (let nTileY = 0; nTileY < 16; nTileY++) {
			for (let nTileX = 0; nTileX < 16; nTileX++) {
				// Convert the 2D tile coordinate into a 1D offset into the pattern
				// table memory.
				let nOffset = nTileY * 256 + nTileX * 16;

				// Now loop through 8 rows of 8 pixels
				for (let row = 0; row < 8; row++) {
					// For each row, we need to read both bit planes of the character
					// in order to extract the least significant and most significant
					// bits of the 2 bit pixel value. in the CHR ROM, each character
					// is stored as 64 bits of lsb, followed by 64 bits of msb. This
					// conveniently means that two corresponding rows are always 8
					// bytes apart in memory.
					let tile_lsb = this.ppuRead(i * 0x1000 + nOffset + row + 0x0000);
					let tile_msb = this.ppuRead(i * 0x1000 + nOffset + row + 0x0008);


					// Now we have a single row of the two bit planes for the character
					// we need to iterate through the 8-bit words, combining them to give
					// us the final pixel index
					for (let col = 0; col < 8; col++) {
						// We can get the index value by simply adding the bits together
						// but we're only interested in the lsb of the row words because...
						let pixel = (tile_lsb & 0x01) + (tile_msb & 0x01);

						// ...we will shift the row words 1 bit right for each column of
						// the character.
						tile_lsb >>= 1;
						tile_msb >>= 1;

						// Now we know the location and NES pixel value for a specific location
						// in the pattern table, we can translate that to a screen colour, and an
						// (x,y) location in the sprite
						this.sprPatternTable[i].SetPixel
						(
							nTileX * 8 + (7 - col), // Because we are using the lsb of the row word first
							// we are effectively reading the row from right
							// to left, so we need to draw the row "backwards"
							nTileY * 8 + row,
							this.GetColourFromPaletteRam(palette, pixel)
						);
					}
				}
			}
		}

// Finally return the updated sprite representing the pattern table
		return this.sprPatternTable[i];
	}


	GetColourFromPaletteRam(palette, pixel) {
		// This is a convenience function that takes a specified palette and pixel
		// index and returns the appropriate screen colour.
		// "0x3F00"       - Offset into PPU addressable range where palettes are stored
		// "palette << 2" - Each palette is 4 bytes in size
		// "pixel"        - Each pixel index is either 0, 1, 2 or 3
		// "& 0x3F"       - Stops us reading beyond the bounds of the palScreen array
		return this.palScreen[this.ppuRead(0x3F00 + (palette << 2) + pixel) & 0x3F];

		// Note: We dont access tblPalette directly here, instead we know that ppuRead()
		// will map the address onto the seperate small RAM attached to the PPU bus.
	}

	GetNameTable(i) {
		// As of now unused, but a placeholder for nametable visualisation in teh future
		return this.sprNameTable[i];
	}


	cpuRead(addr, rdonly) {
		let data = 0x00;

		if (rdonly) {
			// Reading from PPU registers can affect their contents
			// so this read only option is used for examining the
			// state of the PPU without changing its state. This is
			// really only used in debug mode.
			switch (addr) {
				case 0x0000: // Control
					data = this.control.reg;
					break;
				case 0x0001: // Mask
					data = this.mask.reg;
					break;
				case 0x0002: // Status
					data = this.status.reg;
					break;
				case 0x0003: // OAM Address
					break;
				case 0x0004: // OAM Data
					break;
				case 0x0005: // Scroll
					break;
				case 0x0006: // PPU Address
					break;
				case 0x0007: // PPU Data
					break;
			}
		} else {
			// These are the live PPU registers that repsond
			// to being read from in various ways. Note that not
			// all the registers are capable of being read from
			// so they just return 0x00
			switch (addr) {
				// Control - Not readable
				case 0x0000:
					break;

				// Mask - Not Readable
				case 0x0001:
					break;

				// Status
				case 0x0002:
					// Reading from the status register has the effect of resetting
					// different parts of the circuit. Only the top three bits
					// contain status information, however it is possible that
					// some "noise" gets picked up on the bottom 5 bits which
					// represent the last PPU bus transaction. Some games "may"
					// use this noise as valid data (even though they probably
					// shouldn't)
					data = (this.status.reg & 0xE0) | (this.ppu_data_buffer & 0x1F);

					// Clear the vertical blanking flag
					this.status.vertical_blank = 0;

					// Reset Loopy's Address latch flag
					this.address_latch = 0;
					break;

				// OAM Address
				case 0x0003:
					break;

				// OAM Data
				case 0x0004:
					break;

				// Scroll - Not Readable
				case 0x0005:
					break;

				// PPU Address - Not Readable
				case 0x0006:
					break;

				// PPU Data
				case 0x0007:
					// Reads from the NameTable ram get delayed one cycle,
					// so output buffer which contains the data from the
					// previous read request
					this.data = this.ppu_data_buffer;
					// then update the buffer for next time
					this.ppu_data_buffer = this.ppuRead(this.vram_addr.reg);
					// However, if the address was in the palette range, the
					// data is not delayed, so it returns immediately
					if (this.vram_addr.reg >= 0x3F00) data = this.ppu_data_buffer;
					// All reads from PPU data automatically increment the nametable
					// address depending upon the mode set in the control register.
					// If set to vertical mode, the increment is 32, so it skips
					// one whole nametable row; in horizontal mode it just increments
					// by 1, moving to the next column
					this.vram_addr.reg += (this.control.increment_mode ? 32 : 1);
					break;
			}
		}

		return data;
	}

	cpuWrite(addr, data) {
		switch (addr) {
			case 0x0000: // Control
				this.control.reg = data;
				this.tram_addr.nametable_x = this.control.nametable_x;
				this.tram_addr.nametable_y = this.control.nametable_y;
				break;
			case 0x0001: // Mask
				this.mask.reg = data;
				break;
			case 0x0002: // Status
				break;
			case 0x0003: // OAM Address
				break;
			case 0x0004: // OAM Data
				break;
			case 0x0005: // Scroll
				if (this.address_latch == 0)
				{
					// First write to scroll register contains X offset in pixel space
					// which we split into coarse and fine x values
					this.fine_x = data & 0x07;
					this.tram_addr.coarse_x = data >> 3;
					this.address_latch = 1;
				} else {
					// First write to scroll register contains Y offset in pixel space
					// which we split into coarse and fine Y values
					this.tram_addr.fine_y = data & 0x07;
					this.tram_addr.coarse_y = data >> 3;
					this.address_latch = 0;
				}
				break;
			case 0x0006: // PPU Address
				if (this.address_latch == 0) {
					// PPU address bus can be accessed by CPU via the ADDR and DATA
					// registers. The fisrt write to this register latches the high byte
					// of the address, the second is the low byte. Note the writes
					// are stored in the tram register...
					this.tram_addr.reg = ((data & 0x3F) << 8) | (this.tram_addr.reg & 0x00FF);
					this.address_latch = 1;
				} else {
					// ...when a whole address has been written, the internal vram address
					// buffer is updated. Writing to the PPU is unwise during rendering
					// as the PPU will maintam the vram address automatically whilst
					// rendering the scanline position.
					this.tram_addr.reg = (this.tram_addr.reg & 0xFF00) | data;
					this.vram_addr = this.tram_addr;
					this.address_latch = 0;
				}
				break;
			case 0x0007: // PPU Data
				this.ppuWrite(this.vram_addr.reg, data);
				// All writes from PPU data automatically increment the nametable
				// address depending upon the mode set in the control register.
				// If set to vertical mode, the increment is 32, so it skips
				// one whole nametable row; in horizontal mode it just increments
				// by 1, moving to the next column
				this.vram_addr.reg = this.vram_addr.reg + (this.control.increment_mode ? 32 : 1) & 0xFFFF;
				break;
		}
	}

	ppuRead(addr, rdonly) {
		let data = 0x00, temp = this.cart.ppuRead(addr, data);
		addr &= 0x3FFF;

		if (temp !== false) {
			data = temp;
		} else if (addr >= 0x0000 && addr <= 0x1FFF) {
			// If the cartridge cant map the address, have
			// a physical location ready here
			data = this.tblPattern[(addr & 0x1000) >> 12][addr & 0x0FFF];
		} else if (addr >= 0x2000 && addr <= 0x3EFF) {
			addr &= 0x0FFF;

			if (this.cart.mirror === Cartridge.VERTICAL) {
				// Vertical
				if (addr >= 0x0000 && addr <= 0x03FF)
					data = this.tblName[0][addr & 0x03FF];
				if (addr >= 0x0400 && addr <= 0x07FF)
					data = this.tblName[1][addr & 0x03FF];
				if (addr >= 0x0800 && addr <= 0x0BFF)
					data = this.tblName[0][addr & 0x03FF];
				if (addr >= 0x0C00 && addr <= 0x0FFF)
					data = this.tblName[1][addr & 0x03FF];
			} else {
				// Horizontal
				if (addr >= 0x0000 && addr <= 0x03FF)
					data = this.tblName[0][addr & 0x03FF];
				if (addr >= 0x0400 && addr <= 0x07FF)
					data = this.tblName[0][addr & 0x03FF];
				if (addr >= 0x0800 && addr <= 0x0BFF)
					data = this.tblName[1][addr & 0x03FF];
				if (addr >= 0x0C00 && addr <= 0x0FFF)
					data = this.tblName[1][addr & 0x03FF];
			}
		} else if (addr >= 0x3F00 && addr <= 0x3FFF) {
			addr &= 0x001F;
			if (addr == 0x0010) addr = 0x0000;
			if (addr == 0x0014) addr = 0x0004;
			if (addr == 0x0018) addr = 0x0008;
			if (addr == 0x001C) addr = 0x000C;
			data = this.tblPalette[addr] & (this.mask.grayscale ? 0x30 : 0x3F);
		}

		return data;
	}

	ppuWrite(addr, data) {
		addr &= 0x3FFF;

		if (this.cart.ppuWrite(addr, data)) {

		} else if (addr >= 0x0000 && addr <= 0x1FFF) {
			this.tblPattern[(addr & 0x1000) >> 12][addr & 0x0FFF] = data;
		} else if (addr >= 0x2000 && addr <= 0x3EFF) {
			addr &= 0x0FFF;
			if (this.cart.mirror === Cartridge.VERTICAL) {
				// Vertical
				if (addr >= 0x0000 && addr <= 0x03FF)
					this.tblName[0][addr & 0x03FF] = data;
				if (addr >= 0x0400 && addr <= 0x07FF)
					this.tblName[1][addr & 0x03FF] = data;
				if (addr >= 0x0800 && addr <= 0x0BFF)
					this.tblName[0][addr & 0x03FF] = data;
				if (addr >= 0x0C00 && addr <= 0x0FFF)
					this.tblName[1][addr & 0x03FF] = data;
			} else {
				// Horizontal
				if (addr >= 0x0000 && addr <= 0x03FF)
					this.tblName[0][addr & 0x03FF] = data;
				if (addr >= 0x0400 && addr <= 0x07FF)
					this.tblName[0][addr & 0x03FF] = data;
				if (addr >= 0x0800 && addr <= 0x0BFF)
					this.tblName[1][addr & 0x03FF] = data;
				if (addr >= 0x0C00 && addr <= 0x0FFF)
					this.tblName[1][addr & 0x03FF] = data;
			}
		} else if (addr >= 0x3F00 && addr <= 0x3FFF) {
			addr &= 0x001F;
			if (addr == 0x0010) addr = 0x0000;
			if (addr == 0x0014) addr = 0x0004;
			if (addr == 0x0018) addr = 0x0008;
			if (addr == 0x001C) addr = 0x000C;
			this.tblPalette[addr] = data;
		}
	}


	void

	clock() {
		// As we progress through scanlines and cycles, the PPU is effectively
		// a state machine going through the motions of fetching background
		// information and sprite information, compositing them into a pixel
		// to be output.

		// The lambda functions (functions inside functions) contain the various
		// actions to be performed depending upon the output of the state machine
		// for a given scanline/cycle combination

		// ==============================================================================
		// Increment the background tile "pointer" one tile/column horizontally
		let IncrementScrollX = () => {
			// Note: pixel perfect scrolling horizontally is handled by the
			// data shifters. Here we are operating in the spatial domain of
			// tiles, 8x8 pixel blocks.

			// Ony if rendering is enabled
			if (this.mask.render_background || this.mask.render_sprites) {
				// A single name table is 32x30 tiles. As we increment horizontally
				// we may cross into a neighbouring nametable, or wrap around to
				// a neighbouring nametable
				if (this.vram_addr.coarse_x === 31) {
					// Leaving nametable so wrap address round
					this.vram_addr.coarse_x = 0;
					// Flip target nametable bit
					this.vram_addr.nametable_x = this.vram_addr.nametable_x ? 0 : 1;
				} else {
					// Staying in current nametable, so just increment
					this.vram_addr.coarse_x++;
				}
			}
		};

		// ==============================================================================
		// Increment the background tile "pointer" one scanline vertically
		let IncrementScrollY = () => {
			// Incrementing vertically is more complicated. The visible nametable
			// is 32x30 tiles, but in memory there is enough room for 32x32 tiles.
			// The bottom two rows of tiles are in fact not tiles at all, they
			// contain the "attribute" information for the entire table. This is
			// information that describes which palettes are used for different
			// regions of the nametable.

			// In addition, the NES doesnt scroll vertically in chunks of 8 pixels
			// i.e. the height of a tile, it can perform fine scrolling by using
			// the fine_y component of the register. This means an increment in Y
			// first adjusts the fine offset, but may need to adjust the whole
			// row offset, since fine_y is a value 0 to 7, and a row is 8 pixels high

			// Ony if rendering is enabled
			if (this.mask.render_background || this.mask.render_sprites) {
				// If possible, just increment the fine y offset
				if (this.vram_addr.fine_y < 7) {
					this.vram_addr.fine_y++;
				} else {
					// If we have gone beyond the height of a row, we need to
					// increment the row, potentially wrapping into neighbouring
					// vertical nametables. Dont forget however, the bottom two rows
					// do not contain tile information. The coarse y offset is used
					// to identify which row of the nametable we want, and the fine
					// y offset is the specific "scanline"

					// Reset fine y offset
					this.vram_addr.fine_y = 0;

					// Check if we need to swap vertical nametable targets
					if (this.vram_addr.coarse_y == 29) {
						// We do, so reset coarse y offset
						this.vram_addr.coarse_y = 0;
						// And flip the target nametable bit
						this.vram_addr.nametable_y = this.vram_addr.nametable_y ? 0 : 1;
					} else if (this.vram_addr.coarse_y == 31) {
						// In case the pointer is in the attribute memory, we
						// just wrap around the current nametable
						this.vram_addr.coarse_y = 0;
					} else {
						// None of the above boundary/wrapping conditions apply
						// so just increment the coarse y offset
						this.vram_addr.coarse_y++;
					}
				}
			}
		};

		// ==============================================================================
		// Transfer the temporarily stored horizontal nametable access information
		// into the "pointer". Note that fine x scrolling is not part of the "pointer"
		// addressing mechanism
		let TransferAddressX = () => {
			// Ony if rendering is enabled
			if (this.mask.render_background || this.mask.render_sprites) {
				this.vram_addr.nametable_x = this.tram_addr.nametable_x;
				this.vram_addr.coarse_x = this.tram_addr.coarse_x;
			}
		};

		// ==============================================================================
		// Transfer the temporarily stored vertical nametable access information
		// into the "pointer". Note that fine y scrolling is part of the "pointer"
		// addressing mechanism
		let TransferAddressY = () => {
			// Ony if rendering is enabled
			if (this.mask.render_background || this.mask.render_sprites) {
				this.vram_addr.fine_y = this.tram_addr.fine_y;
				this.vram_addr.nametable_y = this.tram_addr.nametable_y;
				this.vram_addr.coarse_y = this.tram_addr.coarse_y;
			}
		};


		// ==============================================================================
		// Prime the "in-effect" background tile shifters ready for outputting next
		// 8 pixels in scanline.
		let LoadBackgroundShifters = () => {
			// Each PPU update we calculate one pixel. These shifters shift 1 bit along
			// feeding the pixel compositor with the binary information it needs. Its
			// 16 bits wide, because the top 8 bits are the current 8 pixels being drawn
			// and the bottom 8 bits are the next 8 pixels to be drawn. Naturally this means
			// the required bit is always the MSB of the shifter. However, "fine x" scrolling
			// plays a part in this too, whcih is seen later, so in fact we can choose
			// any one of the top 8 bits.
			this.bg_shifter_pattern_lo = (this.bg_shifter_pattern_lo & 0xFF00) | this.bg_next_tile_lsb;
			this.bg_shifter_pattern_hi = (this.bg_shifter_pattern_hi & 0xFF00) | this.bg_next_tile_msb;

			// Attribute bits do not change per pixel, rather they change every 8 pixels
			// but are synchronised with the pattern shifters for convenience, so here
			// we take the bottom 2 bits of the attribute word which represent which
			// palette is being used for the current 8 pixels and the next 8 pixels, and
			// "inflate" them to 8 bit words.
			this.bg_shifter_attrib_lo = (this.bg_shifter_attrib_lo & 0xFF00) | ((this.bg_next_tile_attrib & 0b01) ? 0xFF : 0x00);
			this.bg_shifter_attrib_hi = (this.bg_shifter_attrib_hi & 0xFF00) | ((this.bg_next_tile_attrib & 0b10) ? 0xFF : 0x00);
		};


		// ==============================================================================
		// Every cycle the shifters storing pattern and attribute information shift
		// their contents by 1 bit. This is because every cycle, the output progresses
		// by 1 pixel. This means relatively, the state of the shifter is in sync
		// with the pixels being drawn for that 8 pixel section of the scanline.
		let UpdateShifters = () => {
			if (this.mask.render_background) {
				// Shifting background tile pattern row
				this.bg_shifter_pattern_lo <<= 1;
				this.bg_shifter_pattern_hi <<= 1;

				// Shifting palette attributes by 1
				this.bg_shifter_attrib_lo <<= 1;
				this.bg_shifter_attrib_hi <<= 1;
			}
		};

		// All but 1 of the secanlines is visible to the user. The pre-render scanline
		// at -1, is used to configure the "shifters" for the first visible scanline, 0.
		if (this.scanline >= -1 && this.scanline < 240) {
			if (this.scanline == 0 && this.cycle == 0) {
				// "Odd Frame" cycle skip
				this.cycle = 1;
			}

			if (this.scanline == -1 && this.cycle == 1) {
				// Effectively start of new frame, so clear vertical blank flag
				this.status.vertical_blank = 0;
			}


			if ((this.cycle >= 2 && this.cycle < 258) || (this.cycle >= 321 && this.cycle < 338)) {
				UpdateShifters();


				// In these cycles we are collecting and working with visible data
				// The "shifters" have been preloaded by the end of the previous
				// scanline with the data for the start of this scanline. Once we
				// leave the visible region, we go dormant until the shifters are
				// preloaded for the next scanline.

				// Fortunately, for background rendering, we go through a fairly
				// repeatable sequence of events, every 2 clock cycles.
				switch ((this.cycle - 1) % 8) {
					case 0:
						// Load the current background tile pattern and attributes into the "shifter"
						LoadBackgroundShifters();

						// Fetch the next background tile ID
						// "(vram_addr.reg & 0x0FFF)" : Mask to 12 bits that are relevant
						// "| 0x2000"                 : Offset into nametable space on PPU address bus
						this.bg_next_tile_id = this.ppuRead(0x2000 | (this.vram_addr.reg & 0x0FFF));

						// Explanation:
						// The bottom 12 bits of the loopy register provide an index into
						// the 4 nametables, regardless of nametable mirroring configuration.
						// nametable_y(1) nametable_x(1) coarse_y(5) coarse_x(5)
						//
						// Consider a single nametable is a 32x32 array, and we have four of them
						//   0                1
						// 0 +----------------+----------------+
						//   |                |                |
						//   |                |                |
						//   |    (32x32)     |    (32x32)     |
						//   |                |                |
						//   |                |                |
						// 1 +----------------+----------------+
						//   |                |                |
						//   |                |                |
						//   |    (32x32)     |    (32x32)     |
						//   |                |                |
						//   |                |                |
						//   +----------------+----------------+
						//
						// This means there are 4096 potential locations in this array, which
						// just so happens to be 2^12!
						break;
					case 2:
						// Fetch the next background tile attribute. OK, so this one is a bit
						// more involved :P

						// Recall that each nametable has two rows of cells that are not tile
						// information, instead they represent the attribute information that
						// indicates which palettes are applied to which area on the screen.
						// Importantly (and frustratingly) there is not a 1 to 1 correspondance
						// between background tile and palette. Two rows of tile data holds
						// 64 attributes. Therfore we can assume that the attributes affect
						// 8x8 zones on the screen for that nametable. Given a working resolution
						// of 256x240, we can further assume that each zone is 32x32 pixels
						// in screen space, or 4x4 tiles. Four system palettes are allocated
						// to background rendering, so a palette can be specified using just
						// 2 bits. The attribute byte therefore can specify 4 distinct palettes.
						// Therefore we can even further assume that a single palette is
						// applied to a 2x2 tile combination of the 4x4 tile zone. The very fact
						// that background tiles "share" a palette locally is the reason why
						// in some games you see distortion in the colours at screen edges.

						// As before when choosing the tile ID, we can use the bottom 12 bits of
						// the loopy register, but we need to make the implementation "coarser"
						// because instead of a specific tile, we want the attribute byte for a
						// group of 4x4 tiles, or in other words, we divide our 32x32 address
						// by 4 to give us an equivalent 8x8 address, and we offset this address
						// into the attribute section of the target nametable.

						// Reconstruct the 12 bit loopy address into an offset into the
						// attribute memory

						// "(vram_addr.coarse_x >> 2)"        : integer divide coarse x by 4,
						//                                      from 5 bits to 3 bits
						// "((vram_addr.coarse_y >> 2) << 3)" : integer divide coarse y by 4,
						//                                      from 5 bits to 3 bits,
						//                                      shift to make room for coarse x

						// Result so far: YX00 00yy yxxx

						// All attribute memory begins at 0x03C0 within a nametable, so OR with
						// result to select target nametable, and attribute byte offset. Finally
						// OR with 0x2000 to offset into nametable address space on PPU bus.
						this.bg_next_tile_attrib = this.ppuRead(0x23C0 | (this.vram_addr.nametable_y << 11)
							| (this.vram_addr.nametable_x << 10)
							| ((this.vram_addr.coarse_y >> 2) << 3)
							| (this.vram_addr.coarse_x >> 2));

						// Right we've read the correct attribute byte for a specified address,
						// but the byte itself is broken down further into the 2x2 tile groups
						// in the 4x4 attribute zone.

						// The attribute byte is assembled thus: BR(76) BL(54) TR(32) TL(10)
						//
						// +----+----+			    +----+----+
						// | TL | TR |			    | ID | ID |
						// +----+----+ where TL =   +----+----+
						// | BL | BR |			    | ID | ID |
						// +----+----+			    +----+----+
						//
						// Since we know we can access a tile directly from the 12 bit address, we
						// can analyse the bottom bits of the coarse coordinates to provide us with
						// the correct offset into the 8-bit word, to yield the 2 bits we are
						// actually interested in which specifies the palette for the 2x2 group of
						// tiles. We know if "coarse y % 4" < 2 we are in the top half else bottom half.
						// Likewise if "coarse x % 4" < 2 we are in the left half else right half.
						// Ultimately we want the bottom two bits of our attribute word to be the
						// palette selected. So shift as required...
						//if (vram_addr.coarse_y & 0x02) bg_next_tile_attrib >>= 4;
						//if (vram_addr.coarse_x & 0x02) bg_next_tile_attrib >>= 2;
						if (this.vram_addr.coarse_y % 4 < 2) this.bg_next_tile_attrib >>= 4;

						if (this.vram_addr.coarse_x % 4 < 2) this.bg_next_tile_attrib >>= 2;
						this.bg_next_tile_attrib &= 0x03;
						break;

					// Compared to the last two, the next two are the easy ones... :P

					case 4:
						// Fetch the next background tile LSB bit plane from the pattern memory
						// The Tile ID has been read from the nametable. We will use this id to
						// index into the pattern memory to find the correct sprite (assuming
						// the sprites lie on 8x8 pixel boundaries in that memory, which they do
						// even though 8x16 sprites exist, as background tiles are always 8x8).
						//
						// Since the sprites are effectively 1 bit deep, but 8 pixels wide, we
						// can represent a whole sprite row as a single byte, so offsetting
						// into the pattern memory is easy. In total there is 8KB so we need a
						// 13 bit address.

						// "(control.pattern_background << 12)"  : the pattern memory selector
						//                                         from control register, either 0K
						//                                         or 4K offset
						// "((uint16_t)bg_next_tile_id << 4)"    : the tile id multiplied by 16, as
						//                                         2 lots of 8 rows of 8 bit pixels
						// "(vram_addr.fine_y)"                  : Offset into which row based on
						//                                         vertical scroll offset
						// "+ 0"                                 : Mental clarity for plane offset
						// Note: No PPU address bus offset required as it starts at 0x0000
						this.bg_next_tile_lsb = this.ppuRead((this.control.pattern_background << 12)
							+ (this.bg_next_tile_id << 4 & 0xFFFF)
							+ (this.vram_addr.fine_y) + 0);

						break;
					case 6:
						// Fetch the next background tile MSB bit plane from the pattern memory
						// This is the same as above, but has a +8 offset to select the next bit plane
						this.bg_next_tile_msb = this.ppuRead((this.control.pattern_background << 12)
							+ (this.bg_next_tile_id << 4 & 0xFFFF)
							+ (this.vram_addr.fine_y) + 8);
						break;
					case 7:
						// Increment the background tile "pointer" to the next tile horizontally
						// in the nametable memory. Note this may cross nametable boundaries which
						// is a little complex, but essential to implement scrolling
						IncrementScrollX();
						break;
				}
			}

			// End of a visible scanline, so increment downwards...
			if (this.cycle == 256) {
				IncrementScrollY();
			}

			//...and reset the x position
			if (this.cycle == 257) {
				LoadBackgroundShifters();
				TransferAddressX();
			}

			// Superfluous reads of tile id at end of scanline
			if (this.cycle == 338 || this.cycle == 340) {
				this.bg_next_tile_id = this.ppuRead(0x2000 | (this.vram_addr.reg & 0x0FFF));
			}

			if (this.scanline == -1 && this.cycle >= 280 && this.cycle < 305) {
				// End of vertical blank period so reset the Y address ready for rendering
				TransferAddressY();
			}
		}

		if (this.scanline == 240) {
			// Post Render Scanline - Do Nothing!
		}

		if (this.scanline >= 241 && this.scanline < 261) {
			if (this.scanline == 241 && this.cycle == 1) {
				// Effectively end of frame, so set vertical blank flag
				this.status.vertical_blank = 1;

				// If the control register tells us to emit a NMI when
				// entering vertical blanking period, do it! The CPU
				// will be informed that rendering is complete so it can
				// perform operations with the PPU knowing it wont
				// produce visible artefacts
				if (this.control.enable_nmi)
					this.nmi = true;
			}
		}


		// Composition - We now have background pixel information for this cycle
		// At this point we are only interested in background

		let bg_pixel = 0x00;   // The 2-bit pixel to be rendered
		let bg_palette = 0x00; // The 3-bit index of the palette the pixel indexes

		// We only render backgrounds if the PPU is enabled to do so. Note if
		// background rendering is disabled, the pixel and palette combine
		// to form 0x00. This will fall through the colour tables to yield
		// the current background colour in effect
		if (this.mask.render_background) {
			// Handle Pixel Selection by selecting the relevant bit
			// depending upon fine x scolling. This has the effect of
			// offsetting ALL background rendering by a set number
			// of pixels, permitting smooth scrolling
			let bit_mux = 0x8000 >> this.fine_x;

			// Select Plane pixels by extracting from the shifter
			// at the required location.
			let p0_pixel = (this.bg_shifter_pattern_lo & bit_mux) > 0;
			let p1_pixel = (this.bg_shifter_pattern_hi & bit_mux) > 0;

			// Combine to form pixel index
			bg_pixel = (p1_pixel << 1) | p0_pixel;

			// Get palette
			let bg_pal0 = (this.bg_shifter_attrib_lo & bit_mux) > 0;
			let bg_pal1 = (this.bg_shifter_attrib_hi & bit_mux) > 0;
			bg_palette = (bg_pal1 << 1) | bg_pal0;
		}


		// Now we have a final pixel colour, and a palette for this cycle
		// of the current scanline. Let's at long last, draw that ^&%*er :P

		this.sprScreen.SetPixel(this.cycle - 1, this.scanline, this.GetColourFromPaletteRam(bg_palette, bg_pixel));

		// Fake some noise for now
		//sprScreen.SetPixel(cycle - 1, scanline, palScreen[(rand() % 2) ? 0x3F : 0x30]);

		// Advance renderer - it never stops, it's relentless
		this.cycle++;
		if (this.cycle >= 341) {
			this.cycle = 0;
			this.scanline++;
			if (this.scanline >= 261) {
				this.scanline = -1;
				this.frame_complete = true;
			}
		}
	}


}
