Feature: Admin lot gallery media inheritance
  Scenario: Save an existing lot after loading inherited media information
    Given an administrator opens the edit page for lot LOTE-0028
    And the lot has gallery images rendered as thumbnail cells
    When the administrator submits the lot form with the current media state
    Then gallery thumbnail images declare responsive sizes
    And the lot save succeeds without Prisma rejecting imageMediaId
    And the form does not fail client validation because imageMediaId is a BigInt