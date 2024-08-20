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
      share: { public: {}, atomic: {} },
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
                filename: path.join(logpath, "error", "error.log"),
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

    let startupfunc = {
      load: (...args) => {
        return new Promise(async (resolve, reject) => {
          const [params, obj] = args;
          const [library, sys, cosetting] = obj;
          const {
            utils,
            utils: { errhandler, handler, import_cjs },
          } = library;
          let output = handler.dataformat;
          try {
            output.data = await import_cjs(params, utils, obj);
            if (output.code != 0) throw output;
            resolve(output);
          } catch (error) {
            reject(errhandler(error));
          }
        });
      },
      nested_load: (...args) => {
        return new Promise(async (resolve, reject) => {
          const [params, obj] = args;
          const [atomic, general] = params;
          const [library] = obj;
          const {
            utils,
            utils: { errhandler, handler, import_cjs },
          } = library;
          let output = handler.dataformat;
          let rtn = {};
          try {
            for (let val of general) {
              rtn[val] = await import_cjs(atomic[val], utils, obj);
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
        const [params, obj] = args;
        const [library, sys] = obj;
        console.log(
          `Import ${params} done (${sys.dayjs().format("DD-MM-YYYY HH:mm:ss")})`
        );
        return library.utils.handler.dataformat;
      },
      work: (...args) => {
        return new Promise(async (resolve, reject) => {
          const [params, obj] = args;
          const [library] = obj;
          const {
            components,
            utils: { errhandler, handler },
          } = library;
          let output = handler.dataformat;

          try {
            let { startup, start } = components;
            if (startup) {
              for (let module of startup) {
                let rtn = await module(params.ongoing);
                if (rtn) throw rtn;
              }
            }
            if (start) {
              let rtn = await start(params);
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
          const [params, obj] = args;
          const [library, sys] = obj;
          const {
            dir,
            utils: { errhandler, handler },
          } = library;
          const {
            fs: { existsSync, readFileSync, writeFileSync },
            path: { join },
          } = sys;
          let output = handler.dataformat;

          try {
            if (params.routejson) {
              let routefilename = join(dir, "components", "route.json");
              let routefile;
              if (existsSync(routefilename))
                routefile = JSON.parse(readFileSync(routefilename, "utf8"));

              if (!routefile)
                writeFileSync(routefilename, JSON.stringify(params.routejson));
              else if (
                JSON.stringify(params.routejson) !== JSON.stringify(routefile)
              )
                writeFileSync(routefilename, JSON.stringify(params.routejson));
            }
            resolve(output);
          } catch (error) {
            reject(errhandler(error));
          }
        });
      },
      failure: (error) => {
        throw error;
      },
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
        const [, obj] = args;
        const [library, sys, cosetting] = obj;
        const {
          utils: {
            errhandler,
            handler: { dataformat, fmtseries, wfwseries },
            serialize,
          },
        } = library;
        let output = dataformat;
        let input = fmtseries;

        try {
          input.func = startupfunc;
          input.err = ["failure"];
          input.share = {
            lib: { library: library },
            setting: { cosetting: cosetting },
            message: {
              engine: "engine",
              atomic: "atomic",
              components: "components",
            },
            core: { obj: obj },
          };
          input.workflow = [
            {
              name: "load_engine",
              func: "load",
              param: [[obj]],
              push: [["data"]],
              pull: [["setting.cosetting.engine"]],
              push: [["engine", "lib.library.engine"]],
            },
            {
              name: "msg_engine",
              func: "call_message",
              param: [[obj]],
              pull: [["message.engine"]],
            },
            {
              name: "load_atomic",
              func: "nested_load",
              param: [[obj]],
              pull: [
                [
                  "setting.cosetting.atomic",
                  "setting.cosetting.general.atomic",
                ],
              ],
              push: [["atomic", "lib.library.atomic"]],
            },
            {
              name: "msg_atomic",
              func: "call_message",
              param: [[obj]],
              pull: [["message.atomic"]],
            },
            {
              name: "load_components",
              func: "load",
              param: [[obj]],
              pull: [["setting.cosetting.components"]],
              push: [["components"]],
            },
            {
              name: "merge_coresetting",
              func: "mergedata",
              pull: [["setting.cosetting", "load_components.components"]],
              push: [["cosetting", "setting.cosetting"]],
            },
            {
              name: "work",
              func: "work",
              param: [[obj]],
              pull: [["setting.cosetting"]],
            },
            {
              name: "routejson",
              func: "routejson",
              param: [[obj]],
              pull: [["lib.library.components"]],
            },
            {
              name: "msg_components",
              func: "call_message",
              param: [[obj]],
              pull: [["message.components"]],
            },
          ];

          let rtn = await serialize(input, obj);
          if (rtn.code != 0) throw rtn;
          resolve(output);
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

    let rtn = await startup(null, [kernel, sysmodule, coresetting]);
    if (rtn.code != 0) throw rtn;
    console.log(
      `done app (${sysmodule.dayjs().format("DD-MM-YYYY HH:mm:ss")})`
    );
  } catch (error) {
    sysmodule.logger.error(error.stack);
    console.log(error.stack);
  }
})();
