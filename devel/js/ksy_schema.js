
define(function(){

return {
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "ksy schema",
  "description": "the schema for ksy files",
  "type": "object",
  "additionalProperties": "false",
  "properties": {
    "meta": {
      "$ref": "#/definitions/MetaSpec",
      "required": [
        "id"
      ]
    },
    "doc": {
      "$ref": "#/definitions/Attribute/properties/doc"
    },
    "doc-ref": {
      "$ref": "#/definitions/Attribute/properties/doc-ref"
    },
    "params": { "$ref": "#/definitions/ParamsSpec" },
    "seq": {
      "description": "identifier for a primary structure described in top-level map",
      "$ref": "#/definitions/Attributes"
    },
    "types": {
      "description": "maps of strings to user-defined types\n\ndeclares types for substructures that can be referenced in the attributes of seq or instances element\n\nwould be directly translated into classes",
      "$ref": "#/definitions/TypesSpec"
    },
    "instances": {
      "description": "Purpose: description of data that lies outside of normal sequential parsing flow (for example, that requires seeking somewhere in the file) or just needs to be loaded only by special request\n\nInfluences: would be translated into distinct methods (that read desired data on demand) in current class",
      "$ref": "#/definitions/InstancesSpec"
    },
    "enums": {
      "description": "allows for the setup of named enums, mappings of integer constants to symbolic names. Can be used with integer attributes using the enum key.\n\nwould be represented as enum-like construct (or closest equivalent, if target language doesn’t support enums), nested or namespaced in current type/class",
      "$ref": "#/definitions/EnumsSpec"
    }
  },
  "patternProperties": {
    "^-.*$": { "$ref": "#/definitions/StringOrInteger" }
  },
  "definitions": {
    "MetaSpec": {
      "type": "object",
      "additionalProperties": false,
      "properties": {
        "id": { "$ref": "#/definitions/Identifier" },
        "title": { "type": "string" },
        "application": {
          "anyOf": [
            { "type": "string" },
            {
              "type": "array",
              "items": { "type": "string" }
            }
          ]
        },
        "file-extension": {
          "anyOf": [
            { "type": "string" },
            {
              "type": "array",
              "items": { "type": "string" }
            }
          ]
        },
        "xref": {
          "type": "object",
          "additionalProperties": false,
          "patternProperties": {
            "^.*$": {
              "anyOf": [
                { "$ref": "#/definitions/AnyScalar" },
                {
                  "type": "array",
                  "items": { "$ref": "#/definitions/AnyScalar" }
                }
              ]
            }
          }
        },
        "license": { "type": "string" },
        "ks-version": {
          "anyOf": [
            { "type": "string" },
            { "type": "number" }
          ]
        },
        "imports": {
          "type": "array",
          "items": {
            "type": "string",
            "pattern": "^(.*/)?[a-z][a-z0-9_]*$"
          }
        },
        "encoding": { "type": "string" },
        "endian": {
          "anyOf": [
            { "enum": [ "le", "be" ] },
            {
              "type": "object",
              "additionalProperties": false,
              "properties": {
                "switch-on": { "type": "string" },
                "cases": {
                  "type": "object",
                  "additionalProperties": false,
                  "patternProperties": {
                    "^.*$": { "enum": [ "le", "be" ] }
                  }
                }
              }
            }
          ]
        }
      }
    },
    "Attribute": {
      "additionalProperties": "false",
      "type": "object",
      "properties": {
        "id": {
          "type": "string",
          "description": "contains a string that matches /^[a-z][a-z0-9_]*$/ used to identify one attribute among others"
        },
        "doc": {
          "type": "string",
          "description": "used to give a more detailed description of a user-defined type. In most languages, it will be used as a docstring compatible with tools like Javadoc, Doxygen, JSDoc, etc."
        },
        "doc-ref": {
          "type": "string",
          "description": "used to provide reference to original documentation (if the ksy file is actually an implementation of some documented format).\n\nContains: (1) URL as text, (2) arbitrary string, or (3) URL as text + space + arbitrary string"
        },
        "contents": {
          "description": "specify fixed contents that the parser should encounter at this point. If the content of the stream doesn't match the given bytes, an error is thrown and it's meaningless to continue parsing",
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "array",
              "items": {
                "$ref": "#/definitions/StringOrInteger"
              }
            }
          ]
        },
        "type": {
          "description": "defines data type for an attribute can also be user-defined https://doc.kaitai.io/ksy_reference.html#attribute-type",
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "object",
              "additionalProperties": false,
              "properties": {
                "switch-on": {
                  "type": "string",
                  "pattern": "^[a-z_][a-z0-9_.]*$"
                },
                "cases": {
                  "type": "object",
                  "additionalProperties": false,
                  "patternProperties": {
                    "^.*$": {
                      "type": "string",
                      "pattern": "^[a-z_][a-z0-9_.]*$"
                    }
                  }
                }
              }
            },
            {
              "type": "string",
              "enum": [
                "u1",
                "u2le",
                "u2be",
                "u4le",
                "u4be",
                "u8le",
                "u8be",
                "s1",
                "s2le",
                "s2be",
                "s4le",
                "s4be",
                "s8le",
                "s8be",
                "f4be",
                "f4le",
                "f8be",
                "f8le",
                "str",
                "strz"
              ]
            }
          ]
        },
        "repeat": {
          "description": "designates repeated attribute in a structure\n\n\"expr\" = repeated amount specifified in repeat-expr \"eos\" = repeated until the end of the current system \"until\" = repeated until given expression is true\n\nattribute read as array/list/sequence",
          "enum": [
            "expr",
            "eos",
            "until"
          ]
        },
        "repeat-expr": {
          "description": "specify number of repetitions for repeated attribute",
          "$ref": "#/definitions/StringOrInteger"
        },
        "repeat-until": {
          "description": "expression of boolean type\n\nspecifies expression to be checked each time this is parsed, repeating until the expression is false. One can use _ as a special variable that references the last read element",
          "anyOf": [
            { "type": "string" },
            { "type": "boolean" }
          ]
        },
        "if": {
          "description": "expected to be boolean expression\n\nmarks the attribute as optional (attribute is parsed only if condition specified evaluates to true)",
          "type": "string"
        },
        "size": {
          "description": "the number of bytes to read if \"type\" isn't defined.\n\ncan also be an expression",
          "$ref": "#/definitions/StringOrInteger"
        },
        "size-eos": {
          "description": "reads all the bytes till the end of the stream",
          "type": "boolean"
        },
        "process": {
          "description": "processes the byte buffer before acces",
          "type": "string",
          "pattern": "^zlib|(xor|rol|ror)\\(.*\\)$"
        },
        "enum": {
          "description": "name of existing enum field data type becomes given enum",
          "type": "string",
          "pattern": "^[a-z][a-z0-9_]*$"
        },
        "encoding": {
          "type": "string"
        },
        "terminator": {
          "type": "integer",
          "description": "string reading will stop when it encounters this value default is 0"
        },
        "consume": {
          "type": "boolean",
          "description": "specify if terminator byte should be \"consumed\" when reading\n\nif true: the stream pointer will point to the byte after the terminator byte\n\nif false: the stream pointer will point to the terminator byte itself\n\ndefault is true"
        },
        "include": {
          "type": "boolean",
          "description": "specifies if terminator byte should be considered part of the string read and thus be appended to it\n\ndefault is false"
        },
        "eos-error": {
          "type": "boolean",
          "description": "allows the compiler to ignore the lack of a terminator if eos-error is disabled, string reading will stop at either:\n\n(1.) terminator being encountered\n\n(2.) end of stream is reached\n\ndefault is TRUE"
        },
        "pos": {
          "description": "specifies position at which the value should be parsed",
          "$ref": "#/definitions/StringOrInteger"
        },
        "io": {
          "type": "string",
          "description": "specifies an IO stream from which a value should be parsed"
        },
        "value": {
          "description": "overrides any reading & parsing. Instead, just calculates function specified in value and returns the result as this instance. Has many purposes"
        }
      }
    },
    "Attributes": {
      "type": "array",
      "items": {
        "$ref": "#/definitions/Attribute"
      }
    },
    "StringOrInteger": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "integer"
        }
      ]
    },
    "TypeSpec": {
      "type": "object",
      "additionalProperties": false,
      "properties": {
        "meta": { "$ref": "#/definitions/MetaSpec" },
        "params": { "$ref": "#/definitions/ParamsSpec" },
        "seq": { "$ref": "#/definitions/AttrsSpec" },
        "types": { "$ref": "#/definitions/TypesSpec" },
        "enums": { "$ref": "#/definitions/EnumsSpec" },
        "instances": { "$ref": "#/definitions/InstancesSpec" },
        "doc": { "type": "string" },
        "doc-ref": { "type": "string" }
      },
      "patternProperties": {
        "^-.*$": { "$ref": "#/definitions/StringOrInteger" }
      }
    },
    "TypesSpec": {
      "type": "object",
      "additionalProperties": false,
      "patternProperties": {
        "^([a-z0-9_])+$": {
          "$ref": "#/definitions/TypeSpec"
        }
      }
    },
    "ParamSpec": {
      "type": "object",
      "additionalProperties": false,
      "properties": {
        "id": { "$ref": "#/definitions/Identifier" },
        "type": { "type": "string" },
        "doc": { "type": "string" },
        "doc-ref": { "type": "string" }
      },
      "required": ["id"]
    },
    "ParamsSpec": {
      "type": "array",
      "items": { "$ref": "#/definitions/ParamSpec" }
    },
    "InstancesSpec": {
      "type": "object",
      "additionalProperties": false,
      "patternProperties": {
        "^([a-z0-9_])+$": {
          "$ref": "#/definitions/Attribute"
        }
      }
    },
    "EnumValueSpec": {
      "$ref": "#/definitions/Identifier",
      "anyOf": [
        {
          "type": "object",
          "additionalProperties": false,
          "properties": {
            "id": { "$ref": "#/definitions/Identifier" },
            "doc": { "type": "string" },
            "doc-ref": { "type": "string" },
            "-orig-id": { "type": "string" }
          },
          "patternProperties": {
            "^-.*$": { "$ref": "#/definitions/StringOrInteger" }
          }
        }
      ]
    },
    "EnumSpec": {
      "type": "object",
      "additionalProperties": false,
      "patternProperties": { "^.*$": { "$ref": "#/definitions/EnumValueSpec" } }
    },
    "EnumsSpec": {
      "type": "object",
      "additionalProperties": false,
      "patternProperties": {
        "^([a-z0-9_])+$": {
          "$ref": "#/definitions/EnumSpec"
        }
      }
    },
    "Identifier": {
      "anyOf": [
        {
          "type": "string",
          "pattern": "^[a-z][a-z0-9_]*$"
        },
        { "type": "boolean" }
      ]
    },
    "AnyScalar": {
      "anyOf": [
        { "type": "string" },
        { "type": "number" },
        { "type": "integer" },
        { "type": "boolean" },
        { "type": "null" }
      ]
    }
  }
}


});