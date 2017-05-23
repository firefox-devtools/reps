/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const constants = require("../constants");

function loadObjectProperties(object) {
  return async function ({ dispatch, client }) {
    const properties = await client.getProperties(object);
    dispatch({
      type: constants.LOAD_OBJECT,
      value: {
        object,
        properties
      }
    });
  };
}

module.exports = {
  loadObjectProperties
};
