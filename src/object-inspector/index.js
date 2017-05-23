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

type NextProps = {
  autoExpandAll: boolean,
  autoExpandDepth: number,
  getChildren: () => any,
  getKey: () => string,
  getRoots: () => any,
  highlightItems: Array<TreeItem>,
  itemHeight: number,
  listItems?: Array<TreeItem>,
  onFocus: () => any,
  renderItem: () => any,
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
      onLabelClick: PropTypes.func.isRequired,
      onDoubleClick: PropTypes.func.isRequired,
      getExpanded: PropTypes.func,
      setExpanded: PropTypes.func,
      getActors: PropTypes.func.isRequired,
      setActors: PropTypes.func,
    }
  ),

  actors: (null: any),

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

  componentWillReceiveProps(nextProps: NextProps) {
    console.log("componentWillReceiveProps", nextProps)
    const listItems = nextProps.listItems;
    if (
      listItems
      && listItems !== this.props.listItems
      && listItems.length > 0
    ) {
      this.expandListItems(listItems);
    }

    const highlightItems = nextProps.highlightItems;
    if (
      highlightItems
      && highlightItems != this.props.highlightItems
      && highlightItems.length > 0
    ) {
      this.highlightItem(highlightItems);
    }
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
    let {
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

  getParent: function() {
    return null;
  },

  getKey: function(item) {
    return item.path;
  },

  setExpanded(item: TreeItem, expand: boolean) {
    const {expandedItems} = this.state;
    const key = this.getKey(item);

    if (expand === true) {
      if (expandedItems.has(key)) {
        console.warn("Trying to expand already expanded", { key });
        console.trace();
        return;
      }
      expandedItems.add(key);

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
    } else {
      expandedItems.delete(key);
    }

    this.setState({ expandedItems });
  },

  expandListItems(listItems: Array<TreeItem>) {
    const {expandedItems} = this.state;
    listItems.forEach(item => expandedItems.add(this.props.getKey(item)));
    this.focusItem(listItems[0]);
    this.setState({ expandedItems });
  },

  highlightItem(highlightItems: Array<TreeItem>) {
    if (!highlightItems || highlightItems.length === 0) {
      return;
    }

    const expandedItems = this.state.expandedItems;
    const { getKey } = this;

    let firstHighlighItem = highlightItems[0];
    // If the first item is expanded, focus it.
    if (expandedItems.has(getKey(firstHighlighItem))) {
      this.focusItem(firstHighlighItem);
    } else {
      // Otherwise, look at items starting from the top-level until finds a
      // collapsed item and focus it.
      const item = highlightItems
        .reverse()
        .find(x => !expandedItems.has(getKey(x)));

      if (item) {
        this.focusItem(item);
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

  renderItem(
    item: ObjectInspectorItem,
    depth: number,
    focused: boolean,
    arrow: Object,
    expanded: boolean
  ) {

    const {
      mode = MODE.TINY,
    } = this.props;

    let objectValue;
    if (nodeIsOptimizedOut(item)) {
      objectValue = dom.span({ className: "unavailable" }, "(optimized away)");
    } else if (nodeIsMissingArguments(item)) {
      objectValue = dom.span({ className: "unavailable" }, "(unavailable)");
    } else if (nodeHasProperties(item) || nodeIsPrimitive(item)) {
      const object = item.contents.value;
      objectValue = Rep(Object.assign({},
        this.props,
        {
          mode,
          object
        }
      ));
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
            this.setExpanded(item, !expanded);
          }
          : null,
        onDoubleClick: nodeIsPrimitive(item) === false && this.props.onDoubleClick
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

      renderItem: this.renderItem
    });
  }
});

module.exports = ObjectInspector;
