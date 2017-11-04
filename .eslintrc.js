module.exports = {
  extends: ["eslint-config-airbnb-base"].map(require.resolve),
  parserOptions: {
    sourceType: "script"
  },
  env: {
    node: true,
    jest: true
  },
  rules: {
    "arrow-body-style": "off",
    "arrow-parens": ["error", "always"],
    "comma-dangle": [
      "error",
      {
        arrays: "always-multiline",
        objects: "always-multiline",
        imports: "always-multiline",
        exports: "always-multiline",
        functions: "always-multiline"
      }
    ],
    "dot-notation": "off",
    "no-confusing-arrow": "off",
    "no-console": "off",
    "no-mixed-operators": [
      "error",
      {
        groups: [["&", "|", "^", "~", "<<", ">>", ">>>"], ["&&", "||"]]
      }
    ],
    "no-multiple-empty-lines": ["error", { max: 2, maxEOF: 0 }],
    "quote-props": "off",
    strict: ["error", "never"]
  }
};
