import { SyncHookRequest, SyncHookResponse } from "../types/metacontroller";
import { KubernetesObject } from "../types/kubernetes";

interface ControllerStatus {
    aggregated: ("OK" | "not OK"),
    children: {
        [type: string]: string
    };
}

export function determineStatus(request: SyncHookRequest<any>, expectedChildren: KubernetesObject<any>[]): ControllerStatus {
    const status: ControllerStatus = {
        aggregated: 'OK',
        children: {}
    };

    expectedChildren.forEach(expectedChild => {
        const resourcesOfType = request.children[`${expectedChild.kind}.${expectedChild.apiVersion}`];
        if (resourcesOfType && resourcesOfType[expectedChild.metadata.name]) {
            status.children[expectedChild.kind] = 'exists';
        } else {
            status.children[expectedChild.kind] = 'does not exist';
            status.aggregated = 'not OK';
        }
    });

    return status;
}

export function responseWithAutoStatus(children: KubernetesObject<any>[], request: SyncHookRequest<any>): Promise<SyncHookResponse> {
    const syncHookResponse: SyncHookResponse = {
        status: determineStatus(request, children),
        children
    };
    return Promise.resolve(syncHookResponse);
}
