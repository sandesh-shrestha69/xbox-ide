import fs from 'fs';

export function validateEmulatorPath(path) {
    return fs.existsSync(path);
}
