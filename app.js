/**
 * Copyright (c) 2024   Loh Wah Kiang
 *
 * openGauss is licensed under Mulan PSL v2.
 * You can use this software according to the terms and conditions of the Mulan PSL v2.
 * You may obtain a copy of Mulan PSL v2 at:
 *
 *          http://license.coscl.org.cn/MulanPSL2
 *
 * THIS SOFTWARE IS PROVIDED ON AN "AS IS" BASIS, WITHOUT WARRANTIES OF ANY KIND,
 * EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT,
 * MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
 * See the Mulan PSL v2 for more details.
 * -------------------------------------------------------------------------
 */
"use strict";
/**
 * app
 * @module app
 */
(async () => {
  try {
    const os = require("os");

    let argv = [];
    let lib = {};

    global.coresetting = {
      args: {},
      splitter: "/",
      platform: process.platform,
    };
    global.sysmodule = {};
    global.kernel = {};

    kernel.app = {};
    kernel.core = {};
    kernel.atomic = {};
    kernel.components = {};

    sysmodule.path = require("path");
    sysmodule.fs = require("fs");
    sysmodule.events = require("events");
    sysmodule.lodash = require("lodash");
    sysmodule.dayjs = require("dayjs");
    sysmodule.toml = require("@ltd/j-toml");

    sysmodule.events.EventEmitter.defaultMaxListeners = 50;
    global.emitter = new sysmodule.events.EventEmitter();

    /**
     * Filter out some specific modules
     * @alias module:app.filter_module
     * @param {...Object} args - 1 parameters
     * @param {Array} args[0] - path is directory path
     * @param {Array} args[1] - excluded skip module
     * @returns {Object} - Return value
     **/
    lib["filter_module"] = (...args) => {
      const [path, excluded] = args;
      const { dir_module } = kernel.app;
      let output = {
        path: path,
        module: dir_module(path).filter((item) => !excluded.includes(item)),
      };
      return output;
    };

    /**
     * initialize pre process setting
     * @alias module:app.initialize
     * @param {...Object} args - 0 parameters
     * @returns {Object} - Return value
     */
    lib["initialize"] = (...args) => {
      return new Promise(async (resolve, reject) => {
        const { fs, path, toml } = sysmodule;
        let { platform, splitter } = coresetting;
        let output = {
          code: 0,
          msg: "",
          data: null,
        };
        try {
          if (process.argv.length > 1)
            kernel.dir = path.resolve(path.dirname(process.argv[1]));
          else kernel.dir = path.resolve(path.dirname(process.argv[0]));

          if (platform == "win32") splitter = "\\";

          process.argv.map((value) => {
            if (value.match("=")) {
              let arg = value.split("=");
              let args_key = arg[0].replace(/[\(,\),\.,\/,\-,\_, ,]/g, "");
              coresetting.args[args_key] = arg[1];
            } else argv.push(value);
          });

          if (!argv.includes("app.js")) {
            let tempcur = argv[0]
              .replace(".", "")
              .split(splitter)
              .slice(0, -1)
              .join(splitter);

            for (let item of argv) {
              if (item.split(splitter).includes("app.js")) tempcur = "";
            }
            if (tempcur != "") kernel.dir = tempcur;
          }

          if (
            fs.existsSync(
              `${kernel.dir}${splitter}resources${splitter}app.asar`
            )
          )
            kernel.dir += `${splitter}resources${splitter}app.asar${splitter}`;
          else if (
            fs.existsSync(`${kernel.dir}${splitter}resources${splitter}app`)
          )
            kernel.dir += `${splitter}resources${splitter}app${splitter}`;

          if (coresetting.args["mode"]) kernel.mode = coresetting.args["mode"];
          else kernel.mode = "production";

          let tomlpath = path.join(kernel.dir, `.${splitter}coresetting.toml`);

          if (fs.existsSync(tomlpath)) {
            let psetting = toml.parse(fs.readFileSync(tomlpath), {
              bigint: false,
            });

            let { debug, production, ...setting } = psetting;
            coresetting = { ...coresetting, ...setting };
            coresetting["nodepath"] = path.join(kernel.dir, "node_modules");

            coresetting[kernel.mode] = { ...psetting[kernel.mode] };
            coresetting["ongoing"] = { ...psetting[kernel.mode] };
          }

          coresetting.packagejson = JSON.parse(
            fs.readFileSync(path.join(kernel.dir, "package.json"), "utf8")
          );

          coresetting.logpath = path.join(
            os.homedir(),
            `.${coresetting.packagejson.name}`
          );

          coresetting.general.engine = coresetting.general.engine.filter(
            (item) => item !== coresetting.args.engine
          );

          coresetting["core"] = lib.filter_module(
            path.join(kernel.dir, "core"),
            coresetting.general.engine
          );

          coresetting["atomic"] = {};
          for (let val of coresetting.general.atomic) {
            coresetting["atomic"][val] = lib.filter_module(
              path.join(kernel.dir, "atomic", val),
              []
            );
          }

          coresetting["components"] = lib.filter_module(
            path.join(kernel.dir, "components"),
            []
          );
          output.data = { coresetting: coresetting };
        } catch (error) {
          output.code = -1;
          output.msg = error.message;
        } finally {
          resolve(output);
        }
      });
    };

    /**
     * Make log directory
     * @alias module:app.mkdirlog
     * @param {String} logpath - Log file path
     * @returns {Object} - Return value
     */
    lib["mkdirlog"] = (...args) => {
      return new Promise(async (resolve, reject) => {
        const [logpath] = args;
        const { fs } = sysmodule;
        let output = {
          code: 0,
          msg: "",
          data: null,
        };

        try {
          fs.access(logpath, (notexist) => {
            // To check if given directory exists or not
            if (notexist) {
              // If current directory does not exist then create it
              fs.mkdir(logpath, { recursive: true }, (err) => {
                if (err) {
                  output.code = -2;
                  output.msg = err.message;
                } else {
                  output.msg = "New Directory created successfully !!";
                }
                resolve(output);
              });
            } else {
              output.msg = "Given Directory already exists !!";
              resolve(output);
            }
          });
        } catch (error) {
          output.code = -1;
          output.msg = error.message;
          resolve(output);
        }
      });
    };

    /**
     * Configure log module for webexpress and normal log
     * @alias module:app.configlog
     * @param {...Object} args - 1 parameters
     * @param {Array} args[0] - logpath is directory path
     * @returns {Object} - Return value
     */
    lib["configlog"] = (...args) => {
      return new Promise(async (resolve, reject) => {
        const [logpath, log] = args;
        const { splitter } = coresetting;
        let output = {
          code: 0,
          msg: "app.js configlog done!",
          data: null,
        };
        try {
          const { default: log4js } = await import("log4js");
          await log4js.configure({
            appenders: {
              access: {
                filename: `${logpath}${splitter}success.log`,
                ...log.success,
              },
              error: {
                filename: `${logpath}${splitter}error.log`,
                ...log.error,
              },
            },
            categories: {
              default: { appenders: ["access"], level: "ALL" },
              access: { appenders: ["access"], level: "INFO" },
              info: { appenders: ["error"], level: "ALL" },
            },
          });

          sysmodule = {
            ...sysmodule,
            ...{
              logger: log4js.getLogger("info"),
              logelectron: log4js.getLogger("access"),
              loghttp: log4js.connectLogger(log4js.getLogger("access"), {
                level: log4js.levels.INFO,
                format: (...params) => {
                  let [req, res, cb] = params;
                  cb(
                    `:remote-addr - ":method :url HTTP/:http-version" :status :content-length ":referrer" ":user-agent"\ndata - query: ${JSON.stringify(
                      req.query
                    )} body: ${JSON.stringify(
                      req.body
                    )} params: ${JSON.stringify(req.params)}`
                  );
                },
              }),
            },
          };
          resolve(output);
        } catch (error) {
          output.code = -1;
          output.msg = error.message;
          resolve(output);
        }
      });
    };

    /**
     * Start loading main project
     * @alias module:app.startup
     * @returns {Object} - Return value
     */
    lib["startup"] = () => {
      return new Promise(async (resolve, reject) => {
        const { errhandler, serialize } = kernel.app;
        let output = {
          code: 0,
          msg: "app.js configlog done!",
          data: null,
        };
        try {
          let cond = [
            {
              func: "load",
              merge: {},
              joinp: false,
              params: ["coresetting.core", "core"],
            },
            {
              func: "call_message",
              merge: {},
              joinp: false,
              params: ["core", "coresetting.core"],
            },
            {
              func: "nested_load",
              merge: {},
              joinp: false,
              params: ["coresetting.atomic", "coresetting.general.atomic"],
            },
            {
              func: "call_message",
              merge: {},
              joinp: false,
              params: ["atomic", "coresetting.atomic"],
            },
            {
              func: "call_message",
              merge: {},
              joinp: false,
              params: ["components", "coresetting.components"],
            },
            {
              func: "delay",
              merge: {},
              joinp: false,
              params: ["coresetting.general.timeout"],
            },
            {
              func: "load",
              merge: {},
              joinp: false,
              params: ["coresetting.components", "components"],
            },
          ];

          let rtn = await serialize(
            {
              library: {
                load: (...args) => {
                  return new Promise(async (resolve, reject) => {
                    const [params, modname] = args;
                    const { load_module } = kernel.app;
                    let output = { code: 0, msg: "", data: null };
                    try {
                      kernel[modname] = await load_module(
                        params.path,
                        params.module,
                        modname
                      );
                      resolve(output);
                    } catch (error) {
                      reject(errhandler(error));
                    }
                  });
                },
                nested_load: (...args) => {
                  return new Promise(async (resolve, reject) => {
                    const [atomic, general] = args;
                    const { load_module } = kernel.app;
                    let output = { code: 0, msg: "", data: null };
                    let rtn = {};
                    try {
                      for (let val of general) {
                        rtn[val] = await load_module(
                          atomic[val].path,
                          atomic[val].module,
                          "atomic"
                        );
                      }
                      kernel["atomic"] = rtn;
                      resolve(output);
                    } catch (error) {
                      reject(errhandler(error));
                    }
                  });
                },
                call_message: (...args) => {
                  const [name, value] = args;

                  let emitdata = {};
                  emitdata[name] = value;
                  emitter.emit("onapp", emitdata);
                  console.log(
                    `Import ${name} done (${sysmodule
                      .dayjs()
                      .format("DD-MM-YYYY HH:mm:ss")})`
                  );

                  return { code: 0, msg: "", data: null };
                },
                delay: (...args) => {
                  return new Promise(async (resolve, reject) => {
                    const [timer] = args;
                    setTimeout(() => {
                      console.log("Delay done!");
                      resolve({
                        code: 0,
                        msg: 0,
                        data: {},
                      });
                    }, timer);
                  });
                },
              },
              params: {
                kernel: kernel,
                coresetting: coresetting,
                core: "core",
                atomic: "atomic",
                components: "components",
              },
            },
            cond,
            {
              failure: (error) => {
                throw error;
              },
            }
          );

          if (rtn.code != 0) throw rtn;
          else resolve(output);
        } catch (error) {
          resolve(errhandler(error));
        }
      });
    };

    /**
     * The main objective is find the value base on nested keyname
     * The detail refer to https://github.com/flexdinesh/typy
     * @alias module:app.dir_module
     * @param {Object} obj - Object
     * @param {String} dotSeparatedKeys - Nested keyname
     * @returns {Object} - Return modules | undefined
     */
    kernel.app["dir_module"] = (...args) => {
      const [pathname] = args;
      const { fs, path } = sysmodule;
      const { excludefile } = coresetting.general;

      return fs.readdirSync(path.join(pathname)).filter((filename) => {
        if (path.extname(filename) == "" && !excludefile.includes(filename)) {
          return filename;
        }
      });
    };

    /**
     * The main objective is find the value base on nested keyname
     * The detail refer to https://github.com/flexdinesh/typy
     * @alias module:app.load_module
     * @param {Object} obj - Object
     * @param {String} dotSeparatedKeys - Nested keyname
     * @returns {Object} - Return modules | undefined
     */
    kernel.app["load_module"] = (...args) => {
      return new Promise(async (resolve, reject) => {
        const [pathname, arr_modname, curdir] = args;
        const { errhandler } = kernel.app;
        const {
          path: { join },
        } = sysmodule;

        try {
          let modules = {};
          let arr_process = [];
          for (let val of arr_modname) {
            let modpath = join(pathname, val);
            let module = require(join(modpath), "utf8")(modpath, val, curdir);
            arr_process.push(module);
          }
          let arrrtn = await Promise.all(arr_process);
          for (let [idx, val] of Object.entries(arrrtn)) {
            if (curdir != "components") modules[arr_modname[idx]] = val;
            else val.done();
          }

          resolve(modules);
        } catch (error) {
          reject(errhandler(error));
        }
      });
    };

    /**
     * The main objective is find the value base on nested keyname
     * The detail refer to https://github.com/flexdinesh/typy
     * @alias module:app.dyimport
     * @param {Object} obj - Object
     * @param {String} dotSeparatedKeys - Nested keyname
     * @returns {Object} - Return modules | undefined
     */
    kernel.app["dyimport "] = async (...args) => {
      return new Promise(async (resolve, reject) => {
        const [name, fn] = args;
        const { dir_module, load_module, errhandler } = kernel.app;
        let output = { code: 0, msg: "", data: null };
        try {
          let df = await import(name);
          if (fn) output = df[fn];
          else output.data = df.default;
          resolve(output);
        } catch (error) {
          reject(errhandler(error));
        }
      });
    };

    /**
     * The main objective is find the value base on nested keyname
     * The detail refer to https://github.com/flexdinesh/typy
     * @alias module:app.getNestedObject
     * @param {Object} obj - Object
     * @param {String} dotSeparatedKeys - Nested keyname
     * @returns {Object} - Return modules | undefined
     */
    kernel.app["getNestedObject"] = (obj, dotSeparatedKeys) => {
      if (
        dotSeparatedKeys !== undefined &&
        typeof dotSeparatedKeys !== "string"
      )
        return undefined;
      if (typeof obj !== "undefined" && typeof dotSeparatedKeys === "string") {
        // split on ".", "[", "]", "'", """ and filter out empty elements
        const splitRegex = /[.\[\]'"]/g; // eslint-disable-line no-useless-escape
        const pathArr = dotSeparatedKeys
          .split(splitRegex)
          .filter((k) => k !== "");

        // eslint-disable-next-line no-param-reassign, no-confusing-arrow
        obj = pathArr.reduce(
          (o, key) => (o && o[key] !== "undefined" ? o[key] : undefined),
          obj
        );
      }
      return obj;
    };

    /**
     * Update object value by keyname
     * The detail refer to https://stackoverflow.com/questions/73071777/function-to-update-any-value-by-key-in-nested-object
     * @alias module:app.updateObject
     *  @param {String} key - keyname
     * @param {Array|Object|String|Integer} newValue - Value support all data type
     * @param {Object} obj - Object
     * @returns {Object} - Return modules | undefined
     */
    kernel.app["updateObject"] = (key, newValue, obj) => {
      let newObj = Object.assign({}, obj); // Make new object

      function updateKey(key, newValue, obj) {
        if (typeof obj !== "object") return; // Basecase
        if (obj[key]) obj[key] = newValue; // Look for and edit property
        else
          for (let prop in obj) {
            updateKey(key, newValue, obj[prop]); // Go deeper
          }
      }
      updateKey(key, newValue, newObj);
      return newObj;
    };

    /**
     * Serialize execution of a set of functions
     * @alias module:app.serialize
     *  @param {Object} obj - The source of functions prepare to call by proc defination
     * @param {Object} proc - Value support all data type
     * @param {Object} next - When error happen will execution if not undefined
     * @returns {Object} - Return final result
     */
    kernel.app["serialize"] = async (...args) => {
      return new Promise(async (resolve, reject) => {
        const [obj, proc, next] = args;
        const { getNestedObject, updateObject, errhandler } = kernel.app;
        let output = {
          code: 0,
          msg: "",
          data: null,
        };

        try {
          const pre_funcparam = (...args) => {
            let [obj, params] = args;
            let output = [];
            for (let queue of params) {
              let paramdata = getNestedObject(obj, queue);
              if (paramdata) output.push(paramdata);
            }
            return output;
          };

          for (let [, compval] of Object.entries(proc)) {
            let { func } = compval;
            let fn = getNestedObject(obj.library, func);
            if (!fn) {
              output.code = -3;
              output.msg = `Cannot find "${func}" function int object!`;
              break;
            }
          }
          if (output.code == 0) {
            let funcparam_next;
            for (let [, compval] of Object.entries(proc)) {
              let { func, merge, joinp, params } = compval;
              let fn = getNestedObject(obj.library, func);
              let funcparams = [];
              let queuertn;
              if (params) {
                funcparams = [
                  ...funcparams,
                  ...pre_funcparam(obj.params, params),
                ];
                funcparam_next = undefined;
              } else if (joinp) {
                funcparams = [
                  ...funcparams,
                  ...structuredClone(funcparam_next),
                  ...pre_funcparam(obj.params, params),
                ];
                funcparam_next = undefined;
              }

              queuertn = await fn.apply(null, funcparams);
              funcparam_next = structuredClone(funcparams);

              let { code, data } = queuertn;
              if (code == 0) {
                if (merge) {
                  for (let [mkey, mval] of Object.entries(merge)) {
                    obj[mkey] = {
                      ...obj[mkey],
                      ...updateObject(mval, data[mval], obj[mkey]),
                    };
                  }
                }
              } else {
                if (next) next.failure(queuertn);
              }
            }
          } else {
            if (next.failure) next.failure(output);
          }
          resolve(output);
        } catch (error) {
          reject(errhandler(error));
        }
      });
    };

    /**
     *  Produce all try catch error returning data format
     * @alias module:app.errhandler
     * @param {...Object} args - 1 parameters
     * @param {Object} args[0] - error try catch errror value
     * @returns {Object} - Return value
     */
    kernel.app["errhandler"] = (...args) => {
      let [error] = args;
      if (error.errno)
        return {
          code: error.errno,
          errno: error.errno,
          message: error.message,
          stack: error.stack,
          data: error,
        };
      else
        return {
          code: -1,
          errno: -1,
          message: error.message,
          stack: error.stack,
          data: error,
        };
    };

    let cond = [
      {
        func: "lib.initialize",
        merge: { params: "coresetting" },
        joinp: false,
        params: [],
      },
      {
        func: "lib.mkdirlog",
        merge: {},
        joinp: false,
        params: ["coresetting.logpath"],
      },
      {
        func: "lib.configlog",
        merge: {},
        joinp: false,
        params: ["coresetting.logpath", "coresetting.log"],
      },
      {
        func: "lib.startup",
        merge: {},
        joinp: false,
        params: [],
      },
      {
        func: "lib.job_done",
        merge: {},
        joinp: false,
        params: [],
      },
    ];

    let rtn = await kernel.app["serialize"](
      {
        library: {
          app: kernel.app,
          lib: {
            ...lib,
            job_done: () => {
              console.log(
                `done app (${sysmodule.dayjs().format("DD-MM-YYYY HH:mm:ss")})`
              );
              return {
                code: 0,
                msg: "",
                data: null,
              };
            },
          },
          sysmodule: sysmodule,
        },
        params: {
          coresetting: coresetting,
        },
      },
      cond,
      {
        failure: (error) => {
          throw error;
        },
      }
    );

    if (rtn.code != 0) throw rtn;
  } catch (error) {
    sysmodule.logger.error(error.stack);
    console.log(error.stack);
  }
})();
