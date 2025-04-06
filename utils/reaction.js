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

const { minify } = require("html-minifier-terser");
const jsdom = require("jsdom");
const htmlTags = require("./data/html-tags.json");

/**
 * Submodule handles http responses, which are preprocessed by jsdom to manipulate the data before presenting to the client
 * @module utils_reaction
 */
module.exports = async (...args) => {
  return new Promise(async (resolve, reject) => {
    const [params, obj] = args;
    const [pathname, curdir] = params;
    const [library, sys, cosetting] = obj;
    const { handler, getNestedObject, sanbox } = library.utils;
    const { fs, path, logger } = sys;

    try {
      const basic =
        /\s?<!doctype html>|(<html\b[^>]*>|<body\b[^>]*>|<x-[^>]+>)+/i;
      const full = new RegExp(
        htmlTags.map((tag) => `<${tag}\\b[^>]*>`).join("|"),
        "i"
      );
      let lib = {};
      let components = { defaulturl: "" };

      /**
       * The main objective is convert css data in object type to jsdom format and append to parent
       * @alias module:utils_reaction.import_css
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
                let url = href;
                if (key != "other") url = params[key] + href;
                let attributes = JSON.parse(
                  `{"rel":"stylesheet","type":"text/css","href":"${url}"}`
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
       * @alias module:utils_reaction.import_js
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
                let url = href;
                if (key != "other") url = params[key] + href;
                let attributes = JSON.parse(
                  `{"type":"text/javascript","src":"${url}"}`
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
       * The main objective is concat string become complete url for ES Module
       * @alias module:utils_reaction.import_mjs
       * @param {...Object} args - 3 parameters
       * @param {Object} args[0] - doc is an object of jsdom window.document
       * @param {Object} args[1] - data is an object which listing js link source
       * @param {Object} args[2] - params is an object which use to concat data object value
       */
      const import_mjs = (...args) => {
        let [data, params] = args;
        try {
          let initialize = {},
            libname = [];
          for (let [key, val] of Object.entries(data)) {
            if (key == "initialize") initialize[key] = val;
            else {
              if (val.length > 0) {
                for (let href of val) {
                  let url = href;
                  if (key != "other") url = params[key] + href;
                  libname.push(url);
                }
              }
            }
          }
          return { initialize, lib: libname };
        } catch (error) {
          return error;
        }
      };

      /**
       * The main objective is convert less.js data in object type to jsdom format and append to parent
       * @alias module:utils_reaction.import_less
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
                let url = href;
                if (key != "other") url = params[key] + href;
                let attributes = JSON.parse(
                  `{"rel":"stylesheet/less","type":"text/css","href":"${url}"}`
                );

                Object.keys(attributes).forEach((attr) => {
                  gfgData.setAttribute(attr, attributes[attr]);
                });
                el.appendChild(gfgData);
              }
            }
          }

          for (let [key, val] of Object.entries(data.engine)) {
            if (val !== "") {
              let engine = {};
              engine[key] = [val];
              import_js(doc, engine, params);
            }
          }

          return;
        } catch (error) {
          return error;
        }
      };

      /**
       * The main objective is read a file content and minify become one row
       * @alias module:utils_reaction.get_domhtml
       * @param {...Object} args - 1 parameters
       * @param {String} args[0] - file is file name which emebed absolute path
       * @returns {String} - Return undefined|text
       */
      const get_domhtml = (...args) => {
        let [file] = args;
        try {
          let output;
          if (fs.existsSync(file)) {
            output = fs.readFileSync(file, "utf8").trim();
          }
          return output;
        } catch (error) {
          return error;
        }
      };

      /**
       * Replace specific character from text base on object key name
       * Keyword <-{name}>
       * @alias module:reaction.str_replace
       * @param {...Object} args - 2 parameters
       * @param {String} args[0] - text is a statement in string value
       * @param {Object} args[1] - params a sets of values for change
       * @returns {String} - Return unchange or changed text
       */
      const str_replace = (...args) => {
        let [text, params] = args;
        let output = text;
        for (let [key, val] of Object.entries(params)) {
          let name = `<-{${key}}>`;
          while (output.indexOf(name) > -1) {
            let idx = output.indexOf(name);
            output =
              output.substring(0, idx) +
              val +
              output.substring(idx + name.length);
          }
        }
        return output;
      };

      /**
       * The main objective is indentify the string in html tag format
       * https://github.com/sindresorhus/is-html
       * @alias module:reaction.moleculde.indentify_html
       * @param {...Object} args - 1 parameters
       * @param {String} args[0] - buffhtml is a string for checking valid in html tag format
       * @returns {Object} - Return valid stting | null
       */
      const indentify_html = (...args) => {
        let [buffhtml] = args;
        let output = buffhtml;
        try {
          let html = buffhtml.trim().slice(0, 1000);
          let result = basic.test(html) || full.test(html);
          if (!result) output = null;
        } catch (error) {
          output = null;
        } finally {
          return output;
        }
      };

      /**
       * The main objective is read a list of file content and minify become one row
       * @alias module:reaction.moleculde.get_filenames
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
        if (node.external) {
          for (let val of node.external) {
            let htmlstr = indentify_html(val);
            if (htmlstr) docs.push(val);
            else if (fs.existsSync(val)) docs.push(get_domhtml(val));
          }
        }
        if (node.htmlstr) {
          for (let val of node.htmlstr) {
            let htmlstr = indentify_html(val);
            if (htmlstr) docs.push(val);
          }
        }
        return await Promise.all(docs);
      };

      /**
       * The main objective is combine a list of file become one html text
       * @alias module:reaction.moleculde.combine_layer
       * @param {...Object} args - 1 parameters
       * @param {Object} args[0] - layer is an object the list of files for merge purpose
       * @param {Object} args[1] - params is object use for write data to relevent html element
       * @returns {Object} - Return object
       */
      const combine_layer = (...args) => {
        return new Promise(async (resolve, reject) => {
          const [layer, params] = args;
          const { JSDOM } = jsdom;
          try {
            let output = { code: 0, msg: "", data: null };
            let master_dom, master_doc;
            let conv;

            if (indentify_html(layer.layouts)) conv = layer.layouts;
            else conv = get_domhtml(layer.layouts);
            let [layouts, childlists] = await Promise.all([
              conv,
              get_filenames(layer.childs, ["*.html"]),
            ]);

            let { message, stack } = layouts;
            if (!message && !stack) {
              master_dom = new JSDOM(str_replace(layouts, params));
              master_doc = master_dom.window.document;

              for (let childlist of childlists) {
                let child_doc = new JSDOM().window.document;
                let body = child_doc.querySelector("body");
                body.innerHTML = str_replace(childlist, params);
                let body_node = body.childNodes[0];
                if (body_node && body_node.nodeName == "STATEMENT") {
                  let statement = body
                    .querySelector(body_node.nodeName.toLowerCase())
                    .querySelectorAll("*");
                  let attrname = body_node.getAttribute("name");
                  let attraction = body_node.getAttribute("action");
                  switch (attraction) {
                    case "overwrite":
                      let mel = master_doc.querySelector(attrname);
                      let cel = body_node.querySelector(attrname);
                      let attrs = cel.getAttributeNames();
                      if (mel && cel) {
                        for (let attr of attrs) {
                          let val = cel.getAttribute(attr);
                          mel.setAttribute(attr, val);
                        }
                        mel.innerHTML = cel.innerHTML;
                      }
                      break;

                    case "append":
                      let childNodes = master_doc.querySelector(attrname);
                      for (const el of statement) childNodes.append(el);
                      break;
                  }
                }
              }

              output.data = master_dom.serialize();
            } else {
              throw {
                message: message,
                stack: stack,
              };
            }
            resolve(output);
          } catch (error) {
            resolve({ msg: error.message, data: error.stack });
          }
        });
      };

      /**
       * The main objective is combine a list of file become one html text
       * @alias module:reaction.moleculde.combine_layer
       * @param {...Object} args - 1 parameters
       * @param {Object} args[0] - layer is an object the list of files for merge purpose
       * @param {Object} args[1] - params is object use for write data to relevent html element
       * @returns {Object} - Return object
       */
      const single_layer = (...args) => {
        return new Promise(async (resolve, reject) => {
          const [layer, params] = args;
          const { JSDOM } = jsdom;
          try {
            let output = { code: 0, msg: "", data: null };
            let master_dom;
            let layouts = indentify_html(layer);
            if (!layouts) layouts = await get_domhtml(layer);

            let { message, stack } = layouts;
            if (!message && !stack) {
              master_dom = new JSDOM(str_replace(layouts, params));
              output.data = master_dom.serialize();
            } else {
              throw {
                message: message,
                stack: stack,
              };
            }
            resolve(output);
          } catch (error) {
            resolve({ msg: error.message, data: error.stack });
          }
        });
      };

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
            let isredirect = handler.check_empty(redirect);
            let isjson = handler.check_empty(json);
            let ishtml = handler.check_empty(html);
            // let iscss = handler.check_empty(options.css);

            if (!isredirect) {
              res.redirect(301, redirect);
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
                  else isvalid = indentify_html(view);
                } else if (!islayer) {
                  if (path.extname(layer.layouts) == ".html") isvalid = true;
                  else isvalid = indentify_html(layer.layouts);
                }
                if (isvalid) {
                  if (!islayer) {
                    if (!isview) layer.childs.external.push(view);
                    let { code, msg, data } = await combine_layer(
                      layer,
                      params
                    );
                    if (code == 0) layouts = data;
                    else throw { msg: msg, data: data };
                  } else if (!isview) {
                    let { code, msg, data } = await single_layer(view, params);

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

              let preload = await get_domhtml(
                path.join(pathname, "data", "preload.html")
              );
              document.querySelector("body").innerHTML += preload;
              let script = document.createElement("script");
              script.type = "text/javascript";
              script.innerHTML = `var mjs=${JSON.stringify(
                import_mjs(mjs, params)
              )};`;
              if (Object.keys(injectionjs.variables).length > 0)
                script.innerHTML += `var injectionjs=${JSON.stringify(
                  injectionjs.variables
                )}`;
              document.getElementsByTagName("head")[0].appendChild(script);
              let rtnimport_css = import_css(document, css, params);
              if (rtnimport_css) throw rtnimport_css;
              let rtnimport_js = import_js(document, js, params);
              if (rtnimport_js) throw rtnimport_js;
              let rtnimport_less = import_less(document, less, params);
              if (rtnimport_less) throw rtnimport_less;
              res.status(status).send(
                await minify(dom.serialize(), {
                  collapseWhitespace: true,
                })
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
       * @alias module:reaction.inspector
       * @param {...Object} args - 1 parameters
       * @param {Object} args[0] - fn is mehtod/fuction for execution
       * @param {Array} args[1] - params is in array type which contant with request and response variable
       * @returns {Object} - Either return object or return data from execution function
       */
      const inspector = async (...args) => {
        let [fn, params] = args;
        let [, response] = params;
        try {
          response.inspector = async (...args) => {
            let [fn, params] = args;
            try {
              let result = await sanbox(fn, params);
              if (result.code) throw result;
              return result;
            } catch (error) {
              if (error.msg) response.err.error = error.msg;
              else if (error.stack) response.err.error = error.stack;
              else if (error.message) response.err.error = error.message;
              return response;
            }
          };

          let result = await sanbox(fn, params);
          if (result.code) throw result;
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
      const onrequest = async (...args) => {
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
                  queuertn = inspector(queue[fname], [orireq, response]);
                  if (queuertn instanceof Promise) queuertn = await queuertn;
                  queuertn["action"] = queuertn.render;
                } else if (fn.idx != idx) {
                  queuertn = inspector(queue[fname], [orireq, response]);
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

          let rtn = await processEnd(orires);
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
            if (errcode >= 500) err["view"] = `${pathname}/data/error/500.html`;
            else err["view"] = `${pathname}/data/error/404.html`;
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

          let result_catch = await processEnd(orires);
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

      const onless = async (...args) => {
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
          orires.end();
        }
      };

      /**
       * The main objective is register api,gui modules into the cache memory
       * @alias module:reaction.register
       * @param {...Object} args - 1 parameters
       * @param {Object} args[0] - oncomponents gui and api modules
       */
      const register = (...args) => {
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

      resolve({
        ...lib,
        onrequest,
        onless,
        register,
        get guiapi() {
          return components;
        },
      });
    } catch (error) {
      reject(error);
    }
  });
};
