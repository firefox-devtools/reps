const constants = require("../constants");
const Immutable = require("immutable");

const initialState = Immutable.Map();

function update(state = initialState, action) {
  const { type, value } = action;
  switch (type) {
    case constants.LOAD_OBJECT:
      if (!value || !value.properties || !value.properties.from) {
        console.warn("object loaded without expected data", {value});
        console.trace();
        return state;
      }

      return state.set(
        value.properties.from,
        value.properties
      );
  }

  return state;
}

module.exports = update;
