/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
// @flow

const React = require("react");
const classnames = require("classnames");
const ManagedTree = React.createFactory(require("./managed-tree"));
const Svg = require("../reps/images/Svg");
const {Rep} = require("../reps/rep");
const {MODE} = require("../reps/constants");

const {
  nodeIsOptimizedOut,
  nodeIsMissingArguments,
  nodeHasProperties,
  nodeIsPrimitive,
  isDefault,
  getChildren,
  createNode,
} = require("./utils");

const {DOM: dom, PropTypes} = React;

export type ObjectInspectorItemContentsValue = {
  actor: string,
  class: string,
  displayClass: string,
  extensible: boolean,
  frozen: boolean,
  ownPropertyLength: number,
  preview: Object,
  sealed: boolean,
  type: string,
};

type ObjectInspectorItemContents = {
  value: ObjectInspectorItemContentsValue,
};

type ObjectInspectorItem = {
  contents: Array<ObjectInspectorItem> & ObjectInspectorItemContents,
  name: string,
  path: string,
};

type DefaultProps = {
  onLabelClick: any,
  onDoubleClick: any,
  autoExpandDepth: number,
};

// This implements a component that renders an interactive inspector
// for looking at JavaScript objects. It expects descriptions of
// objects from the protocol, and will dynamically fetch child
// properties as objects are expanded.
//
// If you want to inspect a single object, pass the name and the
// protocol descriptor of it:
//
//  ObjectInspector({
//    name: "foo",
//    desc: { writable: true, ..., { value: { actor: "1", ... }}},
//    ...
//  })
//
// If you want multiple top-level objects (like scopes), you can pass
// an array of manually constructed nodes as `roots`:
//
//  ObjectInspector({
//    roots: [{ name: ... }, ...],
//    ...
//  });

// There are 3 types of nodes: a simple node with a children array, an
// object that has properties that should be children when they are
// fetched, and a primitive value that should be displayed with no
// children.

const ObjectInspector = React.createClass({
  propTypes: {
    autoExpandDepth: PropTypes.number,
    name: PropTypes.string,
    desc: PropTypes.object,
    roots: PropTypes.array,
    getObjectProperties: PropTypes.func.isRequired,
    loadObjectProperties: PropTypes.func.isRequired,
    onLabelClick: PropTypes.func.isRequired,
    onDoubleClick: PropTypes.func.isRequired,
    getExpanded: PropTypes.func,
    setExpanded: PropTypes.func,
    getActors: PropTypes.func.isRequired,
    setActors: PropTypes.func,
  },

  actors: (null: any),

  displayName: "ObjectInspector",

  getInitialState() {
    return {};
  },

  getDefaultProps(): DefaultProps {
    return {
      onLabelClick: () => {},
      onDoubleClick: () => {},
      autoExpandDepth: 1,
      getActors: () => {
        return {};
      }
    };
  },

  componentWillMount() {
    // Cache of dynamically built nodes. We shouldn't need to clear
    // this out ever, since we don't ever "switch out" the object
    // being inspected.
    this.actors = this.props.getActors();
  },

  componentWillUnmount() {
    if (this.props.setActors) {
      this.props.setActors(this.actors);
    }
  },

  getChildren(item: ObjectInspectorItem) {
    const { getObjectProperties } = this.props;
    const { actors } = this;

    return getChildren({
      getObjectProperties,
      actors,
      item
    });
  },

  renderItem(
    item: ObjectInspectorItem,
    depth: number,
    focused: boolean,
    _: Object,
    expanded: boolean,
    mode: any,
    { setExpanded }: () => any
  ) {

    let objectValue;
    if (nodeIsOptimizedOut(item)) {
      objectValue = dom.span({ className: "unavailable" }, "(optimized away)");
    } else if (nodeIsMissingArguments(item)) {
      objectValue = dom.span({ className: "unavailable" }, "(unavailable)");
    } else if (nodeHasProperties(item) || nodeIsPrimitive(item)) {
      const object = item.contents.value;
      objectValue = Rep({
        object,
        mode: mode || MODE.TINY
      });
    }

    return dom.div(
      {
        className: classnames("node object-node", {
          focused,
          "default-property": isDefault(item)
        }),
        style: { marginLeft: depth * 15 },
        onClick: nodeIsPrimitive(item) === false
          ? e => {
            e.stopPropagation();
            setExpanded(item, !expanded);
          }
          : null,
        onDoubleClick: nodeIsPrimitive(item) === false
          ? e => {
            e.stopPropagation();
            this.props.onDoubleClick(item, {
              depth, focused, expanded
            });
          }
          : null
      },
      Svg("arrow", {
        className: classnames({
          expanded: expanded,
          hidden: nodeIsPrimitive(item)
        })
      }),
      item.name
        ? dom.span(
          {
            className: "object-label",
            onClick: event => {
              event.stopPropagation();
              this.props.onLabelClick(item, {
                depth, focused, expanded, setExpanded
              });
            }
          },
          item.name
        )
        : null,
      item.name && objectValue
        ? dom.span(
            { className: "object-delimiter" },
            " : "
          )
        : null,
      dom.span({ className: "object-value" }, objectValue || "")
    );
  },

  getRoots: function() {
    const {
      desc,
      name,
      path,
      roots,
    } = this.props;

    if (!roots) {
      roots = [createNode(name, path || name, desc)];
    }

    return roots;
  },

  onExpand: function(item) {
    const { getObjectProperties } = this.props;

    if (
      nodeHasProperties(item)
      && (
        item.contents.value
        && !getObjectProperties(item.contents.value.actor)
      )
    ) {
      this.props.loadObjectProperties(item.contents.value);
    }
  },

  getParent: function() {
    return null;
  },

  getKey: function(item) {
    return item.path;
  },

  render() {
    const {
      autoExpandDepth,
      getExpanded,
      setExpanded,
      mode,
    } = this.props;

    return ManagedTree({
      autoExpand: 0,
      autoExpandAll: false,
      autoExpandDepth,
      disabledFocus: true,
      getChildren: this.getChildren,
      getExpanded,
      getKey: this.getKey,
      getParent: this.getParent,
      getRoots: this.getRoots,
      mode,
      onExpand: this.onExpand,
      renderItem: this.renderItem,
      setExpanded,
    });
  }
});

module.exports = ObjectInspector;
