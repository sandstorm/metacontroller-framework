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

    console.log("Installing scripts into project");
    const packageJsonString = fs.readFileSync(path.join(targetDirectory, 'package.json'), 'utf-8');
    const packageJson = JSON.parse(packageJsonString);
    packageJson.scripts = packageJson.scripts || {};
    packageJson.scripts["start"] = "node lib/index.js";
    packageJson.scripts["build"] = "tsc -p .";
    fs.writeFileSync(path.join(targetDirectory, 'package.json'), JSON.stringify(packageJson, null, 2));

}