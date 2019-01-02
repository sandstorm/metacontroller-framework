import { randomBytes } from 'crypto';
import { ensureDatabaseAndUserExists } from './database/index';
import { OperatorDefinition } from '../../types/api';
import { SyncHookRequest, SyncHookResponse } from '../../types/metacontroller';
import { createSecret, createConfigMap } from '../../controllerApi/creators';
import { responseWithAutoStatus } from '../../controllerApi/mainControllerApi';

interface ExternalDatabaseSpec {
    /**
     * Reference to the DatabaseHost CRD
     */
    databaseHost: string;
}





const operator: OperatorDefinition = {
    key: 'metacontroller-framework/externalDatabase',
    async sync(request: SyncHookRequest<ExternalDatabaseSpec>): Promise<SyncHookResponse> {
        const { name, namespace, labels } = request.parent.metadata;

        let dbPassword;
        if (request.children["Secret.v1"] && request.children["Secret.v1"][name]) {
            const secret = request.children["Secret.v1"][name];
            dbPassword = Buffer.from(secret.data['DB_PASSWORD'], 'base64').toString('utf8');
        }
        if (!dbPassword) {
            // generate a new password
            console.log('Was not able to extract the password from the secret; generating a new one.');
            dbPassword = randomBytes(40).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/\=/g, '');
        }

        const dbUser = `${namespace}_${name}`;
        const dbName = `${namespace}_${name}`;
        const [dbHost, dbPort] = await ensureDatabaseAndUserExists(request.parent.spec.databaseHost, {
            user: dbUser,
            databaseName: dbName,
            password: dbPassword
        });

        const secret = createSecret({
            name,
            namespace,
            labels,
            stringData: {
                DB_PASSWORD: dbPassword
            }
        });

        const configMap = createConfigMap({
            name,
            namespace,
            labels,
            data: {
                DB_USER: dbUser,
                DB_HOST: dbHost,
                DB_PORT: String(dbPort),
                DB_NAME: dbName
            }
        })


        return responseWithAutoStatus([secret, configMap], request);
    }
};

export default operator;