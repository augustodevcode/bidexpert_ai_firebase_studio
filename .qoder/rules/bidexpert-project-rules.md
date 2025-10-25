# BidExpert Project Rules for Qoder AI Agent

These rules must always be followed by the Qoder AI agent when creating, modifying, or correcting code in the BidExpert project.

## 1. Technology Stack Compliance

- **Frontend**: Next.js 14.2.3 with App Router
- **UI Components**: React 18 with ShadCN UI components
- **Styling**: Tailwind CSS with custom theme in globals.css
- **Backend**: Prisma ORM 6.16.2 with MySQL database
- **AI Integration**: Genkit and Google AI (Gemini 2.0 Flash)
- **Authentication**: Firebase Authentication
- **Icons**: Lucide React (clean, line-based icons)
- **Testing**: Vitest for unit tests, Playwright for E2E tests

## 2. Architecture Requirements

- **MVC Pattern**: Follow Model-View-Controller architecture with Service and Repository layers
- **Models**: Defined in Prisma schema (prisma/schema.prisma) with tenantId for multi-tenant support
- **Views**: Next.js components in src/app directory
- **Controllers**: Next.js Server Actions
- **Services**: Business logic in src/services/*.ts
- **Repositories**: Data access in src/repositories/*.ts
- **Multi-Tenant**: All tenant-specific models must include tenantId field

## 3. Multi-Tenant Architecture Enforcement

- **Tenant Isolation**: All database queries must be filtered by tenantId
- **Tenant Identification**: Tenant is identified by subdomain (e.g., leiloeiro-x.bidexpert.com)
- **Landlord Tenant**: Main domain resolves to tenant ID '1'
- **Global Models**: User, Role, State models are tenant-agnostic and should not be filtered by tenantId
- **Prisma Middleware**: Use existing Prisma middleware for automatic tenant filtering

## 4. Code Quality Standards

- **Type Safety**: Use TypeScript for all code with strict typing
- **Component Structure**: Use functional components with hooks
- **Error Handling**: Implement proper error boundaries and fallback UIs
- **Loading States**: Always provide loading indicators for async operations
- **Accessibility**: Ensure all components are accessible (ARIA labels, keyboard navigation)
- **Performance**: Optimize for performance (code splitting, lazy loading, memoization)

## 5. File and Component Conventions

- **Naming**: Use kebab-case for file names and PascalCase for components
- **Exports**: Use named exports only, never default exports
- **Documentation**: Add JSDoc comments to all functions and components
- **Component Props**: Define prop types with TypeScript interfaces
- **Hooks**: Custom hooks should start with "use" prefix
- **Constants**: Define constants in separate files when used across multiple components

## 6. UI/UX Guidelines

- **Color Scheme**: Primary orange (hsl(25 95% 53%)), white backgrounds, light gray accents
- **Typography**: 'Open Sans' font family for headings and body text
- **Layout**: Card-based design with rounded corners (8px) and subtle shadows
- **Responsive Design**: Mobile-first approach with responsive breakpoints
- **Consistent Spacing**: Use Tailwind spacing utilities consistently
- **Interactive Elements**: All interactive elements must have hover, focus, and active states
- **Component Library**: Use shadcn/ui components as the primary UI component library
- **Customization**: Customize shadcn/ui components through Tailwind CSS classes rather than modifying the source
- **Accessibility**: Ensure all shadcn/ui components maintain their accessibility features
- **Consistency**: Maintain visual consistency by using the same component variants throughout the application

## 7. Database and Prisma Guidelines

- **Single Schema**: All Prisma models must be in prisma/schema.prisma file
- **Field Requirements**: All tenant-specific models must have mandatory tenantId field
- **Relationships**: Use proper Prisma relations with appropriate referential actions
- **Migrations**: Use prisma db push for development, proper migrations for production
- **Queries**: Use repositories for all database access, never direct Prisma calls in components

## 8. Security Requirements

- **Environment Variables**: Never expose sensitive data in client-side code
- **Input Validation**: Validate all user inputs with Zod schemas
- **Authentication**: Always check user authentication and permissions
- **Data Filtering**: Ensure proper tenant data isolation in all queries
- **Error Messages**: Never expose sensitive system information in error messages

## 9. Testing Standards

- **Unit Tests**: Write unit tests for services and utility functions
- **Component Tests**: Test key components with React Testing Library
- **Integration Tests**: Test API endpoints and database operations
- **E2E Tests**: Use Playwright for end-to-end testing of critical user flows
- **Test Coverage**: Aim for high test coverage, especially for business logic

## 10. AI Integration Guidelines

- **Genkit Flows**: Implement AI features using Genkit flows in src/ai/flows/
- **Prompt Engineering**: Follow best practices for prompt design
- **Safety**: Implement proper safeguards for AI-generated content
- **Fallbacks**: Provide non-AI fallbacks for critical functionality
- **User Control**: Allow users to override or edit AI-generated content

## 11. Git and Collaboration

- **Commit Messages**: Use clear, descriptive commit messages
- **Branch Names**: Use feature/bugfix prefixes for branch names
- **Code Reviews**: All changes must be reviewed before merging
- **Documentation**: Update documentation when making significant changes
- **Breaking Changes**: Never introduce breaking changes without explicit approval

## 12. Error Prevention

- **Type Checking**: Fix all TypeScript errors before committing
- **Linting**: Resolve all ESLint warnings and errors
- **Build Issues**: Ensure the application builds successfully
- **Runtime Errors**: Test all new functionality to prevent runtime crashes
- **Regression Testing**: Verify that new changes don't break existing functionality

These rules are mandatory and must be followed in all AI-assisted development activities within the BidExpert project.