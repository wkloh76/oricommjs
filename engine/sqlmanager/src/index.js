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
    const jandas = require("jandas");
    const sqlformat = require("sql-fmt");
    const { path, logger } = sys;
    const {
      utils: { handler, errhandler },
    } = library;
    try {
      let lib = {
        sqlite3: await require("./sqlite3")(params, obj),
      };

      /**
       * Handle exception error and compile error statement and save to error.log
       * @alias module:sqlmanager.errlog
       * @param {...Object} args - 1 parameters
       * @param {Object} args[0] - err is an object value in exception error type
       */
      const errlog = (...args) => {
        let [err] = args;
        let message;
        if (err.code && !message) message = "Code:" + err.code + "\r\n";
        else message += "Message:" + err.code + "\r\n";
        if (err.message && !message)
          message = "Message:" + err.message + "\r\n";
        else message += "Message:" + err.message + "\r\n";
        if (err.stack && !message) message = "Stack:" + err.stack;
        else message += "Message:" + err.stack;
        logger.error(message);
      };

      const setuplog = async (...args) => {
        const [log, db, dbname] = args;
        const { default: log4js } = await import("log4js");
        try {
          let output = handler.dataformat;
          let logpath = db.path;
          if (db.path == "")
            logpath = path.join(cosetting.logpath, db.engine, `${dbname}.log`);
          cosetting.log4jsconf.appenders = {
            ...cosetting.log4jsconf.appenders,
            ...{
              [dbname]: {
                filename: logpath,
                ...log,
              },
            },
          };
          cosetting.log4jsconf.categories = {
            ...cosetting.log4jsconf.categories,
            ...{
              [dbname]: {
                appenders: [dbname],
                level: "ALL",
              },
            },
          };
          await log4js.configure(cosetting.log4jsconf);
          output.data = log4js.getLogger(dbname);
          return output;
        } catch (error) {
          return errhandler(error);
        }
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

      lib["sqlexecute"] = (...args) => {
        let [db, condition, data] = args;
        let output = handler.dataformat;
        try {
          let saltrounds = 10;

          output.data = bcrypt.hashSync(myPlaintextPassword, saltRounds);
          // Store hash in your password DB.

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

      lib = {
        ...lib,
        setuplog: setuplog,
        errlog: errlog,
      };
      resolve(lib);
    } catch (error) {
      reject(error);
    }
  });
};
