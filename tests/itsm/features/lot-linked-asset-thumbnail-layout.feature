Feature: Linked asset thumbnail layout on lot edit pages
  As an admin editing a lot with linked assets
  I want each linked-asset thumbnail to stay inside a fixed 80px wrapper
  So that media previews never expand to the full page width

  Scenario: Linked asset thumbnail stays clipped and sized on the lot edit page
    Given the lot edit route has at least one linked asset thumbnail
    When the admin opens the lot edit form
    Then the first thumbnail wrapper is relative and hides overflow
    And the wrapper stays near 80 by 80 pixels
    And the image uses object-fit cover with sizes equal to 80px