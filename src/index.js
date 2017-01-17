const React = require("react");

const { MODE } = require("./reps/constants");
const Rep = React.createFactory(require("./reps/rep"));
const StringRep = React.createFactory(require("./reps/string").rep);
const Grip = require("./reps/grip");
const { createFactories, parseURLEncodedText, parseURLParams } = require("./reps/rep-utils");

module.exports = {
  Rep,
  StringRep,
  Grip,
  MODE,
  createFactories,
  parseURLEncodedText,
  parseURLParams,
};
