function add(num1, num2) {
  return num1 + num2;
}

function subtract(num1, num2) {
  return num1 - num2;
}

describe("addition function", () => {
  it("adds numbers", () => {
    expect(add(7, 3)).to.equal(10);
  });
});

describe("subtraction function", () => {
  it("subtracts numbers", () => {
    expect(subtract(22, 10)).to.equal(12);
  });
});
