import fs from 'fs';
import path from 'path';

export function validateEmulatorPath(path) {
    return fs.existsSync(path);
}

export function openFile(filePath) {
    if (validateEmulatorPath(filePath)) {
        // Implement file opening logic here
        console.log(`Opening file: ${filePath}`);
    } else {
        console.error(`File not found: ${filePath}`);
    }
}

export function saveFile(filePath, content) {
    fs.writeFileSync(filePath, content);
    console.log(`Saved file: ${filePath}`);
}
