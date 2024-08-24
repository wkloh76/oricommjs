"use strict";

/**
 * ES Module type
 * @module utils
 */

export default await (async () => {
  const { default: handler } = await import(`./handler.js`);
  let library, sys;

  try {
    const getNestedObject = (obj, dotSeparatedKeys) => {
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

    const datatype = (value) => {
      try {
        let output = typeof value;
        if (output == "string") {
          if (!isNaN(value)) output = "number";
        } else if (output == "object") {
          if (Array.isArray(value)) {
            output = "array";
          } else if (Object.keys(value).length > 0) {
            output = "object";
          }
        }
        return output;
      } catch (error) {
        return error;
      }
    };

    const pick_arrayofobj = (...args) => {
      let [arrobj, picker, rename] = args;
      let output = [];
      for (let [idx, obj] of Object.entries(arrobj)) {
        let data = {};

        picker.map((val) => {
          let dtype = datatype(val);

          if (dtype == "string") {
            let { [val]: reserve, ...rest } = obj;
            if (reserve !== undefined && reserve != null)
              data = { ...data, ...{ [val]: reserve } };
            output.push(data);
          } else if (dtype == "object") {
            let [keyname] = Object.keys(val);
            let { [keyname]: reserve, ...rest } = obj;

            if (rename) {
              let key = rename[idx];
              data = { ...data, ...{ [key]: reserve } };
            } else {
              data = { ...data, ...reserve };
            }

            if (output.length == 0) output.push({ [keyname]: data });
            else output[0][keyname] = { ...output[0][keyname], ...data };
          }
        });
      }
      return output;
    };

    const pick_arrayobj2list = (...args) => {
      let [arrobj, picker] = args;
      let output = {};
      for (let obj of arrobj) {
        picker.map((val) => {
          const { [val]: reserve, ...rest } = obj;
          if (reserve !== undefined && reserve != null) {
            if (!output[val]) output[val] = [];
            output[val].push(reserve);
          }
        });
      }
      return output;
    };

    const omit = (...args) => {
      let [object, keys] = args;
      let rtn = object;
      keys.split(" ").map((val) => {
        const { [val]: omitted, ...rest } = rtn;
        rtn = rest;
      });
      return rtn;
    };

    const objpick = (...args) => {
      let [object, keys] = args;
      let rtn = {};
      keys.split(" ").map((key) => (rtn[key] = object[key]));
      return rtn;
    };

    const arr_selected = (...args) => {
      const [source, compare] = args;
      let output = { code: 0, msg: "", data: null };
      try {
        output.data = source.filter(function (val) {
          return compare.indexOf(val) != -1;
        });
      } catch (error) {
        output = errhandler(error);
      } finally {
        return output;
      }
    };

    const arr_diffidx = (...args) => {
      const [source, compare, format = 1] = args;
      let output = { code: 0, msg: "", data: null };
      try {
        if (format == 2)
          output.data = {
            source: { index: [], value: [] },
            compare: { index: [], value: [] },
          };
        else output.data = [];
        let diff = source
          .concat(compare)
          .filter((val) => !(source.includes(val) && compare.includes(val)));
        if (diff.length > 0) {
          diff.forEach((value) => {
            let result;
            let pos_source = source.findIndex((element) => element == value);
            let pos_compare = compare.findIndex((element) => element == value);
            if (pos_source > -1) {
              if (format == 2) {
                output.data.source.index.push(pos_source);
                output.data.source.value.push(value);
              } else
                result = { from: "source", index: pos_source, value: value };
            } else if (pos_compare > -1) {
              if (format == 2) {
                output.data.compare.index.push(pos_compare);
                output.data.compare.value.push(value);
              } else
                result = {
                  from: "compare",
                  index: pos_compare,
                  value: value,
                };
            }
            if (result && format != 2) output.data.push(result);
          });
        }
      } catch (error) {
        output = errhandler(error);
      } finally {
        return output;
      }
    };

    const concatobj = (...args) => {
      const [type, param1, param2] = args;
      let output;
      let data1, data2;
      try {
        const mergedata = (type, arg1, arg2) => {
          let output;
          switch (type) {
            case "array":
              output = arg1.concat(arg2);
              break;
            case "object":
              output = mergeDeep(arg1, arg2);
              break;
          }
          return output;
        };

        let reftype = datatype(type);
        let refdata1 = datatype(param1);
        let refdata2 = datatype(param2);

        data1 = param1;
        data2 = param2;
        if (refdata1 == "undefined") data1 = type;
        if (refdata2 == "undefined") data2 = type;

        output = mergedata(reftype, data1, data2);
      } catch (error) {
        output = errhandler(error);
      } finally {
        return output;
      }
    };

    const sanbox = async (...args) => {
      let [fn, params] = args;
      try {
        let result = fn.apply(null, params);
        if (result instanceof Promise) {
          result = await result;
          if (result instanceof ReferenceError) throw result;
        } else if (result instanceof ReferenceError) throw result;
        return result;
      } catch (error) {
        return errhandler(error);
      }
    };

    const serialize = async (...args) => {
      return new Promise(async (resolve) => {
        const [params, obj, verbose = true] = args;
        const [library, sys] = obj;
        const { datatype, errhandler, getNestedObject, handler, sanbox } =
          library.utils;
        const { jptr } = sys;

        try {
          const { err, func: funcs, workflow, share } = params;
          let output = handler.dataformat;
          let temp = {};
          let terminate = false;
          let errmsg;

          const getparams = (...args) => {
            let [value, cache_temp, cache_share] = args;
            let result;
            if (value.lastIndexOf(".") > -1) {
              let location = value.replaceAll(".", "/");
              let getpull_temp = jptr.get(cache_temp, location);
              let getpull_share = jptr.get(cache_share, location);
              if (getpull_temp) result = getpull_temp;
              else if (getpull_share) result = getpull_share;
            }
            return result;
          };

          const proparams = (...args) => {
            const [param, obj] = args;
            const [pulling, parameter, idx] = param;
            const [localshare, pubshare] = obj;
            let funcparams = [];
            if (pulling[idx]) {
              if (pulling[idx].length == 0) {
                if (parameter[idx]) {
                  if (parameter[idx].length > 0) funcparams = parameter[idx];
                }
              } else {
                let cache_pull = [];
                for (let value of pulling[idx]) {
                  let dtype = datatype(value);
                  switch (dtype) {
                    case "string":
                      let result = getparams(value, localshare, pubshare);
                      if (result) cache_pull.push(result);
                      break;
                    case "array":
                      let arr_result = [];
                      for (let subval of value) {
                        let result = getparams(subval, localshare, pubshare);
                        if (result) arr_result.push(result);
                      }
                      cache_pull.push(arr_result);
                      break;
                  }
                }
                if (!parameter[idx]) {
                  if (cache_pull.length > 0) funcparams = cache_pull;
                } else {
                  if (cache_pull.length == 1) funcparams = cache_pull;
                  else if (cache_pull.length >= 1) funcparams.push(cache_pull);
                  if (parameter[idx].length == 1)
                    funcparams = funcparams.concat(parameter[idx]);
                  else if (parameter[idx].length > 1)
                    funcparams.push(parameter[idx]);
                }
              }
            } else {
              if (parameter[idx]) {
                if (parameter[idx].length > 0)
                  funcparams = funcparams.concat(parameter[idx]);
              }
            }

            return funcparams;
          };

          for (let [idx, compval] of Object.entries(workflow)) {
            errmsg = `Current onging step is:${parseInt(idx) + 1}/${
              workflow.length
            }. `;
            let { error, func, name, param, pull, push } = {
              ...handler.wfwseries,
              ...compval,
            };

            for (let [kfunc, vfunc] of Object.entries(func.split(","))) {
              let fn = getNestedObject(funcs, vfunc);
              if (fn) {
                let funcparams = proparams([pull, param, kfunc], [temp, share]);

                let queuertn = await sanbox(fn, funcparams);
                let { code, data, msg } = queuertn;
                if (code == 0) {
                  jptr.set(temp, `${name}/detail`, data);
                  if (push[kfunc]) {
                    push[kfunc].map((value, id) => {
                      let dataval;
                      if (data == null) dataval = data;
                      else if (data[value]) dataval = data[value];
                      else dataval = data;
                      if (value.lastIndexOf(".") > -1) {
                        let location = value.replaceAll(".", "/");
                        let emptycheck = jptr.get(share, location);
                        if (!emptycheck) jptr.set(share, location, dataval);
                        else {
                          let dtype = datatype(emptycheck);
                          switch (dtype) {
                            case "object":
                              jptr.set(
                                share,
                                location,
                                mergeDeep(emptycheck, dataval)
                              );
                              break;
                            case "array":
                              if (emptycheck.length == 0)
                                jptr.set(
                                  share,
                                  location,
                                  mergeDeep(emptycheck, dataval)
                                );
                              else
                                jptr.set(
                                  share,
                                  location,
                                  emptycheck.concat(dataval)
                                );
                              break;
                          }
                        }
                      } else jptr.set(temp, `${name}/${value}`, dataval);
                    });
                  }
                } else {
                  if (error != "") {
                    let fnerr = getNestedObject(funcs, error);
                    let fnerrrtn = await sanbox(fnerr, [queuertn, errmsg]);
                    if (!fnerrrtn) {
                      if (queuertn.stack) queuertn.stack += errmsg;
                      else if (queuertn.message) queuertn.message += errmsg;
                      else if (queuertn.msg) queuertn.msg += errmsg;
                      if (verbose == true) output = { ...queuertn, data: temp };
                      terminate = true;
                    }
                  } else if (err.length > 0) {
                    for (let [errkey, errfunc] of Object.entries(err)) {
                      let { func, name, param, pull, push } = {
                        ...handler.wfwseries,
                        ...errfunc,
                      };

                      let fn = getNestedObject(funcs, func);
                      if (fn) {
                        let funcparams = proparams(
                          [pull, param, errkey],
                          [temp, share]
                        );
                        let fnerrrtn = await sanbox(fn, [
                          queuertn,
                          errmsg,
                          funcparams,
                        ]);
                        if (!fnerrrtn) {
                          if (queuertn.stack) queuertn.stack += errmsg;
                          else if (queuertn.message) queuertn.message += errmsg;
                          else if (queuertn.msg) queuertn.msg += errmsg;
                          if (verbose == true)
                            output = { ...queuertn, data: temp };
                          terminate = true;
                        }
                      }
                    }
                  }
                }
              } else {
                output.code = -3;
                output.msg = `Process stop at (${name}).${errmsg}. `;
                terminate = true;
              }
              if (terminate == true) break;
            }
            if (terminate == true) break;
          }

          if (output.code == 0 && verbose == true) output.data = temp;

          resolve(output);
        } catch (error) {
          resolve(errhandler(error));
        }
      });
    };

    const errhandler = (...args) => {
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

    let lib = {
      sanbox: sanbox,
      getNestedObject: getNestedObject,
      datatype: datatype,
      pick_arrayofobj: pick_arrayofobj,
      pick_arrayobj2list: pick_arrayobj2list,
      omit: omit,
      objpick: objpick,
      arr_selected: arr_selected,
      arr_diffidx: arr_diffidx,
      concatobj: concatobj,
      serialize: serialize,
      errhandler: errhandler,
      handler,
    };

    return lib;
  } catch (error) {
    return error;
  }
})();
