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
 * @module src_reaction_atom
 */
module.exports = async (...args) => {
  return new Promise(async (resolve, reject) => {
    const [params, obj] = args;
    const [pathname, curdir] = params;
    const [library, sys, cosetting] = obj;
    const { fs } = sys;

    try {
      let lib = {};

      /**
       * The main objective is convert css data in object type to jsdom format and append to parent
       * @alias module:src_reaction_atom.import_css
       * @param {...Object} args - 3 parameters
       * @param {Object} args[0] - doc is an object of jsdom window.document
       * @param {Object} args[1] - data is an object which listing css link source
       * @param {Object} args[2] - params is an object which use to concat data object value
       */
      lib["import_css"] = (...args) => {
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
       * @alias module:src_reaction_atom.import_js
       * @param {...Object} args - 3 parameters
       * @param {Object} args[0] - doc is an object of jsdom window.document
       * @param {Object} args[1] - data is an object which listing js link source
       * @param {Object} args[2] - params is an object which use to concat data object value
       */
      lib["import_js"] = (...args) => {
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
       * @alias module:src_reaction_atom.import_mjs
       * @param {...Object} args - 3 parameters
       * @param {Object} args[0] - doc is an object of jsdom window.document
       * @param {Object} args[1] - data is an object which listing js link source
       * @param {Object} args[2] - params is an object which use to concat data object value
       */
      lib["import_mjs"] = (...args) => {
        let [data, params] = args;
        try {
          let output = { initialize: {}, lib: [] };
          for (let [key, val] of Object.entries(data)) {
            if (key == "initialize") output[key] = val;
            else {
              if (val.length > 0) {
                for (let href of val) {
                  let url = href;
                  if (key != "other") url = params[key] + href;
                  output["lib"].push(url);
                }
              }
            }
          }
          return output;
        } catch (error) {
          return error;
        }
      };

      /**
       * The main objective is convert less.js data in object type to jsdom format and append to parent
       * @alias module:src_reaction_atom.import_less
       * @param {...Object} args - 3 parameters
       * @param {Object} args[0] - doc is an object of jsdom window.document
       * @param {Object} args[1] - data is an object which listing less.js link source
       * @param {Object} args[2] - params is an object which use to concat data object value
       */
      lib["import_less"] = (...args) => {
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
              lib.import_js(doc, engine, params);
            }
          }

          return;
        } catch (error) {
          return error;
        }
      };

      /**
       * The main objective is read a file content and minify become one row
       * @alias module:src_reaction_atom.get_domhtml
       * @param {...Object} args - 1 parameters
       * @param {String} args[0] - file is file name which emebed absolute path
       * @returns {String} - Return undefined|text
       */
      lib["get_domhtml"] = (...args) => {
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
      lib["str_replace"] = (...args) => {
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
      resolve(lib);
    } catch (error) {
      reject(error);
    }
  });
};
