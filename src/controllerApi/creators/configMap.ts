import { RecursivePartial } from "../../types/util";
import * as k8s from '@kubernetes/client-node';
import { AbstractCreateArgs } from "./abstract";
import { KubernetesObject } from "../../types/kubernetes";

interface CreateConfigMapArgs extends AbstractCreateArgs {
    /**
    * stringData allows specifying non-binary configMap data in string form. It is provided as a write-only convenience method. All keys and values are merged into the data field on write, overwriting any existing values. It is never output when reading from the API.
    */
    'data': {
        [key: string]: string;
    };
}

interface ConfigMap extends KubernetesObject {
    'data': {
        [key: string]: string;
    };
}

export function createConfigMap(args: CreateConfigMapArgs): ConfigMap {
    return {
        apiVersion: "v1",
        kind: "ConfigMap",
        metadata: {
            name: args.name,
            namespace: args.namespace,
            labels: args.labels
        },
        data: args.data
    };
}
