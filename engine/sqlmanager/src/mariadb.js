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
      utils: { datatype, handler, errhandler },
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
          }
        }

        #rules = {
          transaction: false,
          queryone: false,
        };

        #dboption = {
          timeout: 30000,
          namedPlaceholders: false,
          rowsAsArray: false,
          metaAsArray: true,
          nestTables: false,
          dateStrings: true,
          bigIntAsNumber: true,
          decimalAsNumber: false,
        };

        /**
         * Proeduce the sql statement to database with transaction
         * @alias module:mariadb.clsMariaDB.trans
         * @param {...Object} args - 1 parameters
         * @param {String} args[0] - statement is string data in sql statement format.
         */
        trans = async (...args) => {
          let [statement] = args;
          let output = handler.dataformat;
          try {
            let [rows] = await this._conn.query(statement);
            let tempsql = statement.sql.toUpperCase();
            if (tempsql.indexOf("SELECT") > -1) output.data = rows;
          } catch (error) {
            await this._conn.rollback();
            output = errhandler(error);
          } finally {
            return output;
          }
        };

        /**
         * Proeduce the sql statement to database without transaction
         * @alias module:mariadb.clsMariaDB.notrans
         * @param {...Object} args - 1 parameters
         * @param {String} args[0] - statement is string data in sql statement format.
         */
        notrans = async (...args) => {
          let [statement] = args;
          let output = handler.dataformat;
          try {
            let [rows] = await this._conn.query(statement);
            let tempsql = statement.sql.toUpperCase();
            if (tempsql.indexOf("SELECT") > -1) output.data = rows;
          } catch (error) {
            output = errhandler(error);
          } finally {
            return output;
          }
        };

        /**
         * Set a limit 1 into the sql statement and return a row of data(Only for SELECT enquiry)
         * @alias module:mariadb.clsMariaDB.prepare_queryone
         * @param {...Object} args - 1 parameters
         * @param {Object} args[0] - sql is an array of value in sql statement format.
         */
        prepare_queryone = (...args) => {
          let [sql] = args;
          let output = [];
          for (let prepare of sql) {
            let tempsql = prepare.toUpperCase();
            let limit = tempsql.indexOf("LIMIT");
            if (tempsql.indexOf("SELECT") > -1 && limit == -1) {
              let lastIndexOf = prepare.lastIndexOf(";");
              if (lastIndexOf > -1)
                prepare = prepare.substring(0, lastIndexOf) + " LIMIT 1;";
              else prepare = prepare + " LIMIT 1;";
            }
            output.push(prepare);
          }
          return output;
        };

        /**
         * Getter the dboption default value
         * @type {Object}
         * @memberof module:mariadb.clsMariaDB.property.dboption
         * @instance
         */
        get dboption() {
          return structuredClone(this.#dboption);
        }

        /**
         * Getter the rules default value
         * @type {Object}
         * @memberof module:mariadb.clsMariaDB.property.rules
         * @instance
         */
        get rules() {
          return structuredClone(this.#rules);
        }

        /**
         * Getter the connection threadId value
         * @type {Object}
         * @memberof module:mariadb.clsMariaDB.property.threadId
         * @instance
         */
        get threadId() {
          return this._conn.threadId;
        }

        /**
         * Disconnect connection
         * @alias module:mariadb.clsMariaDB.disconnect
         * @param {...Object} args - 1 parameter
         * @returns {Null} - Return null
         */
        disconnect = async (...args) => {
          await this._conn.end();
          this._fn(this._conn.threadId);
          this._conn = null;
          return;
        };

        /**
         * Check SQLite3 database is exist
         * @alias module:mariadb.clsMariaDB.ischema
         * @param {...Object} args - 1 parameters
         * @returns {Boolean} - Return true/false
         */
        ischema = async (...args) => {
          let [dbname] = args;
          let output = false;
          try {
            let statement = {
              sql:
                "SELECT COUNT(DISTINCT `table_name`) AS counter FROM `information_schema`.`columns` WHERE `table_schema` = '" +
                dbname +
                "';",
              ...this.dboption,
            };
            let [rows] = await this._conn.query(statement);
            if (rows[0].counter > 0) output = true;
          } catch (error) {
            sqlmanager.errlog(error);
          } finally {
            return output;
          }
        };

        /**
         * Mariadb general query enquiry work with db options setting and some of rules condition
         * @alias module:mariadb.clsMariaDB.query
         * @param {...Object} args - 1 parameters
         * @param {Object} args[0] - sql is array value which and each content in sql statement format
         * @param {Object} args[1] - opt is an object value of mariadb module query method options and refer to dboption setting
         * @param {Object} args[2] - cond is an object value refer to rules setting
         *
         * @returns {Object} - Return database result in  object type
         */
        query = async (...args) => {
          let [sql, opt, cond] = args;
          let output = handler.dataformat;
          try {
            if (!cond) cond = this.rules;
            if (!opt) opt = this.dboption;

            if (datatype(sql) != "array") {
              throw {
                code: 10003,
                msg: "The sql parameter is not the array data type! Reject query request.",
              };
            }
            if (cond.queryone) sql = this.prepare_queryone(sql);
            if (cond.transaction) await this._conn.beginTransaction();
            for (let prepare of sql) {
              let statement = { sql: prepare, ...opt };
              this._logger.info(sql);
              if (cond.transaction) {
                let rtn = await this.trans(statement);
                if (rtn.code == 0) {
                  if (!output.data) output.data = [];
                  output.data.push(rtn.data);
                } else throw rtn;
              } else {
                let rtn = await this.notrans(statement);
                if (rtn.code == 0) {
                  if (!output.data) output.data = [];
                  output.data.push(rtn.data);
                } else throw rtn;
              }
            }
            if (cond.transaction) await this._conn.commit();
          } catch (error) {
            output = errhandler(error);
            sqlmanager.errlog(error);
          } finally {
            return output;
          }
        };
      }

      /**
       * Destroy the deactive connection Id in the module cache
       * @alias module:mariadb.terminator
       * @param {...Object} args - 1 parameter
       *  @param {Integer} args[0] - threadId database connection Id.
       * @returns {Null} - Return null
       */
      const terminator = (...args) => {
        let [threadId] = args;
        if (conn[threadId]) {
          delete conn[threadId];
          conncount -= 1;
        }
        return;
      };

      /**
       * Register database pre-connection to the engine by on coresetting.toml defination
       * @alias module:mariadb.connect
       * @param {...Object} args - 1 parameters
       * @param {Object} args[0] - db is an object type of mariadb database connection setting
       * @param {String} args[1] - dbname is db onnection name base on coresetting.ongoing
       * @param {String} args[2] - compname is the components project naming
       * @returns {Object} - Return object value which content process status
       */
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
            output.data = new clsMariaDB(rtn, dblog[dbname], terminator);
            if (!conn[output.data.threadId]) conn[output.data.threadId] = true;
          }
        } catch (error) {
          output = errhandler(error);
        } finally {
          return output;
        }
      };

      /**
       * Register database pre-connection to the engine by on coresetting.toml defination
       * @alias module:mariadb.register
       * @param {...Object} args - 1 parameters
       * @param {Object} args[0] - db is an object type of mariadb database connection setting
       * @param {String} args[1] - dbname is db onnection name base on coresetting.ongoing
       * @param {String} args[2] - compname is the components project naming
       * @returns {Object} - Return object value which content process status
       */
      lib["register"] = async (...args) => {
        let [db, dbname, compname] = args;
        let output = handler.dataformat;
        try {
          if (!registered[compname]) registered[compname] = {};
          let { path: location, ...dbconf } = db;
          registered[compname][dbname] = dbconf;
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
       * @alias module:mariadb.createlog
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

      /**
       * Establish databas connection base on registered setting
       * @alias module:mariadb.connector
       * @param {...Object} args - 1 parameters
       * @param {String} args[0] - dbname is db onnection name base on coresetting.ongoing
       * @param {String} args[1] - compname is the components project naming
       * @returns {Object} - Return value in object type which embed db connection module
       */
      lib["connector"] = (...args) => {
        return new Promise(async (resolve) => {
          let [dbname, compname] = args;
          let output = handler.dataformat;
          try {
            let dbarr = Object.keys(registered[compname]);
            if (!dbarr.includes(dbname)) {
              if (registered[compname][dbname]) {
                if (!output.data) output.data = {};
                let rtn = await connect(key, compname);
                if (rtn.code == 0) output.data[key] = rtn.data;
              } else
                throw {
                  code: 10004,
                  msg: "Unmatching database connection name compare with coresetting.ongoiong setting!",
                };
            } else {
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
