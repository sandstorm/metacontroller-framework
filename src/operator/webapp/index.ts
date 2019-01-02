import { OperatorDefinition } from "../../types/api";
import { SyncHookRequest, SyncHookResponse } from "../../types/metacontroller";
import { createCombinedSingleContainerSinglePortDeploymentAndService } from "../../controllerApi/creators";
import { responseWithAutoStatus } from "../../controllerApi/mainControllerApi";

interface WebappSpec {
    image: {
        name: string;
        tag?: string;
    };

    ssl?: boolean;
}


const operator: OperatorDefinition = {
    key: 'metacontroller-framework/webapp',
    sync(request: SyncHookRequest<WebappSpec>): Promise<SyncHookResponse> {
        const { name, namespace, labels } = request.parent.metadata;

        const [deployment, service] = createCombinedSingleContainerSinglePortDeploymentAndService({
            name,
            namespace,
            labels,
            containerImage: request.parent.spec.image.name, // TODO tag!!
        });

        return responseWithAutoStatus([deployment, service], request);
    }
};

export default operator;