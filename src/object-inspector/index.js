/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// @flow
const {
  createClass,
  createFactory,
  DOM: dom,
  PropTypes,
} = require("react");

const Tree = createFactory(require("devtools-sham-modules").Tree);
require("./index.css");

const classnames = require("classnames");
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
  autoExpandAll: false,
  autoExpandDepth: number,
};

type TreeItem = {
  contents: Array<TreeItem>,
  name: string,
  path: string
};

type InitialState = {
  expandedItems: any,
  focusedItem: ?TreeItem
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

const ObjectInspector = createClass({
  propTypes: Object.assign({},
    Tree.propTypes,
    {
      autoExpandDepth: PropTypes.number,
      name: PropTypes.string,
      desc: PropTypes.object,
      roots: PropTypes.array,
      getObjectProperties: PropTypes.func.isRequired,
      loadObjectProperties: PropTypes.func.isRequired,
      onLabelClick: PropTypes.func,
      onDoubleClick: PropTypes.func,
      getActors: PropTypes.func,
      setActors: PropTypes.func,
    }
  ),

  actors: (null: any),
  roots: (null:any),

  displayName: "ObjectInspector",

  getInitialState(): InitialState {
    return {
      expandedItems: new Set(),
      focusedItem: null
    };
  },

  getDefaultProps(): DefaultProps {
    return {
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
    if (this.props.getActors) {
      this.actors = this.props.getActors();
    }
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

  getRoots: function() {
    if (this.roots) {
      return this.roots;
    }

    let {
      desc,
      name,
      path,
      roots,
    } = this.props;

    if (!roots) {
      roots = [createNode(name, path || name, desc)];
    }

    this.roots = roots;

    return roots;
  },

  getParent: function(...args) {
    console.log("getParent", ...args)
    return null;
  },

  getKey: function(item) {
    return item.path;
  },

  setExpanded(item: TreeItem, expand: boolean) {
    const {expandedItems} = this.state;
    const key = this.getKey(item);

    if (expand === true) {
      expandedItems.add(key);
    } else {
      expandedItems.delete(key);
    }

    this.setState({expandedItems});

    if (expand === true) {
      const {
        getObjectProperties,
        loadObjectProperties,
      } = this.props;

      if (
        nodeHasProperties(item)
        && (item.contents.value && !getObjectProperties(item.contents.value.actor))
      ) {
        loadObjectProperties(item.contents.value);
      }
    }
  },

  focusItem(item: TreeItem) {
    if (!this.props.disabledFocus && this.state.focusedItem !== item) {
      this.setState({
        focusedItem: item
      });

      if (this.props.onFocus) {
        this.props.onFocus(item);
      }
    }
  },

  renderTreeItem(
    item: ObjectInspectorItem,
    depth: number,
    focused: boolean,
    arrow: Object,
    expanded: boolean
  ) {
    let objectValue = this.renderGrip(item, this.props.mode);

    return dom.div(
      {
        className: classnames("node object-node", {
          focused,
          "default-property": isDefault(item)
        }),
        style: { marginLeft: depth * 15 },
        onClick: e => {
          e.stopPropagation();
          this.setExpanded(item, !expanded);
        },
        onDoubleClick: this.props.onDoubleClick
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
          expanded: expanded
        })
      }),
      item.name
        ? dom.span(
          {
            className: "object-label",
            onClick: this.props.onLabelClick
              ? event => {
                event.stopPropagation();
                this.props.onLabelClick(item, {
                  depth,
                  focused,
                  expanded,
                  setExpanded: this.setExpanded
                });
              }
            : null
          },
          item.name
        )
        : null,
      item.name && objectValue
        ? dom.span({ className: "object-delimiter" }," : ")
        : null,
      objectValue
    );
  },

  renderGrip(item: ObjectInspectorItem, mode = MODE.TINY) {
    if (nodeIsOptimizedOut(item)) {
      return dom.span({ className: "unavailable" }, "(optimized away)");
    }

    if (nodeIsMissingArguments(item)) {
      return dom.span({ className: "unavailable" }, "(unavailable)");
    }

    if (nodeHasProperties(item) || nodeIsPrimitive(item)) {
      const object = item.contents.value;
      return Rep(Object.assign({},
        this.props,
        {
          mode,
          object
        }
      ));
    }

    return null;
  },

  render() {
    const {
      expandedItems,
      focusedItem,
    } = this.state;

    const {
      autoExpandDepth,
      autoExpandAll,
      disabledFocus,
      itemHeight,
      mode,
    } = this.props;

    return Tree({
      autoExpandAll,
      autoExpandDepth,
      disabledFocus,
      itemHeight,

      isExpanded: item => expandedItems.has(this.getKey(item)),
      focused: focusedItem,

      getRoots: this.getRoots,
      getParent: this.getParent,
      getChildren: this.getChildren,
      getKey: this.getKey,

      onExpand: item => this.setExpanded(item, true),
      onCollapse: item => this.setExpanded(item, false),
      onFocus: this.focusItem,

      renderItem: this.renderTreeItem
    });
  }
});

module.exports = ObjectInspector;
