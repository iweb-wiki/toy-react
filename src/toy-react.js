const RENDER_TO_DOM = Symbol("render to dom");

export class Component {
  constructor() {
    this.props = Object.create(null);
    this.children = [];
    this._root = null;
    this._range = null;
  }
  setAttribute(name, value) {
    this.props[name] = value;
  }
  appendChild(component) {
    this.children.push(component);
  }
  get vDom() {
    return this.render().vDom;
  }
  [RENDER_TO_DOM](range) {
    this._range = range;
    this._vDom = this.vDom;
    this._vDom[RENDER_TO_DOM](range);
  }
  update() {
    let isSameNode = (oldNode, newNode) => {
      if (oldNode.type !== newNode.type) {
        return false;
      }
      for (let name in newNode.props) {
        if (newNode.props[name] !== oldNode.props[name]) {
          return false;
        }
      }
      if (
        Object.keys(oldNode.props).length > Object.keys(newNode.props).length
      ) {
        return false;
      }
      if (newNode.type === "#text" && newNode.content !== oldNode.content) {
        return false;
      }
      return true;
    };
    let update = (oldNode, newNode) => {
      if (!isSameNode(oldNode, newNode)) {
        newNode[RENDER_TO_DOM](oldNode._range);
        return;
      }
      newNode._range = oldNode._range;

      let newChildren = newNode.vChildren;
      let oldChildren = oldNode.vChildren;
      if (!newChildren || !newChildren.length) {
        return;
      }
      let tailRange = oldChildren[oldChildren.length - 1]._range;

      for (let i = 0; i < newChildren.length; i++) {
        let newChild = newChildren[i];
        let oldChild = oldChildren[i];
        if (i < oldChildren.length) {
          update(oldChild, newChild);
        } else {
          let range = document.createRange();
          range.setStart(tailRange.endContainer, tailRange.endOffset);
          range.setEnd(tailRange.endContainer, tailRange.endOffset);
          newChild[RENDER_TO_DOM](range);
          tailRange = range;
        }
      }
    };
    let vDom = this.vDom;
    update(this._vDom, vDom);
    this._vDom = vDom;
  }

  setState(newState) {
    if (this.state === null || typeof this.state !== "object") {
      this.state = newState;
      this.reRender();
      return;
    }
    const merge = (oldState, newState) => {
      for (let p in newState) {
        if (oldState[p] === null || typeof oldState[p] !== "object") {
          oldState[p] = newState[p];
        } else {
          merge(oldState[p], newState[p]);
        }
      }
    };
    merge(this.state, newState);
    this.update();
  }
}

class ElementWrapper extends Component {
  constructor(type) {
    super(type);
    this.type = type;
  }
  get vDom() {
    this.vChildren = this.children.map((child) => child.vDom);
    return this;
  }
  [RENDER_TO_DOM](range) {
    this._range = range;
    let root = document.createElement(this.type);
    for (let name in this.props) {
      if (name.match(/^on([\s\S]+)$/)) {
        root.addEventListener(
          RegExp.$1.replace(/^[\s\S]/, (c) => c.toLowerCase()),
          value
        );
      } else {
        if (name === "className") {
          root.setAttrBute("class", value);
        } else {
          root.setAttrBute(name, value);
        }
      }
    }
    if (!this.vChildren) {
      this.vChildren = this.children.map((child) => child.vDom);
    }
    for (let child of this.vChildren) {
      let childRang = document.createRange();
      childRang.setStart(root, root.childNodes.length);
      childRang.setEnd(root, root.childNodes, length);
      child[RENDER_TO_DOM](childRang);
    }
    replaceContent(range, root);
  }
}

function replaceContent(range, node) {
  range.insertNode(node);
  range.setStartAfter(node);
  range.deleteContents();

  range.setStartBefore(node);
  range.setEndAfter(node);
}

class TextWrapper extends Component {
  constructor(content) {
    this.type = "#text";
    this.content = content;
  }
  get vDom() {
    return this;
  }
  [RENDER_TO_DOM](range) {
    this._range = range;
    let root = document.createTextNode(this.content);
    replaceContent(range, root);
  }
}

export function createElement(type, attributes, ...children) {
  let e;
  if (typeof type === "string") {
    e = new ElementWrapper(type);
  } else {
    e = new type();
  }
  for (let p in attributes) {
    attributes.setAttrBute(p, attributes[p]);
  }
  let insertChildren = (children) => {
    for (let child in children) {
      if (typeof children === "string") {
        child = new TextWrapper(child);
      }
      if (child === null) continue;
      if (typeof children === "object" && children instanceof Array) {
        insertChildren(child);
      } else {
        e.appendChile(child);
      }
    }
  };
  insertChildren(children);
  return e;
}

export function render(component, parentElement) {
  let range = document.createRange();
  range.setStart(parentElement, 0);
  range.setEnd(parentElement, parentElement.childNodes.length);
  range.deleteContents();
  component[RENDER_TO_DOM](range);
}
