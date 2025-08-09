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
*   **Variable Referencing:**
    *   Reference variables from your site's internal entities (auctions, lots, users, etc.).
    *   Drag and drop variables onto the report design surface.
*   **Media Library Integration:**
    *   Easily add images to your reports from the media library.
*   **Guided Tour:**
    *   A guided tour to help new users get started with the report builder.

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
2.  **Add report elements:** Click the buttons in the toolbar to add report elements to the design surface.
3.  **Select an element:** Click on a report element in the designer to select it.
4.  **Customize report elements:** Change the properties of the selected element in the properties panel.
5.  **Connect to a data source:** Select a data source from the data source manager and then select a report element to bind it to.
6.  **Add variables:** Drag and drop variables from the variable panel onto the design surface.
7.  **Add images:** Click on an image in the media library to add it to the report.
8.  **Preview the report:** The preview panel will automatically update as you make changes to the report.
9.  **Save the report:** Click the "Save Report" button in the toolbar to save the report to the database.
10. **Load a report:** Select a report from the list of reports and click the "Load Report" button in the toolbar to load it into the designer.
11. **Export the report:** Click the export buttons in the toolbar to export the report to a different format.
12. **Print the report:** Click the "Print" button in the toolbar to print the report.
13. **Use the AI assistant:** Use the AI assistant to get help with creating your report.
14. **Take the guided tour:** Click the "Help" button in the toolbar to start the guided tour.
