import { SyncHookRequest, SyncHookResponse } from "./metacontroller";

export interface OperatorDefinition {
    /**
     * The fully-qualified service definition name; in the form of "nodejs-package/crd"
     */
    key: string;
    sync: (request: SyncHookRequest<any>) => Promise<SyncHookResponse>
}