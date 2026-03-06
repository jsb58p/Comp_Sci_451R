/* 
This script goes through a JSON file that contains values for primitive design tokens and converts them 
into CSS variables in a different CSS file so those tokens can be used throughout a React application with Tailwind.

The CSS variables that are outputed to the CSS file are formated as described by Tailwind v4.1 Theme variables
- https://tailwindcss.com/docs/theme#extending-the-default-theme
- v4.1 moved theme configuration from the tailwind.config to a global CSS file
*/

const outputfileName = "index.css";
const outputfilePath = "./src/" + outputfileName;

function generate_CSS_variables(
  deconstructed_key_value_pairs,
  variableName_prefix = "",
) {
  // Take in object that contains array of key-value pairs, that are stored in an array of two items, and output whatever SASS stuff I need by accessing the key and the value
  // Take in the key-values pairs that are the most primitive, i.e. "fs-400":  "1rem". Not the string keys like "neutral" or "font-size" that serve both a token grouping purpose and a token naming purpose
  let output_text = ``;

  for ([key, value] of deconstructed_key_value_pairs) {
    output_text = output_text.concat(
      `  --${variableName_prefix}-${key}: ${value};\n`,
    );
  }

  return output_text;
}

function generate_1_CSS_variable(key, value) {
  let output_text = ``;

  output_text = output_text.concat(`  --${key}: ${value};\n`);

  return output_text;
}

try {
  const design_tokens_object = require("./primitive-tokens.json");

  const fs = require("fs");

  try {
    var global_token_output = ``;

    // semantic_token_output = semantic_token_output.concat(`@use 'global_tokens' as ${globalToken_namespace_name};\n`);

    // Add global tailwind import
    global_token_output = global_token_output.concat(
      `@import "tailwindcss"; \n`,
    );

    // Store all CSS variables inside '@theme' selector
    global_token_output = global_token_output.concat(`\n@theme { \n`);

    for ([key, value] of Object.entries(design_tokens_object)) {
      if (key == "text") {
        // Iterate through object with zero nested objects. Object only has string key and string value
        global_token_output = global_token_output.concat(
          `\n   /* Text Sizes */\n`,
        );

        // Write SASS variables into global_tokens.scss
        const fontSizes_object = Object.entries(design_tokens_object["text"]);
        global_token_output = global_token_output.concat(
          generate_CSS_variables(fontSizes_object, key),
        );
        // Empty string passed for variableName_prefix means that I set up the names for font-size variables and utlity classes directly in my json file
      }

      if (key == "font") {
        global_token_output = global_token_output.concat(
          `\n   /* Font Family */\n`,
        );

        const fontType_object = Object.entries(design_tokens_object["font"]);
        global_token_output = global_token_output.concat(
          generate_CSS_variables(fontType_object, key),
        );
      }

      if (key == "font-weight") {
        // 0 nested objects inside font-weights object
        global_token_output = global_token_output.concat(
          `\n  /* Font Weight */\n`,
        );

        const fontWeight_object = Object.entries(
          design_tokens_object["font-weight"],
        );
        global_token_output = global_token_output.concat(
          generate_CSS_variables(fontWeight_object, key),
        );
      }

      if (key == "color") {
        // Iterate through object of objects(each one has string key and object value) that are nested one level deep
        global_token_output = global_token_output.concat(`\n  /* Colors */\n`);

        for ([colorType, colorType__object] of Object.entries(
          design_tokens_object[key],
        )) {
          // Inside the "colors" object, there might be neutral colors object (an object in another object)
          // colorType is a string denoting the type of color
          const colors = Object.entries(design_tokens_object[key][colorType]);
          global_token_output = global_token_output.concat(
            generate_CSS_variables(colors, key + "-" + colorType),
          );
        }
      }

      if (key == "spacing") {
        // Same code logic as iterating through "font-sizes"
        global_token_output = global_token_output.concat(
          `\n  /* Spacing & Sizing */\n`,
        );

        const spacing_object = Object.entries(design_tokens_object["spacing"]);
        global_token_output = global_token_output.concat(
          generate_CSS_variables(spacing_object, key),
        );
        global_token_output = global_token_output.concat(`\n`);
        // No creating spacing utlity classes. Create utlitly classes as you need them, so you include only utility classes you will use.
        // data = data.concat(generate_SASS_utility_classes(spacing_object,"","","font-size"));
        // data = data.concat(`\n`);
      }

      if (key == "radius") {
        // Same code logic as iterating through "font-sizes"
        global_token_output = global_token_output.concat(`  /* Radius */\n`);

        const radius_object = Object.entries(design_tokens_object["radius"]);
        global_token_output = global_token_output.concat(
          generate_CSS_variables(radius_object, key),
        );
        global_token_output = global_token_output.concat(`\n`);
        // No creating spacing utlity classes. Create utlitly classes as you need them, so you include only utility classes you will use.
        // data = data.concat(generate_SASS_utility_classes(spacing_object,"","","font-size"));
        // data = data.concat(`\n`);
      }
    }

    global_token_output = global_token_output.concat(`} \n`); // Add final curly brace to :root selector
    fs.writeFileSync(outputfilePath, global_token_output);
    console.log("=== " + outputfileName + " written successfully ===");
  } catch (err) {
    console.log(err);
  }
} catch (err) {
  console.log(err);
}
