export function getSocketDestination() {
    if (window.location.hostname === 'localhost') {
        return 'localhost';
    }
    return 'https://gotg.io';
}
