export enum ACTION_RESULT {
    ASYNC, // Performing calculations, waiting for file or network I/O, etc.
    SUCCESS, // Action performed
    INSUFFICIENT_AP, // Not enough AP
    REDUNDANT, // Action would not result in any change (e.g. equipping already equipped item, turning to face the same direction)
    FAILURE, // Action is Impossible
}
