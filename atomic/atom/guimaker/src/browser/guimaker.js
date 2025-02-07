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
 * The guimaker module
 * @module guimaker
 */
export default await (async () => {
  const { default: utils } = await import(`./guimaker/utils/utils.js`);
  const { default: sys } = await import(`./guimaker/sysmodule/sysmodule.js`);
  const { default: interfaces } = await import(
    "./guimaker/interfaces/interfaces.js"
  );
  try {
    interfaces.load({ utils }, sys);
    let lib = { library: { utils }, sys, interfaces };

    return lib;
  } catch (error) {
    return error;
  }
})();
