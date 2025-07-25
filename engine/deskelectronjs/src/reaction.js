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
 * @module src_reaction
 */
module.exports = async (...args) => {
  return new Promise(async (resolve, reject) => {
    const [params, obj] = args;
    const [pathname, curdir] = params;
    const [library, sys, cosetting] = obj;
    const { minify } = require("html-minifier-terser");
    const jsdom = require("jsdom");
    const { fs, path, logger } = sys;
    const { handler, getNestedObject } = library.utils;
    try {
      const molecule = await require("./reaction/molecule")(params, obj);

      let lib = {};
      let components = { defaulturl: "" };

      /**
       * Merge multi css file to be sinlge string and render to frontend
       * @alias module:reaction.mergecss
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
       * Cast the variables to master less.js file
       * @alias module:reaction.castless
       * @param {...Object} args - 1 parameters
       * @param {Object} args[0] - res the object for render to frontend
       * @param {Object} args[1] - head content which will merge to the less file
       * @param {Object} args[1] - file is less file name
       */
      const castless = async (...args) => {
        let [res, head, file] = args;
        let css = head;
        css = css.concat(" ", fs.readFileSync(file, "utf8"));
        css = await minify(css, {
          collapseWhitespace: true,
        });
        res.writeHead(200, { "Content-Type": "text/less" });
        res.status(200).write(`${css}`);
      };

      /**
       * The final process which is sending resutl to frontend
       * @alias module:reaction.processEnd
       * @param {...Object} args - 1 parameters
       * @param {Object} args[0] - res the object for render to frontend
       */
      const processEnd = (...args) => {
        return new Promise(async (resolve, reject) => {
          const { JSDOM } = jsdom;
          let [res, sess] = args;
          try {
            let {
              options: {
                css,
                html,
                injectionjs,
                js,
                json,
                layer,
                less,
                mjs,
                params,
                redirect,
              },
              status,
              rendererr,
              view,
            } = res.locals.render;
            let rtn = handler.dataformat;
            let isview = handler.check_empty(view);
            let islayer = handler.check_empty(layer.layouts);
            let isredirect = handler.check_empty(redirect);
            let isjson = handler.check_empty(json);
            let ishtml = handler.check_empty(html);
            // let iscss = handler.check_empty(options.css);

            if (!isredirect) {
              res.redirect(redirect, sess);
              resolve(rtn);
            } else if (!isjson) {
              res.status(status).json(json);
              resolve(rtn);
              // } else if (!iscss) {
              //   await mergecss(.css);
            } else if (!islayer || !isview || !ishtml) {
              let dom, isvalid, layouts;
              if (!ishtml) dom = new JSDOM(html);
              else {
                // if (!isview) isvalid = path.extname(view);
                // else if (!islayer) isvalid = path.extname(layer.layouts);
                if (!isview) {
                  if (path.extname(view) == ".html") isvalid = true;
                  else isvalid = molecule.indentify_html(view);
                } else if (!islayer) {
                  if (path.extname(layer.layouts) == ".html") isvalid = true;
                  else isvalid = molecule.indentify_html(layer.layouts);
                }
                if (isvalid) {
                  if (!islayer) {
                    if (!isview) layer.childs.external.push(view);
                    let { code, msg, data } = await molecule.combine_layer(
                      layer,
                      params
                    );
                    if (code == 0) layouts = data;
                    else throw { msg: msg, data: data };
                  } else if (!isview) {
                    let { code, msg, data } = await molecule.single_layer(
                      view,
                      params
                    );

                    if (code == 0) view = data;
                    else throw { msg: msg, data: data };
                  }

                  if (!layouts) {
                    dom = new JSDOM(view);
                  } else {
                    dom = new JSDOM(layouts);
                  }
                } else {
                  throw {
                    message:
                      "Cannot found any html extension file from view or options.layout property!",
                    stack:
                      "Cannot found any html extension file from view or options.layout property!",
                  };
                }
              }
              let document = dom.window.document;
              for (let [el, content] of Object.entries(params)) {
                let found = document.querySelector(el);
                if (found) found.innerHTML = content;
              }

              let preload = await molecule.get_domhtml(
                path.join(pathname, "browser", "preload.html")
              );
              document.querySelector("body").innerHTML += preload;
              let script = document.createElement("script");
              script.type = "text/javascript";
              script.innerHTML = `var mjs=${JSON.stringify(
                molecule.import_mjs(mjs, params)
              )};`;
              if (Object.keys(injectionjs.variables).length > 0)
                script.innerHTML += `var injectionjs=${JSON.stringify(
                  injectionjs.variables
                )}`;
              document.getElementsByTagName("head")[0].appendChild(script);
              let rtnimport_css = molecule.import_css(document, css, params);
              if (rtnimport_css) throw rtnimport_css;
              let rtnimport_js = molecule.import_js(document, js, params);
              if (rtnimport_js) throw rtnimport_js;
              let rtnimport_less = molecule.import_less(document, less, params);
              if (rtnimport_less) throw rtnimport_less;
              if (!rendererr)
                res.status(status).send(
                  await minify(dom.serialize(), {
                    collapseWhitespace: true,
                  }),
                  sess
                );
              else
                res.status(status).rendererr(
                  await minify(dom.serialize(), {
                    collapseWhitespace: true,
                  }),
                  sess
                );
            } else {
              throw {
                message:
                  "Cannot found any html file name from view or options.layout property or html in string type for render!",
                stack:
                  "Cannot found any html file name from view or options.layout property or html in string type for render!",
              };
            }

            resolve(rtn);
          } catch (error) {
            if (error.errno)
              resolve({
                code: error.errno,
                errno: error.errno,
                message: error.message,
                stack: error.stack,
                data: null,
              });
            else {
              let err = {
                code: 506,
                errno: 506,
                message: "",
                stack: "",
                data: null,
              };
              if (error.msg) {
                err.message = error.msg;
                err.stack = error.data;
              } else {
                err.message = error.message;
                err.stack = error.stack;
              }
              resolve(err);
            }
          }
        });
      };

      /**
       * The final process redirect gui content to frontend
       * @alias module:reaction.procredirect
       * @param {...Object} args - 1 parameters
       * @param {Object} args[0] - res the object for render to frontend
       */
      const procredirect = (...args) => {
        return new Promise(async (resolve, reject) => {
          const { JSDOM } = jsdom;
          let [res] = args;
          try {
            let {
              options: {
                css,
                html,
                injectionjs,
                js,
                json,
                layer,
                less,
                mjs,
                params,
                redirect,
              },
              status,
              view,
            } = res.locals.render;
            let rtn = handler.dataformat;
            let isview = handler.check_empty(view);
            let islayer = handler.check_empty(layer.layouts);
            let ishtml = handler.check_empty(html);
            // let iscss = handler.check_empty(options.css);

            if (!islayer || !isview || !ishtml) {
              let dom, isvalid, layouts;
              if (!ishtml) dom = new JSDOM(html);
              else {
                if (!isview) {
                  if (path.extname(view) == ".html") isvalid = true;
                  else isvalid = molecule.indentify_html(view);
                } else if (!islayer) {
                  if (path.extname(layer.layouts) == ".html") isvalid = true;
                  else isvalid = molecule.indentify_html(layer.layouts);
                }
                if (isvalid) {
                  if (!islayer) {
                    if (!isview) layer.childs.external.push(view);
                    let { code, msg, data } = await molecule.combine_layer(
                      layer,
                      params
                    );
                    if (code == 0) layouts = data;
                    else throw { msg: msg, data: data };
                  } else if (!isview) {
                    let { code, msg, data } = await molecule.single_layer(
                      view,
                      params
                    );

                    if (code == 0) view = data;
                    else throw { msg: msg, data: data };
                  }

                  if (!layouts) {
                    dom = new JSDOM(view);
                  } else {
                    dom = new JSDOM(layouts);
                  }
                } else {
                  throw {
                    message:
                      "Cannot found any html extension file from view or options.layout property!",
                    stack:
                      "Cannot found any html extension file from view or options.layout property!",
                  };
                }
              }
              let document = dom.window.document;
              for (let [el, content] of Object.entries(params)) {
                let found = document.querySelector(el);
                if (found) found.innerHTML = content;
              }

              let preload = await molecule.get_domhtml(
                path.join(pathname, "browser", "preload.html")
              );
              document.querySelector("body").innerHTML += preload;
              let script = document.createElement("script");
              script.type = "text/javascript";
              script.innerHTML = `var mjs=${JSON.stringify(
                molecule.import_mjs(mjs, params)
              )};`;
              if (Object.keys(injectionjs.variables).length > 0)
                script.innerHTML += `var injectionjs=${JSON.stringify(
                  injectionjs.variables
                )}`;
              document.getElementsByTagName("head")[0].appendChild(script);
              let rtnimport_css = molecule.import_css(document, css, params);
              if (rtnimport_css) throw rtnimport_css;
              let rtnimport_js = molecule.import_js(document, js, params);
              if (rtnimport_js) throw rtnimport_js;
              let rtnimport_less = molecule.import_less(document, less, params);
              if (rtnimport_less) throw rtnimport_less;
              rtn.data = await minify(dom.serialize(), {
                collapseWhitespace: true,
              });
            } else {
              throw {
                message:
                  "Cannot found any html file name from view or options.layout property or html in string type for render!",
                stack:
                  "Cannot found any html file name from view or options.layout property or html in string type for render!",
              };
            }

            resolve(rtn);
          } catch (error) {
            if (error.errno)
              resolve({
                code: error.errno,
                errno: error.errno,
                message: error.message,
                stack: error.stack,
                data: null,
              });
            else {
              let err = {
                code: 506,
                errno: 506,
                message: "",
                stack: "",
                data: null,
              };
              if (error.msg) {
                err.message = error.msg;
                err.stack = error.data;
              } else {
                err.message = error.message;
                err.stack = error.stack;
              }
              resolve(err);
            }
          }
        });
      };

      /**
       * The main objective is check the selected keys value either one is not empty
       * @alias module:reaction.isrender
       * @param {...Object} args - 2 parameters
       * @param {Array} args[0] - render modules
       * @param {Array} args[1] - gui modules
       * @returns {Boolean} - Either one is not empty will return false
       */
      const isrender = (...args) => {
        let [render] = args;
        let { options, view } = render;
        if (!handler.check_empty(options.html)) return false;
        if (!handler.check_empty(view)) return false;
        if (!handler.check_empty(options.layer.layouts)) return false;
        if (!handler.check_empty(options.redirect)) return false;
        if (!handler.check_empty(options.json)) return false;
        if (!handler.check_empty(options.html)) return false;

        return true;
      };

      /**
       * The main objective is pick function from api or gui base on key name
       * @alias module:reaction.guiapi_picker
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
          } catch (error) {
            reject(error);
          }
        });
      };

      /**
       * The main objective is find the register url which embed restful route params
       * @alias module:reaction.guiapi_route_filter
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
          } catch (error) {
            reject(error);
          }
        });
      };

      /**
       * The main objective is write the error statement to error.log
       * @alias module:reaction.logerr
       * @param {...Object} args - 1 parameters
       * @param {String} args[0] - message is error statement in text
       */
      const logerr = (...args) => {
        let [message] = args;
        logger.error(message);
      };

      /**
       * The main purpose is to prevent users from improperly using async/await and promise
       * methods to trigger unpredictable errors and cause the entire system to shut down.
       * When server receive the request from client, will proceed
       * @alias module:reaction.sanbox
       * @param {...Object} args - 1 parameters
       * @param {Object} args[0] - fn is mehtod/fuction for execution
       * @param {Array} args[1] - params is in array type which contant with request and response variable
       * @returns {Object} - Either return object or return data from execution function
       */
      const sanbox = async (...args) => {
        let [fn, params] = args;
        let [, response] = params;
        try {
          response.inspector = async (...args) => {
            let [fn, params] = args;
            try {
              let result = fn.apply(null, params);
              if (result instanceof Promise) {
                result = await result;
                if (result instanceof ReferenceError) throw result;
              } else if (result instanceof ReferenceError) throw result;
              return result;
            } catch (error) {
              if (error.msg) response.err.error = error.msg;
              else if (error.stack) response.err.error = error.stack;
              else if (error.message) response.err.error = error.message;
              return response;
            }
          };

          let result = fn.apply(null, params);
          if (result instanceof Promise) {
            result = await result;
            if (result instanceof ReferenceError) throw result;
          } else if (result instanceof ReferenceError) throw result;
          return result;
        } catch (error) {
          if (error.msg) response.err.error = error.msg;
          else if (error.stack) response.err.error = error.stack;
          else if (error.message) response.err.error = error.message;
          return response;
        }
      };
      /**
       * The main objective is on listen register url from http client
       * @alias module:reaction.onrequest
       * @param {...Object} args - 2 parameters
       * @param {Array} args[0] - orireq http request module
       * @param {Array} args[1] - orires http response module
       */
      lib["onrequest"] = async (...args) => {
        let [orireq, orires, next] = args;
        let fn;
        try {
          //Resolve web page caching across all browsers
          //https://stackoverflow.com/questions/49547/how-do-we-control-web-page-caching-across-all-browsers
          orires.setHeader(
            "Cache-Control",
            "no-cache, no-store, must-revalidate"
          ); // HTTP 1.1.
          orires.setHeader("Pragma", "no-cache"); // HTTP 1.0.
          orires.setHeader("Expires", "0"); // Proxies.

          let paramres = {};
          let paramerror;
          let errorstack;
          let redirect;
          let { defaulturl, ...component } = components;
          for (let [compkey, compval] of Object.entries(component)) {
            let { api, gui } = compval;
            let baseUrl = orireq.originalUrl;
            if (!handler.check_empty(orireq?.params)) {
              fn = await guiapi_route_filter(api, gui, {
                params: orireq.params,
                originalUrl: orireq.originalUrl,
              });
              if (baseUrl == `/${compkey}`) redirect = defaulturl;
            } else {
              let pos = orireq.originalUrl.indexOf("?");
              if (pos != -1) baseUrl = orireq.originalUrl.substring(0, pos);
              fn = await guiapi_picker(
                getNestedObject(api, baseUrl),
                getNestedObject(gui, baseUrl)
              );
              if (baseUrl == `/${compkey}`) redirect = defaulturl;
            }
            if (fn || redirect) break;
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
                  rule: chkrule,
                  ...chkparamres
                } = paramres;

                let response = {
                  err: {
                    error: "",
                    render: handler.webview,
                  },
                  fname: fname,
                  render: handler.webview,
                  rule: {},
                  ...chkparamres,
                };
                if (chkrule) response = { ...response, rule: chkrule };

                let queuertn;
                if (permit && fn.idx == idx) {
                  queuertn = sanbox(queue[fname], [orireq, response]);
                  if (queuertn instanceof Promise) queuertn = await queuertn;
                  queuertn["action"] = queuertn.render;
                } else if (fn.idx != idx) {
                  queuertn = sanbox(queue[fname], [orireq, response]);
                  if (queuertn instanceof Promise) queuertn = await queuertn;
                  queuertn["action"] = queuertn.render;
                }

                let { err, render, stack, message, ...res } = queuertn;
                if (stack && message) {
                  if (!err)
                    err = {
                      error: stack,
                      render: handler.webview,
                      ...res.data,
                    };
                  if (!res.action) res.action = err.render;
                }
                if (!res.action) {
                  delete queuertn["action"];
                  throw queuertn;
                }

                if (
                  err &&
                  (!isrender(err.render) || !handler.check_empty(err.error))
                ) {
                  if (
                    permit &&
                    idx >= fn.idx &&
                    idx + 1 <= fn.controller.length
                  ) {
                    if (errorstack) errorstack = { ...paramerror, ...err };
                    else errorstack = { ...{}, ...paramerror, ...err };
                  } else {
                    paramerror = { ...paramerror, ...err };
                    if (!isrender(err.render) && permit == true) permit = false;
                  }
                }

                if (render) {
                  if (!isrender(render)) paramres["render"] = render;
                }
                if (res) {
                  paramres = { ...paramres, ...res };
                  if (
                    permit &&
                    idx < fn.idx &&
                    res.action.options.redirect != ""
                  )
                    break;
                  if (!permit && idx > fn.idx && !fn.strict) break;
                }
                if (paramerror !== undefined) break;
              }
            } else {
              paramerror = {
                render: handler,
                error: "Unmatched the request method!",
              };
            }

            if (errorstack) paramerror = errorstack;
            // Error checking
            if (paramerror) {
              orires.locals = {
                render: handler.webview,
              };
              if (!handler.check_empty(paramerror.error))
                throw { code: 500, message: paramerror.error };
              if (!isrender(paramerror.render))
                orires.locals.render = paramerror.render;
            } else if (paramres) {
              if (paramres.render) {
                if (!isrender(paramres.render))
                  orires.locals = { render: paramres.render };
              } else orires.locals = { render: handler.webview };
            }
          } else if (redirect) {
            orires.locals = { render: handler.webview };
            orires.locals.render.options.redirect = redirect;
          } else throw { code: 404, message: "Page not found" };

          let rtn = await processEnd(orires, orireq.session);
          if (rtn.code !== 0) throw rtn;
        } catch (error) {
          orires.locals = { render: handler.webview };
          let { render: err } = orires.locals;
          let errcode, errmessage;

          if (error.code) {
            errcode = error.code;
            errmessage = error.message;
          } else if (error.err) {
            errcode = 506;
            if (error.err.error == "") errmessage = "Unexpected error!";
            else errmessage = error.err.error;
          } else {
            errcode = 506;
            errmessage = error;
          }
          if (fn?.from == "api") {
            err["options"]["json"] = {
              ...handler.dataformat,
              ...{ code: errcode, msg: errmessage },
            };
          } else {
            err["status"] = errcode;
            if (errcode >= 500)
              err["view"] = `${pathname}/browser/error/500.html`;
            else err["view"] = `${pathname}/browser/error/404.html`;
            let msg;
            if (typeof errmessage == "string") msg = errmessage;
            else msg = JSON.stringify(errmessage);

            err["options"]["params"] = {
              errorcode: errcode,
              title: "System Notification",
              msg: msg,
            };
          }
          let errmsg = `"${orireq.method} ${orireq.originalUrl} HTTP/1.1" ${errcode} Error:`;
          if (typeof errmessage == "string") errmsg += errmessage;
          else errmsg += JSON.stringify(errmessage);
          logerr(errmsg);
          orires.locals.render.rendererr = true;
          let result_catch = await processEnd(orires, orireq.session);
          if (result_catch.code != 0) {
            let msg = "onrquest catch error:";
            if (result_catch.stack) msg += result_catch.stack;
            else msg += result_catch.message;
            console.log(msg);
            logerr(msg);
          }
          orires.end();
        }
      };

      /**
       * The main objective is on listen register url from redirectly gui
       * @alias module:reaction.onredirect
       * @param {...Object} args - 2 parameters
       * @param {Array} args[0] - orireq http request module
       * @param {Array} args[1] - orires http response module
       */
      lib["onredirect"] = async (...args) => {
        let [orireq, orires, next] = args;
        let fn;
        try {
          //Resolve web page caching across all browsers
          //https://stackoverflow.com/questions/49547/how-do-we-control-web-page-caching-across-all-browsers
          orires.setHeader(
            "Cache-Control",
            "no-cache, no-store, must-revalidate"
          ); // HTTP 1.1.
          orires.setHeader("Pragma", "no-cache"); // HTTP 1.0.
          orires.setHeader("Expires", "0"); // Proxies.

          let paramres = {};
          let paramerror;
          let errorstack;
          let redirect;
          let { defaulturl, ...component } = components;
          for (let [compkey, compval] of Object.entries(component)) {
            let { api, gui } = compval;
            let baseUrl = orireq.originalUrl;
            if (!handler.check_empty(orireq?.params)) {
              fn = await guiapi_route_filter(api, gui, {
                params: orireq.params,
                originalUrl: orireq.originalUrl,
              });
            } else {
              let pos = orireq.originalUrl.indexOf("?");
              if (pos != -1) baseUrl = orireq.originalUrl.substring(0, pos);
              fn = await guiapi_picker(getNestedObject(gui, baseUrl));
            }
            if (fn) {
              orireq.method = fn.method;
              break;
            }
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
                  rule: chkrule,
                  ...chkparamres
                } = paramres;

                let response = {
                  err: {
                    error: "",
                    render: handler.webview,
                  },
                  fname: fname,
                  render: handler.webview,
                  rule: {},
                  ...chkparamres,
                };
                if (chkrule) response = { ...response, rule: chkrule };

                let queuertn;
                if (permit && fn.idx == idx) {
                  queuertn = sanbox(queue[fname], [orireq, response]);
                  if (queuertn instanceof Promise) queuertn = await queuertn;
                  queuertn["action"] = queuertn.render;
                } else if (fn.idx != idx) {
                  queuertn = sanbox(queue[fname], [orireq, response]);
                  if (queuertn instanceof Promise) queuertn = await queuertn;
                  queuertn["action"] = queuertn.render;
                }

                let { err, render, stack, message, ...res } = queuertn;
                if (stack && message) {
                  if (!err)
                    err = {
                      error: stack,
                      render: handler.webview,
                      ...res.data,
                    };
                  if (!res.action) res.action = err.render;
                }
                if (!res.action) {
                  delete queuertn["action"];
                  throw queuertn;
                }

                if (
                  err &&
                  (!isrender(err.render) || !handler.check_empty(err.error))
                ) {
                  if (
                    permit &&
                    idx >= fn.idx &&
                    idx + 1 <= fn.controller.length
                  ) {
                    if (errorstack) errorstack = { ...paramerror, ...err };
                    else errorstack = { ...{}, ...paramerror, ...err };
                  } else {
                    paramerror = { ...paramerror, ...err };
                    if (!isrender(err.render) && permit == true) permit = false;
                  }
                }

                if (render) {
                  if (!isrender(render)) paramres["render"] = render;
                }
                if (res) {
                  paramres = { ...paramres, ...res };
                  if (
                    permit &&
                    idx < fn.idx &&
                    res.action.options.redirect != ""
                  )
                    break;
                  if (!permit && idx > fn.idx && !fn.strict) break;
                }
                if (paramerror !== undefined) break;
              }
            } else {
              paramerror = {
                render: handler,
                error: "Unmatched the request method!",
              };
            }

            if (errorstack) paramerror = errorstack;
            // Error checking
            if (paramerror) {
              orires.locals = {
                render: handler.webview,
              };
              if (!handler.check_empty(paramerror.error))
                throw { code: 500, message: paramerror.error };
              if (!isrender(paramerror.render))
                orires.locals.render = paramerror.render;
            } else if (paramres) {
              if (paramres.render) {
                if (!isrender(paramres.render))
                  orires.locals = { render: paramres.render };
              } else orires.locals = { render: handler.webview };
            }
          }

          let rtn = await procredirect(orires);

          if (rtn.code !== 0) throw rtn;
          return rtn;
        } catch (error) {
          orires.locals = { render: handler.webview };
          let { render: err } = orires.locals;
          let errcode, errmessage;

          if (error.code) {
            errcode = error.code;
            errmessage = error.message;
          } else if (error.err) {
            errcode = 506;
            if (error.err.error == "") errmessage = "Unexpected error!";
            else errmessage = error.err.error;
          } else {
            errcode = 506;
            errmessage = error;
          }
          if (fn?.from == "api") {
            err["options"]["json"] = {
              ...handler.dataformat,
              ...{ code: errcode, msg: errmessage },
            };
          } else {
            err["status"] = errcode;
            if (errcode >= 500)
              err["view"] = `${pathname}/browser/error/500.html`;
            else err["view"] = `${pathname}/browser/error/404.html`;
            let msg;
            if (typeof errmessage == "string") msg = errmessage;
            else msg = JSON.stringify(errmessage);

            err["options"]["params"] = {
              errorcode: errcode,
              title: "System Notification",
              msg: msg,
            };
          }
          let errmsg = `"${orireq.method} ${orireq.originalUrl} HTTP/1.1" ${errcode} Error:`;
          if (typeof errmessage == "string") errmsg += errmessage;
          else errmsg += JSON.stringify(errmessage);
          logerr(errmsg);

          return await procredirect(orires);
        }
      };

      lib["onless"] = async (...args) => {
        let [orireq, orires] = args;
        let fn;
        try {
          let { defaulturl, ...component } = components;
          for (let [, compval] of Object.entries(component)) {
            let { less } = compval;
            let baseUrl = orireq.baseUrl;
            fn = getNestedObject(less, baseUrl);
            if (fn) {
              let file = path.join(fn.path, orireq.url);
              if (fs.existsSync(file)) await castless(orires, fn.config, file);
              break;
            }
          }
        } catch (error) {
        } finally {
        }
      };

      /**
       * The main objective is register api,gui modules into the cache memory
       * @alias module:reaction.register
       * @param {...Object} args - 1 parameters
       * @param {Object} args[0] - oncomponents gui and api modules
       */
      lib["register"] = (...args) => {
        let [oncomponents] = args;
        for (let [key, val] of Object.entries(oncomponents)) {
          let { api, gui, defaulturl, less } = val;
          components[key] = { api: api, gui: gui, less: less };
          if (components.defaulturl == "") components.defaulturl = defaulturl;
          else
            console.log(
              `The system rejects the new default url '${defaulturl}' because it is already assigned '${components.defaulturl}'`
            );
        }
      };

      lib = {
        ...lib,
        ...{
          get guiapi() {
            return components;
          },
        },
      };
      resolve(lib);
    } catch (error) {
      reject(error);
    }
  });
};
