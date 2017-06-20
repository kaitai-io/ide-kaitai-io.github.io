System.register(["goldenlayout"], function (exports_1, context_1) {
    "use strict";
    var __moduleName = context_1 && context_1.id;
    var GoldenLayout, LayoutItem, Component, ClosableComponent, fakeComponentName, Container, LayoutManager;
    return {
        setters: [
            function (GoldenLayout_1) {
                GoldenLayout = GoldenLayout_1;
            }
        ],
        execute: function () {
            LayoutItem = class LayoutItem {
                constructor(parent, contentItem) {
                    this.parent = parent;
                    this.contentItem = contentItem;
                }
                init() { }
            };
            exports_1("LayoutItem", LayoutItem);
            Component = class Component extends LayoutItem {
                get component() { return this.contentItem.contentItems[0]; }
                get container() { return this.component.container; }
                get element() { return this.container.getElement().get(0); }
                get title() { return this.component.config.title; }
                set title(newTitle) { this.component.setTitle(newTitle); }
                init() {
                    var config = this.component && this.component.config;
                    if (config && (typeof config.width === "number" || typeof config.height === "number"))
                        this.container.setSize(config.width, config.height);
                }
            };
            exports_1("Component", Component);
            ClosableComponent = class ClosableComponent {
                constructor(parent, generator, show) {
                    this.parent = parent;
                    this.generator = generator;
                    this.component = null;
                    if (show)
                        this.show();
                }
                get visible() { return this.component !== null; }
                set visible(show) {
                    if (show === this.visible)
                        return;
                    if (show)
                        this.show();
                    else
                        this.hide();
                }
                show() {
                    this.component = this.generator(this.parent);
                    if (this.lastHeight || this.lastWidth)
                        this.component.container.setSize(this.lastWidth, this.lastHeight);
                    this.component.container.on("resize", () => {
                        var element = this.component.contentItem.element;
                        this.lastHeight = element.outerHeight();
                        this.lastWidth = element.outerWidth();
                    });
                    for (var event of ["destroy", "close"])
                        this.component.container.on(event, () => {
                            this.component = null;
                            console.log('set');
                        });
                }
                hide() {
                    this.component.component.remove();
                }
            };
            exports_1("ClosableComponent", ClosableComponent);
            fakeComponentName = "fakeComponent";
            Container = class Container extends LayoutItem {
                constructor() {
                    super(...arguments);
                    this.children = [];
                }
                addChild(creator, props, cb) {
                    this.contentItem.addChild(Object.assign({ isClosable: false, children: [] }, props));
                    var newItem = new creator(this, this.contentItem.contentItems.last());
                    newItem.init();
                    this.children.push(newItem);
                    cb && cb(newItem);
                    return typeof (cb) === "undefined" ? newItem : this;
                }
                addContainer(type, cb) {
                    return this.addChild(Container, { type: type }, cb);
                }
                addHorizontal(cb) { return this.addContainer("row", cb); }
                addVertical(cb) { return this.addContainer("column", cb); }
                addTabs(cb) { return this.addContainer("stack", cb); }
                remove(item) {
                    this.children.remove(item);
                    this.contentItem.removeChild(item.contentItem);
                }
                addComponent(title, cbOrProps, cb) {
                    var props = typeof cbOrProps === "object" ? cbOrProps : null;
                    cb = cb || (typeof cbOrProps === "function" ? cbOrProps : undefined);
                    return this.addChild(Component, Object.assign({ type: "component", componentName: fakeComponentName, title: title }, props), cb);
                }
                addClosableComponent(generator, show, cb) {
                    cb(new ClosableComponent(this, generator, show));
                    return this;
                }
                init() {
                    for (var child of this.children)
                        child.init();
                }
            };
            exports_1("Container", Container);
            LayoutManager = class LayoutManager {
                constructor() {
                    this.goldenLayout = new GoldenLayout({ settings: { showCloseIcon: false, showPopoutIcon: false }, content: [] });
                    this.goldenLayout.registerComponent(fakeComponentName, function () { });
                    this.goldenLayout.init();
                    this.root = new Container(null, this.goldenLayout.root);
                }
            };
            exports_1("LayoutManager", LayoutManager);
        }
    };
});
//# sourceMappingURL=LayoutManagerV2.js.map