import * as k8s from '@kubernetes/client-node';
import * as path from 'path';
import * as fs from 'fs';
import express from 'express';
import { generateUriPathForKey } from './util';
import { SyncHookRequest, SyncHookResponse } from './types/metacontroller';
import { KubernetesObjectWithOptionalSpec, KubernetesObject } from './types/kubernetes';
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
                const uriPath = `/${generateUriPathForKey(operatorDefinition.key)}/sync`;
                console.log(`Registering URI path ${uriPath}`);
                app.post(uriPath, (req, res) => {
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

        generateKubernetesResources(targetDirectory) {
            if (!fs.existsSync(targetDirectory)) {
                fs.mkdirSync(targetDirectory, {recursive: true});
            }
            let template = fs.readFileSync(path.resolve(__dirname, '../deployment/_metacontroller-framework.yaml'), 'utf-8');
            template = template.replace('CONTAINER_IMAGE_PLACEHOLDER', args.metacontrollerFrameworkDockerImage);
            fs.writeFileSync(path.resolve(targetDirectory, '_metacontroller-framework.yaml'), template);

            args.operators.forEach(operatorDefinition => {
                let template = fs.readFileSync(path.resolve(process.cwd() + '/src/operator/' + operatorDefinition.key + '/crd.yaml'), 'utf-8');
                template = template.replace('SYNC_WEBHOOK_URL', 'http://metacontroller-framework/' + generateUriPathForKey(operatorDefinition.key) + '/sync');
                fs.writeFileSync(path.resolve(targetDirectory, generateUriPathForKey(operatorDefinition.key) + '.yaml'), template);
            });

            console.log(`cd ${targetDirectory}`);
            console.log('export METACONTROLLER_NAMESPACE=metacontroller');
            console.log('kubectl -n $METACONTROLLER_NAMESPACE apply -f .');
            console.log('# to trigger a redeploy, run:');
            console.log(`kubectl -n $METACONTROLLER_NAMESPACE patch deployment metacontroller-framework -p "{\"spec\":{\"template\":{\"metadata\":{\"annotations\":{\"deployment-date\":\"$(date +'%s')\"}}}}}"`)
        }
    }
}

export default metacontrollerService;
export { OperatorDefinition, k8s, SyncHookRequest, SyncHookResponse, KubernetesObjectWithOptionalSpec, KubernetesObject };