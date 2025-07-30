# BidReportBuilder Component Specification

## 1. Overview

The `BidReportBuilder` is a self-service reporting tool designed for the `bidexpert_ai_firebase_studio` application. It allows users (administrators, auction analysts, auctioneers, and consignors) to create, customize, and export reports in an intuitive, AI-assisted environment.

The component will be built using the following technology stack:

*   **Frontend:** React, Next.js
*   **Backend:** Node.js, Next.js API Routes
*   **Database:** Prisma
*   **Reporting Engine:** DevExpress Reporting

## 2. Architecture

The `BidReportBuilder` will follow a client-server architecture:

*   **Client (React/Next.js):** A rich, interactive frontend application that provides the report designer interface. It will use the DevExpress Report Designer and Document Viewer components for React.
*   **Server (Node.js/Next.js API Routes):** A backend that handles data requests, report processing, and AI-powered features. It will expose a RESTful API for the client to consume.

## 3. Key Features

### 3.1. Report Designer

*   **Drag-and-Drop Interface:** Users can drag and drop report elements onto the design surface.
*   **Report Elements:**
    *   Tables
    *   Charts (Bar, Line, Pie, etc.)
    *   Text Boxes
    *   Images
    *   Rich Text
*   **Properties Panel:** A panel that allows users to customize the properties of each report element (e.g., color, font, size, data binding).
*   **Data Source Manager:** A user-friendly interface for connecting to data sources.
*   **Report Preview:** A real-time preview of the report as it is being designed.

### 3.2. Data Management

*   **Prisma Integration:** The backend will use Prisma to manage the database schema and data access.
*   **Report Storage:** Reports will be saved to the database in a structured format (e.g., JSON or REPX).
*   **Data Source Connectivity:** The `BidReportBuilder` will support connecting to various data sources, including:
    *   Databases (via Prisma)
    *   JSON data
    *   Custom data sources

### 3.3. AI-Powered Assistance

*   **Natural Language to Query:** Users can describe the data they want to see in plain English, and the AI will translate it into a query.
*   **Chart Recommendations:** The AI will suggest the most appropriate chart type for the selected data.
*   **Layout Suggestions:** The AI will provide pre-built report templates and layout suggestions based on the user's role and the data they are working with.

### 3.4. Exporting and Printing

*   **Export Formats:** Users can export reports to various formats, including:
    *   PDF
    *   XLSX
    *   CSV
*   **Printing:** Users can print reports directly from the browser.

### 3.5. Security

*   **Content Security Policy (CSP):** The application will implement a strict CSP to prevent XSS and other attacks.
*   **Authentication and Authorization:** The backend will handle user authentication and authorization to ensure that only authorized users can access and create reports.

### 3.6. Variable Referencing and Drag-and-Drop

*   The `VariablePanel` component fetches a list of available variables from the backend API and displays them to the user.
*   The variables are draggable and can be dropped onto the report design surface.
*   When a variable is dropped onto the designer, it is added to the report as a text element with a special syntax (e.g., `{{auction.name}}`).
*   The backend API replaces the variable placeholders with the actual data from the database when the report is previewed, displayed, or exported.

### 3.7. Media Library Integration

*   The `MediaLibrary` component fetches a list of images from the backend API and displays them to the user.
*   The `handleSelectImage` function in the `BidReportBuilder` component uses the DevExpress Report Designer API to add the selected image to the report.

### 3.8. Guided Tour

*   A guided tour to help new users get started with the report builder.

## 4. User Roles and Permissions

The `BidReportBuilder` will support the following user roles:

*   **Administrator:** Can create, edit, and delete all reports. Can manage data sources.
*   **Auction Analyst:** Can create and edit their own reports. Can view all reports.
*   **Auctioneer:** Can create and edit their own reports. Can view reports related to their auctions.
*   **Consignor:** Can view reports related to their consignments.

## 5. UI/UX

The `BidReportBuilder` will have a clean, modern, and intuitive user interface. It will be designed to be easy to use for both technical and non-technical users.

## 6. Frontend Implementation Details

### 6.1. Components

*   **`BidReportBuilder`:** The main component that orchestrates the entire report builder UI.
*   **`ReportDesigner`:** The component that wraps the DevExpress Report Designer component.
*   **`Toolbar`:** The component that contains the buttons for adding new report elements.
*   **`PropertiesPanel`:** The component that displays the properties of the selected report element.
*   **`DataSourceManager`:** The component that allows users to connect to and manage data sources.
*   **`PreviewPanel`:** The component that displays a preview of the report.
*   **`AIPanel`:** The component that provides the UI for the AI-powered features.
*   **`VariablePanel`:** The component that displays the list of available variables.
*   **`MediaLibrary`:** The component that displays a list of images from the media library.

### 6.2. State Management

The frontend will use React's built-in state management (`useState`, `useEffect`) to manage the state of the `BidReportBuilder` component.

### 6.3. Component Integration

*   The `Toolbar` component will call the `onAddElement` callback in the `BidReportBuilder` component to add new elements to the design surface.
*   The `ReportDesigner` component will call the `onSelectionChanged` callback in the `BidReportBuilder` component to update the `selectedElement` state.
*   The `DataSourceManager` component will call the `onSelectDataSource` callback in the `BidReportBuilder` component to bind a data source to a report element.
*   The `ReportDesigner` component will call the `onReportChanged` callback in the `BidReportBuilder` component to update the `reportUrl` state, which will in turn update the `PreviewPanel`.
*   The `AIPanel` component will call the `onGetAIAssistance` callback in the `BidReportBuilder` component to pass the current state of the report to the AI API.
*   The `VariablePanel` component will make the variables draggable, and the `ReportDesigner` component will be a drop target.
*   The `MediaLibrary` component will call the `onSelectImage` callback in the `BidReportBuilder` component to add the selected image to the report.

### 6.4. Element Manipulation

*   **Adding Elements:** The `handleAddElement` function in the `BidReportBuilder` component uses the DevExpress Report Designer API to create and add new report elements to the design surface.
*   **Selecting Elements:** The `handleSelectionChanged` function in the `BidReportBuilder` component updates the `selectedElement` state, which is then passed to the `PropertiesPanel` component.
*   **Changing Properties:** The `handleElementPropertyChanged` function in the `BidReportBuilder` component uses the DevExpress Report Designer API to update the properties of the selected report element.
*   **Data Binding:** The `handleSelectDataSource` function in the `BidReportBuilder` component uses the DevExpress Report Designer API to bind a data source to the selected report element.

### 6.5. Save/Load Logic

*   The `Toolbar` component contains `Save` and `Load` buttons that trigger the `handleSaveReport` and `handleLoadReport` functions in the `BidReportBuilder` component.
*   The `handleSaveReport` function serializes the report to JSON and sends it to the backend API to be saved to the database.
*   The `handleLoadReport` function fetches a report from the backend API and loads it into the designer.

### 6.6. Variable Referencing and Drag-and-Drop

*   The `VariablePanel` component fetches a list of available variables from the backend API and displays them to the user.
*   The variables are draggable and can be dropped onto the report design surface.
*   When a variable is dropped onto the designer, it is added to the report as a text element with a special syntax (e.g., `{{auction.name}}`).
*   The backend API replaces the variable placeholders with the actual data from the database when the report is previewed, displayed, or exported.

### 6.7. Export Functionality

*   The `Toolbar` component contains `Export` buttons for PDF, Excel, Word, and PowerPoint formats.
*   The `handleExportReport` function in the `BidReportBuilder` component uses the backend API to export the report to the selected format.
*   The backend API uses the DevExpress Reporting API to export the report to the selected format.

### 6.8. Media Library Integration

*   The `MediaLibrary` component fetches a list of images from the backend API and displays them to the user.
*   The `handleSelectImage` function in the `BidReportBuilder` component uses the DevExpress Report Designer API to add the selected image to the report.

## 7. Backend Implementation Details

### 7.1. API Routes

*   **/api/reports:** Handles CRUD operations for reports.
*   **/api/datasources:** Handles CRUD operations for data sources.
*   **/api/ai:** Handles requests for AI-powered features.
*   **/api/auth/[...nextauth]:** Handles user authentication and authorization.
*   **/api/variables:** Returns a list of available variables.
*   **/api/media:** Returns a list of images from the media library.
*   **/api/export:** Handles requests for exporting reports.

### 7.2. Database

The backend will use a PostgreSQL database with Prisma as the ORM.

### 7.3. AI Integration

The backend will use the OpenAI API to provide AI-powered features.

## 8. Next Steps

The next steps in the development of the `BidReportBuilder` component are:

1.  **Testing:** Revisit the testing setup and write comprehensive unit and integration tests.
2.  **Deployment:** Deploy the `BidReportBuilder` component to a staging environment for testing and feedback.
3.  **User Feedback:** Gather feedback from users and iterate on the component.
