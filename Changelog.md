# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.5] - 2024-08-01

### Summary

### Added

- Apply "y"(old system) to compare hash password in `password` method at `sqlmanager` engine. Completed on 2024-08-01

### Changed

- Apply structureClone to `password` method at `sqlmanager` engine to predict parameter change during process. Completed on 2024-08-01

### Deprecated

### Removed

### Fixed

### Security

[1.1.5]: https://github.com/wkloh76/oricommjs/releases/tag/1.1.5

## [1.1.4] - 2024-07-26

### Summary

- Design deskelectronjs engine -- Done until auto updater

### Added

- Add filter method and on allow `web_` prfix name can continue in `webnodejs/src/index.js`. Completed on 2024-07-30
- Redesign public share(atmoic and share) method in `webnodejs/src/webserver.js` to avoid multi produce with same contents. Completed on 2024-07-30
- Add specify http route request in both `webnodejs/src/webserver.js` and `webnodejs/src/reaction.js` for less.js static file. Completed on 2024-07-30
- Add specify http route request in both `webnodejs/src/webserver.js` and `deskelectronjs/src/reaction.js` for less.js static file. Completed on 2024-07-30
- Implement auto updater service to `deskelectronjs`. Completed on 2024-07-30
- Add `intercomm.js` to `utils` which will create a single events transaction to handler backend data passing. Completed on 2024-07-31
- Implement BroadcastChannel to passing data from deskelectronjs preload `init.js` to frontend js. The BroadcastChannel can passing data arround js to js without html elemeent support. Completed on 2024-07-31

### Changed

- Rename webnodejs `coresetting.toml.example` to `web.toml.example`. Completed on 2024-07-26
- Rename deskelectronjs `coresetting.toml.example` to `desktop.toml.example`. Completed on 2024-07-26
- Update package.json.example dependencies modules. Completed on 2024-07-26
- Change the global.coresetting.share to object type in `app.js`. Completed on 2024-07-30
- Chnage the error log file save mehtod into the error folder. Completed on 2024-07-30

### Deprecated

### Removed

- Remove unused code from `start` method in `webnodejs/src/index.js`. Completed on 2024-07-30

### Fixed

### Security

[1.1.4]: https://github.com/wkloh76/oricommjs/releases/tag/1.1.4

## [1.1.3] - 2024-07-23

### Summary

- Design deskelectronjs engine

### Added

- Add advance feature to mariadb trans method which support both function and string in sql statement. Completed on 2024-07-23
- Add auto detect default ongoing in deskelectronjs engine either from commnad line arguments or components project desktop.toml file. Completed on 2024-07-24
- Add `sandbox` function into both webnodejs and deskelectronjs engine `preload.html`. Completed on 2024-07-25

### Changed

### Deprecated

### Removed

### Fixed

### Security

[1.1.3]: https://github.com/wkloh76/oricommjs/releases/tag/1.1.3

## [1.1.2] - 2024-07-01

### Summary

- Design deskelectronjs engine -- simple done

### Added

### Changed

- Apply `yaml` as global module to instead `js-yaml` module. Completed on 2024-07-01

### Deprecated

### Removed

### Fixed

- Bug fix sqlite engine cannot save log and db to specific folder. Completed on 2024-07-02
- Bug fix mariadb engine register failure not throw error. Completed on 2024-07-02
- Bug fix in `slqtemplate.js` which unable create second key value during generate sql update statement. Completed on 2024-07-02
- Bug fix in `query` function at `mariadb.js` to check the sql statement must in string type before proceed the data query to predict mariadb module crash. Completed on 2024-07-03
- Bug fix in `query` function at `sqlite3.js` to check the sql statement must in string type before proceed the data query to predict mariadb module crash. Completed on 2024-07-03
- Add `concatobj` method into `utils.js` for merge or concat 2 data in 1. Completed on 2024-07-04

### Security

[1.1.2]: https://github.com/wkloh76/oricommjs/releases/tag/1.1.2

## [1.1.1] - 2024-06-10

### Summary

### Added

- Add new key `atomic` into `utils/handler.js` webview properties. Completed on 2024-06-10
- Simple design smfetch atom module which allow frontend and backend call web api. Completed on 2024-06-11
- Add new key `htmlstr` into `utils/handler.js` webview properties layer->childs. Completed on 2024-06-11
- Add `indentify_html` function into `webnodejs/src/reaction/molecule.js` for check the string is in html tag. Completed on 2024-06-11
- Add store session option either in memory or save into sqlite database file at `webnodejs/src/webserver.js`. Completed on 2024-06-12
- Apply `indentify_html` to `webnodejs/src/reaction.js` to checking layouts and view content is html string. Completed on 2024-06-18
- Add `ini` and `js-yaml` module into sysmodule global variable. Complete on 2024-06-24
- Create `sqltemplate.js` at sqlmanager engine which use for generate sql query statemenet with simple format. Complete on 2024-06-26
- Create `pick_arrayobj2list` method at `utils.js` which will pick ick data from the array object as the defination from picker and convert data to list of object. Completed on 2024-07-10
- Add checking `index.js` file exist during loading module in `import_cjs` and `import_mjs` function at `utils.js`. Completed on 2024-07-12
- Create `arr_diffidx` method at `utils.js` which will Compare 2 array values and return values differently with index and value. Completed on 2024-07-12
- Create `objpick` method at `utils.js` which will pick selected keys and values from the object. Completed on 2024-07-17
- Add `share` key(array) into the `global.coresetting` object at `app.js`. Completed on 2024-07-22
- Add decode more more layer of value to support multi components file sharing in webnodejs engine. Completed on 2024-07-22

### Changed

- Code optimize in `utils.js` at utils. Completed on 2024-06-10
- Code optimize in `reaction.js` at webnodejs engine. Completed on 2024-06-10
- Update comment in sqlmanager engine. Completed on 2024-06-10
- Rename `pick_arryobj` method to `pick_arrayofobj` at `utils.js` and do the checking to prevent pickup undefined key of value. Completed on 2024-07-10
- Relocate the `let [setting, onrequest] = args;` variable defination before try catch in `start` method at `webserver.js`. Completed on 2024-07-16
- Improve check data type in `pick_arrayofobj` and `pick_arrayobj2list` method at `utils.js`. Completed on 2024-07-18
- Rename `deskfectch` to `deskfetch` function at `smfetch/src/browser/atom.js`. Completed on 2024-07-23

### Deprecated

### Removed

- Remove unused console.log from `atom/smfetch/src/browser/smfetch.js`. Completed on 2024-07-11

### Fixed

- Fix bug from `request` return empty data when the call method not in promise at `smfetch` atom. Completed on 2024-06-14
- Add check available keys before proceed in `get_filenames` function at `webnodejs/src/reaction/molecule.js`. Completed on 2024-06-18
- Resolve the bug in smfetch `urlidentify` and `request` method where is the url which define whithout embed protocal and host cause fetchapi error when call the GET method. Completed on 2024-07-08
- Bug fix in `arr_selected` and `arr_diff` at `utils.js` where is define the output variable inside the try catch and the finally return the output as undefined cause the error occur. Completed on 2024-07-10

### Security

[1.1.1]: https://github.com/wkloh76/oricommjs/releases/tag/1.1.1

## [1.1.0] - 2024-05-28

### Summary

- Design sqlmanager engine -- simple done

### Added

- Apply setHeader to control cache in web engine which allow to control web page caching across all browsers. Completed on 2024-05-28
- Release simple MariaDB database client engine into sqlmanager. Completed on 2024-06-04
- Define and standardized database query returning data format in `mariadb.js`. Completed on 2024-06-05
- Add `ischema` method into `clsMariaDB` at `mariadb.js` to check is empty database. Completed on 2024-06-05
- Redesign simple `sqlite3.js` database engine suit to sqlmanager design. Complete on 2024-06-06
- Redesign `clsMariaDB` and the functions effect are `query`,`trans`,`notrans` and `prepare_queryone` suit to sqlmanager design. Complete on 2024-06-06

### Changed

- Move `errlog` and `setuplog` function from `sqlite3.js` to `index.js` and those function will support any kind of database engine. Completed on 2024-05-30
- ~~Swtich the logger object require from connect function parameter to internal module private variable which will covert entire module in `sqlite3.js`.Completed on 2024-05-31~~
- ~~Create sqlite transaction to insert table statement to prevent multi connection insert same table cause the problem at `sqlite3.js`. Completed on 2024-05-31~~
- ~~Rename `sqlite3.js` `create` function name to `createlog`. Completed on 2024-05-31~~
- ~~Rename `close` function to `disconnect` in `sqlite3.js`. Completed on 2024-06-03~~
- Modify and standardized structure and method in `mariadb.js`. Completed on 2024-06-05
- Alter rule strict checking in `onrequest` function at `reaction.js` and will force continue rules until the end event controller error happen. Completed on 2024-06-06
- Minor change,update,remove unused code and comment in `sqlite3.js`. Completed on 2024-06-06
- Simplify `query` function return data method in `sqlite3.js`. Completed on 2024-06-07
- Change `query` function return data format to array of object in `sqlite3.js`. Completed on 2024-06-07

### Deprecated

### Removed

- ~~Remove call `connect` function from `create` in `sqlite3.js`. Completed on 2024-05-31~~

### Fixed

- Fix post rule process unable continue proceed cause by controller side in `reaction.js` at webnodejs engine. Completed on 2024-05-29
- ~~Bug fix at `sqlite3.js` `query` function no return data issue. Completed on 2024-05-31~~
- Bug fix at `mariadb.js` `connector` function. Completed on 2024-06-05
- Bug fix at `mariadb.js` `dboption` property default value. Completed on 2024-06-05

### Security

[1.1.0]: https://github.com/wkloh76/oricommjs/releases/tag/1.1.0

## [1.0.9] - 2024-05-25

### Summary

- Design sqlmanager engine -- inprogress

### Added

- Create `sanbox` and `response.inspector` function in `reaction.js` at webnodejs engine which will internally handle error inside the trycatch from any components module. Completed on 2024-05-25

### Changed

### Deprecated

### Removed

### Fixed

### Security

[1.0.9]: https://github.com/wkloh76/oricommjs/releases/tag/1.0.9

## [1.0.8] - 2024-05-14

### Summary

- Design sqlmanager engine

### Added

- Add `path` module as new args in `configlog` function at `app.js`. Completed on 2024-05-15
- Migrate all functions from `array.js` to `utils.js `. Completed on 2024-05-16
- Add more check method to prevent unexpected error cause entire system crash in `onrequest` function at `reaction.js`. Completed on 2024-05-17
- Create SQLite3 database engine into sqlmanager and all function tested excluded `query` function. Completed on 2024-05-17
- Active `injectionjs` object which will passing data from backend to frontend global variables in `processEnd` function at `reaction.js`. Completed on 2024-05-23
- Apply `startup` execution process in `work` function at `app.js` for initialize some process at components. Completed on 2024-05-24
- Release simple sqlite3 db engine into sqlmanager engine. Can be define as memory or file type. Completed on 2024-05-24

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
