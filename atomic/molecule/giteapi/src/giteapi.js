/**
 * Copyright (c) 2025   Loh Wah Kiang
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
 * A module which handle gitea api integration
 * @module src_giteapi
 */
module.exports = async (...args) => {
  return new Promise(async (resolve, reject) => {
    const [params, obj] = args;
    const [pathname, curdir] = params;
    const [library, sys, cosetting] = obj;
    const { atomic, utils } = library;
    const { atom } = atomic;
    const { smfetch } = atom;
    const { datatype, errhandler, handler } = utils;
    const { fs, path } = sys;

    try {
      let lib = {};

      const combine_header = (...args) => {
        const [auth, content] = args;
        let { headers } = auth;
        let rtn = {};
        if (datatype(headers) != "object") return rtn;
        if (datatype(content) == "string") {
          rtn = headers;
          content.split(",").forEach((element) => {
            let arr = element.split(":");
            rtn[arr[0]] = arr[1];
          });
        }
        return rtn;
      };

      lib.auth_user = async (...args) => {
        const [param] = args;
        let output = handler.dataformat;
        try {
          let auth =
            "Basic " +
            Buffer.from(param.userid + ":" + param.userpwd).toString("base64");
          let options = {
            method: "GET",
            url: `${param.webapi}/api/v1/user`,
            headers: {
              Authorization: auth,
            },
            timeout: 10000,
          };
          let rtn = await smfetch.request(options);
          if (!rtn.code) {
            output.data = {
              headers: {
                Authorization: auth,
              },
            };
          } else output = rtn;
        } catch (error) {
          output = errhandler(error);
        } finally {
          return output;
        }
      };

      lib.list_org_repos = async (...args) => {
        const [param] = args;
        let output = handler.dataformat;
        try {
          let options = {
            method: "GET",
            url: `${param.webapi}/api/v1/orgs${param.category}/repos`,
            headers: combine_header(param.auth, param.headers),
            timeout: 10000,
          };
          output = await smfetch.request(options);
        } catch (error) {
          output = errhandler(error);
        } finally {
          return output;
        }
      };

      lib.list_releases_repos = async (...args) => {
        const [param] = args;
        let output = handler.dataformat;
        try {
          if (!param.optional) param.optional = "";
          else param.optional = `${param.optional}`;
          let options = {
            method: "GET",
            url: `${param.webapi}/api/v1/repos${param.category}/${param.repos}/releases${param.optional}`,
            ...combine_header(param.auth, param.headers),
            timeout: 10000,
          };
          output = await smfetch.request(options);
        } catch (error) {
          output = errhandler(error);
        } finally {
          return output;
        }
      };

      lib.download_repos = async (...args) => {
        const [param] = args;
        let output = handler.dataformat;
        try {
          let options = {
            url: `${param.tagurl}`,
            location: `${param.location}`,
            target: `${param.tagname}.tar.gz`,
            headers: param.auth,
            timeout: 10000,
          };
          output = await smfetch.download(options);
        } catch (error) {
          output = errhandler(error);
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
