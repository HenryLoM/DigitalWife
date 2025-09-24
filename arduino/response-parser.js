import ArduinoController from './arduino-controller.js';

let baudRate = parseInt(localStorage.getItem("arduino_baud") || "9600", 10);
let arduinoDevice = localStorage.getItem("arduino_device") || "disabled";
let arduinoController = null;
let isConnected = false;

/**
 * Parses AI response text and sends it as a signal to Arduino (if enabled).
 * 
 * @param {string} text - Text signal to parse and send.
 * @returns {Promise<void>}
 */
export async function parse(text) {
    if (!arduinoController) {
        arduinoController = new ArduinoController(baudRate, arduinoDevice);
    }
    if (!isConnected) {
        await arduinoController.connect();
        isConnected = arduinoController.isOpen;
    }
    /*
    | | |
    Later here must be real parsing logic
    | | |
    */
    let command = text;  // Placeholder
    await transferSignals(command);
}

/**
 * Transfers a processed command directly to the Arduino controller.
 * 
 * @param {string} command - Command to send to Arduino.
 * @returns {Promise<void>}
 */
async function transferSignals(command) {
    await arduinoController.sendSignal(command);
    console.log("[✱ ARDUINO ✱ LOG ✱]: Signal was sent to Arduino");  // LOGGING: Log
}
