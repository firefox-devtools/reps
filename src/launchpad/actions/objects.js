function loadObjectProperties(object) {
  return async function ({dispatch, client}) {
    debugger
    const properties = await client.getProperties(object);

    debugger
    return {
      key: "sdf",
      type: constants.ADD_EXPRESSION,
      value: {
        input,
        packet,
      },
    };

  }
}

module.exports = {
  loadObjectProperties
}
