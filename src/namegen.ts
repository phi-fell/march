var fs = require('fs');

var probs = {};

function randomChar(char) {
    var rand = Math.random();
    var sum = 0;
    for (var i = 0; i < 26; i++) {
        var letter = String.fromCharCode(97 + i);
        sum += probs[char][letter];
        if (rand < sum) {
            return letter;
        }
    }
    return 'end';
};

function normalizeProbs() {
    for (var i = -1; i < 26; i++) {
        var letter1 = '';
        if (i == -1) {
            letter1 = 'start';
        } else {
            letter1 = String.fromCharCode(97 + i);
        }
        var sum = 0.0;
        for (var j = 0; j < 27; j++) {
            var letter2 = '';
            if (j == 26) {
                letter2 = 'end';
            } else {
                letter2 = String.fromCharCode(97 + j);
            }
            sum += probs[letter1][letter2];
        }
        for (var j = 0; j < 27; j++) {
            var letter2 = '';
            if (j == 26) {
                letter2 = 'end';
            } else {
                letter2 = String.fromCharCode(97 + j);

                probs[letter1][letter2] /= sum;
            }
        }
    };
}

function generateProbabilities() {
    var names = ('' + fs.readFileSync("res/" + 'words.txt')).toLowerCase().split('\n');
    console.log('names loaded');
    probs['start'] = {};
    for (var i = 0; i < 26; i++) {
        var letter1 = String.fromCharCode(97 + i);
        probs['start'][letter1] = 0;
        probs[letter1] = {};
        for (var j = 0; j < 26; j++) {
            var letter2 = String.fromCharCode(97 + j);
            probs[letter1][letter2] = 0;
        }
        probs[letter1]['end'] = 0;
    }
    probs['start']['end'] = 0;
    console.log('probs setup');
    for (const n of names) {
        var name = n.trim();
        probs['start'][name.charAt(0)]++;
        for (var i = 0; i < name.length; i++) {
            if (i + 1 == name.length) {
                probs[name.charAt(i)]['end']++;
            } else {
                probs[name.charAt(i)][name.charAt(i + 1)]++;
            }
        }
    }
    console.log('names processed');
    normalizeProbs();
    console.log('probs normalized');
}

generateProbabilities();

module.exports.generateName = function () {
    var name = "";
    while (name.length < 4 || name.length > 12) {
        name = "";
        var next = randomChar('start');
        while (next != 'end') {
            name += next;
            next = randomChar(next);
        }
    }
    return name;
}