import { RecursivePartial } from "../../types/util";
import * as k8s from '@kubernetes/client-node';
import { AbstractCreateArgs } from "./abstract";
import { KubernetesObjectWithOptionalSpec } from "../../types/kubernetes";

export interface CreateDeploymentArgs extends AbstractCreateArgs {
    spec: RecursivePartial<k8s.V1DeploymentSpec>
}
export function createDeployment(args: CreateDeploymentArgs): KubernetesObjectWithOptionalSpec<k8s.V1DeploymentSpec> {
    return {
        apiVersion: "v1",
        kind: "Deployment",
        metadata: {
            name: args.name,
            namespace: args.namespace,
            labels: args.labels
        },
        spec: args.spec
    }
}


export interface CreateSingleContainerSinglePortDeploymentArgs extends AbstractCreateArgs {

    /**
     * Docker image to use
     */
    containerImage: string,

    /**
     * Name of the container. If nothing specified, "app" is used.
     */
    containerName?: string,

    /**
     * Port of the container to expose. By default, Port 80 is exposed.
     */
    containerPort?: number,
}

/**
 * Create a Deployment with just a single Pod/Container inside, exposing just a single port.
 *
 * - the labels of the Deployment are used as well for the ReplicaSet
 * - if no `containerName` is specified, `app` is used.
 * - if no `containerPort` is is specified, port `80` is exposed.
 */
export function createSingleContainerSinglePortDeployment(args: CreateSingleContainerSinglePortDeploymentArgs): KubernetesObjectWithOptionalSpec<k8s.V1DeploymentSpec> {
    return createDeployment({
        ...args,
        spec: {
            template: {
                metadata: {
                    labels: args.labels
                },
                spec: {
                    containers: [
                        {
                            name: args.containerName || 'app',
                            image: args.containerImage,
                            ports: [{
                                containerPort: args.containerPort || 80
                            }]
                        }
                    ]
                }
            },
        }
    });
}
