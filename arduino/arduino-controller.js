// ArduinoController using Web Serial API (browser only)
class ArduinoController {
    constructor(baudRate = 9600, arduinoDevice = "disabled") {
        this.baudRate = baudRate;
        this.arduinoDevice = arduinoDevice;
        this.port = null;
        this.writer = null;
        this.reader = null;
        this.isOpen = false;
    }

    async connect() {
        if (!('serial' in navigator)) {
            console.error('❌ Web Serial API is not supported by your browser.');
            return;
        }
        let filters = [];
        // If arduinoDevice is a valid vendorId (e.g., "0x2341"), filter for Arduino
        if (this.arduinoDevice && this.arduinoDevice !== "disabled") {
            let vendorId = parseInt(this.arduinoDevice, 16);
            if (!isNaN(vendorId)) {
                filters.push({ usbVendorId: vendorId });
            }
        } else {
            // Example: filter for common Arduino vendor IDs if desired
            // filters.push({ usbVendorId: 0x2341 }); // Arduino SA
            // filters.push({ usbVendorId: 0x1A86 }); // CH340 (common clone)
        }
        try {
            this.port = await navigator.serial.requestPort(filters.length ? { filters } : {});
            await this.port.open({ baudRate: this.baudRate });
            this.writer = this.port.writable.getWriter();
            this.isOpen = true;
            console.log(`[✱ ARDUINO ✱ LOG ✱]: Arduino connected via Web Serial API with baudRate ${this.baudRate}`);  // LOGGING: Log
            this.readLoop();
        } catch (err) {
            console.error("[✱ ARDUINO ✱ ERROR ✱]: Connection error, it seems you did not select the Arduino");  // LOGGING: Error
        }
    }

    async sendSignal(message) {
        if (this.isOpen && this.writer) {
            try {
                await this.writer.write(new TextEncoder().encode(message + '\n'));
            } catch (err) {
                console.error(`[✱ ARDUINO ✱ ERROR ✱]: Signal was not sent - ${err.message}`);  // LOGGING: Error
            }
        } else {
            console.warn("[✱ ARDUINO ✱ WARNING ✱]: Port is shut, signal was not sent");  // LOGGING: Warning
        }
    }

    async readLoop() {
        if (!this.port || !this.port.readable) return;
        this.reader = this.port.readable.getReader();
        try {
            while (true) {
                const { value, done } = await this.reader.read();
                if (done) break;
                if (value) {
                    const data = new TextDecoder().decode(value);
                    console.log(`[✱ ARDUINO ✱ MESSAGE ✱]: ${data.trim()}`);  // LOGGING: Message
                }
            }
        } catch (err) {
            console.error(`[✱ ARDUINO ✱ ERROR ✱]:Reading error: ${err.message}`);  // LOGGING: Error
        } finally {
            this.reader.releaseLock();
        }
    }

    async disconnect() {
        if (this.writer) {
            await this.writer.close();
            this.writer = null;
        }
        if (this.reader) {
            await this.reader.cancel();
            this.reader = null;
        }
        if (this.port) {
            await this.port.close();
            this.port = null;
        }
        this.isOpen = false;
        console.log("[✱ ARDUINO ✱ LOG ✱]: Arduino off");  // LOGGING: Log
    }
}

export default ArduinoController;
