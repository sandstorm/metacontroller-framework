export function generateUriPathForKey(key: string) {
    return key.toLowerCase().replace(/[^a-z0-9-_]/g, '_');
}