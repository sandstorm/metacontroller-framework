import {KubernetesObjectWithSpec, KubernetesObject} from './kubernetes';
import { V1Pod, V1PodSpec, V1DeploymentSpec, V1ServiceSpec, V1ConfigMap, V1Secret } from '@kubernetes/client-node';
import { RecursivePartial } from './util';
/**
 * The full Sync Hook Request; with the parent spec as type
 */
export interface SyncHookRequest<PSpec> {
    /**
     * The whole CompositeController object, like what you might get from kubectl get compositecontroller <name> -o json.
     */
    controller: KubernetesObjectWithSpec<CompositeControllerSpec>;

    /**
     * The parent object, like what you might get from kubectl get <parent-resource> <parent-name> -o json.
     */
    parent: KubernetesObjectWithSpec<PSpec>;

    /**
     * An associative array of child objects that already exist.
     */
    children: Partial<SyncHookRequestChildren>;

    finalizing: boolean;
}

interface SyncHookRequestChildren {
    "Pod.v1": SyncHookRequestChildrenList<KubernetesObjectWithSpec<V1PodSpec>>;
    "Deployment.v1": SyncHookRequestChildrenList<KubernetesObjectWithSpec<V1DeploymentSpec>>;
    "Service.v1": SyncHookRequestChildrenList<KubernetesObjectWithSpec<V1ServiceSpec>>;
    "ConfigMap.v1": SyncHookRequestChildrenList<V1ConfigMap>;
    "Secret.v1": SyncHookRequestChildrenList<V1Secret>;

    // other types we do not know yet
    [key: string]: SyncHookRequestChildrenList<any>
}

interface SyncHookRequestChildrenList<SpecType> {
    [resourceName: string]: SpecType
}

export interface SyncHookResponse {
    status: any;
    children: KubernetesObject[];
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