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
 * @module src_reaction_moleculde
 */
module.exports = async (...args) => {
  return new Promise(async (resolve, reject) => {
    const [params, obj] = args;
    const [pathname, curdir] = params;
    const [library, sys, cosetting] = obj;
    const { fs, path } = sys;
    const {
      utils: { datatype },
    } = library;

    const jsdom = require("jsdom");
    const htmlTags = require("html-tags");
    const basic =
      /\s?<!doctype html>|(<html\b[^>]*>|<body\b[^>]*>|<x-[^>]+>)+/i;
    const full = new RegExp(
      htmlTags.map((tag) => `<${tag}\\b[^>]*>`).join("|"),
      "i"
    );

    try {
      let lib = {};
      let atom = await require("./atom")(params, obj);

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
          docs.push(atom.get_domhtml(path.join(node.path, val)));
        }
        if (node.external) {
          for (let val of node.external) {
            let htmlstr = indentify_html(val);
            if (htmlstr) docs.push(val);
            else if (fs.existsSync(val)) docs.push(atom.get_domhtml(val));
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
      lib["combine_layer"] = (...args) => {
        return new Promise(async (resolve, reject) => {
          const [layer, params] = args;
          const { JSDOM } = jsdom;
          try {
            let output = { code: 0, msg: "", data: null };
            let master_dom, master_doc;
            let conv;

            if (indentify_html(layer.layouts)) conv = layer.layouts;
            else conv = atom.get_domhtml(layer.layouts);
            let [layouts, childlists] = await Promise.all([
              conv,
              get_filenames(layer.childs, ["*.html"]),
            ]);

            let { message, stack } = layouts;
            if (!message && !stack) {
              master_dom = new JSDOM(atom.str_replace(layouts, params));
              master_doc = master_dom.window.document;

              for (let childlist of childlists) {
                let child_doc = new JSDOM().window.document;
                let body = child_doc.querySelector("body");
                body.innerHTML = atom.str_replace(childlist, params);
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
      lib["single_layer"] = (...args) => {
        return new Promise(async (resolve, reject) => {
          const [layer, params] = args;
          const { JSDOM } = jsdom;
          try {
            let output = { code: 0, msg: "", data: null };
            let master_dom;
            let layouts = indentify_html(layer);
            if (!layouts) layouts = await atom.get_domhtml(layer);

            let { message, stack } = layouts;
            if (!message && !stack) {
              master_dom = new JSDOM(atom.str_replace(layouts, params));
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

      lib = { ...lib, ...atom, indentify_html: indentify_html };
      resolve(lib);
    } catch (error) {
      reject(error);
    }
  });
};
