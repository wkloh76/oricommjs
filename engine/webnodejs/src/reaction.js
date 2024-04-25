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
    const { fs, path, logger } = sys;
    const {
      utils: { arr_selected, handler, getNestedObject, datatype },
    } = library;
    try {
      let components = {};

      let lib = {};

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
       * The main objective is convert css data in object type to jsdom format and append to parent
       * @alias module:reaction.import_css
       * @param {...Object} args - 3 parameters
       * @param {Object} args[0] - doc is an object of jsdom window.document
       * @param {Object} args[1] - data is an object which listing css link source
       * @param {Object} args[2] - params is an object which use to concat data object value
       */
      const import_css = (...args) => {
        let [doc, data, params] = args;
        try {
          let el = doc.getElementsByTagName("head").item(0);
          for (let [key, val] of Object.entries(data)) {
            if (val.length > 0) {
              for (let href of val) {
                let gfgData = doc.createElement("link");
                let attributes = JSON.parse(
                  `{"rel":"stylesheet","type":"text/css","href":"${params[key]}${href}"}`
                );

                Object.keys(attributes).forEach((attr) => {
                  gfgData.setAttribute(attr, attributes[attr]);
                });
                el.appendChild(gfgData);
              }
            }
          }
          return;
        } catch (error) {
          return error;
        }
      };

      /**
       * The main objective is convert js data in object type to jsdom format and append to parent
       * @alias module:reaction.import_js
       * @param {...Object} args - 3 parameters
       * @param {Object} args[0] - doc is an object of jsdom window.document
       * @param {Object} args[1] - data is an object which listing js link source
       * @param {Object} args[2] - params is an object which use to concat data object value
       */
      const import_js = (...args) => {
        let [doc, data, params] = args;
        try {
          let el = doc.getElementsByTagName("head").item(0);
          for (let [key, val] of Object.entries(data)) {
            if (val.length > 0) {
              for (let href of val) {
                let gfgData = doc.createElement("script");
                let attributes = JSON.parse(
                  `{"rel":"stylesheet","type":"text/javascript","src":"${params[key]}${href}"}`
                );

                Object.keys(attributes).forEach((attr) => {
                  gfgData.setAttribute(attr, attributes[attr]);
                });
                el.appendChild(gfgData);
              }
            }
          }
          return;
        } catch (error) {
          return error;
        }
      };

      /**
       * The main objective is convert less.js data in object type to jsdom format and append to parent
       * @alias module:reaction.import_less
       * @param {...Object} args - 3 parameters
       * @param {Object} args[0] - doc is an object of jsdom window.document
       * @param {Object} args[1] - data is an object which listing less.js link source
       * @param {Object} args[2] - params is an object which use to concat data object value
       */
      const import_less = (...args) => {
        let [doc, data, params] = args;
        try {
          let el = doc.getElementsByTagName("head").item(0);
          for (let [key, val] of Object.entries(data.style)) {
            if (val.length > 0) {
              for (let href of val) {
                let gfgData = doc.createElement("link");
                let attributes = JSON.parse(
                  `{"rel":"stylesheet/less","type":"text/css","href":"${params[key]}${href}"}`
                );

                Object.keys(attributes).forEach((attr) => {
                  gfgData.setAttribute(attr, attributes[attr]);
                });
                el.appendChild(gfgData);
              }
            }
          }
          let engine = {};
          engine[data.engine.domain] = [data.engine.location];
          import_js(doc, engine, params);
          return;
        } catch (error) {
          return error;
        }
      };

      /**
       * The main objective is read a file content and minify become one row
       * @alias module:reaction.get_domhtml
       * @param {...Object} args - 1 parameters
       * @param {String} args[0] - file is file name which emebed absolute path
       * @returns {String} - Return undefined|text
       */
      const get_domhtml = async (...args) => {
        let [file] = args;
        let output;
        if (fs.existsSync(file)) {
          let renderview = fs.readFileSync(file, "utf8");
          output = await minify(renderview, {
            collapseWhitespace: true,
          });
        }
        return output;
      };

      /**
       * The main objective is read a list of file content and minify become one row
       * @alias module:reaction.get_filenames
       * @param {...Object} args - 1 parameters
       * @param {Object} args[0] - node is an object provide directory path and filter list
       * @param {Array} args[1] - included is check the file type which accept form the list
       * @returns {Object} - Return undefined|text
       */
      const get_filenames = async (...args) => {
        const [node, included = []] = args;
        let files = await fs
          .readdirSync(path.join(node.path))
          .filter((filename) => {
            let extname = path.extname(filename);
            if (
              extname !== "" &&
              !included.includes(extname) &&
              !node.excluded.includes(filename)
            ) {
              return filename;
            }
          });
        let docs = [];
        if (!files) return [];
        for (let val of files) {
          docs.push(get_domhtml(path.join(node.path, val)));
        }
        return await Promise.all(docs);
      };

      /**
       * The main objective is combine a list of file become one html text
       * @alias module:reaction.combine_layer
       * @param {...Object} args - 1 parameters
       * @param {Object} args[0] - layer is an object the list of files for merge purpose
       * @param {Object} args[1] - elcontent is object use for write data to relevent html element
       * @param {Object} args[2] - params is an object which use to concat data object value
       * @returns {Object} - Return object
       */
      const combine_layer = async (...args) => {
        const [layer, elcontent, params] = args;
        const { JSDOM } = jsdom;
        try {
          let output = { code: 0, msg: "", data: null };
          let master_dom, master_doc;
          let [layouts, childlists] = await Promise.all([
            get_domhtml(layer.layouts),
            get_filenames(layer.childs, ["*.html"]),
          ]);

          if (layouts) {
            master_dom = new JSDOM(layouts);
            master_doc = master_dom.window.document;

            for (let childlist of childlists) {
              let child_doc = new JSDOM().window.document;
              let body = child_doc.querySelector("body");
              body.innerHTML = childlist;
              let body_node = body.childNodes[0];
              if (body_node && body_node.nodeName == "STATEMENT") {
                let statement = body
                  .querySelector(body_node.nodeName)
                  .querySelectorAll("*");
                let attrname = body_node.getAttribute("name");
                let attraction = body_node.getAttribute("action");
                switch (attraction) {
                  case "overwrite":
                    master_doc.querySelector(attrname).innerHTML =
                      body_node.innerHTML;
                    break;

                  case "append":
                    for (const el of statement) {
                      let nodename = el.nodeName.toLocaleLowerCase();
                      if (nodename == "remotely" || nodename == "locally") {
                        let append = child_doc.createElement(attraction);
                        append.innerHTML =
                          body.querySelector(nodename).innerHTML;
                        for (const el of append.querySelectorAll("*")) {
                          let alterkeys = ["src", "href"];
                          let { code, data } = arr_selected(el, alterkeys);
                          if ((code = 0)) {
                            let value = el.getAttribute(data.toString());
                            el.setAttribute(key, params[nodename] + value);
                            master_doc.querySelector(attrname).innerHTML +=
                              el.outerHTML;
                          }
                        }
                      }
                    }
                    break;
                }
              }
            }

            for (let [el, content] of Object.entries(elcontent)) {
              master_doc.querySelector(el).innerHTML = content;
            }
            output.data = master_dom.serialize();
          } else {
            output.code = 1;
            output.msg = "Unable to get the content of layouts! ";
          }
          return output;
        } catch (error) {
          return { code: -1, msg: error.message, data: null };
        }
      };

      /**
       * The final process which is sending resutl to frontend
       * @alias module:reaction.processEnd
       * @param {...Object} args - 1 parameters
       * @param {Object} args[0] - res the object for render to frontend
       */
      const processEnd = async (...args) => {
        const { JSDOM } = jsdom;
        let [res] = args;
        try {
          let {
            status,
            view,
            options: {
              css,
              elcontent,
              js,
              json,
              layer,
              less,
              params,
              redirect,
              text,
            },
          } = res.locals.render;
          let rtn = handler.dataformat2;
          let isview = handler.check_empty(view);
          let islayer = handler.check_empty(layer.layouts);
          let isredirect = handler.check_empty(redirect);
          let isjson = handler.check_empty(json);
          let istext = handler.check_empty(text);
          // let iscss = handler.check_empty(options.css);

          if (!isredirect) {
            res.redirect(redirect);
          } else if (!isjson) {
            res.status(status).json(json);
          } else if (!istext) {
            res.status(status).send(text);
            // } else if (!iscss) {
            //   await mergecss(.css);
          } else if (!islayer || !isview) {
            let dom, extname, layouts, renderview;
            if (!isview) extname = path.extname(view);
            else if (!islayer) extname = path.extname(layer.layouts);

            if (extname == ".html") {
              if (!islayer) {
                let { code, data } = await combine_layer(
                  layer,
                  elcontent,
                  params
                );
                if (code == 0) layouts = data;
              }
              if (!isview) {
                let subdom = new JSDOM(await get_domhtml(view));
                view = subdom.serialize();
              }

              if (!layouts) {
                dom = new JSDOM(view);
              } else {
                dom = new JSDOM(layouts);
                let mainbody = dom.window.document.querySelector("mainbody");
                mainbody.innerHTML = new JSDOM(
                  await view
                ).window.document.querySelector("body").innerHTML;
              }

              let document = dom.window.document;
              for (let [el, content] of Object.entries(elcontent)) {
                let found = document.querySelector(el);
                if (found) found.innerHTML = content;
              }

              let preload = await get_domhtml(
                path.join(pathname, "browser", "preload.html")
              );
              document.querySelector("body").innerHTML += preload;
              let script = document.createElement("script");
              script.type = "text/javascript";
              script.innerHTML = `var mjs=${JSON.stringify(params.mjs)}`;
              document.getElementsByTagName("head")[0].appendChild(script);
              let rtnimport_css = import_css(document, css, params);
              if (rtnimport_css) throw rtnimport_css;
              let rtnimport_js = import_js(document, js, params);
              if (rtnimport_js) throw rtnimport_js;
              let rtnimport_less = import_less(document, less, params);
              if (rtnimport_less) throw rtnimport_less;

              res.status(status).send(dom.serialize());
            }
          } else {
            rtn.code = -1;
          }
          return rtn;
        } catch (error) {
          if (error.errno)
            return {
              code: error.errno,
              errno: error.errno,
              message: error.message,
              stack: error.stack,
              data: null,
            };
          else
            return {
              code: -1,
              errno: -1,
              message: error.message,
              stack: error.stack,
              data: null,
            };
        }
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
          } catch (e) {
            reject(e);
          }
        });
      };

      /**
       * The main objective is find the register url which embed restful route params
       * @alias module:reaction.guiapi_params_filter
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
                  queuertn = await queue[fname].apply(null, [orireq, response]);
                  queuertn["action"] = queuertn.render;
                } else if (fn.idx != idx) {
                  queuertn = await queue[fname].apply(null, [orireq, response]);
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
                page = `${pathname}/error/500.html`;
                pcontent = {
                  title: "System Notification",
                  msg: `Catch error: ${paramerror.error}`,
                };
                err500["status"] = 500;
                err500["view"] = page;
                err500["options"]["elcontent"] = pcontent;

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
            err404["view"] = `${pathname}/error/404.html`;
            err404["options"]["elcontent"] = {
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
            err500["view"] = `${pathname}/error/500.html`;
            err500["options"]["elcontent"] = {
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
          err500["view"] = `${pathname}/error/500.html`;
          err500["elcontent"]["title"] = "System Notification";
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
          let { api, gui } = val;
          components[key] = { api: api, gui: gui };
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
