#!/usr/bin/env node

import * as fs from "fs";
import * as path from "path";
import {execSync} from 'child_process';

const [, , subcommand, ...args] = process.argv;

switch (subcommand) {
    case 'init':
        init();
        break;
    case 'help':
        console.log(`Commands:`);
        console.log(``);
        console.log(`init: Initialize the project`);
        break;
    default:
        console.log(`The command "${subcommand}" was not found. Use "metacontroller-framework help" for a list of commands.`);
}

function init() {
    const sourceDirectory = path.join(__dirname, '../templates');
    const targetDirectory = process.cwd();
    console.log("Initializing metacontroller to the path " + targetDirectory);
    if (!fs.existsSync(targetDirectory + '/.git')) {
        console.error(`ERROR: The directory ${targetDirectory} is no git repository root.`);
        return;
    }

    const templateFiles = [
        '.dockerignore',
        '.editorconfig',
        '.gitignore',
        '.gitlab-ci.yml',
        'Dockerfile',
        'tsconfig.json',
    ];

    templateFiles.forEach(file => {
        const target = path.join(targetDirectory, file);
        console.log(`Writing ${target}`);
        fs.writeFileSync(target, fs.readFileSync(path.join(sourceDirectory, file), 'utf-8'));
    });

    console.log("Installing TypeScript into project");
    execSync("npm install --save-dev typescript@3.2.2", {
        cwd: targetDirectory
    });

    console.log("Installing npm-run-all into project");
    execSync("npm install --save-dev npm-run-all@4.1.5", {
        cwd: targetDirectory
    });

    console.log("Installing nodemon into project");
    execSync("npm install --save-dev nodemon@1.18.9", {
        cwd: targetDirectory
    });

    console.log("Installing scripts into project");
    const packageJsonString = fs.readFileSync(path.join(targetDirectory, 'package.json'), 'utf-8');
    const packageJson = JSON.parse(packageJsonString);
    packageJson.scripts = packageJson.scripts || {};
    packageJson.scripts["start"] = "node lib/index.js";
    packageJson.scripts["build"] = "tsc -p .";
    packageJson.scripts["build:watch"] = "tsc -p . --watch";
    packageJson.scripts["generate-k8s"] = "npm run build && GENERATE_K8S=1 node lib/index.js";
    packageJson.scripts["validate-k8s:watch"] = "GENERATE_K8S=1 VALIDATE_K8S=1 nodemon lib/index.js";
    packageJson.scripts["watch"] = "npm-run-all --parallel build:watch validate-k8s:watch";

    fs.writeFileSync(path.join(targetDirectory, 'package.json'), JSON.stringify(packageJson, null, 2));

}