import {Constructor, CSSResult, LitElement} from "lit-element";

/**
 * Used when generating files at build time that transform .css files
 * into something like CSS Modules that export CSSResults.
 *
 * Does nothing in production, and doesn't replace existing references
 * unless the current browser supports adopting stylesheets (at time of
 * writing that Chrome only).
 *
 * We could support replacing styles cross-browser,
 * but it would be very tricky to do so without leaking memory, becasue we'd
 * need to keep track of every style element that `this` is written into.
 * This actually seems like a legit use case for WeakRefs.
 */

// @ts-ignore
CSSResult.prototype.notifyOnHotModuleReload = function (this: CSSResult, newVal: CSSResult) {
    const sheet = this.styleSheet;
    // Only works with constructable stylesheets
    if (sheet === null) {
        return;
    }
    // tslint:disable-next-line:no-any hot module reload writes readonly prop.
    (this as any).cssText = newVal.cssText;
    // @ts-ignore
    sheet.replaceSync(newVal.cssText);
};

export const supportsAdoptingStyleSheets =
    ("adoptedStyleSheets" in Document.prototype) &&
    ("replace" in CSSStyleSheet.prototype);


function* shadowPiercingWalk(node: Node):IterableIterator<Node> {
    const treeWalker = document.createTreeWalker(node, NodeFilter.SHOW_ELEMENT);
    let currentNode: Node | null = treeWalker.currentNode;
    while (currentNode) {
        if (currentNode instanceof HTMLElement) {
            if (currentNode.shadowRoot) {
                yield* shadowPiercingWalk(currentNode.shadowRoot);
            }
            yield currentNode;
        }
        currentNode = treeWalker.nextNode();
    }
}

// @ts-ignore
LitElement.notifyOnHotModuleReload = function (this: Constructor<LitElement>, tagname: string, classObj: typeof LitElement) {

    // There's lots of things that this doesn't handle, but probably the
    // biggest is updates to the constructor. That means that changes to event
    // handlers won't go through when they're defined as arrow function
    // property initializers. We could potentially hack that together, via
    // some really wild tricks, but I'm inclined not to. Periodically
    // reloading the page while developing with HMR is a good habit for people
    // to get into.
    //
    // One thing I'd like to support is live updating of CSS defined in a
    // css file with lit_css_module.
    const existingProps = new Set(Object.getOwnPropertyNames(this.prototype));
    const newProps = new Set(Object.getOwnPropertyNames(classObj.prototype));
    for (const prop of Object.getOwnPropertyNames(classObj.prototype)) {
        Object.defineProperty(
            this.prototype, prop,
            Object.getOwnPropertyDescriptor(classObj.prototype, prop)!);
    }
    for (const existingProp of existingProps) {
        if (!newProps.has(existingProp)) {
            // tslint:disable-next-line:no-any Also hacky
            delete (this.prototype as any)[existingProp];
        }
    }

    // This new class object has never been finalized before. Need to finalize
    // so that instances can get any updated styles.
    // @ts-ignore
    classObj.finalize();

    for (const node of shadowPiercingWalk(document.body)) {
        if (node instanceof HTMLElement && node.tagName.toLowerCase() === tagname.toLowerCase()) {
            const myNode = node as LitElement;
            // Get updated styling. Need to test that this works in all the
            // different browser configs, only tested on recent Chrome so far,
            // where overriding adopted stylesheets seems to just work.
            myNode.adoptStyles();
            if (!supportsAdoptingStyleSheets) {
                const nodes = Array.from(myNode.renderRoot.children);
                for (const node of nodes) {
                    // TODO(rictic): this is super hacky and doesn't always work,
                    //   even for inline styles.
                    if ((node as HTMLElement).tagName.toLowerCase() === "style") {
                        myNode.renderRoot.removeChild(node);
                    }
                }
            }
            // Ask for a re-render.
            myNode.requestUpdate();
        }
    }
};