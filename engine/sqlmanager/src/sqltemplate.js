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
 * A module which will base on template to produce sql statement for sqlite or mysql/mariadb
 * @module src_sqltemplate
 */
module.exports = async (...args) => {
  return new Promise(async (resolve, reject) => {
    const [params, obj] = args;
    const [pathname, curdir] = params;
    const [library, sys, cosetting] = obj;
    const sqlfmt = require("sql-fmt");
    const { handler, errhandler } = library.utils;
    try {
      let lib = {
        /**
         *  Getter sql json format
         * @type {Object}
         * @memberof module:src_sqltemplate.jsonsqlite
         * @instance
         */
        get jsonsqlite() {
          return Object.assign(
            {},
            {
              DB: "SQLITE",
              TABLE: [],
              INSERT: {
                FIELD: [{}],
                INSERT: {},
              },
              UPDATE: {
                FIELD: [{}],
                INSERT: {},
                REPLACE: {},
                REMOVE: {},
              },
              WHERE: { AND: {}, OR: {}, BETWEEN: {}, LIKE: {} },
            }
          );
        },
      };

      /**
       * Create sql stamenet with command and table fields
       * @alias module:src_sqltemplate.getsqlcmd
       * @param {...Object} args - 1 parameters
       * @param {Object} args[0] - sqlcmds is an object value which embed query command and field request
       * @param {String} args[1] - sqldb is string value content the database name
       * @param {Array} args[2] - sqltables an array value content single or multiple database tables name
       * @returns {Object} - Return value in object type
       */
      const getsqlcmd = (...args) => {
        let [sqlcmds, sqldb, sqltables] = args;
        let output = handler.dataformat;
        try {
          for (let [cmd] of Object.entries(sqlcmds)) {
            if (sqlcmds[cmd]) {
              let statement,
                tables = "";
              switch (cmd) {
                case "INSERT":
                  let INSERT = sqlcmds[cmd];
                  if (sqltables.length == 1 && INSERT.length == 1) {
                    statement = "INSERT INTO ";
                    tables =
                      `${sqltables[0].trim()} ` + sqlfmt`${sqlcmds[cmd][0]}`;
                    if (sqldb) tables = `${sqldb}.${tables}`;
                  }
                  break;

                case "SELECT":
                  let SELECT = sqlcmds[cmd];
                  if (sqltables.length > 0 && SELECT.length > 0) {
                    let fields = "";
                    statement = "SELECT ";
                    tables = "FROM ";

                    for (let tlbidx in sqltables) {
                      for (let [key, val] of Object.entries(SELECT[tlbidx])) {
                        let castdata = `${sqltables[tlbidx]}.${key}`;
                        if (val) castdata += ` AS ${val}`;
                        fields += `${castdata},`;
                      }
                      if (sqldb) tables += `${sqldb}.`;
                      tables += `${sqltables[tlbidx].trim()},`;
                    }
                    if (fields.lastIndexOf(",") > -1)
                      fields = fields.substring(0, fields.lastIndexOf(","));

                    if (tables.lastIndexOf(",") > -1)
                      tables = tables.substring(0, tables.lastIndexOf(","));
                    tables = `${fields} ${tables}`;
                  }
                  break;

                case "UPDATE":
                  let UPDATE = sqlcmds[cmd];
                  if (sqltables.length > 0 && UPDATE.length > 0) {
                    let fields = {};
                    statement = "UPDATE ";
                    if (sqldb) tables = `${sqldb}.`;
                    else tables = "";
                    for (let tlbidx in sqltables) {
                      tables += `${sqltables[tlbidx].trim()},`;
                      fields = { ...fields, ...UPDATE[tlbidx] };
                    }
                    fields = `${sqlfmt.set(fields)}`;

                    if (fields.lastIndexOf(",") > -1) {
                      let lastindex = fields.lastIndexOf(",");
                      let len = fields.length;
                      if (lastindex + 1 == len)
                        fields = fields.substring(0, fields.lastIndexOf(","));
                    }

                    if (tables.lastIndexOf(",") > -1) {
                      let lastindex = tables.lastIndexOf(",");
                      let len = tables.length;
                      if (lastindex + 1 == len)
                        tables = tables.substring(0, tables.lastIndexOf(","));
                    }
                    tables += ` SET ${fields} `;
                  }
                  break;
              }
              if (statement) statement += tables;
              if (!output.data) output.data = "";
              output.data += `${statement} `;
            }
          }
          return output;
        } catch (error) {
          return errhandler(error);
        }
      };

      /**
       * General sql operator stamenet format such WHERE and so on
       * @alias module:src_sqltemplate.getsqloperator
       * @param {...Object} args - 1 parameters
       * @param {Object} args[0] - cond is an object value of sql operator request such as `WHERE` operator
       * @returns {Object} - Return value in object type
       */
      const getsqloperator = (...args) => {
        let [cond] = args;
        let output = handler.dataformat;
        try {
          for (let [cmd] of Object.entries(cond)) {
            if (cond[cmd]) {
              let statement, content;
              switch (cmd) {
                case "WHERE":
                  statement = "WHERE ";
                  let operator = {};
                  for (let [key, val] of Object.entries(cond[cmd])) {
                    if (Object.keys(val).length > 0)
                      operator = { ...operator, ...val };
                  }
                  content = `${sqlfmt.where(operator)}`;
                  break;
              }
              if (content) statement += content;
              if (!output.data) output.data = "";
              output.data += `${statement} `;
            }
          }
          return output;
        } catch (error) {
          return errhandler(error);
        }
      };

      const extract = (...args) => {
        let [param] = args;
        let { DB, DELETE, INSERT, SELECT, TABLE, UPDATE, ...cond } = param;

        let sqlcmd;
        let presqlcmd = Object.entries({
          DELETE,
          INSERT,
          SELECT,
          UPDATE,
        }).reduce((acc, [key, value]) => {
          if (value) {
            acc[key] = value;
            sqlcmd = key;
          }
          return acc;
        }, {});
        if (Object.keys(presqlcmd).length > 0)
          return { sqlcmd, DB, TABLE, presqlcmd, cond };
        else return;
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
          let name = `'<-{${key}}>'`;
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

      const transform = (...args) => {
        const [[generic, sqljson]] = args;
        if (generic) {
          let { cond, DB, presqlcmd, sqlcmd, TABLE } = generic;
          return [[[presqlcmd, DB, TABLE], cond], sqlcmd];
        }
        if (sqljson) {
          let output = {};
          let jsondata = "";
          let { DB, cond, presqlcmd, sqlcmd, TABLE } = sqljson;
          for (let [cmdname, cmdval] of Object.entries(presqlcmd)) {
            output[cmdname] = [{}];
            for (let [k, v] of Object.entries(cmdval)) {
              if (k == "FIELD" && v.length > 0) output[cmdname] = v;
              else if (k == "INSERT") {
                for (let [key, value] of Object.entries(v)) {
                  if (cmdname == "INSERT") {
                    if (jsondata == "") jsondata = {};
                    jsondata[key] = `json('${value[0]}')`;
                    output[cmdname][0][key] = `<-{${key}}>`;
                  } else {
                    let arr = value;
                    const indexFrom = 2; // Index of element to move
                    const indexTo = 1; // New index for the element
                    arr[1] = `json('${value[1]}')`;
                    if (value.length == 3) {
                      [arr[indexFrom], arr[indexTo]] = [
                        arr[indexTo],
                        arr[indexFrom],
                      ];
                    }
                    if (jsondata == "") jsondata = {};
                    jsondata[key] = `json_insert(${arr.join(",")})`;
                    output[cmdname][0][key] = `<-{${key}}>`;
                  }
                }
              }
            }
          }
          return [
            [[output, DB, TABLE], cond],
            sqlcmd,
            { code: 0, msg: "", data: jsondata },
          ];
        }
      };

      /**
       * General full sql stamenet
       * @alias module:src_sqltemplate.generate
       * @param {...Object} args - 1 parameters
       * @param {Object} args[0] - sqlgeneric is an object value of general strcuture of sql command and operator
       * @param {Object} args[1] - sqljson an object value of sql in json format(reserve)
       * @returns {Object} - Return value in object type
       */
      lib["generate"] = async (...args) => {
        let [sqlgeneric = {}, sqljson = {}] = args;
        let output = handler.dataformat;

        try {
          let [[presqlcmd, cond], sqlcmd, jsondata] = transform(
            await Promise.all([extract(sqlgeneric), extract(sqljson)])
          );
          let rtnsqlcmd = await Promise.all([
            getsqlcmd.apply(null, presqlcmd),
            getsqloperator(cond),
          ]);
          if (jsondata) rtnsqlcmd.splice(1, 0, jsondata);
          rtnsqlcmd.map((value, index) => {
            if (value.code != 0) throw value;
            if (!output.data) {
              output.data = { cmd: sqlcmd, value: "" };
            }
            if (index == 0) output.data.value += value.data;
            else {
              if (value.data && value.data !== null) {
                let cast = "";
                if (sqlcmd != "INSERT") {
                  cast = ",<-{${data}}> ";
                  if (rtnsqlcmd.length == 3 && index == 1)
                    output.data.value = str_replace(
                      output.data.value,
                      value.data
                    );
                  else output.data.value += value.data;
                } else {
                  if (rtnsqlcmd.length == 3 && index == 1)
                    output.data.value = str_replace(
                      output.data.value,
                      value.data
                    );
                  else output.data.value += value.data;
                }
              }
            }
          });
          output.data.value = output.data.value.trim() + ";";
          return output;
        } catch (error) {
          return errhandler(error);
        }
      };

      resolve(lib);
    } catch (error) {
      reject(error);
    }
  });
};
