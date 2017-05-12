const constants = require("../constants");

function loadObjectProperties(object) {
  return async function ({ dispatch, client }) {
    const properties = await client.getProperties(object);
console.log("loadObjectProperties", properties);
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
