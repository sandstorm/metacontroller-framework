import { RecursivePartial } from "../../types/util";
import * as k8s from '@kubernetes/client-node';
import { AbstractCreateArgs } from "./abstract";
import { KubernetesObjectWithOptionalSpec } from "../../types/kubernetes";

interface CreateServiceArgs extends AbstractCreateArgs {
    spec: RecursivePartial<k8s.V1ServiceSpec>
}

export function createService(args: CreateServiceArgs): KubernetesObjectWithOptionalSpec<k8s.V1ServiceSpec> {
    return {
        apiVersion: "v1",
        kind: "Service",
        metadata: {
            name: args.name,
            namespace: args.namespace,
            labels: args.labels
        },
        spec: args.spec
    };
}
