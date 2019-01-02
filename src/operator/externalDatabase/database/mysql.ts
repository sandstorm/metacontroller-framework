import {Connection, QueryOptions} from 'mysql';

export async function ensureDatabaseExists(databaseName: string, connection: Connection) {
    const result = await query({
        sql: 'SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?',
        values: [databaseName]
    }, connection);
    if (result.length === 0) {
        console.log(`Database ${databaseName} does not exist yet; trying to create...`);
        await query({
            sql: `CREATE DATABASE ${connection.escapeId(databaseName)}`
        }, connection);
    }
}

export async function ensureUserExistsAndPasswordMatches(user: string, password: string, connection: Connection) {
    const result = await query({
        sql: 'SELECT EXISTS(SELECT 1 FROM mysql.user WHERE user = ?)',
        values: [user]
    }, connection);
    if (result.length === 0) {
        console.log(`User ${user} does not exist yet; trying to create...`);
        await query({
            sql: `CREATE USER ${connection.escapeId(user)} IDENTIFIED BY ?;`,
            values: [password]
        }, connection);
    } else {
        // user already exists; check that PW matches (and if not, update it)
        const result = await query({
            sql: "SELECT EXISTS(SELECT 1 FROM mysql.user WHERE user = ? AND password = CONCAT('*',UPPER(SHA1(UNHEX(SHA1(?))))))",
            values: [user, password]
        }, connection);
        if (result.length === 0) {
            console.log(`Password for user ${user} does not match expected one, setting password...`);
            await query({
                sql: `SET PASSWORD FOR ${connection.escapeId(user)} = PASSWORD(?)`,
                values: [password]
            }, connection);
        }
    }
}

// Implemented roughly after https://github.com/ansible/ansible/blob/devel/lib/ansible/modules/database/mysql/mysql_user.py
export async function ensureUserHasAccessToDatabase(user: string, databaseName: string, connection: Connection) {
    const result: any[] = await query({
        sql: `SHOW GRANTS FOR ${connection.escapeId(user)})`
    }, connection);
    let foundGrantAll = false;
    let foundAdditionalGrantLine = false;
    result.forEach((grantLine: string[]) => {
        const result = grantLine[0].match(/GRANT (.+) ON (.+) TO '.*'@'.*'( IDENTIFIED BY PASSWORD '.+')? ?(.*)/);
        if (!result) {
            throw `Unable to parse privilege string ${grantLine[0]}`;
            foundAdditionalGrantLine = true;
        } else {
            if (result[1] === 'ALL PRIVILEGES' && result[2] === databaseName + '.*') {
                foundGrantAll = true;
            } else {
                foundAdditionalGrantLine = true;
            }
        }
    })

    if (foundGrantAll && !foundAdditionalGrantLine) {
        // the user has already access to the database; we do NOT need to do anything! :-)
        return;
    }

    if (!foundGrantAll && !foundAdditionalGrantLine) {
        console.log("Did not find any grants for user; creating them...");
    } else {
        console.log("Found the following grants, which will be removed: ");
        result.forEach((grantLine: string[]) => {
            console.log('   ' + grantLine[0]);
        });

        await query({
            sql: `REVOKE ALL PRIVILEGES FROM ${connection.escapeId(user)}`
        }, connection);

        await query({
            sql: `FLUSH PRIVILEGES`
        }, connection);
    }

    console.log(`Creating grant to database ${databaseName}`);
    await query({
        sql: `GRANT ALL PRIVILEGES ON ${connection.escapeId(databaseName)}.* TO ${connection.escapeId(user)}`
    }, connection);

    await query({
        sql: `FLUSH PRIVILEGES`
    }, connection);
}

function query(query: QueryOptions, connection: Connection): Promise<any> {
    return new Promise((accept, reject) => {
        connection.query(query, (err, results) => {
            if (err) {
                reject(err);
            } else {
                accept(results);
            }
        });
    })
};