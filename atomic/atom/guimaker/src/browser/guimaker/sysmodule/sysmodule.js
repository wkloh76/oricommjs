"use strict";

/**
 * ES Module type
 * @module manager
 */

export default await (async () => {
  const { default: jspointer } = await import(`./jspointer.js`);

  try {
    return { jptr: jspointer };
  } catch (error) {
    return error;
  }
})();
