import { readFileSync } from 'fs';

import { Random } from './math/random';

const probs: any = {};

function randomChar(char) {
    const rand = Random.float();
    let sum = 0;
    for (let i = 0; i < 26; i++) {
        const letter = String.fromCharCode(97 + i);
        sum += probs[char][letter];
        if (rand < sum) {
            return letter;
        }
    }
    return 'end';
}

function normalizeProbs() {
    for (let i = -1; i < 26; i++) {
        let letter1 = '';
        if (i === -1) {
            letter1 = 'start';
        } else {
            letter1 = String.fromCharCode(97 + i);
        }
        let sum = 0.0;
        for (let j = 0; j < 27; j++) {
            let letter2 = '';
            if (j === 26) {
                letter2 = 'end';
            } else {
                letter2 = String.fromCharCode(97 + j);
            }
            sum += probs[letter1][letter2];
        }
        for (let j = 0; j < 27; j++) {
            let letter2 = '';
            if (j === 26) {
                letter2 = 'end';
            } else {
                letter2 = String.fromCharCode(97 + j);

                probs[letter1][letter2] /= sum;
            }
        }
    }
}

function generateProbabilities() {
    const names = ('' + readFileSync('res/' + 'words.txt')).toLowerCase().split('\n');
    probs.start = {};
    for (let i = 0; i < 26; i++) {
        const letter1 = String.fromCharCode(97 + i);
        probs.start[letter1] = 0;
        probs[letter1] = {};
        for (let j = 0; j < 26; j++) {
            const letter2 = String.fromCharCode(97 + j);
            probs[letter1][letter2] = 0;
        }
        probs[letter1].end = 0;
    }
    probs.start.end = 0;
    for (const n of names) {
        const name = n.trim();
        probs.start[name.charAt(0)]++;
        for (let i = 0; i < name.length; i++) {
            if (i + 1 === name.length) {
                probs[name.charAt(i)].end++;
            } else {
                probs[name.charAt(i)][name.charAt(i + 1)]++;
            }
        }
    }
    normalizeProbs();
}

generateProbabilities();

export function generateName() {
    let name = '';
    while (name.length < 4 || name.length > 12) {
        name = '';
        let next = randomChar('start');
        while (next !== 'end') {
            name += next;
            next = randomChar(next);
        }
    }
    return name;
}
