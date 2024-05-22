# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.8] - 2024-05-14

### Summary

- Design sqlmanager engine

### Added

- Add `path` module as new args in `configlog` function at `app.js`. Completed on 2024-05-15
- Migrate all functions from `array.js` to `utils.js `. Completed on 2024-05-16
- Add more check method to prevent unexpected error cause entire system crash in `onrequest` function at `reaction.js`. Completed on 2024-05-17
- Create SQLite3 database engine into sqlmanager and all function tested excluded `query` function. Completed on 2024-05-17

### Changed

- Apply `html` instead `text` property in handler.webview.options. Completed on 2024-05-14
- The `configlog` function in `app.js` will create a folder based on the engine name and save the success.log file in that folder. Completed on 2024-05-15
- Direct get `defaulturl` from `coresetting.toml` instead read from `default.json`. Completed on 2024-05-16
- Rewrite `configlog` fuction log4js configuration method ad `app.js`. Completed on 2024-05-16

### Deprecated

- Eliminate `lodash` module from `utils` and `app.js`. Completed on 2024-05-16

### Removed

- Delete `array.js`. Completed on 2024-05-16

### Fixed

- Fix bug Cannot read properties of null (reading 'querySelectorAll') from `body.querySelector(body_node.nodeName).querySelectorAll("*");` issue. Apply `toLowerCase()` into `body_node.nodeName`. Completed on 2024-05-14
- Bug fix from callback at loghttp which manage express.js route message. Completed on 2024-05-16
- Fixed a bug in the rules where good conditions could not be determined causing the entire route to fail. Completed on 2024-05-20

### Security

[1.0.8]: https://github.com/wkloh76/oricommjs/releases/tag/1.0.8

## [1.0.7] - 2024-05-08

### Summary

### Added

- Add `getNestedObject` function to `preload.html` at `webnodejs/src/browser` folder. Completed on 2024-05-09
- Set `webnodejs` as default engine if argument undefined at `app.js`. Completed on 2024-05-09
- Apply multer module. Completed on 2024-05-11
- Add `webstorage` function to `utils.js` for web client upload file to web server. Completed on 2024-05-11

### Changed

- Move `webnodejs/src/error` folder into `webnodejs/src/browser` folder. Completed on 2024-05-09
- Update `package.json` at `engine/webnodejs`. Completed on 2024-05-11

### Deprecated

### Removed

### Fixed

- Fix `onrequest` function cannot find error folder at `webnodejs/src/reaction.js`. Completed on 2024-05-09

### Security

[1.0.7]: https://github.com/wkloh76/oricommjs/releases/tag/1.0.7

## [1.0.6] - 2024-05-06

### Summary

### Added

- Add `mjs` to handler webview. Completed on 2024-05-07
- add `import_mjs` function at `reaction/atom.js` to reprocess url. Completed on 2024-05-08
- Redesign frontend dynamic import ES Module process at `browser/preload.html`. Completed on 2024-05-08
- Redesign initialize method at `browser/preload.html`. Completed on 2024-05-08

### Changed

- Apply trim to `get_domhtml` at `reaction/atom.js`. Completed on 2024-05-07
- Formatter `webview` return object at `utils/handler.js`. Completed on 2024-05-08
- Redefine `webview` less object format which will handler the original source of less.js at `utils/handler.js`. Completed on 2024-05-08

### Deprecated

### Removed

- Remove `elcontent` from handler webview. Completed on 2024-05-07
- Remove `mjs` from handler webview params. Completed on 2024-05-07
- Change `preload.html` process method. Completed on 2024-05-07
- Remove unused code from `processEnd` at `reaction.js`. Completed on 2024-05-07

### Fixed

- Fix elcontent key name unable find by querySelector still overwrite into innerHTML issue . Completed on 2024-05-06
- Fix `import_less` , `import_css` and `import_js` functions at webnodejs/src/reaction/atom.js issue which will concat additional string to the url when the object key name is "other". Completed on 2024-05-08

### Security

[1.0.6]: https://github.com/wkloh76/oricommjs/releases/tag/1.0.6

## [1.0.5] - 2024-05-03

### Summary

### Added

- Create `handler.js` and move those code form hanlder folder to here. Completed on 2024-05-06
- Create `powershell.js` and move those code form powershell folder to here. Completed on 2024-05-06

### Changed

- ~~Convert handler Getter and Setter Property to an Object modules at utils. Completed on 2024-05-03~~
- At atmomic,Only specific share folder(src/browser) allow to access from url when the web server ready. Completed on 2024-05-06

### Deprecated

### Removed

- Remove extra async from module exports. Completed on 2024-05-04
- Remove handler and powershell folder from utils. Completed on 2024-05-06

### Fixed

- Resove the Getter and Seter property in utils handler issue which will overwrite value in getter variable. This is cause by object merging issue which will direct set as globally value. Completed on 2024-05-06

### Security

[1.0.5]: https://github.com/wkloh76/oricommjs/releases/tag/1.0.5

## [1.0.4] - 2024-05-02

### Summary

- Optimise webnodejs and remove repeat functions call process

### Added

- Move private functions `import_css`, `import_js`, `import_less`, `get_domhtml` and `str_replace` from `reaction.js` to `raction/atom.js`. Completed on 2024-05-02
- Move private function `combine_layer` from `reaction.js` to `raction/molecule.js`. Completed on 2024-05-02
- Add `single_layer` function to `raction/molecule.js`. Completed on 2024-05-02

### Changed

- Handler error catch properly in `onrequest` function at `reaction.js`. Completed on 2024-05-02

### Deprecated

### Removed

### Fixed

- Solve the problem of unreasonable repeated calls of `processEnd` function in `onrequest` at at `reaction.js`. Completed on 2024-05-02
- Fix bug in `processEnd` where is missing resolve(rtn) when proceed in ` res.redirect`,` res.status(status).json()` and `res.status(status).send()` issue. Completed on 2024-05-02

### Security

[1.0.4]: https://github.com/wkloh76/oricommjs/releases/tag/1.0.4

## [1.0.3] - 2024-04-29

### Summary

### Added

- ~~Add new action `update ` to `combine_layer` function at `reaction.js` in `webnodejs` to concate the `src/href` value with components name. Completed on 2024-04-29~~
- Apply return promise to `combine_layer` and `processEnd` functions at `reaction.js` in `webnodejs`. Completed on 2024-05-01

### Changed

- Change action `overwrite ` content method to `combine_layer` function at `reaction.js` in `webnodejs`. Completed on 2024-04-29

- Change action `append ` content method to `combine_layer` function at `reaction.js` in `webnodejs`. Completed on 2024-05-01

### Deprecated

- Remove action `update ` to `combine_layer` function at `reaction.js` in `webnodejs`. Completed on 2024-05-01

### Removed

- Remove unused attribute from `import_js` function at `reaction.js` in webnodejs engine. Completed on 2024-04-29
- Remove `minify` process from `get_domhtml` at `reaction.js` in webnodejs engine. Completed on 2024-05-01

### Fixed

### Security

[1.0.3]: https://github.com/wkloh76/oricommjs/releases/tag/1.0.3

## [1.0.2] - 2024-04-28

### Summary

### Added

### Changed

### Deprecated

### Removed

### Fixed

- Fix bug `mergeDeep` function at `utils.js` when internal recall `mergeDeep` failure issue. Completed on 2024-04-28

### Security

[1.0.2]: https://github.com/wkloh76/oricommjs/releases/tag/1.0.2

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

[1.0.1]: https://github.com/wkloh76/oricommjs/releases/tag/1.0.1

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
