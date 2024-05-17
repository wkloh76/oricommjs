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
 * A module which handle all transaction wih sqlite3 database
 * @module src_sqlite3_index
 */
module.exports = async (...args) => {
  return new Promise(async (resolve, reject) => {
    const [params, obj] = args;
    const [pathname, curdir] = params;
    const [library, sys, cosetting] = obj;
    const sqlite3 = require("better-sqlite3");
    const csv = require("csv-parser");
    const { fs, path, logger } = sys;
    const {
      utils: { handler, errhandler },
    } = library;
    try {
      let conn = {};
      let lib = {
        get listdb() {
          return Object.keys(conn);
        },
      };

      const errlog = (err) => {
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

      const isconnected = (...args) => {
        let [dbname] = args;
        let output = true;
        if (conn[dbname]) output = conn[dbname].db.open;
        else output = false;
        return output;
      };

      const isschema = (...args) => {
        let [dbname] = args;
        let output = false;
        try {
          let query = conn[dbname].db
            .prepare(
              "SELECT COUNT(name) AS counter FROM sqlite_master WHERE type='table';"
            )
            .get();
          if (query.counter > 0) output = true;
        } catch (error) {
          errlog(error);
        } finally {
          return output;
        }
      };

      const connect = async (...args) => {
        let [log, db, dbname] = args;
        let output = handler.dataformat;
        try {
          let options = {};
          let rtn;
          let logpath = db.path;
          if (db.path == "")
            logpath = path.join(cosetting.logpath, db.engine, `${dbname}.db3`);

          if (log)
            options.verbose = (message) => {
              log.info(message);
            };
          if (db.type == "file") rtn = await new sqlite3(logpath, options);
          else rtn = await new sqlite3(":memory:", options);
          output.data = rtn;
          if (!conn[dbname]) conn[dbname] = { db: rtn, logger: log };
          if (!rtn)
            throw {
              message: "newschema execution failure!",
              stack:
                " newschema execution failure!better-sqlite3 return undefind.",
            };

          return output;
        } catch (error) {
          return errhandler(error);
        }
      };

      /**
       * Configure log module for webexpress and normal log
       * @alias module:sqlite3.create
       * @param {...Object} args - 1 parameters
       * @param {Object} args[0] - cosetting is an object value from global variable coresetting
       * @param {Object} args[1] - path is a module from node_modules
       * @returns {Object} - - Return value in object type
       */
      lib["create"] = async (...args) => {
        let [setting] = args;
        let { db, log } = setting;
        try {
          let output = handler.dataformat;
          let err;
          for (let [key, val] of Object.entries(db)) {
            let { ...dbconf } = val;
            dbconf["engine"] = "sqlite3";
            let rtn = await setuplog(log, dbconf, key);
            let logger = rtn.data;
            if (rtn.code != 0) logger = undefined;
            rtn = await connect(logger, dbconf, key);
            if (rtn.code !== 0)
              err += `The ${key}.db3 database create failure!`;
          }
          if (err)
            throw { message: "Failure to create all database!", stack: err };

          return output;
        } catch (error) {
          return errhandler(error);
        }
      };

      lib["status"] = (...args) => {
        let [dbname] = args;
        let output = handler.dataformat;
        output.data = {};
        output.data["connected"] = isconnected(dbname);
        output.data["schema"] = isschema(dbname);
        return output;
      };

      lib["close"] = (...args) => {
        let [dbname] = args;
        let output = true;
        if (!conn[dbname]) output = false;
        else {
          conn[dbname].db.close();
          if (!conn[dbname].open) delete conn[dbname];
          else output = false;
        }
        return output;
      };

      lib["import"] = (...args) => {
        let [dbname, file] = args;
        let output = handler.dataformat;
        try {
          if (fs.existsSync(file)) {
            let sql = fs.readFileSync(file, "utf8");
            let db = new sqlite3(":memory:");
            let rtn = db.exec(sql);
            if (rtn) conn[dbname].db.exec(sql);
            rtn.close();
          }
        } catch (error) {
          output.code = 10001;
          output.msg = "SQLite3 import failure:SQL file format wrong!";
          errlog(error);
        } finally {
          return output;
        }
      };

      lib["backup"] = async (...args) => {
        let [dbname, file] = args;
        let output = handler.dataformat;
        try {
          if (!fs.existsSync(file)) {
            await conn[dbname].db.backup(file);
          }
        } catch (error) {
          output.code = 10002;
          output.msg =
            "SQLite3 backup failure:File already exits or path and folder permission issue!";
          errlog(error);
        } finally {
          return output;
        }
      };

      lib["query"] = async (...args) => {
        let [
          dbname,
          statements,
          options = { write: false, type: 0, cond: "" },
        ] = args;
        let output = handler.dataformat;
        try {
          if (conn[dbname]) {
            let query = conn[dbname].db.prepare(statements);
            let rtn;
            if (!options.write) {
              switch (options.type) {
                case 0: // First found of row will be retrieved
                  if (options.cond !== "") rtn = await query.get(options.cond);
                  else rtn = await query.get();
                  break;
                case 1: //All matching rows will be retrieved
                  if (options.cond !== "") rtn = await query.all(options.cond);
                  else rtn = await query.all();
                  break;
                case 2:
                  rtn = await query.iterate();
                  break;
                case 3:
                  rtn = await query.pluck();
                  break;
                case 4:
                  rtn = await query.expand();
                  break;
                case 5:
                  rtn = await query.raw();
                  break;
                case 6:
                  rtn = await query.columns();
                  break;
                default:
                  rtn = await query.get();
                  break;
              }
            } else rtn = await query.run();
            if (rtn) output.data = rtn;
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
