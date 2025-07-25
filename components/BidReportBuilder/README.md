# Bid Report Builder

The Bid Report Builder is a self-service reporting tool that allows users to create, customize, and export reports in an intuitive, AI-assisted environment.

## Features

*   **Drag-and-Drop Interface:** Users can drag and drop report elements onto the design surface.
*   **Report Elements:**
    *   Tables
    *   Charts (Bar, Line, Pie, etc.)
    *   Text Boxes
    *   Images
    *   Rich Text
*   **Properties Panel:** A panel that allows users to customize the properties of each report element.
*   **Data Source Manager:** A user-friendly interface for connecting to data sources.
*   **Report Preview:** A real-time preview of the report as it is being designed.
*   **AI-Powered Assistance:**
    *   **Natural Language to Query:** Users can describe the data they want to see in plain English, and the AI will translate it into a query.
    *   **Chart Recommendations:** The AI will suggest the most appropriate chart type for the selected data.
    *   **Layout Suggestions:** The AI will provide pre-built report templates and layout suggestions based on the user's role and the data they are working with.
*   **Exporting and Printing:**
    *   **Export Formats:** PDF, XLSX, CSV
    *   **Printing:** Print reports directly from the browser.

## Getting Started

1.  **Install the dependencies:**
    ```bash
    npm install
    ```
2.  **Set up the database:**
    *   Create a PostgreSQL database.
    *   Create a `.env` file and add the `DATABASE_URL` environment variable.
    *   Run `npx prisma migrate dev` to create the database schema.
3.  **Set up the OpenAI API:**
    *   Create an OpenAI account and get an API key.
    *   Add the `OPENAI_API_KEY` environment variable to your `.env` file.
4.  **Run the application:**
    ```bash
    npm run dev
    ```
5.  Open `http://localhost:3000/report-builder` in your browser.

## Usage

1.  **Create a new report:** Click the "New Report" button in the toolbar.
2.  **Add report elements:** Drag and drop report elements from the toolbar onto the design surface.
3.  **Customize report elements:** Select a report element to see its properties in the properties panel.
4.  **Connect to a data source:** Use the data source manager to connect to a data source.
5.  **Preview the report:** Click the "Preview" button in the toolbar to see a preview of the report.
6.  **Export the report:** Click the "Export" button in the toolbar to export the report to a different format.
7.  **Print the report:** Click the "Print" button in the toolbar to print the report.
8.  **Use the AI assistant:** Use the AI assistant to get help with creating your report.
