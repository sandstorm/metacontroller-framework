import * as k8s from '@kubernetes/client-node';
import * as path from 'path';
import * as fs from 'fs';
import express from 'express';
import { generateUriPathForKey } from './util';
import { SyncHookRequest, SyncHookResponse } from './types/metacontroller';
import { KubernetesObjectWithOptionalSpec, KubernetesObjectWithSpec } from './types/kubernetes';
import { OperatorDefinition } from './types/api';
import { execSync } from 'child_process';
import YAML from 'yaml';
import tmp from 'tmp';
import * as operators from './operator';

interface MetacontrollerServiceArgs {
    metacontrollerFrameworkDockerImage: string,
    operators: OperatorDefinition[]
}

interface MetacontrollerService {
    generateKubernetesResources: (basePath: string) => void
    listen: (port: number) => void,
    validateKubernetesResources: (singleOperatorName: (string|boolean)) => void
}

function operatorBasePath(operatorDefinition: OperatorDefinition): string {
    if (operatorDefinition.key.indexOf('/') !== -1) {
        const [packageKey, operatorName] = operatorDefinition.key.split('/');
        // the key contains a slash, so we have a sub package.
        return path.resolve(require.resolve(packageKey, {paths: [process.cwd()]}), 'src/operator', operatorDefinition.key) + '/';
    } else {
        return path.resolve(process.cwd(), 'src/operator', operatorDefinition.key) + '/';
    }
}

function loadCustomResourceDefinition(operatorDefinition: OperatorDefinition): string {
    return fs.readFileSync(operatorBasePath(operatorDefinition) + 'crd.yaml', 'utf-8');
}

function loadExample(operatorDefinition: OperatorDefinition): string {
    return fs.readFileSync(operatorBasePath(operatorDefinition) + 'example.yaml', 'utf-8');
}

function loadExtraDefinitions(operatorDefinition: OperatorDefinition): string | null {
    const fileName = operatorBasePath(operatorDefinition) + 'extra.yaml';
    if (fs.existsSync(fileName)) {
        return fs.readFileSync(fileName, 'utf-8');
    }
    return null;
}

function loadControllerDefinition(operatorDefinition: OperatorDefinition): string {
    const template = fs.readFileSync(operatorBasePath(operatorDefinition) + 'controller.yaml', 'utf-8');
    return template.replace('SYNC_WEBHOOK_URL', 'http://metacontroller-framework/' + generateUriPathForKey(operatorDefinition.key) + '/sync');
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
                fs.mkdirSync(targetDirectory, { recursive: true });
            }
            let template = fs.readFileSync(path.resolve(__dirname, '../deployment/_metacontroller-framework.yaml'), 'utf-8');
            template = template.replace('CONTAINER_IMAGE_PLACEHOLDER', args.metacontrollerFrameworkDockerImage);
            fs.writeFileSync(path.resolve(targetDirectory, '_metacontroller-framework.yaml'), template);

            args.operators.forEach(operatorDefinition => {
                const crd = loadCustomResourceDefinition(operatorDefinition);
                fs.writeFileSync(path.resolve(targetDirectory, generateUriPathForKey(operatorDefinition.key) + '_crd.yaml'), crd);

                const controller = loadControllerDefinition(operatorDefinition);
                fs.writeFileSync(path.resolve(targetDirectory, generateUriPathForKey(operatorDefinition.key) + '_controller.yaml'), controller);

                const extraDefinitions = loadExtraDefinitions(operatorDefinition);
                if (extraDefinitions) {
                    fs.writeFileSync(path.resolve(targetDirectory, generateUriPathForKey(operatorDefinition.key) + '_extra.yaml'), extraDefinitions);
                }
            });

            console.log(`cd ${targetDirectory}`);
            console.log('export METACONTROLLER_NAMESPACE=metacontroller');
            console.log('kubectl -n $METACONTROLLER_NAMESPACE apply -f .');
            console.log('# to trigger a redeploy, run:');
            console.log(`kubectl -n $METACONTROLLER_NAMESPACE patch deployment metacontroller-framework -p "{\"spec\":{\"template\":{\"metadata\":{\"annotations\":{\"deployment-date\":\"$(date +'%s')\"}}}}}"`)
        },

        validateKubernetesResources(singleOperatorName) {
            // 1) Delete/Create Namespace. NOTE: for some reason, we need to do this using the Kubectl Command Line;
            //    as I was not able to wait on the deleted namespace using the Kubernetes JS client.
            execSync("kubectl delete namespace metacontroller-dev || echo 'Namespace does not exist'", { stdio: 'inherit' });
            execSync("kubectl create namespace metacontroller-dev", { stdio: 'inherit' });

            const kc = new k8s.KubeConfig();
            kc.loadFromDefault();
            const k8sApi_apiExtensions = kc.makeApiClient(k8s.Apiextensions_v1beta1Api);
            const k8sApi_customObjects = kc.makeApiClient(k8s.Custom_objectsApi);
            const d = new k8s.V1DeleteOptions();
            d.propagationPolicy = 'Foreground';
            d.gracePeriodSeconds = 0;

            let nextPromise = Promise.resolve();
            args.operators.forEach(operatorDefinition => {
                if (singleOperatorName !== true && operatorDefinition.key !== singleOperatorName) {
                    console.log(`\n\nOPERATOR ${operatorDefinition.key}\n  - skipping`);
                    return;
                }
                const crd = YAML.parse(loadCustomResourceDefinition(operatorDefinition));
                crd.metadata.name += ".dev";
                crd.spec.group += ".dev";

                nextPromise = nextPromise
                    .then(() => console.log(`\n\nOPERATOR ${operatorDefinition.key}`))
                    // 2) Delete/Create "DEV" CRDs
                    .then(() =>
                        k8sApi_apiExtensions.deleteCustomResourceDefinition(crd.metadata.name, d)
                            .catch((e) => /* the resource does not exist; so that's OK as well :-) */ true)
                    )
                    .then(() => k8sApi_apiExtensions.createCustomResourceDefinition(crd))

                    // 3) Create example for CRD. In case there is an error, the example does not fit to the schema.
                    .then(() => {
                        const example = YAML.parse(loadExample(operatorDefinition));
                        example.apiVersion = example.apiVersion.replace("/", ".dev/");
                        console.log(`  - Trying to create ${example.metadata.name}`);

                        return k8sApi_customObjects.createNamespacedCustomObject(crd.spec.group, crd.spec.versions[0].name, "metacontroller-dev", crd.spec.names.plural, example)
                            .then(() => console.log("  - successfully created example for " + crd.metadata.name))
                            .catch((e) => console.log(`  - ERROR creating example for ${crd.metadata.name}:\n\n${e.body.message}`));
                    })
                    // 4) Run the hook using the example
                    .then(() => {
                        console.log(`  - trying to run the hook`);
                        const example = YAML.parse(loadExample(operatorDefinition));
                        example.apiVersion = example.apiVersion.replace("/", ".dev/");
                        const request: SyncHookRequest<any> = {
                            controller: YAML.parse(loadControllerDefinition(operatorDefinition)),
                            parent: example,
                            children: {},
                            finalizing: false
                        };
                        return operatorDefinition.sync(request)
                            .then(response => {
                                const tmpDir = tmp.dirSync();
                                response.children.forEach((child, i) => {
                                    fs.writeFileSync(path.join(tmpDir.name, i + ".yaml"), YAML.stringify(child));
                                });
                                console.log(`  - trying to apply the results of the operator`);
                                execSync(`kubectl apply -n metacontroller-dev -f ${tmpDir.name}`, { stdio: 'inherit' });
                                console.log(`  - applied successfully`);
                            }, e => {
                                console.log(`  - ERROR running the hook: `, e);
                            }).catch(e => console.log(`  - ERROR applying the operator results:`, e.message))

                    })
                    .catch((e) => console.log(`  - UNKNOWN ERROR:\n\n`, e));
            });
            nextPromise.then(() => console.log("\n\nDONE"));
        }
    }
}

export default metacontrollerService;
export { operators, OperatorDefinition, k8s, SyncHookRequest, SyncHookResponse, KubernetesObjectWithOptionalSpec, KubernetesObjectWithSpec };

export * from './controllerApi/mainControllerApi';
export * from './controllerApi/creators/index';