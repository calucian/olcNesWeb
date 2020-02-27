class Sequencer {
	constructor () {
		this.sequence = 0;
		this.timer = 0;
		this.reload = 0;
		this.output = 0;
	}

	clock (enable, callback) {
		if (enable) {
			this.timer = (this.timer - 1) & 0xFFFF;

			if (this.timer === 0xFFFF) {
				this.timer = this.reload + 1;
				this.sequence = callback(this.sequence);
				this.output = this.sequence & 0x1;
			}
		}

		return this.output;
	}
}

class Sound {
	constructor () {
		this.pulse1_enable = false;
		this.pulse1_sample = 0;
		this.pulse1_seq = new Sequencer();

		this.clock_counter = 0;
		this.frame_clock_counter = 0;

		this.pulse1_osc = {};
	}

	get getOutputSample () {
		return this.pulse1_sample;
	}

	cpuWrite (addr, data) {
		switch (addr) {
			case 0x4000:
				switch ((data & 0xC0) >> 6) {
					case 0x00: this.pulse1_seq.sequence = 0b00000001; this.pulse1_osc.dutycycle = 0.125; break;
					case 0x01: this.pulse1_seq.sequence = 0b00000011; this.pulse1_osc.dutycycle = 0.250; break;
					case 0x02: this.pulse1_seq.sequence = 0b00001111; this.pulse1_osc.dutycycle = 0.500; break;
					case 0x03: this.pulse1_seq.sequence = 0b11111100; this.pulse1_osc.dutycycle = 0.750; break;

				}
				break;
			case 0x4002:
				this.pulse1_seq.reload = (this.pulse1_seq.reload & 0xFF00) | data;
				break;
			case 0x4003:
				this.pulse1_seq.reload = (data & 0x07) << 8 | (this.pulse1_seq.reload & 0xFF);
				this.pulse1_seq.timer = this.pulse1_seq.reload;
				break;
			case 0x4015:
				this.pulse1_enable = data & 0x01;
				break;
		}
	}

	cpuRead (addr) {

	}

	clock () {
		let bQuarterFrameClock = false;
		let bHalfFrameClock = false;

		if (this.clock_counter % 6 === 0) {
			this.frame_clock_counter++;

			if (this.frame_clock_counter === 3729) {
				bQuarterFrameClock = true;
			}
			if (this.frame_clock_counter === 7457) {
				bQuarterFrameClock = true;
				bHalfFrameClock = true;
			}
			if (this.frame_clock_counter === 11186) {
				bQuarterFrameClock = true;
			}
			if (this.frame_clock_counter === 14916) {
				bQuarterFrameClock = true;
				bHalfFrameClock = true;
				this.frame_clock_counter = 0;
			}


			/* this.pulse1_seq.clock(this.pulse1_enable, (s) => {
				return ((s & 0x00001) << 7) | ((s & 0xFE) >> 1);
			});

			this.pulse1_sample = this.pulse1_enable ? this.pulse1_seq.output : 0; */

			if (this.pulse1_enable) {
				this.pulse1_osc.frequency = 1789773 / (16 * this.pulse1_seq.reload + 1);
			} else {
				this.pulse1_osc.frequency = 0;
			}
		}

		this.clock_counter++;
	}

	reset () {

	}
}
