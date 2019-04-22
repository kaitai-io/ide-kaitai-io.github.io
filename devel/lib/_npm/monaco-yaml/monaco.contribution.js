(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define('vs/language/yaml/monaco.contribution',["require", "exports"], factory);
    }
})(function (require, exports) {
    /*---------------------------------------------------------------------------------------------
     *  Copyright (c) Microsoft Corporation. All rights reserved.
     *  Licensed under the MIT License. See License.txt in the project root for license information.
     *--------------------------------------------------------------------------------------------*/
    'use strict';
    Object.defineProperty(exports, "__esModule", { value: true });
    var Emitter = monaco.Emitter;
    // --- YAML configuration and defaults ---------
    var LanguageServiceDefaultsImpl = /** @class */ (function () {
        function LanguageServiceDefaultsImpl(languageId, diagnosticsOptions) {
            this._onDidChange = new Emitter();
            this._languageId = languageId;
            this.setDiagnosticsOptions(diagnosticsOptions);
        }
        Object.defineProperty(LanguageServiceDefaultsImpl.prototype, "onDidChange", {
            get: function () {
                return this._onDidChange.event;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(LanguageServiceDefaultsImpl.prototype, "languageId", {
            get: function () {
                return this._languageId;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(LanguageServiceDefaultsImpl.prototype, "diagnosticsOptions", {
            get: function () {
                return this._diagnosticsOptions;
            },
            enumerable: true,
            configurable: true
        });
        LanguageServiceDefaultsImpl.prototype.setDiagnosticsOptions = function (options) {
            this._diagnosticsOptions = options || Object.create(null);
            this._onDidChange.fire(this);
        };
        return LanguageServiceDefaultsImpl;
    }());
    exports.LanguageServiceDefaultsImpl = LanguageServiceDefaultsImpl;
    var diagnosticDefault = {
        validate: true,
        schemas: [],
        enableSchemaRequest: false
    };
    var yamlDefaults = new LanguageServiceDefaultsImpl('yaml', diagnosticDefault);
    // Export API
    function createAPI() {
        return {
            yamlDefaults: yamlDefaults,
        };
    }
    monaco.languages.yaml = createAPI();
    // --- Registration to monaco editor ---
    function withMode(callback) {
        require(['vs/language/yaml/yamlMode'], callback);
    }
    monaco.languages.register({
        id: 'yaml',
        extensions: ['.yaml', '.yml'],
        aliases: ['YAML', 'yaml', 'YML', 'yml'],
        mimetypes: ['application/x-yaml']
    });
    monaco.languages.onLanguage('yaml', function () {
        withMode(function (mode) { return mode.setupMode(yamlDefaults); });
    });
});

