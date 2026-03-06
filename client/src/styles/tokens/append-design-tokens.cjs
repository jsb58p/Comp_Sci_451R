/* 
This script goes through a JSON file that contains values for primitive design tokens and converts them 
into CSS variables that are then concatenated to an already existing index.css file. 

This script works for index.css file that already has text in it or a completely empty index.css file
- Text that's already inside index.css will remain unchanged in the final output.
It's just new text that gets appended to the index.css file.

Script requirements
- JSON file that contains primitive tokens
- An already existing index.css file
- compile-design-tokens

The index.css in this src folder contains all of the CSS that shadcn/ui generated upon "npx shadcn@latest init"
- I want to keep the CSS variables that shadcn/ui relies on but I also want to have my own CSS variables
  from my design tokens
- I tried putting my CSS variables in a separate file (ie. global.css) and keep the shadcn/ui CSS in the index.css
  but when I run 'npm run dev', Tailwind doesn't compile all of my own CSS variables and some of my CSS variables
  are not accessible to my JSX code

The CSS variables that are outputed to the CSS file are formated as described by Tailwind v4.1 Theme variables
- https://tailwindcss.com/docs/theme#extending-the-default-theme
- v4.1 moved theme configuration from the tailwind.config to a global CSS file
*/

const fs = require("fs");
const jsonTokenFunctions = require("./convert-design-tokens.cjs");
const readfilePath = "src/index.css";
const writefilePath = readfilePath;

try {
  const filelines = fs.readFileSync(readfilePath, "utf-8").split("\n");
  let start_count = false;
  let numOflinesTodelete = 0;

  // console.log("filelines.length BEFORE =  " + filelines.length);

  // Counting the number of lines to in index.css delete between the '@theme {' and the '}'
  // - The CSS variables in the plain '@theme' directive are my own generated CSS variables
  // - This assumes that the CSS variables in the "@theme" are located at the end of the file, not the middle or beginning
  for (let line_index = 0; line_index < filelines.length; line_index++) {
    const line = filelines[line_index];

    // console.log(line_index + ": " + filelines[line_index]);

    if (line.includes("@theme {") == true) {
      // console.log("@theme at line #" + line_index);
      start_count = true;
      numOflinesTodelete++;
    }

    if (start_count == true) {
      numOflinesTodelete++;
    }
  }

  // console.log("numOflinesTodelete = " + numOflinesTodelete);

  if (numOflinesTodelete != 0) {
    // Special case if the index.css is empty or not
    // After counting the number of lines to delete, delete the lines in the plain "@theme" block
    for (let v = 1; v <= numOflinesTodelete; v++) {
      filelines.pop();
    }
    // console.log("LInes finished deleted");
    // console.log("filelines.length After =  " + filelines.length);
  }

  // Make new index.css file to overwrite the old index.css text
  const writeStream = fs.createWriteStream(writefilePath);

  // Write into the new index.css with the modified filelines
  filelines.forEach((value) => writeStream.write(value));

  // Append to index.css file the new "@theme" block that has my generated CSS variables
  const content = jsonTokenFunctions.convert_primitive_tokens(
    "./primitive-tokens.json",
  );
  writeStream.write("\n", "utf8");
  writeStream.write(content, "utf8");

  // End the stream after writing all data
  writeStream.end();

  console.log("Primitive Tokens Compiled to " + writefilePath);
} catch (err) {
  console.log(err);
}
