import {KubernetesObject} from './kubernetes';
/**
 * The full Sync Hook Request; with the parent spec as type
 */
export interface SyncHookRequest<PSpec> {
    /**
     * The whole CompositeController object, like what you might get from kubectl get compositecontroller <name> -o json.
     */
    controller: KubernetesObject<CompositeControllerSpec>;

    /**
     * The parent object, like what you might get from kubectl get <parent-resource> <parent-name> -o json.
     */
    parent: KubernetesObject<PSpec>;

    /**
     * An associative array of child objects that already exist.
     */
    children: KubernetesObject<any>[];

    finalizing: boolean;
}

export interface SyncHookResponse {
    status: any;
    children: KubernetesObject<any>[];
}

interface CompositeControllerSpec {
    parentResource: {
        apiVersion: string;
        resource: string;
    };

    childResources: {
        apiVersion: string;
        resource: string;
    }[];
    generateSelector?: boolean;
}