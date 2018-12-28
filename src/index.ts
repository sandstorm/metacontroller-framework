import * as k8s from '@kubernetes/client-node';
import express from 'express';
import { generateUriPathForKey } from './util';
import { SyncHookRequest, SyncHookResponse } from './types/metacontroller';
import { KubernetesObjectWithOptionalSpec } from './types/kubernetes';
import { OperatorDefinition } from './types/api';


function metacontrollerService(serviceDefinitions: OperatorDefinition[]) {
    const app = express();
    app.use(express.json());
    serviceDefinitions.forEach(serviceDefinition => {
        app.post(`/${generateUriPathForKey(serviceDefinition.key)}/sync`, (req, res) => {
            const request: SyncHookRequest<any> = req.body;
            serviceDefinition.sync(request).then(response =>
                res.send(response)
                , (err) => {
                    console.log("ERROR");
                    console.log(err);
                    res.send(500);
                }
            );
        });
    })
    return app;
}

export default metacontrollerService;
export { OperatorDefinition, k8s, SyncHookRequest, SyncHookResponse, KubernetesObjectWithOptionalSpec };