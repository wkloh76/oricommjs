/**
 * Copyright (c) 2025   Loh Wah Kiang
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
 * The asistant of main module which is handle the submodule in each sub folder.
 * @module src_index
 */

module.exports = (...args) => {
  return new Promise(async (resolve, reject) => {
    try {
      class cengine {
        constructor(...args) {
          const [params, obj] = args;

          this.prjsrc = params[0];
          this.compname = params[1];
          this.library = obj[0];
          this.sys = obj[1];
          this.cosetting = obj[2];

          try {
            return new Promise(async (resolve) => {
              let rtninit = await this.init(this.cosetting);
              if (rtninit.code !== 0) throw rtninit;
              resolve(rtninit.data);
            });
            // };
          } catch (error) {}
        }

        get route() {
          return {
            controller: undefined,
            url: undefined,
            method: undefined,
            rules: undefined,
            from: undefined,
            name: undefined,
          };
        }

        get compstruct() {
          return {
            api: {},
            app: {},
            common: {},
            gui: {},
            less: {},
            public: {},
            rules: {},
            startup: {},
          };
        }

        general = async (...args) => {
          const [params, obj] = args;
          const [pathname, curdir, compname] = params;
          const [library, sys, cosetting] = obj;
          const [setting] = args;
          const { utils } = library;
          const { dir_module, errhandler, handler, import_cjs, import_vcjs } =
            utils;
          const { fs, path } = sys;
          const { existsSync } = fs;
          const { join } = path;
          const { excludefile } = cosetting.general;
          let output = handler.dataformat;

          try {
            let lib = {};
            for (let val of curdir) {
              let location = join(pathname, val);
              if (existsSync(location)) {
                let arr_modname = dir_module(location, excludefile);
                lib[val] = await import_cjs(
                  [location, arr_modname, compname],
                  utils,
                  [library, sys, cosetting]
                );
              }
            }
            output.data = lib;
          } catch (error) {
            output = errhandler(error);
          } finally {
            return output;
          }
        };
        rules = async (...args) => {
          const [params, obj] = args;
          const [pathname, curdir, compname] = params;
          const [library, sys, cosetting] = obj;
          const { utils } = library;
          const { dir_module, errhandler, handler, import_cjs, import_vcjs } =
            utils;
          const { fs, path } = sys;
          const { join } = path;
          const { existsSync, readFileSync } = fs;
          const { excludefile } = cosetting.general;
          let output = handler.dataformat;
          try {
            let lib = {
              rule: {},
              module: {},
            };

            let location = join(pathname, curdir[0]);
            if (existsSync(location)) {
              let rulespath = path.join(location, "rule.json");
              let arr_modname = dir_module(location, excludefile);
              let modules = await import_cjs(
                [location, arr_modname, compname],
                utils,
                [library, sys, cosetting]
              );

              for (let [, val] of Object.entries(modules)) {
                lib["module"] = { ...lib["module"], ...val };
              }
              if (existsSync(rulespath))
                lib["rule"] = JSON.parse(readFileSync(rulespath));
            }
            lib["regulation"] = {
              api: { strict: {}, nostrict: {}, none: {} },
              gui: { strict: {}, nostrict: {}, none: {} },
            };

            Object.keys(lib["rule"]).map((value) => {
              lib["regulation"]["api"]["strict"][value] = {};
              lib["regulation"]["gui"]["strict"][value] = {};
              lib["regulation"]["api"]["nostrict"][value] = {};
              lib["regulation"]["gui"]["nostrict"][value] = {};
            });

            output.data = { [curdir[0]]: lib };
          } catch (error) {
            output = errhandler(error);
          } finally {
            return output;
          }
        };
        guiapi = async (...args) => {
          const [params, obj] = args;
          const [pathname, curdir, compname] = params;
          const [library, sys, cosetting] = obj;
          const { components, utils } = library;
          const { dir_module, errhandler, handler, import_cjs, import_vcjs } =
            utils;
          const { fs, path } = sys;
          const { existsSync } = fs;
          const { join } = path;
          const { excludefile } = cosetting.general;
          let output = handler.dataformat;
          try {
            let lib = {};

            for (let value of curdir) {
              lib[value] = {};
              let location = join(pathname, value);
              if (existsSync(location)) {
                let arr_modname = dir_module(location, excludefile);
                let arr_modules = await this.import_module(
                  [location, arr_modname, compname],
                  obj
                );
                let { [value]: assets } = components[compname].rules.regulation;

                for (let [modname, RESTAPI] of Object.entries(arr_modules)) {
                  for (let [module_key, module_val] of Object.entries(
                    RESTAPI
                  )) {
                    if (Object.keys(module_val).length > 0) {
                      for (let [key, val] of Object.entries(module_val)) {
                        let url, controller;
                        let rtn = this.route;

                        rtn["from"] = val;
                        rtn["method"] = module_key;
                        rtn["strict"] = false;

                        if (
                          assets.none[modname] &&
                          assets.none[modname].includes(key)
                        ) {
                          rtn["name"] = key;
                          url = key;
                        } else {
                          if (!rtn["rules"]) {
                            Object.keys(assets.nostrict).map((value) => {
                              if (assets.nostrict[value][modname])
                                if (
                                  assets.nostrict[value][modname].includes(key)
                                ) {
                                  rtn["name"] = key;
                                  rtn["rules"] = value;
                                  url = key;
                                }
                            });
                          }

                          if (!rtn["rules"]) {
                            Object.keys(assets.strict).map((value) => {
                              if (assets.strict[value][modname]) {
                                if (
                                  assets.strict[value][modname].includes(key)
                                ) {
                                  rtn["name"] = key;
                                  rtn["rules"] = value;
                                  rtn["strict"] = true;
                                  url = key;
                                }
                              }
                            });
                          }
                        }

                        controller = val;
                        rtn["url"] = `/${compname}/${modname}/${url}`;
                        if (rtn?.["url"] && rtn?.["method"]) {
                          rtn["controller"] = controller;
                          lib[value][rtn["url"]] = rtn;
                        }
                      }
                    }
                  }
                }
              }
            }
            output.data = lib;
          } catch (error) {
            output = errhandler(error);
          } finally {
            return output;
          }
        };

        import_module = (...args) => {
          return new Promise(async (resolve, reject) => {
            const [list, obj, optional] = args;
            const [pathname, arr_modname, curdir] = list;
            const [library, sys] = obj;
            const { utils } = library;
            const { errhandler, mergeDeep } = utils;
            const { fs, path } = sys;
            const { existsSync, import_cjs, readdirSync } = fs;
            const { join } = path;

            try {
              let modules = {};
              let arr_process = [],
                arr_name = [];
              for (let val of arr_modname) {
                let modpath = join(pathname, val);
                let module;
                if (existsSync(join(modpath, "index.js"))) {
                  module = require(join(modpath, "index.js"), "utf8")(
                    [modpath, val, curdir],
                    obj
                  );
                  arr_name.push(val);
                  arr_process.push(module);
                } else {
                  let jsfiles = readdirSync(join(modpath, "controller"));
                  for (let jsfile of jsfiles) {
                    module = require(join(
                      modpath,
                      "controller",
                      jsfile
                    ), "utf8")([modpath, val, curdir], obj);
                    arr_name.push(val);
                    arr_process.push(module);
                  }
                }
              }
              let arrrtn = await Promise.all(arr_process);
              for (let [idx, val] of Object.entries(arrrtn)) {
                if (!modules[arr_name[idx]]) modules[arr_name[idx]] = val;
                else
                  modules[arr_name[idx]] = mergeDeep(
                    modules[arr_name[idx]],
                    val
                  );
              }
              resolve(modules);
            } catch (error) {
              reject(errhandler(error));
            }
          });
        };

        /**
         * Define the workflow for each method in controller
         * @alias module:src_index.pattern
         * @param {...Object} args - 2 parameters
         * @param {Array} args[0] - fn modules
         * @param {Array} args[1] - services modules
         * @returns
         */
        pattern = (...args) => {
          try {
            let [fn, rules] = args;
            let output,
              idx = 0;

            if (fn["rules"]) {
              output = [];
              let rule = rules.rule[fn["rules"]];
              let check = /[:]/.test(rule);
              let objname = {};
              if (check) {
                let cond = rule.split(":");
                let chk_before = /[-]/.test(cond[0]);
                let chk_after = /[-]/.test(cond[1]);
                if (chk_before) {
                  let before = cond[0].split("-");
                  for (let brules of before) {
                    objname[brules] = rules["module"][brules];
                    output.push(objname);
                    objname = {};
                    idx += 1;
                  }
                } else if (cond[0] != "") {
                  objname[cond[0]] = rules["module"][cond[0]];
                  output.push(objname);
                  objname = {};
                  idx += 1;
                }

                objname[fn["name"]] = fn["controller"];
                output.push(objname);
                objname = {};

                if (chk_after) {
                  let after = cond[1].split("-");
                  for (let arules of after) {
                    objname[arules] = rules["module"][arules];
                    output.push(objname);
                    objname = {};
                  }
                } else if (cond[1] != "") {
                  objname[cond[1]] = rules["module"][cond[1]];
                  output.push(objname);
                  objname = {};
                }
              } else {
                let chk_before = /[-]/.test(rule);
                if (chk_before) {
                  let before = rule.split("-");
                  for (let brules of before) {
                    objname[brules] = rules["module"][brules];
                    output.push(objname);
                    objname = {};
                    idx += 1;
                  }
                } else if (rule) {
                  objname[rule] = rules["module"][rule];
                  output.push(objname);
                  objname = {};
                  idx += 1;
                }
                objname[fn["name"]] = fn["controller"];
                output.push(objname);
                objname = {};
              }
            } else {
              output = [];
              let objname = {};
              objname[fn["name"]] = fn["controller"];
              output.push(objname);
            }

            return [output, idx];
          } catch (error) {
            throw Error(error);
          }
        };

        /**
         * Define the workflow for each method in controller
         * @alias module:src_index.prepare_rules
         * @param {...Object} args - 1 parameters
         * @param {Array} args[0].api - api modules
         * @param {Array} args[0].gui - gui modules
         * @param {Array} args[0].rules - services modules
         * @returns
         */
        prepare_rules = (...args) => {
          return new Promise(async (resolve, reject) => {
            let [{ api, gui, rules }] = args;
            const { errhandler } = this.library.utils;

            try {
              for (let [key] of Object.entries(api)) {
                let [controller, idx] = this.pattern(api[key], rules);
                api[key]["controller"] = controller;
                api[key]["idx"] = idx;
              }

              for (let [key] of Object.entries(gui)) {
                let [controller, idx] = this.pattern(gui[key], rules);
                gui[key]["controller"] = controller;
                gui[key]["idx"] = idx;
              }

              let routedoc = {
                api: { ...api },
                gui: { ...gui },
                rules: { ...rules },
              };

              resolve(routedoc);
            } catch (error) {
              return errhandler(error);
            }
          });
        };

        comb_obj = (...args) => {
          const [src, obj] = args;
          const { code, data } = obj;
          const { utils } = this.library;
          const { datatype } = utils;
          let output;
          if (code == 0 && datatype(data) == "object")
            output = {
              ...src,
              ...data,
            };
          else output = src;

          return output;
        };

        /**
         * Initialize
         * @alias module:src_index.init
         * @returns
         */
        init = async () => {
          const { dir, components, engine, utils } = this.library;
          const { errhandler, handler, mergeDeep } = utils;
          const { fs, path, toml } = this.sys;
          const { existsSync, readFileSync } = fs;
          const { join } = path;
          let output = handler.dataformat;
          try {
            let compname = this.compname;
            let prjsrc = this.prjsrc;
            let [compsetting] = compname.split("_");
            let setting = this.cosetting;
            let tomlpath = join(prjsrc, `${compsetting}.toml`);

            if (existsSync(tomlpath)) {
              let psetting = toml.parse(readFileSync(tomlpath), {
                bigint: false,
              });
              let mode = setting.args.mode;
              let { debug, production, ...settingtmp } = psetting;
              setting = mergeDeep(setting, settingtmp);
              setting[mode] = mergeDeep(setting[mode], psetting[mode]);
              setting["ongoing"][compname] = mergeDeep({}, psetting[mode]);
            }

            let comp_engine = engine[setting.general.engine.name];
            if (Object.keys(setting.share.atomic).length == 0)
              setting.share.atomic = join(dir, "atomic");

            let less = `@remote: "${setting.ongoing[compname].remote.cdn}";@internal: "/${compname}/less";@internalcss: "/${compname}/public/assets";`;

            let share = {};
            share[`/${compname}/public`] = join(prjsrc, "src", "public");
            share[`/${compname}/less`] = {
              fn: "onless",
              checkpoint: `${compname}/less`,
              content: less,
              filepath: join(prjsrc, "src", "public", "assets", "less"),
            };
            setting.share.public[compname] = share;

            components[compname] = this.compstruct;

            components[compname].less = {
              [`/${compname}/less`]: {
                config: less,
                path: join(prjsrc, "src", "public", "assets", "less"),
              },
            };

            components[compname] = this.comb_obj(
              components[compname],
              await this.general(
                [join(prjsrc, "src"), ["startup"], compname],
                [this.library, this.sys, setting]
              )
            );

            components[compname]["common"] = this.comb_obj(
              (components[compname]["common"]["models"] = {}),
              await this.general(
                [join(prjsrc, "src", "common"), ["models"], compname],
                [this.library, this.sys, setting]
              )
            );

            components[compname]["common"]["viewspath"] = join(
              prjsrc,
              "src",
              "common",
              "views"
            );

            if (setting.general.engine.type !== "app") {
              components[compname] = this.comb_obj(
                components[compname],
                await this.rules(
                  [join(prjsrc, "src"), ["rules"], compname],
                  [this.library, this.sys, setting]
                )
              );

              components[compname] = this.comb_obj(
                components[compname],
                await this.guiapi(
                  [join(prjsrc, "src"), ["api", "gui"], compname],
                  [this.library, this.sys, setting]
                )
              );
            } else {
              components[compname] = this.comb_obj(
                components[compname],
                await this.general(
                  [join(prjsrc, "src"), ["app"], compname],
                  [this.library, this.sys, setting]
                )
              );
            }

            let routejson = await this.prepare_rules(components[compname]);
            let dataset = {};
            dataset[compname] = components[compname];

            if (!setting.ongoing[compname].internalurl)
              setting.ongoing[compname].internalurl = {};
            setting.ongoing[compname].internalurl[
              `${compname}`
            ] = `/${compname}/public/assets`;

            dataset[compname].defaulturl = setting.ongoing[compname].defaulturl;
            comp_engine.register(dataset, compname, setting.general.engine);

            components.done.push(setting.general.engine);
            if (!components.start) components.start = comp_engine.start;

            if (Object.keys(components[compname]["startup"]).length > 0) {
              for (let [, module] of Object.entries(
                components[compname]["startup"]
              )) {
                if (!components.startup) components.startup = [];
                components.startup.push(module.startup);
              }
            }
            if (!components.routejson) components.routejson = { ...routejson };
            else
              components.routejson = mergeDeep(components.routejson, routejson);
            output.data = setting;
          } catch (error) {
            output = errhandler(error);
          } finally {
            return output;
          }
        };
      }

      resolve({ cengine });
    } catch (error) {
      reject(errhandler(error));
    }
  });
};
