# OriCommJS

- The main purpose of this architectural design is to develop all console, web and desktop applications based on commonJS and javascript runtime engine supports NodeJS, BunJS and electronJS.
- Support Nodejs version 20.11.0 and above.
- Support ElectronJS version 28.1.3 and above.
- Support BunJS version 1.1.3 and above.

## Features

- Utilies JS global variable manage node_modules and custom module which can directly apply to anywhere.
- When system ready {sysmodule,kernel.app,kernel.core,kernel.atomic,kernel.components}.
- A maximum of 3 parameters per module or function is the design principle of the framework.
- Reusable or re-applied modules are one of the design features of this framework to avoid copying code everywhere and wasting resources.

## components

- Here will keep user application source code.
- The skelethon can refer to node_component_template.
- Support multiple components in one project.
  The prefix for the folder:
  - `app_` is console application.
  - `web_` is web application.
  - `desktop_` is desktop application.

## core

- It is the main core engine of the entire project and determines whether the project is a console, web or desktop application.

- startup require:
  - oricjsutils
  - shell
- Choose one engine:
  - webbunjs (bunJS)
  - webnodejs (NodeJS)
  - deskeletronjs (ElectronJS)
- Optional modules:
  - goturl
  - sqlmanager

## atomic

- The role is This
- The modules only can apply into the components.

---

# Development Notes

## .gitignore setting

```
.vscode
package.json
yarn.lock
yarn-error.log
node_modules
.gitignore
bun.lockb
```

## package.josn setting

- For startup, you can change the values from package.json suite to your design (name,productName,homepage,version,description,repository,author).

## Visual Studio Code Debug

---

### launch.json setting

```
{
  // Use IntelliSense to learn about possible attributes.
  // Hover to view descriptions of existing attributes.
  // For more information, visit: https://go.microsoft.com/fwlink/?linkid=830387
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Launch Nodejs Program",
      "skipFiles": [
        "<node_internals>/**"
      ],
      "program": "${workspaceFolder}/app.js",
      "args": [
        "--mode=debug"
      ]
    },
    {
      "type": "node",
      "request": "attach",
      "name": "Attach Nojdejs remotely",
      "address": "192.180.1.111",
      "port": 9229,
      "localRoot": "${workspaceFolder}",
      "remoteRoot": "/usr/share/prj/project",
      "protocol": "inspector"
    },
    {
      "type": "bun",
      "request": "launch",
      "name": "Debug Bun File",
      "program": "app.js",
      "cwd": "${workspaceFolder}",
      "args": [
        "--mode=debug"
      ],
      "stopOnEntry": false,
      "watchMode": false,
      "internalConsoleOptions": "neverOpen"
    },
    {
      "type": "bun",
      "request": "launch",
      "name": "Run Bun File",
      "program": "app.js",
      "cwd": "${workspaceFolder}",
      "args": [
        "--mode=debug"
      ],
      "noDebug": true,
      "watchMode": false,
      "internalConsoleOptions": "neverOpen"
    },
    {
      "type": "bun",
      "request": "attach",
      "name": "Attach Bun",
      "url": "ws://localhost:6499/",
      "stopOnEntry": false,
      "internalConsoleOptions": "neverOpen"
    },
    {
      "name": "Electron: Main",
      "type": "node",
      "request": "launch",
      "runtimeExecutable": "/electron/./electron",
      "windows": {
        "runtimeExecutable": "/electron/./electron.cmd"
      },
      "runtimeArgs": [
        "${workspaceRoot}/app.js",
        "--remote-debugging-port=9223",
        "--mode=debug",
        "--disable-gpu",
        "--no-sandbox"
      ],
    },
    {
      "name": "Electron: Renderer",
      "type": "chrome",
      "request": "attach",
      "port": 9223,
      "webRoot": "${workspaceFolder}",
      "timeout": 30000
    }
  ],
  "compounds": [
    {
      "name": "Electron: All",
      "configurations": [
        "Electron: Main",
        "Electron: Renderer"
      ]
    }
  ]
}
```

## Handle package.json dependencies and devdependencies

- Dependencies: The modules will bundle to the project and standby for deployment.
- Devdependencies: The modules will bundle to project for development and testing purpose. The deployment stage can be ignore the modules.

## yarn run and debug remotely in package.json script setting

- run: node app.js --mode=production/debug
- run: node app.js --mode=debug
- debug: node --inspect=0.0.0.0:9229 app.js --mode=production
- debug: node --inspect=0.0.0.0:9229 app.js --mode=debug

# License

OriCommJS is freely distributable under the terms of the [Mulan PSL v2 license][license-url].

[license-url]: License
