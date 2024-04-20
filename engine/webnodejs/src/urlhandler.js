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
 * Submodule handles http responses, which are preprocessed by jsdom to manipulate the data before presenting to the client
 * @module src_urlhandler
 */
module.exports = async (...args) => {
  return new Promise(async (resolve, reject) => {
    const [params, obj] = args;
    const [pathname, curdir] = params;
    const [library, sys, cosetting] = obj;
    const { minify } = require("html-minifier-terser");
    const jsdom = require("jsdom");
    const { fs, path, logger } = sysmodule;
    const {
      utils: { handler, helper, getNestedObject },
    } = library;
    try {
      let components = {};

      let lib = {};

      /**
       * Merge multi css file to be sinlge string and render to frontend
       * @alias module:src_index.mergecss
       * @param {...Object} args - 1 parameters
       * @param {Object} args[0] - res the object for render to frontend
       * @param {Object} args[1] - files array of css file name
       */
      const mergecss = async (...args) => {
        let [res, files] = args;
        let css = "";
        for (let file of files) {
          css = css.concat(" ", fs.readFileSync(file, "utf8"));
        }
        css = await minify(css, {
          collapseWhitespace: true,
        });
        res.writeHead(200, { "Content-Type": "text/css" });
        res.status(200).write(`${css}`);
        res.end();
      };
      /**
       * The final process which is sending resutl to frontend
       * @alias module:src_index.processEnd
       * @param {...Object} args - 1 parameters
       * @param {Object} args[0] - res the object for render to frontend
       */
      const processEnd = async (...args) => {
        const { JSDOM } = jsdom;
        let [res] = args;
        try {
          let { status, view, options } = res.locals.render;
          let rtn = handler.dataformat2;
          let isview = handler.check_empty(view);
          let islayer = handler.check_empty(options.layer);
          let isredirect = handler.check_empty(options.redirect);
          let isjson = handler.check_empty(options.json);
          let istext = handler.check_empty(options.text);
          let iscss = handler.check_empty(options.css);

          if (!isredirect) {
            res.redirect(options.redirect);
          } else if (!isjson) {
            res.status(status).json(options.json);
          } else if (!istext) {
            res.status(status).send(options.text);
          } else if (!iscss) {
            await mergecss(options.css);
          } else if (!islayer || !isview) {
            let renderview, extname;
            if (view) extname = path.extname(view);
            else extname = ".eta";

            if (extname == ".eta") {
              let { Eta } = require("eta");

              let { layer } = options;
              if (handler.check_empty(layer)) layer = view;
              let template = path.basename(layer);
              let templatesrc = layer.substring(0, layer.lastIndexOf(template));
              let eta = new Eta({
                views: templatesrc,
                cache: true,
                autoEscape: true,
              });

              if (!handler.check_empty(view, helper.get_datatype(view))) {
                options.params["body"] = fs.readFileSync(view, "utf8");
              }

              if (status != 200) {
                renderview = options?.["params"]
                  ? eta.render(template, options.params)
                  : eta.render(template);
                renderview = await minify(renderview, {
                  collapseWhitespace: true,
                });
                res.status(status).send(renderview);
              } else {
                if (options?.["params"]) {
                  renderview = eta.render(template, options.params);
                } else renderview = eta.render(template);

                renderview = await minify(renderview, {
                  collapseWhitespace: true,
                });
                let dom = new JSDOM(renderview);
                let document = dom.window.document;
                let script = document.createElement("script");
                script.type = "text/javascript";
                script.innerHTML = `var jscss=${options.params.jscss}`;
                document.getElementsByTagName("head")[0].appendChild(script);
                let window = dom.serialize();
                res.status(status).send(window);
              }
            }
          } else {
            rtn.code = -1;
          }
          return rtn;
        } catch (error) {
          return { code: -1, msg: error.message, data: null };
        }
      };

      /**
       * The main objective is check the selected keys value either one is not empty
       * @alias module:src_index.isrender
       * @param {...Object} args - 2 parameters
       * @param {Array} args[0] - render modules
       * @param {Array} args[1] - gui modules
       * @returns {Boolean} - Either one is not empty will return false
       */
      const isrender = (...args) => {
        let [render] = args;
        let { view, options } = render;
        if (!handler.check_empty(view)) return false;
        if (!handler.check_empty(options.layer)) return false;
        if (!handler.check_empty(options.redirect)) return false;
        if (!handler.check_empty(options.json)) return false;
        if (!handler.check_empty(options.text)) return false;
        return true;
      };

      /**
       * The main objective is pick function from api or gui base on key name
       * @alias module:src_index.guiapi_picker
       * @param {...Object} args - 2 parameters
       * @param {Array} args[0] - api modules
       * @param {Array} args[1] - gui modules
       * @returns {Object} - Return function either from api or gui
       */
      const guiapi_picker = (...args) => {
        return new Promise(async (resolve, reject) => {
          try {
            let [api, gui] = args;
            let output;
            if (api) {
              output = api;
            } else if (gui) {
              output = gui;
            }
            resolve(output);
          } catch (e) {
            reject(e);
          }
        });
      };

      /**
       * The main objective is find the register url which embed restful route params
       * @alias module:src_index.guiapi_params_filter
       * @param {...Object} args - 2 parameters
       * @param {Array} args[0] - api modules
       * @param {Array} args[1] - gui modules
       * @param {Object} args[2] - The object content originalUrl in string and params in object
       * @returns {Object} - Return function either from api or gui
       */
      const guiapi_route_filter = (...args) => {
        return new Promise(async (resolve, reject) => {
          try {
            let [api, gui, { originalUrl, params }] = args;
            let output;

            let params_count = Object.keys(params).length;
            let original = originalUrl.split("/");
            let url =
              original.slice(0, original.length - params_count).join("/") + "/";

            let apikey = Object.keys(api).filter((item) => {
              if (item.indexOf(url) !== -1) {
                let filter = item
                  .substring(url.length)
                  .split(":")
                  .filter(Boolean);
                if (filter.length == params_count) return item;
              }
            });

            let guikey = Object.keys(gui).filter((item) => {
              if (item.indexOf(url) !== -1) {
                let filter = item
                  .substring(url.length)
                  .split(":")
                  .filter(Boolean);
                if (filter.length == params_count) return item;
              }
            });

            if (apikey.length > 0) output = api[apikey[0]];
            else if (guikey.length > 0) output = gui[guikey[0]];

            resolve(output);
          } catch (e) {
            reject(e);
          }
        });
      };

      const logerr = (...args) => {
        let [message] = args;
        logger.error(message);
      };

      /**
       * The main objective is on listen register url from http client
       * @alias module:src_index.onrequest
       * @param {...Object} args - 2 parameters
       * @param {Array} args[0] - orireq http request module
       * @param {Array} args[1] - orires http response module
       */
      lib["onrequest"] = async (...args) => {
        return new Promise(async (resolve, reject) => {
          let [orireq, orires, next] = args;
          let fn;
          try {
            let paramres = {};
            let paramerror;

            for (let [, compval] of Object.entries(components)) {
              let { api, gui } = compval;
              if (!handler.check_empty(orireq?.params)) {
                fn = await guiapi_route_filter(api, gui, {
                  params: orireq.params,
                  originalUrl: orireq.originalUrl,
                });
              } else {
                let baseUrl = orireq.originalUrl;
                let pos = orireq.originalUrl.indexOf("?");
                if (pos != -1) baseUrl = orireq.originalUrl.substring(0, pos);
                fn = await guiapi_picker(
                  getNestedObject(api, baseUrl),
                  getNestedObject(gui, baseUrl)
                );
              }
              if (fn) break;
            }

            if (fn) {
              if (orireq.method == fn.method.toUpperCase()) {
                let permit = true;
                for (let [idx, queue] of fn["controller"].entries()) {
                  let fname = Object.keys(queue)[0];
                  paramres["onreq"] = {
                    fname: fname,
                    index: idx,
                  };
                  let {
                    err: chkerr,
                    fname: chkfname,
                    render: chkrender,
                    ...chkparamres
                  } = paramres;

                  let response = {
                    err: {
                      error: "",
                      render: handler.webview,
                    },
                    fname: fname,
                    render: handler.webview,
                    ...chkparamres,
                  };

                  let queuertn;
                  if (permit && fn.idx == idx) {
                    queuertn = await queue[fname].apply(null, [
                      orireq,
                      response,
                    ]);
                    queuertn["action"] = queuertn.render;
                  } else if (fn.idx != idx) {
                    queuertn = await queue[fname].apply(null, [
                      orireq,
                      response,
                    ]);
                  }
                  let { err, render, ...res } = queuertn;

                  if (
                    err &&
                    (!isrender(err.render) || !handler.check_empty(err.error))
                  ) {
                    paramerror = { ...paramerror, ...err };
                    if (!isrender(err.render) && permit == true) permit = false;
                  }

                  if (render) {
                    if (!isrender(render)) paramres["render"] = render;
                  }
                  if (res) paramres = { ...paramres, ...res };
                  if (paramerror !== undefined) break;
                }
              } else {
                paramerror = {
                  render: handler.webview,
                  error: "Unmatched the request method!",
                };
              }

              // Error checking
              if (paramerror) {
                orires.locals = {
                  render: handler.webview,
                };
                let { render: err500 } = orires.locals;
                let page, pcontent;

                if (!isrender(paramerror.render))
                  orires.locals.render = paramerror.render;
                else if (!handler.check_empty(paramerror.error)) {
                  page = `${pathname}/error/500.eta`;
                  pcontent = {
                    title: "System Notification",
                    msg: `Catch error: ${paramerror.error}`,
                  };
                  err500["status"] = 500;
                  err500["view"] = page;
                  err500["options"]["params"] = pcontent;

                  if (fn?.from == "api") {
                    err500["options"]["json"] = {
                      ...handler.dataformat2,
                      ...{
                        code: -1,
                        msg: paramerror.error,
                      },
                    };
                  }

                  let errmsg = `"${orireq.method} ${orireq.originalUrl} HTTP/1.1" 500 Error:${paramerror.error}\n`;
                  logger.error(errmsg);
                }
              } else if (paramres) {
                if (paramres?.render) {
                  if (!isrender(paramres.render))
                    orires.locals = { render: paramres.render };
                } else orires.locals = { render: handler.webview };
              }
            } else {
              // Unregistered url
              orires.locals = { render: handler.webview };
              let { render: err404 } = orires.locals;
              err404["status"] = 404;
              err404["view"] = `${pathname}/error/404.eta`;
              err404["options"]["params"] = {
                title: "System Notification",
                msg: "Page not found",
              };

              let errstatment = err404["options"]["params"]["msg"];

              if (orireq.method != "GET") {
                err404["options"]["json"] = {
                  ...handler.dataformat2,
                  ...{ code: -1, msg: "API not found" },
                };
                errstatment = err404["options"]["json"]["msg"];
              }

              let errmsg = `"${orireq.method} ${orireq.originalUrl} HTTP/1.1" 404 Error:${errstatment}`;
              logerr(errmsg);
            }

            let rtn = await processEnd(orires);
            if (rtn.code !== 0) {
              orires.locals = { render: handler.webview };
              let { render: err500 } = orires.locals;
              err500["status"] = 500;
              err500["view"] = `${pathname}/error/500.eta`;
              err500["options"]["params"] = {
                title: "System Notification",
                msg: rtn.msg,
              };
              if (fn?.from == "api") {
                err500["options"]["json"] = {
                  ...handler.dataformat2,
                  ...{
                    code: -1,
                    msg: rtn.msg,
                  },
                };
              }

              let errmsg = `"${orireq.method} ${orireq.originalUrl} HTTP/1.1" 500 Error:${rtn.msg}`;
              logerr(errmsg);

              await processEnd(orires);
            }
            orires.end();
          } catch (error) {
            orires.locals = { render: handler.webview };
            let { render: err500 } = orires.locals;
            err500["status"] = 500;
            err500["view"] = `${pathname}/error/500.eta`;
            err500["options"]["params"] = {
              title: "System Notification",
              msg: error.message,
            };
            if (fn?.from == "api") {
              err500["options"]["json"] = {
                ...handler.dataformat2,
                ...{ code: -1, msg: error.message },
              };
            }
            let errmsg = `"${orireq.method} ${orireq.originalUrl} HTTP/1.1" 500 Error:${error.message}`;
            logerr(errmsg);

            await processEnd(orires);
            orires.end();
          }
        });
      };

      lib["config"] = (...args) => {
        let [oncomponents] = args;
        for (let [key, val] of Object.entries(oncomponents)) {
          let { api, gui } = val;
          components[key] = { api: api, gui: gui };
        }
      };

      lib["guiapi"] = (...args) => {
        let [compname] = args;
        return components[compname];
      };

      resolve(lib);
    } catch (error) {
      reject(error);
    }
  });
};
