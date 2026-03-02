import * as stylex from "@stylexjs/stylex";
import { useState } from "react";

const styles = stylex.create({
  header: {
    backgroundColor: "cornflowerblue",
    color: "white",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "red",
  },
  title: {
    backgroundColor: "rgb(255, 0, 251)",
    fontWeight: "bold",
    color: "white",
  },
});

const Test_Component = () => {
  const [headerState, setHeaderState] = useState(true);

  return (
    <div>
      <h2
        data-cy="test-component"
        {...stylex.props(headerState ? styles.header : styles.title)}
      >
        Element with StyleX styles applied
      </h2>
      <button
        data-cy="test-button"
        className="rounded-full bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700"
        onClick={() => {
          setHeaderState((headerState) => !headerState);
        }}
      >
        Click to change the CSS styles of the StyleX header
      </button>
      <p className="bg-amber-500 font-bold">
        Element with Tailwind styles applied
      </p>
    </div>
  );
};

export default Test_Component;
