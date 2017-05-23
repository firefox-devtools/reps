/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// @flow
import { createClass, PropTypes, createFactory } from "react";
const Tree = createFactory(require("devtools-sham-modules").Tree);
require("./managed-tree.css");

type ManagedTreeItem = {
  contents: Array<ManagedTreeItem>,
  name: string,
  path: string
};

type NextProps = {
  autoExpandAll: boolean,
  autoExpandDepth: number,
  getChildren: () => any,
  getKey: () => string,
  getParent: () => any,
  getRoots: () => any,
  highlightItems: Array<ManagedTreeItem>,
  itemHeight: number,
  listItems?: Array<ManagedTreeItem>,
  onFocus: () => any,
  renderItem: () => any
};

type InitialState = {
  expandedItems: any,
  focusedItem: ?ManagedTreeItem
};

let ManagedTree = createClass({
  propTypes: Object.assign({},
    Tree.propTypes,
    {
      getExpanded: PropTypes.func,
      setExpanded: PropTypes.func
    }
  ),

  displayName: "ManagedTree",

  getInitialState(): InitialState {
    return {
      expandedItems: new Set(),
      focusedItem: null
    };
  },

  componentWillReceiveProps(nextProps: NextProps) {
    const listItems = nextProps.listItems;
    if (listItems && listItems != this.props.listItems && listItems.length) {
      this.expandListItems(listItems);
    }

    const highlightItems = nextProps.highlightItems;
    if (highlightItems && highlightItems != this.props.highlightItems &&
       highlightItems.length) {
      this.highlightItem(highlightItems);
    }
  },

  componentWillMount() {
    if (this.props.getExpanded) {
      const expanded = this.props.getExpanded();
      this.setState({ expanded });
    }
  },

  componentWillUnmount() {
    if (this.props.setExpanded) {
      this.props.setExpanded(this.state.expandedItems);
    }
  },

  setExpanded(item: ManagedTreeItem, expand: boolean) {
    const expandedItems = this.state.expandedItems;
    const key = this.props.getKey(item);
    if (expand) {
      expandedItems.add(key);
    } else {
      expandedItems.delete(key);
    }
    this.setState({ expandedItems });

    if (expand && this.props.onExpand) {
      this.props.onExpand(item);
    } else if (!expandedItems && this.props.onCollapse) {
      this.props.onCollapse(item);
    }
  },

  expandListItems(listItems: Array<ManagedTreeItem>) {
    const expandedItems = this.state.expandedItems;
    listItems.forEach(item => expandedItems.add(this.props.getKey(item)));
    this.focusItem(listItems[0]);
    this.setState({ expandedItems });
  },

  highlightItem(highlightItems: Array<ManagedTreeItem>) {
    if (!highlightItems || highlightItems.length === 0) {
      return;
    }

    const expandedItems = this.state.expandedItems;
    const {getKey} = this.props;

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

  focusItem(item: ManagedTreeItem) {
    if (!this.props.disabledFocus && this.state.focusedItem !== item) {
      this.setState({ focusedItem: item });

      if (this.props.onFocus) {
        this.props.onFocus(item);
      }
    }
  },

  render() {
    const { expandedItems, focusedItem } = this.state;

    const props = Object.assign({}, this.props, {
      isExpanded: item => expandedItems.has(this.props.getKey(item)),
      focused: focusedItem,

      onExpand: item => this.setExpanded(item, true),
      onCollapse: item => this.setExpanded(item, false),
      onFocus: this.focusItem,

      renderItem: (...args) => {
        return this.props.renderItem(...args,
          this.props.mode,
          {
            setExpanded: this.setExpanded
          });
      }
    });

    return Tree(props);
  }
});

module.exports = ManagedTree;
