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
    let argv = [];
    let lib = {};
    global.sysmodule = {
      path: require("path"),
      fs: require("fs"),
      events: require("events"),
      lodash: require("lodash"),
      dayjs: require("dayjs"),
      toml: require("@ltd/j-toml"),
    };
    global.kernel = {
      dir: process.cwd(),
      utils: {},
      engine: {},
      atomic: {},
      components: {},
    };
    global.coresetting = {
      args: {},
      splitter: "/",
      platform: process.platform,
      homedir: require("os").homedir(),
    };

    sysmodule.events.EventEmitter.defaultMaxListeners = 50;
    global.emitter = new sysmodule.events.EventEmitter();

    /**
     * initialize pre process setting
     * @alias module:app.initialize
     * @param {...Object} args - 0 parameters
     * @returns {Object} - Return value
     */
    const initialize = (...args) => {
      return new Promise(async (resolve, reject) => {
        const { fs, path, toml } = sysmodule;
        let { platform, splitter } = coresetting;
        let output = {
          code: 0,
          msg: "",
          data: null,
        };
        try {
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

          if (sysmodule.fs.existsSync(tomlpath)) {
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
            coresetting.homedir,
            `.${coresetting.packagejson.name}`
          );
          coresetting.general.engine = coresetting.general.engine.filter(
            (item) => item !== coresetting.args.engine
          );

          kernel.utils = {
            ...(await require(sysmodule.path.join(kernel.dir, "utils"))(
              sysmodule.path.join(kernel.dir, "utils"),
              "utils",
              coresetting
            )),
          };

          coresetting["engine"] = [
            path.join(kernel.dir, "engine"),
            kernel.utils.dir_module(
              path.join(kernel.dir, "engine"),
              coresetting.general.engine
            ),
            "engine",
          ];
          coresetting["atomic"] = {};
          for (let val of coresetting.general.atomic) {
            coresetting["atomic"][val] = [
              path.join(kernel.dir, "atomic", val),
              kernel.utils.dir_module(path.join(kernel.dir, "atomic", val), []),
              val,
            ];
          }
          coresetting["components"] = [
            path.join(kernel.dir, "components"),
            kernel.utils.dir_module(path.join(kernel.dir, "components"), []),
            "components",
          ];
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
    const mkdirlog = (...args) => {
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
    const configlog = (...args) => {
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
    const startup = () => {
      return new Promise(async (resolve, reject) => {
        const { errhandler, import_cjs, serialize } = kernel.utils;
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
              params: ["coresetting.engine", "kernel.utils"],
            },
            {
              func: "call_message",
              merge: {},
              joinp: false,
              params: ["engine", "coresetting.engine"],
            },
            {
              func: "nested_load",
              merge: {},
              joinp: false,
              params: [
                "coresetting.atomic",
                "coresetting.general.atomic",
                "kernel.utils",
              ],
            },
            {
              func: "call_message",
              merge: {},
              joinp: false,
              params: ["atomic", "coresetting.atomic"],
            },
            {
              func: "load",
              merge: {},
              joinp: false,
              params: ["coresetting.components", "kernel.utils"],
            },
            {
              func: "call_message",
              merge: {},
              joinp: false,
              params: ["components", "coresetting.components"],
            },
          ];
          let rtn = await serialize(
            {
              utils: kernel.utils,
              library: {
                load: (...args) => {
                  return new Promise(async (resolve, reject) => {
                    const [params, obj] = args;
                    let output = { code: 0, msg: "", data: null };
                    try {
                      kernel[params[2]] = await import_cjs(params, obj);
                      resolve(output);
                    } catch (error) {
                      reject(errhandler(error));
                    }
                  });
                },
                nested_load: (...args) => {
                  return new Promise(async (resolve, reject) => {
                    const [params, general, obj] = args;
                    let output = { code: 0, msg: "", data: null };
                    let rtn = {};
                    try {
                      for (let val of general) {
                        rtn[val] = await import_cjs(params[val], obj);
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
                utils: kernel.utils,
              },
              params: {
                kernel: kernel,
                coresetting: coresetting,
                engine: "engine",
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

    await initialize();
    await mkdirlog(coresetting.logpath);
    await configlog(coresetting.logpath, coresetting.log);
    let rtn = await startup();
    if (rtn.code != 0) throw rtn;
    console.log(`done app (${sysmodule.dayjs().format("DD-MM-YYYY HH:mm:ss")})`);
  } catch (error) {
    sysmodule.logger.error(error.stack);
    console.log(error.stack);
  }
})();
