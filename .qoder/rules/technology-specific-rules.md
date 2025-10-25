# Technology-Specific Rules for Qoder AI Agent

These rules provide specific guidance for working with the technologies and frameworks used in the BidExpert project.

## 1. Next.js Guidelines

### App Router
- Use the App Router structure (src/app directory)
- Implement proper layout components
- Use Server Components by default
- Use Client Components only when necessary (useState, useEffect, event handlers)
- Implement proper loading and error boundaries

### Server Actions
- Implement all data mutations as Server Actions
- Use proper validation with Zod schemas
- Handle errors gracefully with user-friendly messages
- Implement proper authentication checks
- Use revalidatePath or revalidateTag for cache invalidation

### Routing
- Follow file-based routing conventions
- Use dynamic routes for dynamic content
- Implement proper middleware for authentication and tenant handling
- Use route groups for logical organization

## 2. Prisma ORM Guidelines

### Schema Design
- Keep all models in prisma/schema.prisma
- Add tenantId to all tenant-specific models
- Use proper relations with referential actions
- Implement proper indexes for frequently queried fields
- Use appropriate field types and constraints

### Queries
- Use repositories for all database operations
- Implement proper pagination for large data sets
- Use select and include to optimize query performance
- Handle Prisma errors appropriately
- Use transactions for related operations

### Migrations
- Use prisma db push for development
- Create proper migration files for production changes
- Test migrations thoroughly before applying
- Backup data before major schema changes

## 3. React and Component Development

### Component Structure
- Use functional components with hooks
- Implement proper TypeScript typing for props
- Use children prop for composability
- Implement proper error boundaries
- Use React.memo for performance optimization when appropriate
- Leverage shadcn/ui components as the primary UI component library
- Customize shadcn/ui components when needed but maintain consistency with the design system

### Hooks
- Use built-in hooks (useState, useEffect, useContext, etc.)
- Create custom hooks for reusable logic
- Follow the rules of hooks
- Implement proper cleanup in useEffect
- Use useCallback and useMemo for performance optimization

### State Management
- Use component state for local UI state
- Use Context for global state when needed
- Avoid prop drilling
- Implement proper state update patterns
- Use reducers for complex state logic

## 4. Tailwind CSS and Styling

### Utility Classes
- Use Tailwind utility classes consistently
- Follow the project's color palette (hsl(25 95% 53%) for primary)
- Use responsive prefixes for mobile-first design
- Implement proper spacing with margin and padding utilities
- Use flexbox and grid for layout
- Prefer Tailwind classes over custom CSS when possible

### Custom Styling
- Define custom colors in tailwind.config.ts
- Use CSS variables in globals.css for theme consistency
- Implement proper CSS for complex components
- Use @apply directive for repeated utility combinations
- Scope custom CSS to avoid conflicts

### shadcn/ui Integration
- Use shadcn/ui components as building blocks for UI
- Customize components through Tailwind CSS classes
- Maintain accessibility features of shadcn/ui components
- Follow shadcn/ui composition patterns
- Extend components rather than modifying core files

## 5. Genkit AI Integration

### Flow Implementation
- Implement AI flows in src/ai/flows/
- Use proper Genkit patterns and best practices
- Implement proper error handling for AI operations
- Provide fallback mechanisms for AI failures
- Cache AI results when appropriate

### Prompt Engineering
- Design clear and specific prompts
- Include proper context in prompts
- Implement safety measures for AI outputs
- Test prompts with various inputs
- Optimize prompts for performance and quality

## 6. Firebase Integration

### Authentication
- Use Firebase Authentication for user management
- Implement proper sign-in and sign-up flows
- Handle authentication state changes
- Protect routes based on authentication status
- Implement proper logout functionality

### Firestore
- Use Firestore for real-time data when appropriate
- Implement proper security rules
- Use proper indexing for query performance
- Handle Firestore errors gracefully
- Implement offline support when needed

## 7. Testing Frameworks

### Vitest
- Write unit tests for services and utility functions
- Use proper mocking for dependencies
- Test both positive and negative cases
- Use describe and it blocks for organization
- Implement proper test setup and teardown

### Playwright
- Write E2E tests for critical user flows
- Use proper selectors for element identification
- Implement proper test data setup
- Handle asynchronous operations correctly
- Use page objects for test organization

## 8. Development Tools

### Environment Variables
- Use .env files for configuration
- Never commit sensitive environment variables
- Use proper variable naming conventions
- Validate environment variables at startup
- Provide default values when appropriate

### Build Process
- Use Next.js build process
- Optimize images and assets
- Implement proper code splitting
- Use environment-specific configurations
- Test build output thoroughly

These technology-specific rules ensure that implementations follow best practices for each technology used in the BidExpert project.