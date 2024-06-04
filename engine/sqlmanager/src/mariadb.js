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
 * @module src_mariadb
 */
module.exports = async (...args) => {
  return new Promise(async (resolve, reject) => {
    const [params, obj] = args;
    const [pathname, curdir] = params;
    const [library, sys, cosetting] = obj;
    const mariadb = require("mariadb");
    const { fs, path, logger } = sys;
    const {
      utils: { handler, errhandler },
    } = library;
    try {
      let conn = {};
      let lib = {};
      let sqlmanager;
      let dblog = {};
      let registered = {};
      let conncount = 0;

      class clsMariaDB {
        constructor(connection, logger, fn) {
          if (!connection)
            throw {
              message: "Connection arguments undefined!",
              stack:
                " Arguments undefined cause clsMariaDB rejection the instance class request !.",
            };
          else {
            this._conn = connection;
            this._logger = logger;
            this._fn = fn;
            this._dboption = {
              // timeout: 3000,
              namedPlaceholders: false,
              rowsAsArray: false,
              metaAsArray: true,
              nestTables: false,
              dateStrings: true,
              bigIntAsNumber: true,
              decimalAsNumber: false,
            };
            this._formatter = {
              transaction: false,
              once: false,
            };
          }
        }

        get dboption() {
          return structuredClone(this._dboption);
        }
        get formatter() {
          return structuredClone(this._formatter);
        }

        /**
         * Disconnect connection
         * @alias module:mariadb.connect
         * @param {...Object} args - 1 parameter
         * @param {Object} args[0] - database connection id
         * @returns {Object} - Return
         */
        disconnect = async () => {
          await this._conn.end();
          this._fn("disconnect", this._conn.threadId);
          this._conn = null;
        };

        get threadId() {
          return this._conn.threadId;
        }

        /**
         * SQLite3 database executionn sql statement
         * @alias module:sqlite3.query
         * @param {...Object} args - 1 parameters
         * @param {Object} args[0] - options is decide what kind of output method
         * @param {Object} args[0][write] - write is true the prepare statement for INSERT,UPDATE,DELETE
         * @param {Object} args[0][type] - type different type of slqite3 class statement
         * @param {Object} args[0][cond] - cond get the specific value from query.get and query.all
         * @param {Object} args[0][transaction] - transaction condition:deferred,immediate,exclusive
         * @param {Object} args[1][name] - dbname is db onnection name base on coresetting.ongoing
         * @param {Object} args[1][statement] - statement sql prepare statement
         * @param {Object} args[2] - sqldata is object value for insert table
         *
         * @returns {Object} - Return database result in  object type
         */
        query = async (...args) => {
          let [sql, opt, cond] = args;
          let output = handler.dataformat;
          try {
            if (!cond) cond = structuredClone(this._formatter);
            if (!opt) opt = structuredClone(this._dboption);

            if (cond.once) {
              let tempsql = sql.toUpperCase();
              if (tempsql.indexOf("SELECT") > -1) {
                let lastIndexOf = sql.lastIndexOf(";");
                if (lastIndexOf > -1)
                  sql = sql.substring(0, lastIndexOf) + " LIMIT 1;";
              }
            }
            let statement = { sql: sql, ...opt };
            this._logger.info(sql);
            if (cond.transaction) {
              await this._conn.beginTransaction();
              let [rows, meta] = await this._conn.query(statement);
              if (rows) {
                await this._conn.commit();
                output.data = rows;
              } else await this._conn.rollback();
            } else {
              let [rows, meta] = await this._conn.query(statement);
              if (rows) output.data = rows;
            }
          } catch (error) {
            output = errhandler(error);
            this._logger.errlog(error);
          } finally {
            return output;
          }
        };
      }

      const parse = (cmd, threadId) => {
        switch (cmd) {
          case "disconnect":
            if (conn[threadId]) {
              delete conn[threadId];
              conncount -= 1;
            }
            break;
        }
      };

      const connect = async (...args) => {
        let [dbname, compname] = args;
        let output = handler.dataformat;
        try {
          if (registered[compname][dbname]) {
            let rtn;
            rtn = await mariadb.createConnection(registered[compname][dbname]);
            if (!rtn)
              throw {
                message: "Mariadb database connenction establish failure!",
                stack: " newschema execution failure!mariadb return undefind.",
              };

            conncount += 1;
            output.data = new clsMariaDB(rtn, dblog[dbname], parse);
            if (!conn[output.data.threadId]) conn[output.data.threadId] = true;
          }
        } catch (error) {
          output = errhandler(error);
        } finally {
          return output;
        }
      };

      /**
       * Establish SQLite3 database connection or create database if no exist
       * @alias module:sqlmanager.sqlite3.connect
       * @param {...Object} args - 1 parameters
       * @param {String} args[0] - log is logger which will save sql prepare statement into log file
       * @param {String} args[1] - db is db engine
       * @param {String} args[2] - dbname is db onnection name base on coresetting.ongoing
       * @returns {Object} - Return object value which content process status
       */
      lib["register"] = async (...args) => {
        let [db, dbname, compname] = args;
        let output = handler.dataformat;
        try {
          if (!registered[compname]) registered[compname] = {};
          registered[compname][dbname] = db;
          let rtn = await connect(dbname, compname);
          if (!rtn.code == 0) {
            delete registered[compname][dbname];
          } else rtn.data.disconnect();
        } catch (error) {
          output = errhandler(error);
        } finally {
          return output;
        }
      };

      /**
       * Create sql stamenet logger
       * @alias module:sqlite3.createlog
       * @param {...Object} args - 1 parameters
       * @param {Object} args[0] - cosetting is an object value from global variable coresetting
       * @param {Object} args[1] - path is a module from node_modules
       * @returns {Object} - Return value in object type
       */
      lib["createlog"] = async (...args) => {
        let [engine, setting] = args;
        let { db, log } = setting;
        try {
          sqlmanager = engine;
          let output = handler.dataformat;
          let err;
          for (let [key, val] of Object.entries(db)) {
            let { ...dbconf } = val;
            dbconf["engine"] = "mariadb";
            let rtn = await sqlmanager.setuplog(log, dbconf, key);
            if (!dblog[key]) dblog[key] = rtn.data;
            if (rtn.code !== 0) {
              delete dblog[key];
              err += `The ${key}.log sql statement log file create failure!`;
            }
          }
          if (err) throw { message: "Failure to create log file!", stack: err };

          return output;
        } catch (error) {
          return errhandler(error);
        }
      };

      lib["connector"] = (...args) => {
        return new Promise(async (resolve) => {
          let [compname, dbname] = args;
          let output = handler.dataformat;
          try {
            if (!dbname)
              for (let key of Object.keys(registered[compname])) {
                if (!output.data) output.data = {};
                let rtn = await connect(key, compname);
                if (rtn.code == 0) output.data[key] = rtn.data;
              }
            else {
              let rtn = await connect(dbname, compname);
              if (rtn.code == 0) {
                output.data = {};
                output.data[dbname] = rtn.data;
              }
            }
          } catch (error) {
            output = errhandler(error);
          } finally {
            resolve(output);
          }
        });
      };

      resolve(lib);
    } catch (error) {
      reject(error);
    }
  });
};
