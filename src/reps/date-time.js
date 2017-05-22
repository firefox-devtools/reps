/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// ReactJS
const React = require("react");

// Reps
const {
  isGrip,
  safeObjectLink,
  wrapRender,
} = require("./rep-utils");

// Shortcuts
const { span } = React.DOM;

/**
 * Used to render JS built-in Date() object.
 */
DateTime.propTypes = {
  key: React.PropTypes.any,
  object: React.PropTypes.object.isRequired,
  objectLink: React.PropTypes.func,
};

function DateTime(props) {
  let grip = props.object;
  let children = [];
  try {
    children.push(
      getTitle(props, grip),
      span({className: "Date"},
        new Date(grip.preview.timestamp).toISOString()
      )
    );
  } catch (e) {
    children.push("Invalid Date");
  }

  return span({
    key: props.key,
    className: "objectBox"
  }, ...children);
}

function getTitle(props, grip) {
  return safeObjectLink(props, {}, grip.class + " ");
}

// Registration
function supportsObject(grip, type) {
  if (!isGrip(grip)) {
    return false;
  }

  return (type == "Date" && grip.preview);
}

// Exports from this module
module.exports = {
  rep: wrapRender(DateTime),
  supportsObject,
};
