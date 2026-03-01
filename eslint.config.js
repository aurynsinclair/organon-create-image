import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier";

export default tseslint.config(
  {
    ignores: ["dist/", "coverage/", "scripts/"],
  },
  ...tseslint.configs.recommended,
  {
    rules: {
      complexity: ["warn", { max: 10 }],
    },
  },
  eslintConfigPrettier,
);
