/* openGauss is licensed under Mulan PSL v2.
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
module.exports = async (...args) => {
  return new Promise(async (resolve, reject) => {
    const [params, obj] = args;
    const [pathname, curdir] = params;
    const [library, sys, cosetting] = obj;
    const bcrypt = require("bcrypt");
    const csv = require("csv-parser");
    const {
      utils: { handler },
    } = library;
    try {
      let lib = {
        sqlite3: await require("./sqlite3")(params, obj),
      };

      lib["password"] = (...args) => {
        let [password, hashpassword] = args;
        let output = handler.dataformat;
        try {
          let saltrounds = 10;
          if (password && hashpassword) {
            let rtn = bcrypt.compareSync(password, hashpassword);
            output.data = { result: rtn, status: "compare" };
          } else {
            let rtn = bcrypt.hashSync(password, saltrounds);
            output.data = { result: rtn, status: "generate" };
          }
        } catch (error) {
          output = errhandler(error);
          errlog(error);
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
