export interface AbstractCreateArgs {
    name: string,
    namespace: string,
    labels?: { [key: string]: string; },
}