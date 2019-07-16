

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex.default : ex; }

const React = require('react');

const React__default = _interopDefault(React);
const PropTypes = _interopDefault(require('prop-types'));
const P5 = _interopDefault(require('p5'));
const Reconciler = _interopDefault(require('react-reconciler'));
const scheduler = require('scheduler');

function _extends() {
  _extends = Object.assign || function (target) {
    for (let i = 1; i < arguments.length; i++) {
      const source = arguments[i];

      for (const key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          target[key] = source[key];
        }
      }
    }

    return target;
  };

  return _extends.apply(this, arguments);
}

function _objectWithoutPropertiesLoose(source, excluded) {
  if (source == null) return {};
  const target = {};
  const sourceKeys = Object.keys(source);
  let key; let i;

  for (i = 0; i < sourceKeys.length; i++) {
    key = sourceKeys[i];
    if (excluded.indexOf(key) >= 0) continue;
    target[key] = source[key];
  }

  return target;
}

function isFunction(obj) {
  return !!(obj && obj.constructor && obj.call && obj.apply);
}

const CONTEXTS = ['noFill', 'noStroke', 'stroke', 'fill', 'shearX', 'applyMatrix', 'resetMatrix', 'rotate', 'rotateX', 'rotateY', 'rotateZ', 'scale', 'shearX', 'shearY', 'translate', 'textAlign', 'textLeading', 'textSize', 'textStyle', 'angleMode'];
class Container {
  constructor(p5Instance, context) {
    if (p5Instance === void 0) {
      p5Instance = null;
    }

    if (context === void 0) {
      context = {};
    }

    this.p5 = p5Instance;
    this.context = context;
    this._waitingForDraw = false;
    this.children = [];
  }

  _applyArgs(key, prop) {
    let obj = prop;

    if (typeof prop === 'string') {
      obj = this[prop];
    }

    if (Array.isArray(obj[key])) {
      this.p5[key](...obj[key]);
    } else if (isFunction(obj[key])) {
      const res = obj[key](this.p5);

      if (Array.isArray(res)) {
        this.p5[key](...res);
      } else {
        this.p5[key](res);
      }
    } else {
      this.p5[key](obj[key]);
    }
  }

  _applyContext() {
    Object.keys(this.context).forEach(key => {
      if (key === 'background' && this.context.noClear) {
        return;
      }

      if (this.p5[key] && isFunction(this.p5[key])) {
        this._applyArgs(key, 'context');
      }
    });
  }

  setContext(context) {
    this.context = context;
  }

  draw() {
    this._applyContext();

    this.children.forEach(child => {
      child.draw([]);
    });
  }

  queueDraw() {
    if (!this._waitingForDraw) {
      this._waitingForDraw = true;
      requestAnimationFrame(() => {
        this.draw();
        this._waitingForDraw = false;
      });
    }
  }

  add(child) {
    this.children.push(child);
  }

  remove(child) {
    this.children = this.children.filter(ch => ch !== child);
  }

}
class Node extends Container {
  constructor(type, _ref, container) {
    const _ref$args = _ref.args;
        const args = _ref$args === void 0 ? [] : _ref$args;
        const props = _objectWithoutPropertiesLoose(_ref, ["args"]);

    super(container.p5);
    this.type = type;
    this.args = args;
    this.props = props;
    this.container = container;
  }

  applyPropsContext(context) {
    context.forEach(con => {
      Object.keys(con).forEach(key => {
        if (this.p5[key] && isFunction(this.p5[key])) {
          this._applyArgs(key, con);
        }
      });
    }); // apply props

    Object.keys(this.props).forEach(key => {
      if (this.p5[key] && isFunction(this.p5[key])) {
        this._applyArgs(key, 'props');
      }
    });
  }

  queueDraw() {
    this.container.queueDraw();
  }

  draw(context) {
    const {p5} = this.container;

    if (p5[this.type] && isFunction(p5[this.type])) {
      if (CONTEXTS.includes(this.type)) {
        context.push(_extends({
          [this.type]: this.args
        }, this.props));
      } // save current drawing style


      p5.push(); // Update drawing style based on props and context

      this.applyPropsContext(context);

      this._applyArgs(this.type, {
        [this.type]: this.args
      }); // reset drawing style


      p5.pop();
    }

    this.children.forEach(child => {
      child.draw([...context]);
    });
  }

}

const roots = new Map();

function appendInitialChild(parent, child) {
  parent.add(child);
}

function appendChild(parent, child) {
  parent.add(child);
}

function appendChildToContainer(parent, child) {
  parent.add(child);
}

function removeChild(parent, child) {
  parent.remove(child);
}

function insertBefore(parentInstance, child, beforeChild) {
  parentInstance.add(child);
}

function createInstance(type, props, container, hostContext, fiber) {
  const instance = new Node(type, props, container);
  return instance;
}

function commitUpdate(instance, updatePayload, type, oldProps, newProps, fiber) {
  // this is only called if prepareUpdate returns a payload. That payload is passed
  // into here as updatePayload.
  instance.queueDraw();
}

function prepareUpdate(instance, type, oldProps, newProps, rootContainerInstance, hostContext) {
  const {args} = newProps;
        const props = _objectWithoutPropertiesLoose(newProps, ["args"]);

  instance.args = args;
  instance.props = props; // instance.context = hostContext;
  // if something is returned here then commitUpdate will be called for this instance.
  // If nothing if returned then it will not be called

  return _extends({}, hostContext);
}

const Renderer = Reconciler({
  now: scheduler.unstable_now,
  supportsMutation: true,
  isPrimaryRenderer: false,
  createInstance,
  removeChild,
  appendChild,
  appendInitialChild,
  appendChildToContainer,
  removeChildFromContainer: removeChild,
  schedulePassiveEffects: scheduler.unstable_scheduleCallback,
  cancelPassiveEffects: scheduler.unstable_cancelCallback,
  commitUpdate,
  prepareUpdate,
  insertBefore,
  getPublicRootInstance: () => {},
  getPublicInstance: instance => instance,
  getRootHostContext: rootContainerInstance => [],
  // Context to pass down from root
  getChildHostContext: () => [],
  createTextInstance: () => {},
  finalizeInitialChildren: (instance, type, props, rootContainerInstance) => false,
  shouldDeprioritizeSubtree: (type, props) => false,
  prepareForCommit: rootContainerInstance => {},
  resetAfterCommit: () => {},
  shouldSetTextContent: props => false
});
function render(el, container) {
  let root = roots.get(container);

  if (!root) {
    root = Renderer.createContainer(container);
    roots.set(container, root);
  }

  Renderer.updateContainer(el, root, null, undefined);
  return Renderer.getPublicRootInstance(root);
}

const StateContext = React__default.createContext();

const Canvas = (_ref) => {
  const {children} = _ref;
      let _ref$size = _ref.size;
  _ref$size = _ref$size === void 0 ? [100, 100] : _ref$size;

  const x = _ref$size[0];
      const y = _ref$size[1];
      const {renderer} = _ref;
      const props = _objectWithoutPropertiesLoose(_ref, ["children", "size", "renderer"]);

  const wrapper = React.useRef(null);

  const _useState = React.useState({});
        const newProps = _useState[0];
        const setNewProps = _useState[1];

  const state = React.useRef({
    canvas: null,
    container: null,
    subscribers: {
      draw: [],
      keyPressed: [],
      keyReleased: [],
      keyTyped: [],
      mouseMoved: [],
      mouseDragged: [],
      mousePressed: [],
      mouseReleased: [],
      mouseClicked: [],
      doubleClicked: [],
      mouseWheel: [],
      touchStarted: [],
      touchMoved: [],
      touchEnded: [],
      deviceMoved: [],
      deviceTurned: [],
      deviceShaken: []
    },
    subscribe: (event, fn) => {
      if (!state.current.subscribers[event]) {
        console.error('Attempting to subscribe to an unknown event:', event);
        return () => {};
      }

      state.current.subscribers[event].push(fn);

      if (event === 'draw') {
        state.current.canvas.loop();
      }

      return () => {
        state.current.subscribers[event] = state.current.subscribers[event].filter(s => s === fn);

        if (state.current.subscribers.draw.length === 0) {
          state.current.canvas.noLoop();
        }
      };
    }
  });
  React.useEffect(() => {
    if (state.current.canvas) {
      state.current.canvas.resizeCanvas(x, y);
    }
  }, [x, y]);
  React.useEffect(() => {
    if (state.current.container) {
      state.current.container.setContext(props);
    }
  }, [props]);
  React.useEffect(() => {
    state.current.canvas = new P5(sketch => {
      sketch.setup = () => {
        sketch.createCanvas(x, y, renderer);

        const propsCopy = _extends({}, props);

        Object.keys(props).forEach(key => {
          if (!isFunction(sketch[key])) return;

          if (Array.isArray(props[key])) {
            sketch[key](...props[key]);
          } else {
            sketch[key](props[key]);
          }

          delete propsCopy[key];
        });
        delete propsCopy.noClear;
        setNewProps(propsCopy);
        sketch.noLoop();
      };

      sketch.draw = () => {
        state.current.subscribers.draw.forEach(fn => fn(state.current.canvas));
      };

      sketch.keyPressed = () => {
        state.current.subscribers.keyPressed.forEach(fn => fn(state.current.canvas.keyCode));
      };

      sketch.keyReleased = () => {
        state.current.subscribers.keyReleased.forEach(fn => fn(state.current.canvas.key, state.current.canvas.keyCode));
      };

      sketch.keyTyped = () => {
        state.current.subscribers.keyTyped.forEach(fn => fn(state.current.canvas.key));
      };

      sketch.mouseMoved = e => {
        state.current.subscribers.mouseMoved.forEach(fn => fn(e));
      };

      sketch.mouseDragged = e => {
        state.current.subscribers.mouseDragged.forEach(fn => fn(e));
      };

      sketch.mousePressed = e => {
        state.current.subscribers.mousePressed.forEach(fn => fn(e));
      };

      sketch.mouseReleased = e => {
        state.current.subscribers.mouseReleased.forEach(fn => fn(e));
      };

      sketch.mouseClicked = e => {
        state.current.subscribers.mouseClicked.forEach(fn => fn(e));
      };

      sketch.doubleClicked = e => {
        state.current.subscribers.doubleClicked.forEach(fn => fn(e));
      };

      sketch.mouseWheel = e => {
        state.current.subscribers.mouseWheel.forEach(fn => fn(e));
      };

      sketch.touchStarted = e => {
        state.current.subscribers.touchStarted.forEach(fn => fn(e));
      };

      sketch.touchMoved = e => {
        state.current.subscribers.touchMoved.forEach(fn => fn(e));
      };

      sketch.touchEnded = e => {
        state.current.subscribers.touchEnded.forEach(fn => fn(e));
      };

      sketch.deviceMoved = () => {
        state.current.subscribers.deviceMoved.forEach(fn => fn());
      };

      sketch.deviceTurned = () => {
        state.current.subscribers.deviceTurned.forEach(fn => fn());
      };

      sketch.deviceShaken = () => {
        state.current.subscribers.deviceShaken.forEach(fn => fn());
      };
    }, wrapper.current);
    state.current.container = new Container(state.current.canvas, props);
  }, []);
  React.useEffect(() => {
    // Unmounting the p5 canvas
    return () => {
      state.current.canvas.remove();
      state.current.canvas = null;
      state.current.container = null;
    };
  }, []);
  React.useEffect(() => {
    setTimeout(() => {
      render(React__default.createElement(StateContext.Provider, {
        value: _extends({}, state.current)
      }, React__default.createElement("renderWrapper", null, children)), state.current.container);
    });
  });
  return React__default.createElement("div", _extends({
    ref: wrapper
  }, newProps, {
    style: {
      display: 'inline-block'
    }
  }));
};

Canvas.propTypes = {
  children: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.element), PropTypes.element]),
  size: PropTypes.arrayOf(PropTypes.number),
  renderer: PropTypes.oneOf(['p2d', 'webgl'])
};

function useP5Event(event, fn) {
  const _useContext = React.useContext(StateContext);
        const {subscribe} = _useContext;

  React.useEffect(() => subscribe(event, fn), []);
}
function useDraw(fn) {
  const _useState = React.useState(0);
        const frame = _useState[0];
        const setFrames = _useState[1]; // eslint-disable-line no-unused-vars


  useP5Event('draw', p5 => {
    fn(p5);
    setFrames(f => f + 1);
  });
} // TODO anyway of getting useP5 etc to work in the top level app component Tue 12 Mar 2019 01:11:31 GMT

function useP5() {
  const _useContext2 = React.useContext(StateContext);
        const {canvas} = _useContext2;

  return canvas;
}
function useP5Effect(fn, deps) {
  const p5 = useP5();
  React.useEffect(() => fn(p5), deps);
}
function useP5LayoutEffect(fn, deps) {
  const p5 = useP5();
  React.useLayoutEffect(() => fn(p5), deps);
}
function useKeyPressed(fn) {
  useP5Event('keyPressed', fn);
}
function useKeyReleased(fn) {
  useP5Event('keyReleased', fn);
}
function useKeyTyped(fn) {
  useP5Event('keyTyped', fn);
}
function useMouseMoved(fn) {
  useP5Event('mouseMoved', fn);
}
function useMouseDragged(fn) {
  useP5Event('mouseDragged', fn);
}
function useMousePressed(fn) {
  useP5Event('mousePressed', fn);
}
function useMouseReleased(fn) {
  useP5Event('mouseReleased', fn);
}
function useMouseClicked(fn) {
  useP5Event('mouseClicked', fn);
}
function useDoubleClicked(fn) {
  useP5Event('doubleClicked', fn);
}
function useMouseWheel(fn) {
  useP5Event('mouseWheel', fn);
}
function useTouchStarted(fn) {
  useP5Event('touchStarted', fn);
}
function useTouchMoved(fn) {
  useP5Event('touchMoved', fn);
}
function useTouchEnded(fn) {
  useP5Event('touchEnded', fn);
}
function useDeviceMoved(fn) {
  useP5Event('deviceMoved', fn);
}
function useDeviceTurned(fn) {
  useP5Event('deviceTurned', fn);
}
function useDeviceShaken(fn) {
  useP5Event('deviceShaken', fn);
}

exports.Canvas = Canvas;
exports.render = render;
exports.default = Canvas;
exports.useP5Event = useP5Event;
exports.useDraw = useDraw;
exports.useP5 = useP5;
exports.useP5Effect = useP5Effect;
exports.useP5LayoutEffect = useP5LayoutEffect;
exports.useKeyPressed = useKeyPressed;
exports.useKeyReleased = useKeyReleased;
exports.useKeyTyped = useKeyTyped;
exports.useMouseMoved = useMouseMoved;
exports.useMouseDragged = useMouseDragged;
exports.useMousePressed = useMousePressed;
exports.useMouseReleased = useMouseReleased;
exports.useMouseClicked = useMouseClicked;
exports.useDoubleClicked = useDoubleClicked;
exports.useMouseWheel = useMouseWheel;
exports.useTouchStarted = useTouchStarted;
exports.useTouchMoved = useTouchMoved;
exports.useTouchEnded = useTouchEnded;
exports.useDeviceMoved = useDeviceMoved;
exports.useDeviceTurned = useDeviceTurned;
exports.useDeviceShaken = useDeviceShaken;
