# Design System & UI Guidelines - BidExpert

This document outlines the core principles, technologies, and patterns that define the BidExpert user interface. It is the single source of truth for designers and developers to ensure a cohesive, consistent, and high-quality user experience.

## 1. Core Technologies & Philosophy

Our design system is built upon a modern, utility-first foundation that prioritizes consistency, reusability, and rapid development. The core pillars are:

-   **Component Library**: **ShadCN/UI** is our single source of truth for UI components. It's built on top of the unstyled, accessible primitives from **Radix UI**.
    -   **Guideline**: Designers should familiarize themselves with the full suite of available ShadCN/UI components (e.g., `Button`, `Card`, `Input`, `Dialog`, `Select`, `Table`). Designs should prioritize using these existing components before proposing new ones.

-   **Styling Engine**: **Tailwind CSS** is used for all styling. We use its utility classes directly in our components.
    -   **Guideline**: Design specifications should reference Tailwind's concepts. Instead of pixel values, use Tailwind's spacing scale (e.g., "padding of p-4" instead of "16px padding").

-   **Iconography**: **Lucide React** is our exclusive icon library.
    -   **Guideline**: All icons must be chosen from the `lucide-react` library to maintain a consistent, clean, and line-art visual style.

## 2. Visual Foundations

### Color Palette
Our color system is defined centrally in `src/app/globals.css` using HSL CSS variables, as is standard for ShadCN/UI theming.

-   **Guideline**: Designers must work within this semantic palette. Instead of specifying hex codes, refer to the theme colors:
    -   `primary`: For main call-to-action buttons and interactive elements (currently a strong blue).
    -   `secondary`: For less prominent actions and container backgrounds.
    -   `destructive`: For delete or error actions (a clear red).
    -   `background`, `foreground`: For main page backgrounds and body text.
    -   `card`, `card-foreground`: For the background and text of card-like containers.
    -   `muted`, `muted-foreground`: For disabled elements and less important text.
    -   `accent`: For hover states and subtle background highlights.

### Typography
-   **Font**: 'Open Sans' is used for both body text and headlines, as defined in `tailwind.config.ts`.
-   **Sizing**: Use Tailwind's default type scale (e.g., `text-sm`, `text-lg`, `text-2xl`).

### Layout & Spacing
-   **Spacing**: All margins, padding, and gaps should adhere to Tailwind's default spacing scale (e.g., `p-4`, `m-8`, `gap-6`).
-   **Borders & Radius**: We use a default border-radius of `0.5rem` (defined by the `--radius` variable), which translates to the `rounded-lg` class in Tailwind for most elements like `Card` and `Button`.
-   **Shadows**: Subtle shadows (`shadow-md`, `shadow-lg`) are used on `Card` components to create a sense of depth and hierarchy.

## 3. Component Usage & Patterns

-   **Composition over Creation**: New UI patterns should be created by composing existing ShadCN/UI components whenever possible. For example, a user profile display should be built using `Card`, `Avatar`, `Badge`, and `Button` components.

-   **Reusability**: We have created higher-order "universal" components like `UniversalCard` and `UniversalListItem`.
    -   **Guideline**: Any new design for list or grid items (like lots or auctions) must be compatible with these universal wrappers to ensure a consistent presentation across the entire application.

-   **Data Display**: For displaying tabular data, always use our styled `DataTable` component, which is built upon TanStack Table and includes built-in features for sorting, filtering, and pagination.

-   **Forms**: All forms are built using `react-hook-form` with `zod` for validation. UI elements within forms must use ShadCN components like `Input`, `Select`, `Checkbox`, `RadioGroup`, etc.
    -   **Address Input**: For any form requiring address information, the reusable `AddressGroup` component (`src/components/address-group.tsx`) **must** be used. This ensures a consistent UI with CEP lookup and map integration across all entities (Users, Sellers, Auctioneers, Auctions, etc.).

-   **Admin Layout**: All administrative pages follow a consistent structure provided by `AdminLayout`, which includes a dark sidebar and a main content area. New admin pages must conform to this structure.

By adhering to these guidelines, designers can create visually stunning and functionally robust interfaces that are perfectly aligned with our development framework, ensuring a seamless translation from design to code.
