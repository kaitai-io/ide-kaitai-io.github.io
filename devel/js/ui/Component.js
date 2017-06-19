define(["require", "exports", "vue", "./ComponentLoader"], function (require, exports, Vue, ComponentLoader_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.$internalHooks = [
        "data",
        "beforeCreate",
        "created",
        "beforeMount",
        "mounted",
        "beforeDestroy",
        "destroyed",
        "beforeUpdate",
        "updated",
        "activated",
        "deactivated",
        "render"
    ];
    function componentFactory(Component, options = {}) {
        options.name = options.name || Component._componentTag || Component.name;
        // prototype props.
        const proto = Component.prototype;
        Object.getOwnPropertyNames(proto).forEach(function (key) {
            if (key === "constructor") {
                return;
            }
            // hooks
            if (exports.$internalHooks.indexOf(key) > -1) {
                options[key] = proto[key];
                return;
            }
            const descriptor = Object.getOwnPropertyDescriptor(proto, key);
            if (typeof descriptor.value === "function") {
                // methods
                (options.methods || (options.methods = {}))[key] = descriptor.value;
            }
            else if (descriptor.get || descriptor.set) {
                // computed properties
                (options.computed || (options.computed = {}))[key] = {
                    get: descriptor.get,
                    set: descriptor.set
                };
            }
        });
        // add data hook to collect class properties as Vue instance's data
        (options.mixins || (options.mixins = [])).push({
            data() {
                return collectDataFromConstructor(this, Component);
            }
        });
        if (!options.props)
            options.props = {};
        if (!options.props["model"])
            options.props["model"] = Object;
        console.log('component factory', options.name, options.template);
        // find super
        const superProto = Object.getPrototypeOf(Component.prototype);
        const Super = superProto instanceof Vue ? superProto.constructor : Vue;
        const result = Super.extend(options);
        if (ComponentLoader_1.componentLoader.templates[options.name])
            options.template = ComponentLoader_1.componentLoader.templates[options.name];
        else if (requirejs) {
            var modulePaths = Array.from(document.head.getElementsByTagName("script")).map(x => x.src);
            var candidates = modulePaths.filter(x => x.endsWith(`/${options.name}.js`));
            // if (candidates.length !== 1) console.error(`Could not found component's source path: ${options.name}!`, candidates, modulePaths);
            ComponentLoader_1.componentLoader.onLoad(candidates[0]).then(() => {
                options.template = ComponentLoader_1.componentLoader.templates[options.name];
            });
        }
        //componentLoader.loadTemplate(options.name, this);
        Vue.component(options.name, result);
        return result;
    }
    exports.componentFactory = componentFactory;
    function collectDataFromConstructor(vm, Component) {
        // override _init to prevent to init as Vue instance
        Component.prototype._init = function () {
            // proxy to actual vm
            const keys = Object.getOwnPropertyNames(vm);
            // 2.2.0 compat (props are no longer exposed as self properties)
            if (vm.$options.props) {
                for (var key in vm.$options.props) {
                    if (!vm.hasOwnProperty(key)) {
                        keys.push(key);
                    }
                }
            }
            keys.forEach(key => {
                if (key.charAt(0) !== "_") {
                    Object.defineProperty(this, key, {
                        get: () => vm[key],
                        set: value => vm[key] = value
                    });
                }
            });
        };
        // should be acquired class property values
        const data = new Component();
        // create plain data object
        const plainData = {};
        Object.keys(data).forEach(key => {
            if (data[key] !== undefined) {
                plainData[key] = data[key];
            }
        });
        return plainData;
    }
    exports.collectDataFromConstructor = collectDataFromConstructor;
    function Component(options) {
        if (typeof options === "function") {
            return componentFactory(options);
        }
        return function (Component) {
            return componentFactory(Component, options);
        };
    }
    (function (Component) {
        function registerHooks(keys) {
            exports.$internalHooks.push(...keys);
        }
        Component.registerHooks = registerHooks;
    })(Component || (Component = {}));
    exports.default = Component;
});
//# sourceMappingURL=Component.js.map