import { RecursivePartial } from "../../types/util";
import * as k8s from '@kubernetes/client-node';
import { AbstractCreateArgs } from "./abstract";
import { KubernetesObject } from "../../types/kubernetes";

interface CreateSecretArgs extends AbstractCreateArgs {
    /**
    * stringData allows specifying non-binary secret data in string form. It is provided as a write-only convenience method. All keys and values are merged into the data field on write, overwriting any existing values. It is never output when reading from the API.
    */
    'stringData': {
        [key: string]: string;
    };
}

interface Secret extends KubernetesObject {
    'stringData': {
        [key: string]: string;
    };
}

export function createSecret(args: CreateSecretArgs): Secret {
    return {
        apiVersion: "v1",
        kind: "Secret",
        metadata: {
            name: args.name,
            namespace: args.namespace,
            labels: args.labels
        },
        stringData: args.stringData
    };
}
