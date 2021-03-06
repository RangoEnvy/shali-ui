'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var sourceMap = require('source-map');
var shared = require('@vue/shared');
var CompilerDOM = require('@vue/compiler-dom');
var compilerCore = require('@vue/compiler-core');
var url = require('url');
var CompilerSSR = require('@vue/compiler-ssr');
var postcss = _interopDefault(require('postcss'));
var selectorParser = _interopDefault(require('postcss-selector-parser'));
var merge = _interopDefault(require('merge-source-map'));

const SFC_CACHE_MAX_SIZE = 500;
const sourceToSFC =  new (require('lru-cache'))(SFC_CACHE_MAX_SIZE);
function parse(source, { sourceMap = true, filename = 'component.vue', sourceRoot = '', pad = false, compiler = CompilerDOM } = {}) {
    const sourceKey = source + sourceMap + filename + sourceRoot + pad + compiler.parse;
    const cache = sourceToSFC.get(sourceKey);
    if (cache) {
        return cache;
    }
    const descriptor = {
        filename,
        template: null,
        script: null,
        styles: [],
        customBlocks: []
    };
    const errors = [];
    const ast = compiler.parse(source, {
        // there are no components at SFC parsing level
        isNativeTag: () => true,
        // preserve all whitespaces
        isPreTag: () => true,
        getTextMode: (tag, _ns, parent) => {
            // all top level elements except <template> are parsed as raw text
            // containers
            if (!parent && tag !== 'template') {
                return 2 /* RAWTEXT */;
            }
            else {
                return 0 /* DATA */;
            }
        },
        onError: e => {
            errors.push(e);
        }
    });
    ast.children.forEach(node => {
        if (node.type !== 1 /* ELEMENT */) {
            return;
        }
        if (!node.children.length && !hasSrc(node)) {
            return;
        }
        switch (node.tag) {
            case 'template':
                if (!descriptor.template) {
                    descriptor.template = createBlock(node, source, false);
                }
                else {
                    warnDuplicateBlock(source, filename, node);
                }
                break;
            case 'script':
                if (!descriptor.script) {
                    descriptor.script = createBlock(node, source, pad);
                }
                else {
                    warnDuplicateBlock(source, filename, node);
                }
                break;
            case 'style':
                descriptor.styles.push(createBlock(node, source, pad));
                break;
            default:
                descriptor.customBlocks.push(createBlock(node, source, pad));
                break;
        }
    });
    if (sourceMap) {
        const genMap = (block) => {
            if (block && !block.src) {
                block.map = generateSourceMap(filename, source, block.content, sourceRoot, !pad || block.type === 'template' ? block.loc.start.line - 1 : 0);
            }
        };
        genMap(descriptor.template);
        genMap(descriptor.script);
        descriptor.styles.forEach(genMap);
    }
    const result = {
        descriptor,
        errors
    };
    sourceToSFC.set(sourceKey, result);
    return result;
}
function warnDuplicateBlock(source, filename, node) {
    const codeFrame = shared.generateCodeFrame(source, node.loc.start.offset, node.loc.end.offset);
    const location = `${filename}:${node.loc.start.line}:${node.loc.start.column}`;
    console.warn(`Single file component can contain only one ${node.tag} element (${location}):\n\n${codeFrame}`);
}
function createBlock(node, source, pad) {
    const type = node.tag;
    let { start, end } = node.loc;
    let content = '';
    if (node.children.length) {
        start = node.children[0].loc.start;
        end = node.children[node.children.length - 1].loc.end;
        content = source.slice(start.offset, end.offset);
    }
    const loc = {
        source: content,
        start,
        end
    };
    const attrs = {};
    const block = {
        type,
        content,
        loc,
        attrs
    };
    if (pad) {
        block.content = padContent(source, block, pad) + block.content;
    }
    node.props.forEach(p => {
        if (p.type === 6 /* ATTRIBUTE */) {
            attrs[p.name] = p.value ? p.value.content || true : true;
            if (p.name === 'lang') {
                block.lang = p.value && p.value.content;
            }
            else if (p.name === 'src') {
                block.src = p.value && p.value.content;
            }
            else if (type === 'style') {
                if (p.name === 'scoped') {
                    block.scoped = true;
                }
                else if (p.name === 'module') {
                    block.module = attrs[p.name];
                }
            }
            else if (type === 'template' && p.name === 'functional') {
                block.functional = true;
            }
        }
    });
    return block;
}
const splitRE = /\r?\n/g;
const emptyRE = /^(?:\/\/)?\s*$/;
const replaceRE = /./g;
function generateSourceMap(filename, source, generated, sourceRoot, lineOffset) {
    const map = new sourceMap.SourceMapGenerator({
        file: filename.replace(/\\/g, '/'),
        sourceRoot: sourceRoot.replace(/\\/g, '/')
    });
    map.setSourceContent(filename, source);
    generated.split(splitRE).forEach((line, index) => {
        if (!emptyRE.test(line)) {
            map.addMapping({
                source: filename,
                original: {
                    line: index + 1 + lineOffset,
                    column: 0
                },
                generated: {
                    line: index + 1,
                    column: 0
                }
            });
        }
    });
    return JSON.parse(map.toString());
}
function padContent(content, block, pad) {
    content = content.slice(0, block.loc.start.offset);
    if (pad === 'space') {
        return content.replace(replaceRE, ' ');
    }
    else {
        const offset = content.split(splitRE).length;
        const padChar = block.type === 'script' && !block.lang ? '//\n' : '\n';
        return Array(offset).join(padChar);
    }
}
function hasSrc(node) {
    return node.props.some(p => {
        if (p.type !== 6 /* ATTRIBUTE */) {
            return false;
        }
        return p.name === 'src';
    });
}

function isRelativeUrl(url) {
    const firstChar = url.charAt(0);
    return firstChar === '.' || firstChar === '~' || firstChar === '@';
}
// We need an extra transform context API for injecting arbitrary import
// statements.
function parseUrl(url) {
    const firstChar = url.charAt(0);
    if (firstChar === '~') {
        const secondChar = url.charAt(1);
        url = url.slice(secondChar === '/' ? 2 : 1);
    }
    return parseUriParts(url);
}
/**
 * vuejs/component-compiler-utils#22 Support uri fragment in transformed require
 * @param urlString an url as a string
 */
function parseUriParts(urlString) {
    // A TypeError is thrown if urlString is not a string
    // @see https://nodejs.org/api/url.html#url_url_parse_urlstring_parsequerystring_slashesdenotehost
    return url.parse(shared.isString(urlString) ? urlString : '');
}

const defaultOptions = {
    video: ['src', 'poster'],
    source: ['src'],
    img: ['src'],
    image: ['xlink:href', 'href'],
    use: ['xlink:href', 'href']
};
const createAssetUrlTransformWithOptions = (options) => {
    const mergedOptions = {
        ...defaultOptions,
        ...options
    };
    return (node, context) => transformAssetUrl(node, context, mergedOptions);
};
const transformAssetUrl = (node, context, options = defaultOptions) => {
    if (node.type === 1 /* ELEMENT */) {
        for (const tag in options) {
            if ((tag === '*' || node.tag === tag) && node.props.length) {
                const attributes = options[tag];
                attributes.forEach(item => {
                    node.props.forEach((attr, index) => {
                        if (attr.type !== 6 /* ATTRIBUTE */)
                            return;
                        if (attr.name !== item)
                            return;
                        if (!attr.value)
                            return;
                        if (!isRelativeUrl(attr.value.content))
                            return;
                        const url = parseUrl(attr.value.content);
                        const exp = getImportsExpressionExp(url.path, url.hash, attr.loc, context);
                        node.props[index] = {
                            type: 7 /* DIRECTIVE */,
                            name: 'bind',
                            arg: compilerCore.createSimpleExpression(item, true, attr.loc),
                            exp,
                            modifiers: [],
                            loc: attr.loc
                        };
                    });
                });
            }
        }
    }
};
function getImportsExpressionExp(path, hash, loc, context) {
    if (path) {
        const importsArray = Array.from(context.imports);
        const existing = importsArray.find(i => i.path === path);
        if (existing) {
            return existing.exp;
        }
        const name = `_imports_${importsArray.length}`;
        const exp = compilerCore.createSimpleExpression(name, false, loc, true);
        context.imports.add({ exp, path });
        if (hash && path) {
            return context.hoist(compilerCore.createSimpleExpression(`${name} + '${hash}'`, false, loc, true));
        }
        else {
            return exp;
        }
    }
    else {
        return compilerCore.createSimpleExpression(`''`, false, loc, true);
    }
}

const srcsetTags = ['img', 'source'];
// http://w3c.github.io/html/semantics-embedded-content.html#ref-for-image-candidate-string-5
const escapedSpaceCharacters = /( |\\t|\\n|\\f|\\r)+/g;
const transformSrcset = (node, context) => {
    if (node.type === 1 /* ELEMENT */) {
        if (srcsetTags.includes(node.tag) && node.props.length) {
            node.props.forEach((attr, index) => {
                if (attr.name === 'srcset' && attr.type === 6 /* ATTRIBUTE */) {
                    if (!attr.value)
                        return;
                    // same logic as in transform-require.js
                    const value = attr.value.content;
                    const imageCandidates = value.split(',').map(s => {
                        // The attribute value arrives here with all whitespace, except
                        // normal spaces, represented by escape sequences
                        const [url, descriptor] = s
                            .replace(escapedSpaceCharacters, ' ')
                            .trim()
                            .split(' ', 2);
                        return { url, descriptor };
                    });
                    // When srcset does not contain any relative URLs, skip transforming
                    if (!imageCandidates.some(({ url }) => isRelativeUrl(url)))
                        return;
                    const compoundExpression = compilerCore.createCompoundExpression([], attr.loc);
                    imageCandidates.forEach(({ url, descriptor }, index) => {
                        if (isRelativeUrl(url)) {
                            const { path } = parseUrl(url);
                            let exp;
                            if (path) {
                                const importsArray = Array.from(context.imports);
                                const existingImportsIndex = importsArray.findIndex(i => i.path === path);
                                if (existingImportsIndex > -1) {
                                    exp = compilerCore.createSimpleExpression(`_imports_${existingImportsIndex}`, false, attr.loc, true);
                                }
                                else {
                                    exp = compilerCore.createSimpleExpression(`_imports_${importsArray.length}`, false, attr.loc, true);
                                    context.imports.add({ exp, path });
                                }
                                compoundExpression.children.push(exp);
                            }
                        }
                        else {
                            const exp = compilerCore.createSimpleExpression(`"${url}"`, false, attr.loc, true);
                            compoundExpression.children.push(exp);
                        }
                        const isNotLast = imageCandidates.length - 1 > index;
                        if (descriptor && isNotLast) {
                            compoundExpression.children.push(` + '${descriptor}, ' + `);
                        }
                        else if (descriptor) {
                            compoundExpression.children.push(` + '${descriptor}'`);
                        }
                        else if (isNotLast) {
                            compoundExpression.children.push(` + ', ' + `);
                        }
                    });
                    node.props[index] = {
                        type: 7 /* DIRECTIVE */,
                        name: 'bind',
                        arg: compilerCore.createSimpleExpression('srcset', true, attr.loc),
                        exp: context.hoist(compoundExpression),
                        modifiers: [],
                        loc: attr.loc
                    };
                }
            });
        }
    }
};

function preprocess({ source, filename, preprocessOptions }, preprocessor) {
    // Consolidate exposes a callback based API, but the callback is in fact
    // called synchronously for most templating engines. In our case, we have to
    // expose a synchronous API so that it is usable in Jest transforms (which
    // have to be sync because they are applied via Node.js require hooks)
    let res, err;
    preprocessor.render(source, { filename, ...preprocessOptions }, (_err, _res) => {
        if (_err)
            err = _err;
        res = _res;
    });
    if (err)
        throw err;
    return res;
}
function compileTemplate(options) {
    const { preprocessLang, preprocessCustomRequire } = options;
    const preprocessor = preprocessLang
        ? preprocessCustomRequire
            ? preprocessCustomRequire(preprocessLang)
            : require('consolidate')[preprocessLang]
        : false;
    if (preprocessor) {
        try {
            return doCompileTemplate({
                ...options,
                source: preprocess(options, preprocessor)
            });
        }
        catch (e) {
            return {
                code: `export default function render() {}`,
                source: options.source,
                tips: [],
                errors: [e]
            };
        }
    }
    else if (preprocessLang) {
        return {
            code: `export default function render() {}`,
            source: options.source,
            tips: [
                `Component ${options.filename} uses lang ${preprocessLang} for template. Please install the language preprocessor.`
            ],
            errors: [
                `Component ${options.filename} uses lang ${preprocessLang} for template, however it is not installed.`
            ]
        };
    }
    else {
        return doCompileTemplate(options);
    }
}
function doCompileTemplate({ filename, inMap, source, ssr = false, compiler = ssr ? CompilerSSR : CompilerDOM, compilerOptions = {}, transformAssetUrls }) {
    const errors = [];
    let nodeTransforms = [];
    if (shared.isObject(transformAssetUrls)) {
        nodeTransforms = [
            createAssetUrlTransformWithOptions(transformAssetUrls),
            transformSrcset
        ];
    }
    else if (transformAssetUrls !== false) {
        nodeTransforms = [transformAssetUrl, transformSrcset];
    }
    let { code, map } = compiler.compile(source, {
        mode: 'module',
        prefixIdentifiers: true,
        hoistStatic: true,
        cacheHandlers: true,
        ...compilerOptions,
        nodeTransforms: nodeTransforms.concat(compilerOptions.nodeTransforms || []),
        filename,
        sourceMap: true,
        onError: e => errors.push(e)
    });
    // inMap should be the map produced by ./parse.ts which is a simple line-only
    // mapping. If it is present, we need to adjust the final map and errors to
    // reflect the original line numbers.
    if (inMap) {
        if (map) {
            map = mapLines(inMap, map);
        }
        if (errors.length) {
            patchErrors(errors, source, inMap);
        }
    }
    return { code, source, errors, tips: [], map };
}
function mapLines(oldMap, newMap) {
    if (!oldMap)
        return newMap;
    if (!newMap)
        return oldMap;
    const oldMapConsumer = new sourceMap.SourceMapConsumer(oldMap);
    const newMapConsumer = new sourceMap.SourceMapConsumer(newMap);
    const mergedMapGenerator = new sourceMap.SourceMapGenerator();
    newMapConsumer.eachMapping(m => {
        if (m.originalLine == null) {
            return;
        }
        const origPosInOldMap = oldMapConsumer.originalPositionFor({
            line: m.originalLine,
            column: m.originalColumn
        });
        if (origPosInOldMap.source == null) {
            return;
        }
        mergedMapGenerator.addMapping({
            generated: {
                line: m.generatedLine,
                column: m.generatedColumn
            },
            original: {
                line: origPosInOldMap.line,
                // use current column, since the oldMap produced by @vue/compiler-sfc
                // does not
                column: m.originalColumn
            },
            source: origPosInOldMap.source,
            name: origPosInOldMap.name
        });
    });
    // source-map's type definition is incomplete
    const generator = mergedMapGenerator;
    oldMapConsumer.sources.forEach((sourceFile) => {
        generator._sources.add(sourceFile);
        const sourceContent = oldMapConsumer.sourceContentFor(sourceFile);
        if (sourceContent != null) {
            mergedMapGenerator.setSourceContent(sourceFile, sourceContent);
        }
    });
    generator._sourceRoot = oldMap.sourceRoot;
    generator._file = oldMap.file;
    return generator.toJSON();
}
function patchErrors(errors, source, inMap) {
    const originalSource = inMap.sourcesContent[0];
    const offset = originalSource.indexOf(source);
    const lineOffset = originalSource.slice(0, offset).split(/\r?\n/).length - 1;
    errors.forEach(err => {
        if (err.loc) {
            err.loc.start.line += lineOffset;
            err.loc.start.offset += offset;
            if (err.loc.end !== err.loc.start) {
                err.loc.end.line += lineOffset;
                err.loc.end.offset += offset;
            }
        }
    });
}

var trimPlugin = postcss.plugin('trim', () => (css) => {
    css.walk(({ type, raws }) => {
        if (type === 'rule' || type === 'atrule') {
            if (raws.before)
                raws.before = '\n';
            if (raws.after)
                raws.after = '\n';
        }
    });
});

var scopedPlugin = postcss.plugin('vue-scoped', (options) => (root) => {
    const id = options;
    const keyframes = Object.create(null);
    root.each(function rewriteSelectors(node) {
        if (node.type !== 'rule') {
            // handle media queries
            if (node.type === 'atrule') {
                if (node.name === 'media' || node.name === 'supports') {
                    node.each(rewriteSelectors);
                }
                else if (/-?keyframes$/.test(node.name)) {
                    // register keyframes
                    keyframes[node.params] = node.params = node.params + '-' + id;
                }
            }
            return;
        }
        node.selector = selectorParser(selectors => {
            function rewriteSelector(selector, slotted) {
                let node = null;
                let shouldInject = true;
                // find the last child node to insert attribute selector
                selector.each(n => {
                    // DEPRECATED ">>>" and "/deep/" combinator
                    if (n.type === 'combinator' &&
                        (n.value === '>>>' || n.value === '/deep/')) {
                        n.value = ' ';
                        n.spaces.before = n.spaces.after = '';
                        console.warn(`[@vue/compiler-sfc] the >>> and /deep/ combinators have ` +
                            `been deprecated. Use ::v-deep instead.`);
                        return false;
                    }
                    if (n.type === 'pseudo') {
                        // deep: inject [id] attribute at the node before the ::v-deep
                        // combinator.
                        if (n.value === '::v-deep') {
                            if (n.nodes.length) {
                                // .foo ::v-deep(.bar) -> .foo[xxxxxxx] .bar
                                // replace the current node with ::v-deep's inner selector
                                selector.insertAfter(n, n.nodes[0]);
                                // insert a space combinator before if it doesn't already have one
                                const prev = selector.at(selector.index(n) - 1);
                                if (!prev || !isSpaceCombinator(prev)) {
                                    selector.insertAfter(n, selectorParser.combinator({
                                        value: ' '
                                    }));
                                }
                                selector.removeChild(n);
                            }
                            else {
                                // DEPRECATED usage
                                // .foo ::v-deep .bar -> .foo[xxxxxxx] .bar
                                console.warn(`[@vue/compiler-sfc] ::v-deep usage as a combinator has ` +
                                    `been deprecated. Use ::v-deep(<inner-selector>) instead.`);
                                const prev = selector.at(selector.index(n) - 1);
                                if (prev && isSpaceCombinator(prev)) {
                                    selector.removeChild(prev);
                                }
                                selector.removeChild(n);
                            }
                            return false;
                        }
                        // slot: use selector inside `::v-slotted` and inject [id + '-s']
                        // instead.
                        // ::v-slotted(.foo) -> .foo[xxxxxxx-s]
                        if (n.value === '::v-slotted') {
                            rewriteSelector(n.nodes[0], true /* slotted */);
                            selector.insertAfter(n, n.nodes[0]);
                            selector.removeChild(n);
                            // since slotted attribute already scopes the selector there's no
                            // need for the non-slot attribute.
                            shouldInject = false;
                            return false;
                        }
                        // global: replace with inner selector and do not inject [id].
                        // ::v-global(.foo) -> .foo
                        if (n.value === '::v-global') {
                            selectors.insertAfter(selector, n.nodes[0]);
                            selectors.removeChild(selector);
                            return false;
                        }
                    }
                    if (n.type !== 'pseudo' && n.type !== 'combinator') {
                        node = n;
                    }
                });
                if (node) {
                    node.spaces.after = '';
                }
                else {
                    // For deep selectors & standalone pseudo selectors,
                    // the attribute selectors are prepended rather than appended.
                    // So all leading spaces must be eliminated to avoid problems.
                    selector.first.spaces.before = '';
                }
                if (shouldInject) {
                    const idToAdd = slotted ? id + '-s' : id;
                    selector.insertAfter(
                    // If node is null it means we need to inject [id] at the start
                    // insertAfter can handle `null` here
                    node, selectorParser.attribute({
                        attribute: idToAdd,
                        value: idToAdd,
                        raws: {},
                        quoteMark: `"`
                    }));
                }
            }
            selectors.each(selector => rewriteSelector(selector));
        }).processSync(node.selector);
    });
    // If keyframes are found in this <style>, find and rewrite animation names
    // in declarations.
    // Caveat: this only works for keyframes and animation rules in the same
    // <style> element.
    if (Object.keys(keyframes).length) {
        root.walkDecls(decl => {
            // individual animation-name declaration
            if (/^(-\w+-)?animation-name$/.test(decl.prop)) {
                decl.value = decl.value
                    .split(',')
                    .map(v => keyframes[v.trim()] || v.trim())
                    .join(',');
            }
            // shorthand
            if (/^(-\w+-)?animation$/.test(decl.prop)) {
                decl.value = decl.value
                    .split(',')
                    .map(v => {
                    const vals = v.trim().split(/\s+/);
                    const i = vals.findIndex(val => keyframes[val]);
                    if (i !== -1) {
                        vals.splice(i, 1, keyframes[vals[i]]);
                        return vals.join(' ');
                    }
                    else {
                        return v;
                    }
                })
                    .join(',');
            }
        });
    }
});
function isSpaceCombinator(node) {
    return node.type === 'combinator' && /^\s+$/.test(node.value);
}

// .scss/.sass processor
const scss = {
    render(source, map, options, load = require) {
        const nodeSass = load('sass');
        const finalOptions = {
            ...options,
            data: source,
            file: options.filename,
            outFile: options.filename,
            sourceMap: !!map
        };
        try {
            const result = nodeSass.renderSync(finalOptions);
            if (map) {
                return {
                    code: result.css.toString(),
                    map: merge(map, JSON.parse(result.map.toString())),
                    errors: []
                };
            }
            return { code: result.css.toString(), errors: [] };
        }
        catch (e) {
            return { code: '', errors: [e] };
        }
    }
};
const sass = {
    render(source, map, options, load) {
        return scss.render(source, map, {
            ...options,
            indentedSyntax: true
        }, load);
    }
};
// .less
const less = {
    render(source, map, options, load = require) {
        const nodeLess = load('less');
        let result;
        let error = null;
        nodeLess.render(source, { ...options, syncImport: true }, (err, output) => {
            error = err;
            result = output;
        });
        if (error)
            return { code: '', errors: [error] };
        if (map) {
            return {
                code: result.css.toString(),
                map: merge(map, result.map),
                errors: []
            };
        }
        return { code: result.css.toString(), errors: [] };
    }
};
// .styl
const styl = {
    render(source, map, options, load = require) {
        const nodeStylus = load('stylus');
        try {
            const ref = nodeStylus(source);
            Object.keys(options).forEach(key => ref.set(key, options[key]));
            if (map)
                ref.set('sourcemap', { inline: false, comment: false });
            const result = ref.render();
            if (map) {
                return {
                    code: result,
                    map: merge(map, ref.sourcemap),
                    errors: []
                };
            }
            return { code: result, errors: [] };
        }
        catch (e) {
            return { code: '', errors: [e] };
        }
    }
};
const processors = {
    less,
    sass,
    scss,
    styl,
    stylus: styl
};

function compileStyle(options) {
    return doCompileStyle({
        ...options,
        isAsync: false
    });
}
function compileStyleAsync(options) {
    return doCompileStyle({ ...options, isAsync: true });
}
function doCompileStyle(options) {
    const { filename, id, scoped = false, trim = true, modules = false, modulesOptions = {}, preprocessLang, postcssOptions, postcssPlugins } = options;
    const preprocessor = preprocessLang && processors[preprocessLang];
    const preProcessedSource = preprocessor && preprocess$1(options, preprocessor);
    const map = preProcessedSource ? preProcessedSource.map : options.map;
    const source = preProcessedSource ? preProcessedSource.code : options.source;
    const plugins = (postcssPlugins || []).slice();
    if (trim) {
        plugins.push(trimPlugin());
    }
    if (scoped) {
        plugins.push(scopedPlugin(id));
    }
    let cssModules;
    if (modules) {
        if (!options.isAsync) {
            throw new Error('[@vue/compiler-sfc] `modules` option can only be used with compileStyleAsync().');
        }
        plugins.push(require('postcss-modules')({
            ...modulesOptions,
            getJSON: (_cssFileName, json) => {
                cssModules = json;
            }
        }));
    }
    const postCSSOptions = {
        ...postcssOptions,
        to: filename,
        from: filename
    };
    if (map) {
        postCSSOptions.map = {
            inline: false,
            annotation: false,
            prev: map
        };
    }
    let result;
    let code;
    let outMap;
    const errors = [];
    if (preProcessedSource && preProcessedSource.errors.length) {
        errors.push(...preProcessedSource.errors);
    }
    try {
        result = postcss(plugins).process(source, postCSSOptions);
        // In async mode, return a promise.
        if (options.isAsync) {
            return result
                .then(result => ({
                code: result.css || '',
                map: result.map && result.map.toJSON(),
                errors,
                modules: cssModules,
                rawResult: result
            }))
                .catch(error => ({
                code: '',
                map: undefined,
                errors: [...errors, error],
                rawResult: undefined
            }));
        }
        // force synchronous transform (we know we only have sync plugins)
        code = result.css;
        outMap = result.map;
    }
    catch (e) {
        errors.push(e);
    }
    return {
        code: code || ``,
        map: outMap && outMap.toJSON(),
        errors,
        rawResult: result
    };
}
function preprocess$1(options, preprocessor) {
    return preprocessor.render(options.source, options.map, {
        filename: options.filename,
        ...options.preprocessOptions
    }, options.preprocessCustomRequire);
}

exports.generateCodeFrame = compilerCore.generateCodeFrame;
exports.compileStyle = compileStyle;
exports.compileStyleAsync = compileStyleAsync;
exports.compileTemplate = compileTemplate;
exports.parse = parse;
