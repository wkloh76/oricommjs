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
 * @module src_sqlite3
 */
module.exports = async (...args) => {
  return new Promise(async (resolve, reject) => {
    const [params, obj] = args;
    const [pathname, curdir] = params;
    const [library, sys, cosetting] = obj;
    const sqlite3 = require("better-sqlite3");
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
      let sqlmanager;

      /**
       * Check SQLite3 database connectivity
       * @alias module:sqlmanager.sqlite3.isconnected
       * @param {...Object} args - 1 parameters
       * @param {String} args[0] - dbname is db onnection name base on coresetting.ongoing
       * @returns {Boolean} - Return true/false
       */
      const isconnected = (...args) => {
        let [dbname] = args;
        let output = true;
        if (conn[dbname]) output = conn[dbname].db.open;
        else output = false;
        return output;
      };

      /**
       * Check SQLite3 database is exist
       * @alias module:sqlmanager.sqlite3.isschema
       * @param {...Object} args - 1 parameters
       * @param {String} args[0] - dbname is db connection name base on coresetting.ongoing
       * @returns {Boolean} - Return true/false
       */
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
          sqlmanager.errlog(error);
        } finally {
          return output;
        }
      };

      /**
       * Establish SQLite3 database connection
       * @alias module:sqlmanager.sqlite3.connect
       * @param {...Object} args - 1 parameters
       * @param {String} args[0] - log is logger which will save sql prepare statement into log file
       * @param {String} args[1] - db is db engine
       * @param {String} args[2] - dbname is db onnection name base on coresetting.ongoing
       * @returns {Object} - Return object value which content process status
       */
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
       * Create SQLite3 database if not exist
       * @alias module:sqlite3.create
       * @param {...Object} args - 1 parameters
       * @param {Object} args[0] - cosetting is an object value from global variable coresetting
       * @param {Object} args[1] - path is a module from node_modules
       * @returns {Object} - Return value in object type
       */
      lib["create"] = async (...args) => {
        let [engine, setting] = args;
        let { db, log } = setting;
        try {
          sqlmanager = engine;
          let output = handler.dataformat;
          let err;
          for (let [key, val] of Object.entries(db)) {
            let { ...dbconf } = val;
            dbconf["engine"] = "sqlite3";
            let rtn = await sqlmanager.setuplog(log, dbconf, key);
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

      /**
       * Request database connection status
       * @alias module:sqlmanager.sqlite3.status
       * @param {...Object} args - 1 parameters
       * @param {String} args[0] - dbname is db onnection name base on coresetting.ongoing
       * @returns {Object} - Return object value which content both connection and schema status
       */
      lib["status"] = (...args) => {
        let [dbname] = args;
        let output = handler.dataformat;
        output.data = {};
        output.data["connected"] = isconnected(dbname);
        output.data["schema"] = isschema(dbname);
        return output;
      };

      /**
       * Close SQLite3 database connection
       * @alias module:sqlmanager.sqlite3.close
       * @param {...Object} args - 1 parameters
       * @param {String} args[0] - dbname is db connection name base on coresetting.ongoing
       * @returns {Boolean} - Return true/false
       */
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

      /**
       * Imposrt SQLite3 database base on sql file format
       * @alias module:sqlmanager.sqlite3.import
       * @param {...Object} args - 1 parameters
       * @param {String} args[0] - dbname is db connection name base on coresetting.ongoing
       * @param {String} args[1] - file is the sql file location
       * @returns {Object} - Return object value which content both connection and schema status
       */
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
          sqlmanager.errlog(error);
        } finally {
          return output;
        }
      };

      /**
       * backup SQLite3 database and save to file
       * @alias module:sqlmanager.sqlite3.backup
       * @param {...Object} args - 1 parameters
       * @param {String} args[0] - dbname is db connection name base on coresetting.ongoing
       * @param {String} args[1] - file is the sql file location to save
       * @returns {Object} - Return object value which content both connection and schema status
       */
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
          sqlmanager.errlog(error);
        } finally {
          return output;
        }
      };

      /**
       * SQLite3 database executionn sql statement
       * @alias module:sqlite3.query
       * @param {...Object} args - 1 parameters
       * @param {String} args[0] - dbname is db onnection name base on coresetting.ongoing
       * @param {String} args[1] - statements sql prepare statement
       * @param {Object} args[2] - options is decide what kind of output method
       * @returns {Object} - Return database result in  object type
       */
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
          sqlmanager.errlog(error);
        } finally {
          return output;
        }
      };

      lib = {
        ...lib,
        connect: connect,
      };
      resolve(lib);
    } catch (error) {
      reject(error);
    }
  });
};
