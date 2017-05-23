/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

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
