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
 * A module which handle web api fetch in backend server service
 * @module src_got
 */
module.exports = async (...args) => {
  return new Promise(async (resolve, reject) => {
    const [params, obj] = args;
    const [pathname, curdir] = params;
    const [library, sys, cosetting] = obj;
    const { fs, path } = sys;

    try {
      let lib = {};

      lib.grabscript = (...args) => {
        const [param, obj] = args;
        const [parentdir, vpath, target] = param;
        let output;
        try {
          let { load } = obj;
          let htmlengine = {};
          let folderpath = path.join(
            parentdir,
            `${obj.path.replace(`${vpath}`, `${target}`)}`
          );
          for (let [name, value] of Object.entries(load)) {
            if (name.substring(0, 4) == "html") {
              let folder = name.substring(4);
              htmlengine[name] = {};
              for (let [parent, child] of Object.entries(value)) {
                let scripts = fs
                  .readdirSync(path.join(folderpath, parent, folder))
                  .filter((filename) => {
                    if (!child.includes(filename)) {
                      return filename;
                    }
                  });
                htmlengine[name][parent] = scripts;
              }
            }
          }
          output = htmlengine;
        } catch (error) {
          console.log(error);
        } finally {
          return output;
        }
      };

      resolve(lib);
    } catch (error) {
      reject(error);
    }
  });
};
