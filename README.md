# OriCommJS

![Static Badge](https://img.shields.io/badge/License-Mulan_PSL_v2-_)
![Static Badge](https://img.shields.io/badge/NodeJS-V20_.19_.2-_)
![Static Badge](https://img.shields.io/badge/ElectronJS-V34_.2_.0-_)
![Static Badge](https://img.shields.io/badge/OS-Ubuntu_24-_?style=flat)
![Static Badge](https://img.shields.io/badge/OS-Windows_10-_?style=flat)
![GitHub Release](https://img.shields.io/github/v/release/wkloh76/oricommjs)

A JavaScript project framework that provides an engine to handle desktop, web, and non-GUI application development. Node JS, bun JS and Electron JS are the backbone engines of this framework. The idea behind the framework is to develop a code model that can switch engines and build desktop, web, and non-GUI applications without changing the design. Due to some module issues, the framework design still retains the CommonJS design method. You can build your reusable modules or class and plugin into atomic folder. If you want the modules or class can be cross entire project than plugin into the enigne folder.

## Idea

- The `webnodejs` engine is a web server designed based on the expressjs framework. It can runs on bith NodeJS and BunJS
- The `deskelectronjs` engine is a desktop application designed to be executed only through ElectronJS.
- The `appservicejs` engine is non-GUI application desgined which can directlly run in pc background service or executed from Linux console or Windows CMD. It can runs on bith NodeJS and BunJS
- Reusable or reappliable modules are one of the design features of the framework to avoid duplicating code everywhere and wasting resources.

## Design principle

- It is worth noting that each module or function can only have a maximum of 3 arguments/parameters. This is to better manage and teach developers how to make the most of object types within constraints.

## components

- Here will keep user application source code.
- The skelethon can refer to node_component_template.
- Support multiple components in one project.
  The prefix for the folder:
  - `app_` for non-GUI application.
  - `web_` for web application.
  - `desktop_` for desktop application.

## engine

- It is the main core engine of the entire project and determines whether the project is a console, web or desktop application.

- Framework comes with functions:
  - utils {handler and powersehll}
- Choose one engine:
  - appservicejs(NodeJS,Bunjs)
  - webnodejs (NodeJS)
    - Implement workflow engine which will proper manage the frontend code instead write the code in one html/js file.
  - deskeletronjs (ElectronJS)
    - Implement workflow engine which will proper manage the frontend code instead write the code in one html/js file.
- Optional modules:
  - sqlmanager
    - sqlite3
    - mariadb

## atomic

- The role is This
- The modules only can apply into the components.

### atom

- smfetch
- guimaker

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

## Debug: vscodelaunch.json setting

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
        "--mode=debug",
        "--engine=webnodejs"
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
      "name": "Electron: Main",
      "type": "node",
      "request": "launch",
      "runtimeExecutable": "/electron/./electron",
      "windows": {
        "runtimeExecutable": "D:\\electron\\electron.exe",
        "runtimeArgs": [
        "${workspaceRoot}\\app.js",
        "--remote-debugging-port=9223",
        "--mode=debug",
        "--engine=deskelectronjs",
        "--disable-gpu",
        "--no-sandbox"
      ],
      },
      "runtimeArgs": [
        "${workspaceRoot}/app.js",
        "--remote-debugging-port=9223",
        "--mode=debug",
        "--engine=deskelectronjs",
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

## Launch: Linux console or Window CMD

- NodeJS: node app.js --mode=debug --engine=webnodejs
- ElectronJS: electron app.js --mode=debug --engine=deskelectronjs

## Handle package.json dependencies and devdependencies

- Dependencies: The modules will bundle to the project and standby for deployment.
- Devdependencies: The modules will bundle to project for development and testing purpose. The deployment stage can be ignore the modules.

# License

OriCommJS is freely distributable under the terms of the [Mulan PSL v2 license][license-url].

[license-url]: License
