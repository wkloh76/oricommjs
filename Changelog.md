# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-04-12

### Summary

### Added

- The code manages the entire engine in a more organized way. Completed on 2024-04-17
- ~~Add `kernel.app["errhandler"]` function to produce all try catch error returning data format. Completed on 2024-04-18~~
- Add helper,hanlder and powershell modules to utils. Completed on 2024-04-19
- Add if empty folder `import_cjs` function will not import. Completed on 2024-04-19
- Add if empty folder `import_mjs` function will not import. Completed on 2024-04-19

### Changed

- ~~Apply `kernel.app["errhandler"]` function to enrire app.js all try catch error exculde the final/parent function. Completed on 2024-04-18~~
- Apply `throw error` instead `process.exit()` and let the `app.js` parent catch to proceed the error statement into `error.log` file. Completed on 2024-04-18
- ~~Apply `kernel.app["serialize"]` function to `lib["startup"]` function. Completed on 2024-04-18~~
- ALl `kernel.app` original source code move to utils folder and `kernel.app` rename to `kernel.utils`. Completed on 2024-04-19
- Rename `core` folder to `engine` and `kernel.core` rename to `kernel.engine`. Completed on 2024-04-19
- `import_mjs` function import ES module and set the default content become parent property. Completed on 2024-04-20
- Apply first draft design of webnodejs module into engine. Completed on 2024-04-20

### Deprecated

### Removed

- Remove unused variable from `app.js`. Completed on 2024-04-18
- ~~Remove `delay` sub function in `lib["startup]` function. Completed on 2024-04-18~~
- Remove empty rows from `app.js`. Completed on 2024-04-18

### Fixed

### Security

<!-- [1.0.0]:  -->
