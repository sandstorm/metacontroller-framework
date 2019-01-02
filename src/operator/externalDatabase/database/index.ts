import {createConnection as mysqlCreateConnection} from 'mysql';
import * as mysql from './mysql';
import * as k8s from '@kubernetes/client-node';
import { KubernetesObjectWithSpec } from '../../../types/kubernetes';

interface ExternalDatabaseHostSpec {
    type: ('MySQL' | 'Postgres');
    host: string;
    port?: number;
    user: string;
    secretName: string;
}

export async function ensureDatabaseAndUserExists(databaseHostResourceName: string, expected: {user: string, password: string, databaseName: string}): Promise<[string,number]> {
    const kc = new k8s.KubeConfig();
    kc.loadFromDefault();
    const k8sApi_customObjects = kc.makeApiClient(k8s.Custom_objectsApi);
    const k8sApi_core = kc.makeApiClient(k8s.Core_v1Api);
    const controllerNamespace = process.env['METACONTROLLER_NAMESPACE'];
    if (!controllerNamespace) {
        throw "Controller namespace not specified in environment variable METACONTROLLER_NAMESPACE, aborting.";
    }
    const externalDatabaseHost = await k8sApi_customObjects.getNamespacedCustomObject('alpha.sandstorm.de', 'v1', controllerNamespace, 'externaldatabasehosts', databaseHostResourceName);
    const adminCredentialsForExternalDatabase = externalDatabaseHost.body as KubernetesObjectWithSpec<ExternalDatabaseHostSpec>;
    const secretName = adminCredentialsForExternalDatabase.spec.secretName;
    const adminSecretForExternalDatabase = await k8sApi_core.readNamespacedSecret(secretName, controllerNamespace);
    const adminPasswordForExternalDatabase = Buffer.from(adminSecretForExternalDatabase.body.data['DB_PASSWORD'], 'base64').toString('utf8');

    let port = adminCredentialsForExternalDatabase.spec.port;
    if (adminCredentialsForExternalDatabase.spec.type === 'MySQL') {
        port = port || 3306;
        const connection = mysqlCreateConnection({
            host: adminCredentialsForExternalDatabase.spec.host,
            port: port,
            user: adminCredentialsForExternalDatabase.spec.user,
            password: adminPasswordForExternalDatabase
        });

        connection.connect();
        try {

            await mysql.ensureDatabaseExists(expected.databaseName, connection);
            await mysql.ensureUserExistsAndPasswordMatches(expected.user, expected.password, connection);
            await mysql.ensureUserHasAccessToDatabase(expected.user, expected.databaseName, connection);
        } catch (e) {
            console.log("THERE WAS AN ERROR:");
            console.log(e);
            throw e;
        } finally {
            connection.end();
        }
    } else {
        throw "This type is currently not supported";
    }

    return [adminCredentialsForExternalDatabase.spec.host, port];
}
