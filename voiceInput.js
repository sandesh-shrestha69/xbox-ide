import { XBOX_CONTROLLER_BUTTONS } from './constants';

export class VoiceInput {
    constructor() {
        this.recognition = new webkitSpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        this.recognition.lang = 'en-US';
        this.recognition.onresult = (event) => {
            const lastResult = event.results[event.results.length - 1];
            const text = lastResult[0].transcript;
            this.processVoiceCommand(text);
        };
    }

    start() {
        this.recognition.start();
    }

    stop() {
        this.recognition.stop();
    }

    processVoiceCommand(command) {
        // Implement command processing logic here
        console.log(`Processing voice command: ${command}`);
    }
}

export const voiceInput = new VoiceInput();
