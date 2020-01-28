import bcrypt = require('bcrypt');
import { promises as fs } from 'fs';

import { Random } from '../math/random';

function generateNewUserPassword() {
    return Random.uuid();
}

function generateFreshAuthToken() {
    return Random.uuid();
}

export async function createUserAndGetPass(id: string) {
    const pass = generateNewUserPassword();
    await setUserPass(id, pass);
    return pass;
}

async function setUserPasswordHash(id: string, hash: string) {
    try {
        await fs.writeFile('users/' + id + '.hash', hash);
    } catch (err) {
        console.log(err);
    }
}

export async function setUserPass(id: string, pass: string) {
    try {
        const hash = await bcrypt.hash(pass, 10);
        await setUserPasswordHash(id, hash);
    } catch (err) {
        console.log(err);
    }
}

export async function setUserIdByName(id: string, name: string) {
    try {
        await fs.writeFile('users/' + name.toLowerCase() + '.id', id + '\n' + name);
    } catch (err) {
        console.log(err);
        throw err;
    }
}

export async function getUserIdFromName(name: string): Promise<string> {
    try {
        const data = await fs.readFile('users/' + name.toLowerCase() + '.id');
        const lines = (data + '').split('\n');
        if (name === lines[1]) {
            return lines[0];
        }
        throw new Error('User does not case-sensitively exist (or the .id file is corrupt)');
    } catch (err) {
        console.log(err);
        throw err;
    }
}

export async function getIfUsernameExists(name: string): Promise<boolean> {
    try {
        const data = await fs.readFile('users/' + name.toLowerCase() + '.id');
        const lines = (data + '').split('\n');
        if (name === lines[1]) {
            return true;
        }
        // for now we don't allow usernames that only differ by case
        // (note the toLowerCase() used on file saving/loading)
        // console.log('User does not case-sensitively exist (or the .id file is corrupt)');
        return false;
    } catch (err) {
        return false;
    }
}

export async function generateAndGetFreshAuthTokenForId(id: string): Promise<string> {
    const token = generateFreshAuthToken();
    try {
        const hash = await bcrypt.hash(token, 10);
        await fs.writeFile('users/' + id + '.auth', hash + '\n' + Date.now());
        return token;
    } catch (err) {
        console.log(err);
        throw err;
    }
}

export async function validateUserByIdAndPass(id: string, pass: string): Promise<boolean> {
    try {
        const data = await fs.readFile('users/' + id + '.hash');
        return bcrypt.compare(pass, data + '');
    } catch (rr) {
        return false;
    }
}

export async function validateUserByIdAndAuthToken(id: string, token: string): Promise<boolean> {
    try {
        const data = await fs.readFile('users/' + id + '.auth');
        const sd = ('' + data).split('\n');
        const hash = sd[0];
        const date = sd[1];
        if (Date.now() - Number(date) > 1000 * 60 * 60 * 24 * 3) {
            return false; // Invalidate after 3 days
        }
        return bcrypt.compare(token, hash);
    } catch (err) {
        return false;
    }
}
