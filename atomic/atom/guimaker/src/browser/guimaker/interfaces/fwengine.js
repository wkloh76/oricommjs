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
 * The submodule of interface
 * @module events
 */
export default await (async () => {
  let library, sys;
  try {
    let lib = {};

    lib.load = (...args) => {
      const [kernel, sysmodule] = args;
      library = kernel;
      sys = sysmodule;
    };

    const start = async (injection) => {
      const [library, sys, interfaces] = Object.values(glib.guimaker);
      const { utils } = library;
      const {
        arr_selected,
        datatype,
        handler,
        getNestedObject,
        objpick,
        pick_arrayofobj,
        pick_arrayobj2list,
        serialize,
      } = utils;
      const { jptr } = sys;
      const atom = {
        ...objpick(glib, "smfetch"),
      };
      const { webengine } = injection;

      let lib = {};

      let htmlengine = {};
      let objfuncs = {};
      let html_objevents = handler.winevents;

      const run = async (...args) => {
        const [event, task, showdata = true] = args;
        let output = handler.dataformat;
        try {
          let { htmlworkflow } = htmlengine;
          let objkeys = Object.keys(htmlworkflow);
          let fn, func, required;
          let task_type = datatype(task);
          if (task_type == "string") func = task;
          else if (task_type == "object") {
            let { taskname, required: req } = task;
            func = taskname;
            if (req) required = req;
          }

          const parallel = async (...args) => {
            const [input, share] = args;
            let process = [];
            for (let objserialize of input) {
              objserialize.func = objfuncs;
              objserialize.share = share;
              let rtn = await new serialize(
                objserialize,
                [library, sys],
                showdata
              );
              process.push(rtn);
              if (rtn.code != 0) break;
            }
            return process;
          };
          for (let item of objkeys) {
            let getfn = getNestedObject(htmlworkflow, `${item}.${func}`);
            if (getfn) {
              fn = getfn;
              break;
            }
          }
          if (fn) {
            let rtnprocess = [];
            let inputs = fn(event, func);
            if (inputs) {
              let share = { shared: { htmlengine, convtrigger } };
              if (required) share.shared = { ...share.shared, required };
              if (datatype(inputs) == "object") inputs = [inputs];
              let allexec = [];
              for (let input of inputs) {
                if (datatype(input) == "object") {
                  input.func = objfuncs;
                  input.share = share;
                  allexec.push(new serialize(input, [library, sys], showdata));
                } else if (datatype(input) == "array")
                  allexec.push(parallel(input, share));
              }
              rtnprocess = await Promise.all(allexec);

              let code = "";
              for (let chkrtnproc of rtnprocess) {
                if (datatype(chkrtnproc) == "array") {
                  let pickarrobj = pick_arrayofobj(chkrtnproc, ["code"]);
                  let chkcode = pick_arrayobj2list(pickarrobj, [
                    "code",
                  ]).code.join("");
                  let validcode = "0".padStart(chkrtnproc.length, "0");
                  if (chkcode != validcode) code += `[${chkcode}],`;
                } else {
                  if (chkrtnproc["code"] != 0)
                    code += `[${chkrtnproc["code"].toString()}],`;
                }
              }

              if (code != "") {
                output.code = -1;
                output.msg = code;
              }
              output.data = rtnprocess;
            } else {
              output.code = -1;

              output.msg = `Error: Incomplete workflow in ${func} process`;
            }
          }
        } catch (error) {
          output = errhandler(error);
        } finally {
          return output;
        }
      };

      const alter_arr2str = (...args) => {
        const [arr, front, back] = args;
        const inistr = "";
        const result = arr.reduce(
          (accumulator, cval) => accumulator + `${front}${cval}${back}`,
          inistr
        );
        return result.toString().trim();
      };

      const preproc = async (...args) => {
        const [event, showdata = true] = args;
        let attrs = event.currentTarget.attributes;
        let clsname = alter_arr2str(
          event.currentTarget.className.split(" "),
          ".",
          " "
        );
        let tagName = event.currentTarget.tagName;
        let id = `#${event.currentTarget.id}`;
        let func = attrs["func"].nodeValue;
        let qslist = [];

        if (tagName) qslist.push(tagName);
        if (id) qslist.push(id);
        if (clsname) qslist.push(clsname);

        for (let [key, valobjevent] of Object.entries(webengine.trigger)) {
          let evtkeys = Object.keys(valobjevent);
          let { code, data, msg } = arr_selected(qslist, evtkeys);
          if (data && data.length == 1) {
            let { attr } = valobjevent[data[0]];
            if (attr) {
              if (attr.required) {
                let { func: fn, required } = attr;
                func = { taskname: fn, required: required };
              }
            }
          }
        }
        if (func) return await run(event, func, showdata);
      };

      const load = async (...args) => {
        const [param] = args;
        for (let [name, value] of Object.entries(param.load)) {
          if (name.substring(0, 4) == "html") {
            let folder = name.substring(4);
            htmlengine[name] = {};
            for (let [parent, child] of Object.entries(value)) {
              for (let item of child) {
                let fnpath = `${param.path}${parent}/${folder}/${item}`;
                let fn = fnpath.split("/").pop().replace(".js", "");
                fn = fn.replace(".", "-");
                let { default: df } = await import(fnpath);
                if (df) {
                  let { load, register, ...other } = df;
                  if (htmlengine[name][fn])
                    htmlengine[name][fn] = {
                      ...htmlengine[name][fn],
                      ...other,
                    };
                  else htmlengine[name][fn] = other;
                  if (load) {
                    let helper;
                    if (folder == "event") helper = preproc;
                    else helper = atom;
                    await df.load([library, sys, interfaces], helper);
                  }
                }
              }
            }
          }
        }
      };

      const register = (...args) => {
        const [param, obj] = args;
        const { htmllogicflow, htmlrender, htmlcollection } = param;
        const { htmlevent } = param;
        const { utils } = library;
        const { mergeDeep } = utils;
        const { reaction } = interfaces;

        for (let funcs of [htmllogicflow, htmlrender, htmlcollection])
          objfuncs = mergeDeep(objfuncs, { ...funcs });

        reaction.regevents(obj, htmlevent);
      };

      const convtrigger = (...args) => {
        const [trigger] = args;
        let objevents = handler.winevents;
        for (let [name, value] of Object.entries(trigger)) {
          let fn = getNestedObject(html_objevents, name);
          if (fn) {
            let location = name.replaceAll(".", "/");
            jptr.set(objevents, location, value);
          }
        }
        return objevents;
      };

      if (webengine) {
        await load(webengine);
        register(htmlengine, convtrigger(webengine.trigger));
        if (webengine.startup) await run(null, webengine.startup, false);
      }
    };

    return lib;
  } catch (error) {
    return error;
  }
})();
