const React = require("react");
const { DOM: dom, PropTypes, createFactory } = React;

const { MODE } = require("../../reps/constants");
const Rep = createFactory(require("../../reps/rep"));
const Grip = require("../../reps/grip");

const Result = React.createClass({
  propTypes: {
    expression: PropTypes.object.isRequired
  },

  displayName: "Result",

  renderRepInAllModes: function({ object }) {
    return Object.keys(MODE).map(modeKey =>
       this.renderRep({ object, modeKey })
     );
  },

  renderRep: function({ object, modeKey }) {
    return dom.div(
      {
        className: `rep-element ${modeKey}`,
        key: JSON.stringify(object) + modeKey,
        "data-mode": modeKey,
      },
      Rep({ object, defaultRep: Grip, mode: MODE[modeKey] })
    );
  },

  render: function() {
    let {expression} = this.props;
    let {input, packet} = expression;
    return dom.div(
      {
        className: "rep-row",
        key: JSON.stringify(expression)
      },
      dom.div({ className: "rep-input" }, input),
      dom.div({ className: "reps" }, this.renderRepInAllModes({
        object: packet.exception || packet.result
      }))
    );
  }
});

module.exports = Result;
