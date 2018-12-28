import {KubernetesObject} from './kubernetes';
import { V1Pod, V1PodSpec, V1DeploymentSpec, V1ServiceSpec } from '@kubernetes/client-node';
import { RecursivePartial } from './util';
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
    children: RecursivePartial<SyncHookRequestChildren>;

    finalizing: boolean;
}

interface SyncHookRequestChildren {
    "Pod.v1": SyncHookRequestChildrenList<V1PodSpec>;
    "Deployment.v1": SyncHookRequestChildrenList<V1DeploymentSpec>;
    "Service.v1": SyncHookRequestChildrenList<V1ServiceSpec>;

    // other types we do not know yet
    [key: string]: SyncHookRequestChildrenList<any>
}

interface SyncHookRequestChildrenList<SpecType> {
    [resourceName: string]: KubernetesObject<SpecType>
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