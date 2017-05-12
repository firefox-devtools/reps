// @flow
const React = require("react");

import type { ObjectInspectorItemContentsValue } from "./index";

type RenderRepOptions = {
  object: ObjectInspectorItemContentsValue,
  mode: string
};

let { REPS: { Rep, Grip }} = require("../reps/rep");
Rep = React.createFactory(Rep);

function renderRep({ object, mode }: RenderRepOptions) {
  return Rep({ object, defaultRep: Grip, mode });
}

module.exports = renderRep;
