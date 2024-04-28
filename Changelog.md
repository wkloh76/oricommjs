# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.1] - 2024-04-26

### Summary

### Added

- Add `arr_diff` function to `utils.js` for Compare 2 array values and return values differently. Completed on 2024-04-26

### Changed

- Redefine the source as pure arrary in `arr_selected` function at `utils.js`. Completed on 2024-04-28

### Deprecated

### Removed

### Fixed

- Fix bug where is assign the wrong first parameter value for `routejson` function at `app.js`. Completed on 2024-04-27
- Fix bug `combine_layer` function at `reaction.js` in webnodejs engine. Completed on 2024-04-27
- Fix bug `import_less` function at `reaction.js` in webnodejs engine where is empty domain string cause inline load less script undefined issue. Completed on 2024-04-28

### Security

[1.0.1]: https://github.com/wkloh76/oricommjs/tree/1.0.1

## [1.0.0] - 2024-04-12

### Summary

### Added

- The code manages the entire engine in a more organized way. Completed on 2024-04-17
- ~~Add `kernel.app["errhandler"]` function to produce all try catch error returning data format. Completed on 2024-04-18~~
- Add helper,hanlder and powershell modules to utils. Completed on 2024-04-19
- Add if empty folder `import_cjs` function will not import. Completed on 2024-04-19
- Add if empty folder `import_mjs` function will not import. Completed on 2024-04-19
- ~~Apply first draft design of webnodejs module into engine. Completed on 2024-04-20~~
- Add `isObject` function to `uitls.js`. Completed on 2024-04-23
- Add `elcontent` key to `handler.js` webview property. Completed on 2024-04-24
- Redefine webview property. Completed on 2024-04-25
- webnodejs module design done. Completed on 2024-04-25

### Changed

- ~~Apply `kernel.app["errhandler"]` function to enrire app.js all try catch error exculde the final/parent function. Completed on 2024-04-18~~
- Apply `throw error` instead `process.exit()` and let the `app.js` parent catch to proceed the error statement into `error.log` file. Completed on 2024-04-18
- ~~Apply `kernel.app["serialize"]` function to `lib["startup"]` function. Completed on 2024-04-18~~
- ALl `kernel.app` original source code move to utils folder and `kernel.app` rename to `kernel.utils`. Completed on 2024-04-19
- Rename `core` folder to `engine` and `kernel.core` rename to `kernel.engine`. Completed on 2024-04-19
- `import_mjs` function import ES module and set the default content become parent property. Completed on 2024-04-20

- Move `array.js` from helper to utils folder. Completed on 2024-04-21
- Create `utils.js` to utils folder and move all lib from `index.js` to `utils.js`. Completed on 2024-04-21
- Modify `import_cjs` and `import_mjs` function import library parameters where is user access global variable by the parameter defination. This change affects utils and webnodejs. Completed on 2024-04-21
- Change the `utils.serialize` function merge returning data method by implement @sagold/json-pointer module. Completed on 2024-04-21
- Change coressting.general.engine defind method. Completed on 2024-04-22
- Implement workspaces to `package.josn`. Completed on 2024-04-22
- Alter entire `app.js` function to avoid directly access `sysmodule,kernel,coressting`. All pass thru the functions parameters. Completed on 2024-04-23
- Remove some unsed script from`import_cjs` and `import_mjs` function due to some design change. Completed on 2024-04-23
- Re-design webnodejs, optimize and remove unused method. Completed on 2024-04-23
- Add `routejson` function for `startup` function in `app.js` call. Completed on 2024-04-23
- Apply new mergDeep function to `utils.js`. Completed on 2024-04-23
- Improve `utils.serialize` function which can keep all function arguments and return data internally for next function call purpose. Completed on 2024-04-23
- Rename `urlhander.js` to `reaction.js`purpose. Completed on 2024-04-24
- Redesign `processEnd` function at `reaction.js` which fully utilise jsdom to editing html file before render to browser. Completed on 2024-04-24
- Add third parameters to `import_cjs` and `import_mjs` instead `[kernel,sysmodule,coresetting]`. Completed on 2024-04-25
- Update new sub function to `app.js` at `startup` function. Completed on 2024-04-25

### Deprecated

- eta node module no longer to use. Completed on 2024-04-25

### Removed

- Remove unused variable from `app.js`. Completed on 2024-04-18
- ~~Remove `delay` sub function in `lib["startup]` function. Completed on 2024-04-18~~
- Remove empty rows from `app.js`. Completed on 2024-04-18
- Delete helper folder from utils. Completed on 2024-04-21
- Delete `components: kernel.component,` from `urlhandler.js` giftpack variable. Completed on 2024-04-23

### Fixed

- Fix bug `utils.renameObjectKeys` function. Completed on 2024-04-21
- Fix bug `utils.dir_module` when param 2 is undefined. Completed on 2024-04-24
- Fix bug `processEnd` function at `reaction.js` which unable write the message and title to the specifiy html element and title. Completed on 2024-04-24
- Fix bug `preload.html` and mjs variable undeclare issue. Completed on 2024-04-25
- Fix bug err500 object missing options key in lib["onrequest"] function. Completed on 2024-04-25

### Security

[1.0.0]: https://github.com/wkloh76/oricommjs/releases/tag/1.0.0
