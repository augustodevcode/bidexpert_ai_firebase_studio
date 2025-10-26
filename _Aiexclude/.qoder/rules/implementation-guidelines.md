# Implementation Guidelines for Qoder AI Agent

These rules guide the Qoder AI agent's approach to implementing new features and fixing bugs in the BidExpert project.

## 1. Feature Implementation Process

### Planning Phase
- Analyze the requirements thoroughly before implementation
- Break down complex features into smaller, manageable tasks
- Identify all affected components and files
- Consider impact on existing functionality
- Plan database schema changes if needed

### Implementation Phase
- Follow the MVC+Service+Repository architecture
- Implement one task at a time
- Write clean, readable, and maintainable code
- Use existing patterns and conventions
- Add proper error handling

### Testing Phase
- Write unit tests for new functionality
- Ensure existing tests still pass
- Test edge cases and error conditions
- Verify multi-tenant functionality
- Check responsive design on different screen sizes

## 2. Bug Fixing Approach

### Diagnosis
- Reproduce the bug to understand its root cause
- Check logs and error messages
- Identify the specific conditions that trigger the bug
- Determine if it's a client-side, server-side, or database issue

### Fix Implementation
- Create minimal changes to resolve the issue
- Ensure the fix doesn't introduce new problems
- Add tests to prevent regression
- Update documentation if needed
- Consider impact on related functionality

### Verification
- Test the fix thoroughly
- Verify it works in all relevant scenarios
- Check that existing functionality remains intact
- Ensure performance is not negatively impacted

## 3. Code Review Standards

Before submitting any changes:
- Verify all TypeScript errors are resolved
- Ensure ESLint warnings are addressed
- Confirm the application builds successfully
- Run all relevant tests
- Check that changes follow project conventions
- Validate multi-tenant isolation is maintained

## 4. Multi-Tenant Considerations

For every implementation:
- Ensure tenant data isolation is maintained
- Verify tenantId is properly handled in all operations
- Test with different tenant contexts
- Confirm global models are not incorrectly filtered
- Validate subdomain routing works correctly

## 5. Performance Optimization

- Implement efficient database queries
- Use pagination for large data sets
- Optimize React component re-renders
- Lazy load non-critical resources
- Cache appropriate data to reduce database load

## 6. Security Best Practices

- Validate and sanitize all user inputs
- Implement proper authentication checks
- Protect against common web vulnerabilities
- Use environment variables for sensitive data
- Implement rate limiting where appropriate

## 7. Accessibility Requirements

- Ensure all components are keyboard navigable
- Use proper ARIA attributes
- Provide sufficient color contrast
- Include alternative text for images
- Test with screen readers when possible

## 8. Responsive Design

- Test on various screen sizes
- Use mobile-first approach
- Implement proper breakpoints
- Ensure touch targets are appropriately sized
- Verify layout consistency across devices

## 9. UI Component Best Practices

- Use shadcn/ui components as the primary UI library
- Customize components through Tailwind CSS classes rather than modifying source
- Maintain accessibility features of all components
- Ensure consistent styling and behavior across the application
- Follow component composition patterns
- Reuse existing components when possible

## 10. Error Handling and User Experience

- Provide clear error messages
- Implement graceful degradation
- Show loading states during async operations
- Offer helpful guidance for user actions
- Log errors appropriately for debugging

## 10. Documentation and Comments

- Add JSDoc comments to functions and components
- Document complex logic and business rules
- Update README files when making significant changes
- Comment on non-obvious implementation decisions
- Keep documentation in sync with code changes

## 11. Version Control Best Practices

- Create focused commits with descriptive messages
- Use feature branches for new functionality
- Rebase on main branch before merging
- Squash related commits when appropriate
- Follow the project's git workflow

These guidelines ensure that all implementations and bug fixes in the BidExpert project are consistent, secure, and maintainable.