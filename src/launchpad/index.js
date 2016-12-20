const React = require("react");
const { DOM: dom, PropTypes, createFactory } = React;

const { bindActionCreators, combineReducers } = require("redux");
const ReactDOM = require("react-dom");

const RepsConsole = createFactory(require("./components/Console"));

// require("./webconsole.css")
require("../reps.css");
require("./launchpad.css");

const { renderRoot, bootstrap, L10N } = require("devtools-launchpad");
const { getValue, isFirefoxPanel } = require("devtools-config");

if (!isFirefoxPanel()) {
  L10N.setBundle(require("../strings.js"));
  window.l10n = L10N;
}

function onConnect({client} = {}) {
  if (!client) {
    return;
  }

  ReactDOM.render(RepsConsole({client}), root);
}

let root = document.createElement("div");
root.innerText = "Waiting for connection";

bootstrap(React, ReactDOM, root)
  .then(onConnect);
