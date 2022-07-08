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
    function componentFactory(component, options = {}) {
        options.name = options.name || component._componentTag || component.name;
        // prototype props.
        const proto = component.prototype;
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
                return collectDataFromConstructor(this, component);
            }
        });
        if (!options.props)
            options.props = {};
        if (!options.props["model"])
            options.props["model"] = Object;
        if (ComponentLoader_1.componentLoader.templates[options.name])
            options.template = ComponentLoader_1.componentLoader.templates[options.name];
        //else
        //    console.error(`Missing template for component: ${options.name}`);
        // find super
        const superProto = Object.getPrototypeOf(component.prototype);
        const Super = superProto instanceof Vue ? superProto.constructor : Vue;
        const result = Super.extend(options);
        Vue.component(options.name, result);
        return result;
    }
    exports.componentFactory = componentFactory;
    function collectDataFromConstructor(vm, component) {
        // override _init to prevent to init as Vue instance
        component.prototype._init = function () {
            // proxy to actual vm
            const keys = Object.getOwnPropertyNames(vm);
            // 2.2.0 compat (props are no longer exposed as self properties)
            if (vm.$options.props) {
                for (var propKey in vm.$options.props) {
                    if (!vm.hasOwnProperty(propKey)) {
                        keys.push(propKey);
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
        const data = new component();
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
        return function (component) {
            return componentFactory(component, options);
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
