import * as k8s from '@kubernetes/client-node';
import express from 'express';
import { generateUriPathForKey } from './util';
import { SyncHookRequest, SyncHookResponse } from './types/metacontroller';
import { KubernetesObjectWithOptionalSpec } from './types/kubernetes';
import { OperatorDefinition } from './types/api';

interface MetacontrollerServiceArgs {
    metacontrollerFrameworkDockerImage: string,
    operators: OperatorDefinition[]
}

interface MetacontrollerService {
    generateKubernetesResources: (basePath: string) => void
    listen: (port: number) => void
}


function metacontrollerService(args: MetacontrollerServiceArgs): MetacontrollerService {
    return {
        listen(port) {
            const app = express();
            app.use(express.json());
            args.operators.forEach(operatorDefinition => {
                app.post(`/${generateUriPathForKey(operatorDefinition.key)}/sync`, (req, res) => {
                    const request: SyncHookRequest<any> = req.body;
                    operatorDefinition.sync(request).then(response =>
                        res.send(response)
                        , (err) => {
                            console.log("ERROR");
                            console.log(err);
                            res.send(500);
                        }
                    );
                });
            });
            app.listen(port);
            return app;
        },

        generateKubernetesResources(baseDirectory) {

        }
    }
}

export default metacontrollerService;
export { OperatorDefinition, k8s, SyncHookRequest, SyncHookResponse, KubernetesObjectWithOptionalSpec };