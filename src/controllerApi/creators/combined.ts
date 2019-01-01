import { KubernetesObjectWithOptionalSpec } from "../../types/kubernetes";
import * as k8s from '@kubernetes/client-node';
import { AbstractCreateArgs } from "./abstract";
import { createSingleContainerSinglePortDeployment, CreateSingleContainerSinglePortDeploymentArgs } from "./deployment";
import { createService } from "./service";

interface CombinedSingleContainerSinglePortDeploymentAndServiceArgs extends AbstractCreateArgs, CreateSingleContainerSinglePortDeploymentArgs {

}

/**
 * Create a Deployment **and** a service with just a single Pod/Container inside, exposing just a single port.
 *
 * - the labels of the Deployment are used as well for the ReplicaSet and the service.
 * - if no `containerName` is specified, `app` is used.
 * - if no `containerPort` is is specified, port `80` is exposed.
 * - the service exposes the same port as specified in `containerPort`.
 */
export function createCombinedSingleContainerSinglePortDeploymentAndService(args: CombinedSingleContainerSinglePortDeploymentAndServiceArgs): [
    KubernetesObjectWithOptionalSpec<k8s.V1DeploymentSpec>,
    KubernetesObjectWithOptionalSpec<k8s.V1ServiceSpec>
] {
    const deployment = createSingleContainerSinglePortDeployment(args);
    const service = createService({
        ...args,
        spec: {
            selector: args.labels,
            ports: [
                {
                    port: args.containerPort || 80
                }
            ]
        }
    });

    return [
        deployment,
        service
    ];
}

