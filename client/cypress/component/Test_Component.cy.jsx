import Test_Component from "../../src/Test_Component";

describe("<Test_Component />", () => {
  beforeEach(() => {
    cy.mount(<Test_Component />);

    cy.get('[data-cy="test-component"]').as("test-component");
    cy.get('[data-cy="test-button"]').as("test-button");
  });

  it("renders in the DOM", () => {
    cy.get("@test-component").should("exist");
  });

  it("should have the background-color cornflowerblue", () => {
    cy.get("@test-component").should(
      "have.css",
      "background-color",
      "rgb(100, 149, 237)",
    );
  });

  it("should have the background-color rgb(255, 0, 251)/pink when test-button is clicked", () => {
    cy.get("@test-button").realClick();
    cy.get("@test-component").should(
      "have.css",
      "background-color",
      "rgb(255, 0, 251)",
    );
  });

  it("should run automated accessibility tests with axe-core", () => {
    cy.injectAxe();
    cy.checkA11y();
  });
});
