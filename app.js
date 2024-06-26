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

    global.sysmodule = {
      dayjs: require("dayjs"),
      events: require("events"),
      fs: require("fs"),
      ini: require("ini"),
      jptr: require("@sagold/json-pointer"),
      path: require("path"),
      toml: require("@ltd/j-toml"),
      yaml: require("yaml"),
    };

    global.kernel = {
      dir: process.cwd(),
      mode: "",
      utils: {},
      engine: {},
      atomic: {},
      components: { done: [] },
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
     * @param {...Object} args - 3 parameters
     * @param {Object} args[0] - cosetting is an object value from global variable coresetting
     * @param {Object} args[1] - sys is an object value from global variable sysmodule
     * @param {Object} args[2] - core is an object value from global variable kernel
     * @returns {Object} - Return value in object type
     */
    const initialize = (...args) => {
      return new Promise(async (resolve, reject) => {
        let [cosetting, sys, core] = args;
        let { fs, path, toml } = sys;
        let { platform, splitter } = cosetting;
        let { utils, dir, mode } = core;
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
              cosetting.args[args_key] = arg[1];
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
            if (tempcur != "") dir = tempcur;
          }
          if (fs.existsSync(`${dir}${splitter}resources${splitter}app.asar`))
            dir += `${splitter}resources${splitter}app.asar${splitter}`;
          else if (fs.existsSync(`${dir}${splitter}resources${splitter}app`))
            dir += `${splitter}resources${splitter}app${splitter}`;
          if (cosetting.args["mode"]) mode = cosetting.args["mode"];
          else mode = "production";

          let tomlpath = path.join(dir, `.${splitter}coresetting.toml`);

          if (fs.existsSync(tomlpath)) {
            let psetting = toml.parse(fs.readFileSync(tomlpath), {
              bigint: false,
            });
            let { debug, production, ...setting } = psetting;
            cosetting = { ...cosetting, ...setting };
            cosetting["nodepath"] = path.join(dir, "node_modules");

            cosetting[mode] = { ...psetting[mode] };
            cosetting["ongoing"] = { ...psetting[mode] };
          }

          cosetting.packagejson = JSON.parse(
            fs.readFileSync(path.join(dir, "package.json"), "utf8")
          );

          cosetting.logpath = path.join(
            cosetting.homedir,
            `.${cosetting.packagejson.name}`
          );

          let exlude_engine = [];
          if (!cosetting.args.engine) cosetting.args.engine = "webnodejs";
          for (let [item, value] of Object.entries(cosetting.general.engine)) {
            if (item == cosetting.args.engine) {
              cosetting.general.engine = { name: item, type: value };
            } else exlude_engine.push(item);
          }

          utils = {
            ...(await require(path.join(dir, "utils"))(
              path.join(dir, "utils"),
              "utils",
              cosetting
            )),
          };

          cosetting["engine"] = [
            path.join(dir, "engine"),
            utils.dir_module(path.join(dir, "engine"), exlude_engine),
            "engine",
          ];
          cosetting["atomic"] = {};
          for (let val of cosetting.general.atomic) {
            cosetting["atomic"][val] = [
              path.join(dir, "atomic", val),
              utils.dir_module(path.join(dir, "atomic", val), []),
              val,
            ];
          }
          cosetting["components"] = [
            path.join(dir, "components"),
            utils.dir_module(path.join(dir, "components"), []),
            "components",
          ];
          output.data = {
            coresetting: cosetting,
            kernel: { dir: dir, mode: mode, utils: utils },
          };
        } catch (error) {
          if (error.errno) {
            output.code = error.errno;
            output.errno = error.errno;
            output.message = error.message;
            output.stack = error.stack;
            output.data = error;
          } else {
            output.code = -1;
            output.msg = error.message;
            output.message = error.message;
            output.stack = error.stack;
            output.data = error;
          }
        } finally {
          resolve(output);
        }
      });
    };

    /**
     * Create log directory
     * @alias module:app.mkdirlog
     * @param {...Object} args - 2 parameters
     * @param {String} args[0] - logpath is Log file path
     * * @param {Object} args[1] - fs is an object value from global variable sysmodule.fs
     * @returns {Object} - - Return value in object type
     */
    const mkdirlog = (...args) => {
      return new Promise(async (resolve, reject) => {
        const [logpath, fs] = args;
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
          if (error.errno)
            resolve({
              code: error.errno,
              errno: error.errno,
              message: error.message,
              stack: error.stack,
              data: error,
            });
          else
            resolve({
              code: -1,
              errno: -1,
              message: error.message,
              stack: error.stack,
              data: error,
            });
        }
      });
    };

    /**
     * Configure log module for webexpress and normal log
     * @alias module:app.configlog
     * @param {...Object} args - 1 parameters
     * @param {Object} args[0] - cosetting is an object value from global variable coresetting
     * @param {Object} args[1] - path is a module from node_modules
     * @returns {Object} - - Return value in object type
     */
    const configlog = (...args) => {
      return new Promise(async (resolve, reject) => {
        const [cosetting, path] = args;
        const {
          log,
          logpath,
          args: { engine },
        } = cosetting;
        let output = {
          code: 0,
          msg: "app.js configlog done!",
          data: null,
        };
        try {
          const { default: log4js } = await import("log4js");
          let config = {
            appenders: {
              access: {
                filename: path.join(logpath, engine, "success.log"),
                ...log.success,
              },
              error: {
                filename: path.join(logpath, "error.log"),
                ...log.error,
              },
            },
            categories: {
              access: { appenders: ["access"], level: "INFO" },
              default: { appenders: ["access"], level: "ALL" },
              info: { appenders: ["error"], level: "ALL" },
            },
          };
          await log4js.configure(config);
          output.data = {
            logger: {
              logger: log4js.getLogger("info"),
              logelectron: log4js.getLogger("access"),
              loghttp: log4js.connectLogger(log4js.getLogger("access"), {
                level: log4js.levels.INFO,
                format: (req, res, cb) =>
                  cb(
                    `:remote-addr - ":method :url HTTP/:http-version" :status :content-length ":referrer" ":user-agent"\ndata - query: ${JSON.stringify(
                      req.query
                    )} body: ${JSON.stringify(
                      req.body
                    )} params: ${JSON.stringify(req.params)}`
                  ),
              }),
            },
            config: config,
          };
          resolve(output);
        } catch (error) {
          if (error.errno)
            resolve({
              code: error.errno,
              errno: error.errno,
              message: error.message,
              stack: error.stack,
              data: error,
            });
          else
            resolve({
              code: -1,
              errno: -1,
              message: error.message,
              stack: error.stack,
              data: error,
            });
        }
      });
    };

    /**
     * Start loading main project
     * @param {...Object} args - 3 parameters
     * @param {Object} args[0] - cosetting is an object value from global variable coresetting
     * @param {Object} args[1] - sys is an object value from global variable sysmodule
     * @param {Object} args[2] - core is an object value from global variable kernel
     * @returns {Object} - Return value
     */
    const startup = (...args) => {
      return new Promise(async (resolve, reject) => {
        const [cosetting, sys, core] = args;
        const { errhandler, import_cjs, serialize } = core.utils;
        let output = {
          code: 0,
          msg: "app.js configlog done!",
          data: null,
        };
        try {
          let cond = [
            {
              func: "load",
              save: { param: "/params/kernel/engine" },
              save_args: true,
              save_rtn: true,
              params: {
                name: "engine",
                data: ["/params/coresetting/engine", "/params/kernel/utils"],
              },
            },
            {
              func: "call_message",
              save: {},
              save_args: true,
              save_rtn: false,
              params: {
                name: "msg_engine",
                data: ["/save_args/engine/0/2", "/params/coresetting/engine"],
              },
            },
            {
              func: "nested_load",
              save: { param: "/params/kernel/atomic" },
              save_args: true,
              save_rtn: false,
              params: {
                name: "atomic",
                data: [
                  "/params/coresetting/atomic",
                  "/params/coresetting/general/atomic",
                  "/params/kernel/utils",
                ],
              },
            },
            {
              func: "call_message",
              save: {},
              save_args: true,
              save_rtn: false,
              params: {
                name: "msg_atomic",
                data: ["/params/msg_atomic", "/params/coresetting/atomic"],
              },
            },
            {
              func: "load",
              save: { param: "/params/tmp" },
              save_args: true,
              save_rtn: false,
              params: {
                name: "components",
                data: [
                  "/params/coresetting/components",
                  "/params/kernel/utils",
                ],
              },
            },
            {
              func: "mergedata",
              save: { param: "/params/coresetting" },
              save_args: true,
              save_rtn: false,
              params: {
                name: "merge_coresetting",
                data: ["/params/coresetting", "/params/tmp"],
              },
            },
            {
              func: "work",
              save: {},
              save_args: true,
              save_rtn: false,
              params: {
                name: "work",
                data: ["/params/coresetting", "/params/kernel/components"],
              },
            },
            {
              func: "routejson",
              save: {},
              save_args: true,
              save_rtn: false,
              params: {
                name: "routejson",
                data: [
                  "/params/kernel/components",
                  "/params/kernel",
                  "/params/fs",
                ],
              },
            },
            {
              func: "call_message",
              save: {},
              save_args: false,
              save_rtn: false,
              params: {
                name: "msg_components",
                data: [
                  "/save_args/components/0/2",
                  "/params/coresetting/components",
                ],
              },
            },
          ];
          let rtn = await serialize(
            {
              utils: core.utils,
              library: {
                load: (...args) => {
                  return new Promise(async (resolve, reject) => {
                    const [params, obj] = args;
                    let output = { code: 0, msg: "", data: null };
                    try {
                      output.data = await import_cjs(params, obj, [
                        core,
                        sys,
                        cosetting,
                      ]);
                      if (output.code != 0) throw output;
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
                        rtn[val] = await import_cjs(params[val], obj, [
                          kernel,
                          sysmodule,
                          coresetting,
                        ]);
                      }
                      output.data = rtn;
                      resolve(output);
                    } catch (error) {
                      reject(errhandler(error));
                    }
                  });
                },
                mergedata: (...args) => {
                  return new Promise(async (resolve, reject) => {
                    const [cosetting, tmp] = args;
                    let output = { code: 0, msg: "", data: null };
                    try {
                      output.data = { ...cosetting };
                      for (let [, v] of Object.entries(tmp)) {
                        output.data = { ...output.data, ...v };
                      }
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
                    `Import ${name} done (${sys
                      .dayjs()
                      .format("DD-MM-YYYY HH:mm:ss")})`
                  );
                  return { code: 0, msg: "", data: null };
                },
                work: (...args) => {
                  return new Promise(async (resolve, reject) => {
                    const [cosetting, comp] = args;
                    let output = { code: 0, msg: "", data: null };
                    try {
                      let { startup, start } = comp;
                      if (startup) {
                        for (let module of startup) {
                          let rtn = await module(cosetting.ongoing);
                          if (rtn) throw rtn;
                        }
                      }
                      if (start) {
                        let rtn = await start(cosetting);
                        if (rtn) throw rtn;
                      }
                      resolve(output);
                    } catch (error) {
                      reject(errhandler(error));
                    }
                  });
                },
                routejson: (...args) => {
                  return new Promise(async (resolve, reject) => {
                    const [comp, core, func] = args;
                    let output = { code: 0, msg: "", data: null };
                    try {
                      if (comp.routejson) {
                        let routefilename = func.path.join(
                          core.dir,
                          "components",
                          "route.json"
                        );
                        let routefile;
                        if (func.fs.existsSync(routefilename))
                          routefile = JSON.parse(
                            func.fs.readFileSync(routefilename, "utf8")
                          );

                        if (!routefile)
                          func.fs.writeFileSync(
                            routefilename,
                            JSON.stringify(comp.routejson)
                          );
                        else if (
                          JSON.stringify(comp.routejson) !==
                          JSON.stringify(routefile)
                        )
                          func.fs.writeFileSync(
                            routefilename,
                            JSON.stringify(comp.routejson)
                          );
                      }
                      resolve(output);
                    } catch (error) {
                      reject(errhandler(error));
                    }
                  });
                },
              },
              params: {
                kernel: core,
                coresetting: cosetting,
                msg_engine: "engine",
                msg_atomic: "atomic",
                msg_components: "components",
                fs: sys,
                tmp: {},
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

    let rtninit = await initialize(coresetting, sysmodule, kernel);
    if (rtninit.code != 0) throw rtninit;
    else {
      coresetting = { ...coresetting, ...rtninit.data.coresetting };
      kernel = { ...kernel, ...rtninit.data.kernel };
    }
    let rtnmklog = await mkdirlog(coresetting.logpath, sysmodule.fs);
    if (rtnmklog.code != 0) throw rtnmklog;
    let rtnconflog = await configlog(coresetting, sysmodule.path);
    if (rtnconflog.code != 0) throw rtnconflog;
    else {
      sysmodule = { ...sysmodule, ...rtnconflog.data.logger };
      coresetting["log4jsconf"] = rtnconflog.data.config;
    }

    let rtn = await startup(coresetting, sysmodule, kernel);
    if (rtn.code != 0) throw rtn;
    console.log(
      `done app (${sysmodule.dayjs().format("DD-MM-YYYY HH:mm:ss")})`
    );
  } catch (error) {
    sysmodule.logger.error(error.stack);
    console.log(error.stack);
  }
})();
