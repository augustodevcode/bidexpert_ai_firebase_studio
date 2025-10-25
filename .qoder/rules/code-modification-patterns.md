# Code Modification Patterns for Qoder AI Agent

These rules define how the Qoder AI agent should approach code modifications in the BidExpert project.

## 1. Code Change Structure

When generating code changes, always use the proper XML structure:

```xml
<change>
<file path="relative/file/path.ts">
// YOUR MODIFICATIONS HERE
</file>
</change>
```

## 2. Minimal Changes Principle

- Only modify the necessary lines of code
- Preserve existing formatting and structure
- Keep changes focused on the specific task
- Avoid unnecessary refactoring or reformatting

## 3. Dependency Management

- Never add new npm dependencies without explicit instruction
- Check existing dependencies before suggesting new ones
- Use project-standard libraries when available
- Ensure imports are correctly resolved

## 4. File Creation Guidelines

When creating new files:
- Follow existing project structure and naming conventions
- Include proper imports and exports
- Add necessary TypeScript types
- Include JSDoc comments for functions and components
- Follow the same styling and formatting as existing files

## 5. Component Development

For React components:
- Use functional components with hooks
- Implement proper TypeScript typing for props
- Include default values for optional props
- Add accessibility attributes where needed
- Follow existing component patterns in the codebase
- Use shadcn/ui components as primary UI building blocks
- Customize shadcn/ui components through Tailwind CSS classes
- Maintain consistency with existing component usage patterns

## 6. Service and Repository Patterns

For backend code:
- Services should contain business logic only
- Repositories should handle all database operations
- Use existing service and repository patterns
- Implement proper error handling and logging
- Follow dependency injection where applicable

## 7. Database Schema Changes

For Prisma schema modifications:
- Always add tenantId to new tenant-specific models
- Maintain existing model relationships
- Use appropriate field types and constraints
- Ensure backward compatibility when possible
- Update related services and repositories

## 8. Testing Requirements

When modifying or creating functionality:
- Update existing tests to reflect changes
- Create new tests for new functionality
- Follow existing test patterns and conventions
- Ensure all tests pass before submitting changes
- Include both positive and negative test cases

## 9. Error Handling

- Always implement proper error handling
- Provide user-friendly error messages
- Log errors appropriately for debugging
- Implement fallback mechanisms where applicable
- Never expose sensitive information in error messages

## 10. Performance Considerations

- Avoid unnecessary re-renders in React components
- Implement proper memoization where beneficial
- Use efficient database queries
- Consider pagination for large data sets
- Optimize images and assets

## 11. Security Practices

- Validate all user inputs
- Sanitize data before database storage
- Implement proper authentication checks
- Protect against common web vulnerabilities
- Follow the principle of least privilege

## 12. Documentation Updates

- Update JSDoc comments when modifying functions
- Add comments for complex logic
- Update README files when making significant changes
- Document new environment variables
- Keep API documentation up to date

These patterns ensure consistent, high-quality code modifications that align with the BidExpert project standards.