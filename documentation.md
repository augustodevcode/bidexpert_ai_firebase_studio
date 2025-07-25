# End-User Report Designer for Web

The Web End-User Report Designer is a fully functional client-side reporting tool that you can integrate in your web application.

The designer component allows users to create and edit a report. The built-in viewer is a fully functional Document Viewer control that allows users to preview, print, and export documents.

[Web Designer Overview](https://docs.devexpress.com/XtraReports/images/web-designer-overview.png)

## Component Architecture

The following diagram illustrates web app architecture when the Report Designer control is used:

[Web Report Designer App Architecture](https://docs.devexpress.com/XtraReports/images/web-introduction-report-designer.png)

| Term | Description |
| --- | --- |
| Data Source | A data source to which the report is connected and from which the report receives data. |
| Report Class (C#/VB) | An instance of a class that inherits from the XtraReport class. The Visual Studio Report Designer uses this format to create a document that can be previewed, printed, and exported. Read more about report file formats: [Report File Formats](https://docs.devexpress.com/XtraReports/404375/visual-studio-report-designer/report-file-formats-cs-vb-and-vsrepx). |
| Query Builder Backend | Query Builder backend is responsible for processing database queries when users design reports with custom SQL queries. It acts as the server-side engine that handles query execution, validation, and schema retrieval. |
| Report Designer Control Backend | The backend uses server-side stateful service. The server performs all the necessary actions - retrieves data from the data source, creates a list of parameter values, generates documents, and renders pages for previewing, exporting, and printing. User-defined data, along with report or document identifiers, are sent to the server, which in turn returns a rendered document for the Report Designer and Document Viewer to display. If a user exports the report, the backend processes the export and provides the file. |
| Report Designer Control Frontend | The control keeps its state on the client (it is a stateless component). All editing operations are performed in the browser, while other operations require server processing, in which case the component state (or part of its state) is sent to the server. |
| Document Viewer Frontend and Backend | The Document Viewer displays a user interface for viewing reports in a web browser. Users can specify report parameters, input data in interactive reports, navigate, zoom, print, and export reports. The Document Viewer communicates with the backend to request and display report data, and receives the exported documents. More information about the Document Viewer: [Document Viewer for Web](https://docs.devexpress.com/XtraReports/401850/web-reporting/web-document-viewer). |
| Report Storage | A service that processes a report name that the Report Designer passes to the server to open or save a report. For more information, review the Add a Report Storage help topics for [ASP.NET Web Forms](https://docs.devexpress.com/XtraReports/17553/web-reporting/asp-net-webforms-reporting/end-user-report-designer-in-asp-net-web-forms-reporting/add-a-report-storage), [ASP.NET MVC](https://docs.devexpress.com/XtraReports/400204/web-reporting/asp-net-mvc-reporting/end-user-report-designer-in-asp-net-mvc-applications/add-a-report-storage) and [ASP.NET Core](https://docs.devexpress.com/XtraReports/400211/web-reporting/asp-net-core-reporting/end-user-report-designer-in-asp-net-applications/add-a-report-storage) platforms. |
| Report Name Resolution Service | A service or a group of services that process a report name or a string that the Report Designer sends to the server as a parameter in the Open method to create a report instance. The string can contain report parameters and additional data. You can register your custom implementation of these services and return a report with custom data and parameters applied at runtime. For more information, review the following help topic: [Open a Report in ASP.NET Core Application](https://docs.devexpress.com/XtraReports/402505/web-reporting/asp-net-core-reporting/document-viewer-in-asp-net-applications/open-a-report). |

See the following article to find out more information about how DevExpress Reports work: [DevExpress Reports: Web Application Architecture](https://docs.devexpress.com/XtraReports/405370/web-reporting/common-features/web-report-controls-architecture).

## Integration

Review the following help topics:
* [Get Started with DevExpress Reporting](https://docs.devexpress.com/XtraReports/14651/get-started-with-devexpress-reporting)
* [Create a Report from A to Z](https://docs.devexpress.com/XtraReports/2440/create-report-types/create-a-report-from-a-to-z)
* [Create Reports in the Visual Studio Report Designer](https://docs.devexpress.com/XtraReports/5152/create-reports)
* [Detailed Guide to DevExpress Reporting](https://docs.devexpress.com/XtraReports/5150/detailed-guide-to-devexpress-reporting)

Report Designer integration has its own specifics. Review the Report Designer Requirements and Limitations help topic for [ASP.NET Web Forms](https://docs.devexpress.com/XtraReports/17558/web-reporting/asp-net-webforms-reporting/end-user-report-designer-in-asp-net-web-forms-reporting/quick-start/report-designer-requirements-and-limitations) and [ASP.NET MVC](https://docs.devexpress.com/XtraReports/400212/web-reporting/asp-net-mvc-reporting/end-user-report-designer-in-asp-net-mvc-applications/quick-start/report-designer-requirements-and-limitations) platforms.

To load and save a report from/to the REPX format, implement report storage. For more information, review Add a Report Storage help topics for [ASP.NET Web Forms](https://docs.devexpress.com/XtraReports/17553/web-reporting/asp-net-webforms-reporting/end-user-report-designer-in-asp-net-web-forms-reporting/add-a-report-storage), [ASP.NET MVC](https://docs.devexpress.com/XtraReports/400204/web-reporting/asp-net-mvc-reporting/end-user-report-designer-in-asp-net-mvc-applications/add-a-report-storage), and [ASP.NET Core](https://docs.devexpress.com/XtraReports/400211/web-reporting/asp-net-core-reporting/end-user-report-designer-in-asp-net-applications/add-a-report-storage) platforms.

## Interface and Functionality (UI)

The following help sections describe the Web End-User Report Designer user interface:
* [Interface Elements](https://docs.devexpress.com/XtraReports/17545/web-reporting/end-user-report-designer-for-web/interface-elements)
* [Document Preview](https://docs.devexpress.com/XtraReports/17554/web-reporting/end-user-report-designer-for-web/document-preview)
* [Wizards](https://docs.devexpress.com/XtraReports/17663/web-reporting/end-user-report-designer-for-web/wizards)

Report Designer UI and functionality are described in detail in the End-User Documentation available online:
* [Report Designer](https://devexpress.github.io/dotnet-eud/reporting-for-web/articles/report-designer.html)
* [Use Report Elements](https://devexpress.github.io/dotnet-eud/reporting-for-web/articles/report-designer/use-report-elements.html)

A general technique that allows you to customize the UI elements in Reporting components: [Use Custom HTML Templates](https://docs.devexpress.com/XtraReports/403960/web-reporting/common-features/use-custom-html-templates).

For more information, review the Customization topic in the End-User Report Designer section for your required platform.

# Reporting for React

Topics in this section describe how to use Reporting components in applications based on the [React framework](https://react.dev/).

DevExpress Web Reporting controls are composed of [DevExtreme UI components](https://js.devexpress.com/DevExtreme/25_1/). React versions supported by the DevExtreme Component Suite are listed in the following help topic: [DevExtreme React - Supported Versions](https://js.devexpress.com/DevExtreme/25_1/Guide/React_Components/Supported_Versions/).

Constants and enums in TypeScript code may require the import directive. The following example declares the DevExpress.Reporting.Viewer.ZoomAutoBy enum:
```typescript
import { ZoomAutoBy } from "devexpress-reporting/viewer/constants";
```

You can import constants from the following sources:
* Document Viewer: devexpress-reporting/dx-webdocumentviewer
* Report Designer: devexpress-reporting/dx-reportdesigner

## Web Document Viewer

[View Example: Reporting for React - Add a Web Document Viewer to a React App](https://github.com/DevExpress-Examples/reporting-react-integrate-web-document-viewer)

### Get Started

* [Create a React Front-End Application with a Document Viewer (Next.js)](https://docs.devexpress.com/XtraReports/119338/web-reporting/react-reporting/document-viewer/document-viewer-integration-react-nextjs)
* [Document Viewer Client-Side Configuration in React Applications](https://docs.devexpress.com/XtraReports/404982/web-reporting/react-reporting/document-viewer/document-viewer-client-side-configuration-react)
* [Specify Parameter Values in a React Reporting Application](https://docs.devexpress.com/XtraReports/404799/web-reporting/react-reporting/document-viewer/specify-parameter-values)
* [Localize Reporting Tools for React](https://docs.devexpress.com/XtraReports/402603/web-reporting/common-features/localization/localization-in-reporting-for-react)
* [Content Security Policy for React Applications](https://docs.devexpress.com/XtraReports/404557/web-reporting/react-reporting/content-security-policy)

### Customization

* [Customize the Document Viewer Toolbar in React Application](https://docs.devexpress.com/XtraReports/401946/web-reporting/react-reporting/document-viewer/customization/customize-the-document-viewer-toolbar)
* [Customize the Document Viewer Tab Panel in React Application](https://docs.devexpress.com/XtraReports/401972/web-reporting/react-reporting/document-viewer/customization/customize-the-document-viewer-tab-panel)
* [Customize Parameter Editor in the Document Viewer in React Applications](https://docs.devexpress.com/XtraReports/404999/web-reporting/react-reporting/document-viewer/customization/custom-parameter-editor-in-viewer)
* [Tasks and Solutions for ASP.NET Core Applications](https://docs.devexpress.com/XtraReports/402406/web-reporting/asp-net-core-reporting/tasks-and-solutions-for-asp-net-core-applications#document-viewer)
* [AI-powered Extensions for DevExpress Reports](https://docs.devexpress.com/XtraReports/405211/ai-powered-functionality/ai-for-devexpress-reporting)

### End-User Documentation

* [Document Viewer](https://devexpress.github.io/dotnet-eud/reporting-for-web/articles/document-viewer.html)

### Client-Side API

#### Client Object

Use the [JSReportViewer](https://docs.devexpress.com/XtraReports/js-DevExpress.Reporting.Viewer.JSReportViewer) class to access the client-side API in React applications.

#### Events

Client-side events in React are handled with callbacks specified in the [Callbacks](https://docs.devexpress.com/XtraReports/404982/web-reporting/react-reporting/document-viewer/document-viewer-client-side-configuration-react#callbacks) component.

For a list of event names and their arguments, review [WebDocumentViewerClientSideEventsBuilder](https://docs.devexpress.com/XtraReports/DevExpress.AspNetCore.Reporting.WebDocumentViewer.WebDocumentViewerClientSideEventsBuilder._members) methods. Although that documentation topic is specific to ASP.NET Core, the API for React callbacks is the same.

The following code snippet uses the CustomizeExportOptions callback to remove the XLS format from the Export To drop-down list and from the Export Options panel:
```javascript
'use client';
import ReportViewer, { RequestOptions, Callbacks } from 'devexpress-reporting-re
act/dx-report-viewer';
import { ExportFormatID } from 'devexpress-reporting/dx-webdocumentviewer';

function App() {
  const onCustomizeExportOptions = ({ args }: { args: any }): void => {
    args.HideFormat(ExportFormatID.XLS);
  };
  return (
    <ReportViewer reportUrl="TestExportReport">
      <RequestOptions host="http://localhost:5000/" invokeAction="DXXRDV" />
      <Callbacks CustomizeExportOptions={onCustomizeExportOptions} />
    </ReportViewer>
  )
}

export default App
```

# Localization in Reporting for React

This topic describes how to localize the Document Viewer and End-User Report Designer UI in a React application.

## Use JSON Files

In the React application you can import the localized JSON resources and use the `CustomizeLocalization` callback to call the `LoadMessages` method that loads localized strings. You can also use the `UpdateLocalization` method to substitute particular strings.

### Obtain JSON Files from the Localization Service

1.  Log into the [DevExpress website](https://www.devexpress.com/MyAccount/Login/).
2.  Open the [DevExpress Localization Service](https://localization.devexpress.com/).
3.  Select your target language, modify translations, and click the **Download** button. Refer to the following help topic for detailed information: [Localization Service](https://docs.devexpress.com/GeneralInformation/16235/localization/localization-service).
4.  Unpack the downloaded executable file to get the satellite assemblies and `json` resources directory. This directory contains the following JSON files required to localize the reporting controls (where `xx` is a culture name):

| File Name | Localization Strings |
| --- | --- |
| `dx-analytics-core.xx.json` | Shared Components: [Query Builder](https://docs.devexpress.com/XtraReports/117591/web-reporting/end-user-report-designer-for-web/interface-elements/query-builder), [Data Source Wizard](https://docs.devexpress.com/XtraReports/114093/web-reporting/end-user-report-designer-for-web/wizards/data-source-wizard-popup), [Filter Editor](https://docs.devexpress.com/XtraReports/113888/web-reporting/end-user-report-designer-for-web/interface-elements/filter-editor), [Expression Editor](https://docs.devexpress.com/XtraReports/114059/web-reporting/end-user-report-designer-for-web/interface-elements/expression-editor) |
| `dx-reporting.xx.json` | [Web Document Viewer](https://docs.devexpress.com/XtraReports/400248/web-reporting/asp-net-core-reporting/document-viewer-in-asp-net-core-applications), [End-User Report Designer](https://docs.devexpress.com/XtraReports/400249/web-reporting/asp-net-core-reporting/end-user-report-designer-in-asp-net-core-applications) and other reporting-specific components |

**Tip**: The component’s UI is built on DevExtreme widgets, so to localize the editors you should also use one of the approaches described in the following topic: [DevExtreme - Localization](https://js.devexpress.com/DevExtreme/25_1/Guide/Common/Localization/). Specify web server’s thread culture to apply culture-specific formats to numbers and dates.

### Localize the Application

1.  Copy the `dx-analytics-core.xx.json` and `dx-reporting.xx.json` (where `xx` is the culture ID) files obtained in the previous section to the application root folder.
2.  Open the component file and add the code that handles the `CustomizeLocalization` callback. The following code substitutes localizable strings used in Reporting UI with their German equivalents:

```javascript
'use client';
import React from 'react';
import ReportViewer, { RequestOptions, Callbacks } from 'devexpress-reporting-react/dx-report-viewer';
import 'devextreme/dist/css/dx.light.css';
import '@devexpress/analytics-core/dist/css/dx-analytics.common.css';
import '@devexpress/analytics-core/dist/css/dx-analytics.light.css';
import 'devexpress-reporting/dist/css/dx-webdocumentviewer.css';

import deCore from './dx-analytics-core.de.json';
import deRep from './dx-reporting.de.json';

const App = () => {
const onCustomizeLocalization = (event: any): void => {
    event.args.LoadMessages(deCore);
    event.args.LoadMessages(deRep);
    event.sender.UpdateLocalization({
    'Search': 'Suche',
    'Search result': 'Suchergebnisse',
    'Next Page': 'Nächste Seite',
    'Export Options': 'Exportoptionen',
    'The document does not contain any pages.': 'Keine Daten'
    });
};

return (
    <ReportViewer reportUrl="TestReport">
      <RequestOptions host="http://localhost:5000/" invokeAction="DXXRDV" />
      <Callbacks CustomizeLocalization={onCustomizeLocalization} />
    </ReportViewer>
);
};

export default App;
```

3.  Recompile the project and open the application in the browser (default URL is `http://localhost:3000/`).

## Use UI Localization Client

**Note**: The UI Localization Client requires localization recourses to be loaded from the server to work properly in a React application.

The UI Localization Client is a cross-platform utility that allows you to quickly identify non-translated strings of DevExpress UI controls and translate them during a debug session. The utility automatically generates a RESX file(s) with translated resources and adds it to the project. Note that the UI Localization Client loads all Web Reporting resource strings once the controls are rendered, without reflecting your interaction with the UI.

To use the UI Localization Client in you application:
*   Make sure that the application gets the localization from the server. For instance, you can use `getLocalizationAction` for Designer or `getLocalizationAction` for Viewer.
*   Make sure you do not use the `CustomizeLocalization` event to localize your application.

For more information refer to the following topic: [UI Localization Client](https://docs.devexpress.com/GeneralInformation/404609/localization/ui-localization-client).

The resource strings for the Web Reporting Controls (Web Document Viewer and Web Report Designer) are located in the following localization containers in the UI Localization Client window:

`DevExpress.XtraReports.Web.Localization.LocalizationContainer`
Contains localization strings specific only to the Web Reporting Controls.

`DevExpress.Utils.Localization.CoreLibraryResources`
Contains cross-platform localization strings used in the Web Reporting Controls.

`DevExpress.Web.Resources.Localization.LocalizationContainer`
Contains localization strings common to DevExpress Web Components used in the Web Reporting Controls.

### Troubleshooting

*   If you followed the instructions in the [UI Localization Client](https://docs.devexpress.com/GeneralInformation/404609/localization/ui-localization-client) topic and the translated resources do not appear on your web page, try clearing browser cache.
*   If you use an ASP.NET Core backend and after following the instructions in the [UI Localization Client](https://docs.devexpress.com/GeneralInformation/404609/localization/ui-localization-client) topic the resource strings do not appear in the UI Localization Client window, call the `HandleRequestsFromAllThreads()` method at application startup to use localizer objects across all application threads.

### Identify Non-Translated Strings

*   Use our [UI Localization Client](https://docs.devexpress.com/GeneralInformation/404609/localization/ui-localization-client) tool shipped as part of your DevExpress subscription. This tool streamlines the entire localization process. You can quickly find non-translated strings and translate them during a debug session.
*   Handle the `XtraLocalizer.QueryLocalizedStringNonTranslated` event to collect non-localized resource strings for further translation. The event allows you to focus on strings that require translation in your application.

# Content Security Policy for React Applications

A [Content Security Policy (CSP)](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP) is an additional layer of security built into most modern browsers. It allows the browser to recognize and mitigate certain types of risks, including Cross Site Scripting (XSS) and data injection attacks. These attacks include, but are not limited to, data theft, page spoofing, and malware distribution.

The CSP defines a list of policies/directives and initial values that specify which resources your site allows/disallows.

To enable CSP, specify a `Content-Security-Policy` header or use the `<meta>` tag to explicitly define authorized functionality with [CSP directives](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy#directives).

The following meta tag specifies minimum required directives for DevExpress Reporting components:

```html
<head>
<!--...-->
    <meta http-equiv="Content-Security-Policy" content="default-src 'self';
    img-src data: https: http:;
    script-src 'self';
    style-src 'self';
    connect-src 'self' http:my_backend_url;
    worker-src 'self' blob:;
    frame-src 'self' blob:;" />
<!--...-->
</head>
```

| Directive | Description |
| --- | --- |
| `default-src 'self';` | Fallback for other fetch directives. |
| `img-src data: https: http:;` | Allows components to load specific images and document pages. |
| `script-src 'self';` | Allows only scripts loaded from the same source as the current page protected with CSP. The Knockout.js library requires the `unsafe-eval` source expression. For information on how to remove the `unsafe-eval` expression, refer to the following section: [Error: Refused to Evaluate a String as JavaScript](https://docs.devexpress.com/XtraReports/404557/web-reporting/react-reporting/content-security-policy#error-refused-to-evaluate-a-string-as-javascript). |
| `style-src 'self';` | Allows the use of stylesheets from the same source as the current page protected with CSP. Specify other sources for stylesheets that are allowed (for example, `'https://fonts.googleapis.com/').` |
| `connect-src 'self' 'http:my_backend_url';` | The `my_backend_url` value specifies the server endpoint. This is necessary for applications where client and server have different URLs. |
| `worker-src 'self' blob:;` | Required for printing. |
| `frame-src 'self' blob: http:my_backend_url;` | Required for printing. The `my_backend_url` value specifies the server endpoint. This is necessary for applications where client and server have different URLs. |

## Troubleshooting

### Error: Refused to Evaluate a String as JavaScript

Certain Reporting components rely on the Knockout.js library. This library requires a `unsafe-eval` expression in the `script-src` directive. If the expression is missing, the following error occurs:

*Refused to evaluate a string as JavaScript because ‘unsafe-eval’ is not an allowed source of script…*

Refer to the following sections depending on the Reporting Components used in your application.

**Note**: Application runs in debug mode may require additional permissions. For example, a debug session establishes a WebSocket connection to automatically reload your application on source code change. This mechanism may involve the use of unsafe JavaScript evaluation.

#### Application Contains Only Native Report Viewer for React

The native [Report Viewer for React](https://docs.devexpress.com/XtraReports/401915/web-reporting/react-reporting#web-document-viewer) does not rely on the [Knockout.js](https://knockoutjs.com/) library. React applications that use the Report Viewer component do not require the `unsafe-eval` expression in the `script-src` directive if all required types are imported from `-native` modules:

```javascript
// Import from the aggregated module.
// import { fetchSetup } from '@devexpress/analytics-core/analytics-utils';
// Import from the native module.
import { fetchSetup } from '@devexpress/analytics-core/analytics-utils-native';
```

#### Application Contains Report Designer for React

To remove the `unsafe-eval` source expression from the `script-src` directive, follow the steps below. These steps are specific to applications built with Vite, and may require adjustments depending on your project setup.

1.  Create a `src/knockout_global.js` file with the following content:

```javascript
(function () {
window.eval = function (p) {
    if (p !== "this") {
        throw new Error("Invalid argument for eval. Only 'this' is allowed.");
    }
    return window;
};
})();
```

2.  Reference the created file in the `index.html` page:

```html
<!DOCTYPE html>
<html lang="">
<head>
    <!--...-->
</head>
<body>
    <div id="app"></div>
    <script src="/src/knockout_global.js"></script></head>
    <script type="module" src="/src/main.js"></script>
</body>
</html>
```

### Error: Refused to Apply Inline Style and Scripts

Depending on the framework/build tool used, the `unsafe-inline` expression may be required. If the expression is missing, the following error may appear in the browser console: Refused to apply inline style because it violates the following Content Security Policy directive: “style-src ‘self’”. Either the ‘unsafe-inline’ keyword, a hash (‘sha256-N2+pL/CTCJuYEGXM3p8y6xbRU0v1D1U8UcUh/uWdoGA=’), or a nonce (‘nonce-…’) is required to enable inline execution..

To remove `unsafe-inline` from the `style-src` directive, you may need to implement a nonce-based CSP. For more information refer to the documentation of framework or build tool, such as:

*   [Vite – Content Security Policy (CSP)](https://vite.dev/guide/features#content-security-policy-csp)
*   [Next.js – Content Security Policy (CSP)](https://nextjs.org/docs/app/guides/content-security-policy)

### Custom Templates Do Not Work

DevExpress Reporting custom templates are based on the [Knockout](https://knockoutjs.com/) JavaScript library. The Knockout library uses the `data-bind` attribute to render a value as follows: it generates a function as a JavaScript string and passes the string to the `new Function` constructor.

Knockout templates require the `script-src 'unsafe-eval'` CSP directive to function properly.

**Important**: We do not recommend the inclusion of the `script-src 'unsafe-eval'` directive in your content security policy. This directive may introduce a vulnerability as it enables script execution from a string on your page.

DevExpress Reporting stores JavaScript functions related to `data-bind` attributes in the cache, thus eliminating the need to run the script on the page. Our components do not need the ‘unsafe-eval’ directive.

Follow the steps below to use custom templates.

#### Call the addToBindingsCache Function

To add a custom template to the function cache, call the `addToBindingsCache` function before the component is rendered. You can handle the `BeforeRender` event to call the function.

*   **Example: DevExtreme Template**
    *   [DevExtreme Template](https://docs.devexpress.com/XtraReports/404557/web-reporting/react-reporting/content-security-policy#tabpanel_rfPnj04xlM_tabid-template)
    *   [Function](https://docs.devexpress.com/XtraReports/404557/web-reporting/react-reporting/content-security-policy#tabpanel_rfPnj04xlM_tabid-function)

*   **Example: Knockout Binding**
    *   [DevExtreme Template](https://docs.devexpress.com/XtraReports/404557/web-reporting/react-reporting/content-security-policy#tabpanel_rfPnj04xlM-1_tabid-template)
    *   [Function](https://docs.devexpress.com/XtraReports/404557/web-reporting/react-reporting/content-security-policy#tabpanel_rfPnj04xlM-1_tabid-function)

#### Use the CLI Utility

v22.2 and later ships with our `@devexpress/analytics-core-cli` CLI utility package. It includes the `processBindings` command. You can use this command to automatically generate a file with the code that calls the `addToBindingsCache` function to add your templates to the cache.

Run the following command to install the package:

```bash
npm i @devexpress/analytics-core-cli
```

To process custom templates, execute the following command:

```bash
node node_modules/@devexpress/analytics-core-cli/utils/processBindings <templates folder path> <result file path>
```

Command parameters are as follows:

| Parameter | Description |
| --- | --- |
| `templates folder path` | A folder that contains template files (.HTML) |
| `result file path` | Path to the file being created |

When prompted, select application type (Modules or Namespaces):

[CLI Template Utility](https://docs.devexpress.com/XtraReports/images/csp-cli-template-utility.png)

The generated file contains JavaScript code that must be run in the DevExpress Reporting component’s `BeforeRender` event handler.

# Customize the Document Viewer Toolbar in React Application

This topic contains customization scenarios related to the Toolbar in the Web Document Viewer.

[View Example: Reporting for React - Customize Viewer Toolbar](https://github.com/DevExpress-Examples/reporting-react-customize-viewer-toolbar)

## Hide Export Formats

Use the `CustomizeExportOptions` callback and call the `HideFormat(format)` method to remove the specified export format from the **Export To** drop-down list.

The following code snippet hides the XLS format from the drop-down-list:

```javascript
'use client';
import ReportViewer, { RequestOptions, Callbacks } from 'devexpress-reporting-react/dx-report-viewer';
import { ExportFormatID } from 'devexpress-reporting/dx-webdocumentviewer';

function App() {
  const onCustomizeExportOptions = ({ args }: { args: any }): void => {
    args.HideFormat(ExportFormatID.XLS);
  };
  return (
    <ReportViewer reportUrl="TestExportReport">
      <RequestOptions host="http://localhost:5000/" invokeAction="DXXRDV" />
      <Callbacks CustomizeExportOptions={onCustomizeExportOptions} />
    </ReportViewer>
  )
}

export default App
```

## Customize Toolbar Commands

Use the `CustomizeMenuActions` callback to customize toolbar commands. The callback function receives the `IPreviewModel` and the `ASPxClientCustomizeMenuActionsEventArgs` objects as arguments.

The `Actions` property contains available Document Viewer commands. You can modify commands in the collection and add new commands. To access a built-in command, call the `GetById` method and pass the `ActionId` value as a parameter.

A command implements the `IAction` interface. When you get access to a command, use the `IAction` properties to customize the command.

The example below uses the `CustomizeMenuActions` event to hide the **Highlight Editing Fields** toolbar command and add a new **Run Slide Show** command to navigate through report pages.

[View Example: Customize Viewer Toolbar](https://github.com/DevExpress-Examples/reporting-react-customize-viewer-toolbar)

### Hide Toolbar Command

To access a built-in toolbar command, call the `GetById` method and pass the `ActionId` value as a parameter. To hide a command and its toolbar button, set the command’s `visible` property to `false`.

```javascript
'use client';
import React from 'react';
import ReportViewer, { Callbacks, RequestOptions } from 'devexpress-reporting-react/dx-report-viewer';
import { TemplateEngine } from 'devexpress-reporting-react/dx-report-viewer/core/template-engine';
import { ActionId } from 'devexpress-reporting/viewer/constants';

import "devextreme/dist/css/dx.light.css";
import "@devexpress/analytics-core/dist/css/dx-analytics.common.css";
import "@devexpress/analytics-core/dist/css/dx-analytics.light.css";
import "devexpress-reporting/dist/css/dx-webdocumentviewer.css";

export default function Home() {
  const onCustomizeMenuActions = ({ sender, args }: { sender: any, args: any }) => {
    var highlightEditingFieldsAction = args.GetById(ActionId.HighlightEditingFields);
    if (highlightEditingFieldsAction)
        highlightEditingFieldsAction.visible = false;
  };

  return (
      <ReportViewer reportUrl="Report" templateEngine={templateEngine}>
        <RequestOptions invokeAction="/DXXRDV" host="http://localhost:5000" />
        <Callbacks CustomizeMenuActions={React.useCallback(onCustomizeMenuActions,[])} />
      </ReportViewer>
  );
}
```

### Add New Toolbar Command

To add a new toolbar command, follow the steps below:

1.  Create an image template:

```javascript
// ...
const templateEngine = new TemplateEngine();
templateEngine.setTemplate('slideshow', () => (
  <svg version="1.1" xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" viewBox="0 0 24 24">
    <polygon className="dxd-icon-fill" points="4,2 4,22 22,12 " />
  </svg>
));
// ...
```

2.  Specify command settings. Set the `imageTemplateName` property to the created template’s id (`slideshow`):

```javascript
const onCustomizeMenuActions = ({ sender, args }: { sender: any, args: any }) => {
  let interval: any;
  const action = new CustomAction({
    text: "Run Slide Show",
    imageTemplateName: "slideshow",
    visible: true,
    disabled: false,
    selected: false,
    clickAction: function () {
      if (this.selected) {
        clearInterval(interval);
        this.selected = false;
        return;
      }
      var model = sender.GetPreviewModel();
      if (model) {
        this.selected = true;
        interval = setInterval(function () {
          var pageIndex = model.GetCurrentPageIndex();
          model.GoToPage(pageIndex + 1);
        }, 2000);
      }
    }
  });
  // ...
};
```

3.  Call the `push` method to add the created command to the `Actions` collection:

```javascript
const onCustomizeMenuActions = ({ sender, args }: { sender: any, args: any }) => {
  // ...
  args.Actions.push(action);
};
```

# Customize the Document Viewer Tab Panel in React Application

This topic contains customization scenarios related to the Tab Panel in the Web Document Viewer.

## Remove the Tab Panel

Use the `CustomizeElements` callback to get the Tab Panel by its `PreviewElements`‘ id and remove the Tab Panel from the collection of UI elements:

```javascript
'use client';
import React from 'react';
import ReportViewer, { RequestOptions, Callbacks } from 'devexpress-reporting-react/dx-report-viewer';
import {PreviewElements} from 'devexpress-reporting/dx-webdocumentviewer';

function App() {
  const onCustomizeElements = ({ args }: { args: any }): void => {
    var panelPart = args.GetById(PreviewElements.RightPanel);
    var index = args.Elements.indexOf(panelPart);
    args.Elements.splice(index, 1);
  };
  return (
    <ReportViewer reportUrl="TestReport">
      <RequestOptions host="http://localhost:5000/" invokeAction="DXXRDV" />
      <Callbacks CustomizeElements={onCustomizeElements} />
    </ReportViewer>
  )
}

export default App
```

## Add a New Tab to the Panel

You can create a new tab and add it to the tab collection in the Document Viewer’s View Model. The tab content is defined in a template specified in the tab constructor.

Use the `BeforeRender` callback to customize toolbar commands. The callback function receives the `IPreviewModel` object and the Document Viewer’s View Model object as arguments.

The view model’s `tabPanel` property allows you to access a tab collection in the Tab Panel. Create a new tab (an instance of the `TabInfo<T>` class) and add it to the collection.

In the `TabInfo` constructor, specify the template used to render the tab content and the template used to render the tab image.

The customized tab panel is shown in the image below:

[web-customize-document-viewer-panel](https://docs.devexpress.com/XtraReports/images/web-customize-document-viewer-panel.png)

```javascript
'use client';
import React from 'react';
import ReportViewer, { RequestOptions, Callbacks } from 'devexpress-reporting-react/dx-report-viewer';
import { TemplateEngine } from 'devexpress-reporting-react/dx-report-viewer/core/template-engine';
import { TabInfo } from "@devexpress/analytics-core/analytics-utils"


function App() {
  const templateEngine = new TemplateEngine();
  templateEngine.setTemplate('fivestar', () => (
    <svg viewBox="-3.4 -4 32 32" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink">
      <g id="Layer_1" transform="translate(-3.4, -4)">
        <g id="Rating_1_">
            <polygon className="dxd-icon-fill" points="16,4 19.9,11.9 28.6,13.2 22.3,19.3 23.8,28 16,23.9 8.2,28 9.7,19.3 3.4,13.2 12.1,11.9" />
        </g>
      </g>
    </svg>
  ));
  templateEngine.setTemplate('my-test-panel', () => (
    <div>
      <button> <span>Test Panel</span> </button>
    </div>
  ));
  const onBeforeRender = ({ args }: { args: any }): void => {
    args.tabPanel.tabs.push(new TabInfo({
      text: "Test",
      template: "my-test-panel",
      imageTemplateName: "fivestar",
      model: null
    }));
  };
  return (
    <ReportViewer reportUrl="TestReport" templateEngine={templateEngine}>
      <RequestOptions host="http://localhost:5000/" invokeAction="DXXRDV" />
      <Callbacks BeforeRender={onBeforeRender} />
    </ReportViewer>
  )
}

export default App
```

Use our SVG Icon Builder tool to create custom icons. For more information, refer to the following help topic: [How To: Draw and Use SVG Images](https://docs.devexpress.com/WindowsForms/117631/devexpress-icon-library/how-to-draw-and-use-svg-images#icon_builder).

# Customize Parameter Editor in the Document Viewer in React Applications

This topic describes two ways to customize a standard parameter editor in the Web Document Viewer:

[View Example: Customize Parameter Editor in the Web Document Viewer](https://github.com/DevExpress-Examples/reporting-react-customize-parameter-editor)

## Customize a Standard Editor

Use the `CustomizeParameterEditors` event to change the display format and set validation rules for parameters.

The code snippets in the sections below remove the unnecessary time part from the DateTime editor and prevent users from entering a date earlier than the specified date.

### Change the Editor Options

Use the `extendedOptions` property to customize the [DateBox](https://js.devexpress.com/DevExtreme/25_1/ApiReference/UI_Components/dxDateBox/) editor options.

```javascript
const onCustomizeParameterEditors = React.useCallback(({ args }: { args: any }): void => {
    if (args.parameter.type === 'System.DateTime') {
        args.info.editor = {...args.info.editor};
        args.info.editor.extendedOptions = {
          ...args.info.editor.extendedOptions,
          type: 'date',
          displayFormat: 'dd-MMM-yyyy'
        };
        ...
}, []);
```

### Add a Validation Rule

Use the `validationRules` property to add rules to validate the value entered in the editor.

```javascript
const onCustomizeParameterEditors = React.useCallback(({ args }: { args: any }): void => {
    if (args.parameter.type === 'System.DateTime') {
    ...
        args.info.validationRules = [{
          type: "range",
          min: new Date(1990, 0, 1),
          message: "No data available prior to the year 1990."
      }];
      ...
}, []);
```

The customized parameter editor appears as follows:

[Custom Parameter Editor DateBox](https://docs.devexpress.com/XtraReports/images/web-custom-parameter-editor-datetime-react.png)

## Create a Custom Editor Template

This section contains an example of a custom editor for the `p_employeeID` parameter that identifies an employee. The custom editor displays the expandable employee hierarchy and information about each employee.

Use the DevExtreme [TreeList](https://js.devexpress.com/DevExtreme/25_1/Guide/UI_Components/TreeList/Getting_Started_with_TreeList/) component as a template for the Employee ID parameter’s value editor.

The data source for the Tree List editor is a list of Employee objects created on the server and serialized to JSON.

The custom parameter editor is shown in the following image:

[Custom Parameter Editor Tree List](https://docs.devexpress.com/XtraReports/images/web-custom-parameter-editor-tree-list.png)

Follow the steps below to implement a custom value editor:

1.  **Create the Employee class.**

    ```csharp
    public class Employee {
        public int Id { get; set; }
        public int ParentId { get; set; }
        public string Name { get; set; }
        public string Title { get; set; }
    }
    ```

2.  **Add a controller action that creates JSON data for the parameter editor.**

    ```csharp
    public IActionResult ListEmployees() {
        var employees = new List<Employee>();
        employees.Add(new Employee() { Id = 2, ParentId = 0, Name = "Andrew Fuller", Title = "Vice President" });
        employees.Add(new Employee() { Id = 1, ParentId = 5, Name = "Nancy Davolio", Title = "Sales Representative" });
        employees.Add(new Employee() { Id = 3, ParentId = 5, Name = "Janet Leverling", Title = "Sales Representative" });
        employees.Add(new Employee() { Id = 4, ParentId = 5, Name = "Margaret Peacock", Title = "Sales Representative" });
        employees.Add(new Employee() { Id = 5, ParentId = 2, Name = "Steven Buchanan", Title = "Sales Manager" });
        return Json(employees);
    }
    ```

3.  **Define a custom editor template with the Tree List editor.**

    ```javascript
    const CustomParameterEditor = ({data}: {data: IEditorViewModel}) => {
        const dataSource = `${BACKEND_URL}/Home/ListEmployees`;
        const columns = [{ dataField: "name", caption: "Name" }, { dataField: "title", caption: "Title" }];

        const onSelectionChanged = (e: any) => {
          if (e.selectedRowsData.length > 0) {
            var selectedEmployeeID = e.selectedRowsData[0].id;
            parametersModel.p_employeeID = selectedEmployeeID;
          }
        }

      return (
          <TreeList
              dataSource={dataSource}
              columns={columns}
              showBorders={true}
              selection={{ mode: 'single' }}
              selectedRowKeys={data.value}
              onSelectionChanged={onSelectionChanged}
          />
      );
    };
    ```

4.  **To register the template, pass the template name and the template itself to the `templateEngine.setTemplate` method:**

    ```javascript
    templateEngine.setTemplate('employeeID-custom-editor', CustomParameterEditor);
    ```

5.  **In the `CustomizeParameterEditors` event handler, set the `header` property to the template name for the `p_employeeID` parameter:**

    ```javascript
    const onCustomizeParameterEditors = React.useCallback(({ args }: { args: any }): void => {
    ...
        if (args.parameter.name == "p_employeeID") {
            args.info.editor = { header: 'employeeID-custom-editor' };
        };
    }, []);
    ```

6.  **Handle the `CustomizeParameterEditors` event.**

    ```javascript
    <ReportViewer reportUrl="CustomParameterReport" templateEngine={templateEngine}>
      <RequestOptions invokeAction="/DXXRDV" host="http://localhost:5000/" />
      <Callbacks
          CustomizeParameterEditors={onCustomizeParameterEditors}
          BeforeRender={onBeforeRender} />
    </ReportViewer>
    ```

## Web Report Designer

[View Example: Reporting for React - Add a Web Report Designer to a React App](https://github.com/DevExpress-Examples/reporting-react-integrate-end-user-designer)

# Create a React Front-End Application with a Report Designer (Next.js)

The Web Report Designer is used in applications that contain client and server parts:

*   **Client**: A Web Report Designer integrated in a client React application displays a report provided by the server-side model.
*   **Server**: The server is an ASP.NET Core application that handles client data requests and provides access to data sources, report storage, and other back-end capabilities.

This tutorial creates and configures a client React application and a server ASP.NET Core backend. The client is created with the help of Next.js and contains the Web Report Designer control.

[View Example](https://github.com/DevExpress-Examples/reporting-react-integrate-end-user-designer)

**Tip**: You can also use our DevExpress project templates to create a React Reporting application:

*   [Use DevExpress Visual Studio Templates to Create a React Reporting App with a Report Designer](https://docs.devexpress.com/XtraReports/405292/web-reporting/react-reporting/report-designer/react-vs-template-designer)
*   [Use DevExpress .NET CLI Templates to Create a React Reporting App with a Report Designer](https://docs.devexpress.com/XtraReports/405247/web-reporting/react-reporting/report-designer/react-cli-templates)

## Prerequisites

*   Node.js v18+
*   .NET 8 SDK or later
*   Visual Studio 2022 (v17.0) or higher

Note the following details about package versions:

*   The script version on the client should match the library version on the server.
*   DevExpress npm package versions should be identical.

## Create a Server Application (Back-End)

### Use the DevExpress CLI Template

You can use DevExpress CLI Templates to create an ASP.NET Core back-end application. Begin with the steps below:

1.  Install DevExpress ASP.NET Core project templates from nuget.org:
    ```bash
    dotnet new install DevExpress.AspNetCore.ProjectTemplates
    ```
2.  Create a back-end Reporting application:
    ```bash
    dotnet new dx.aspnetcore.reporting.backend -n ServerApp
    ```
    You can use the following parameters to see available command options: `-? | -h | --help`.
3.  Enable cross-origin requests (CORS). Specify the policy that allows any local application to access the report’s back-end. Use the `SetIsOriginAllowed` method to set it up. Call the `UseCors` method and pass the policy name as a parameter. The `UseCors` method should be called after the `UseRouting` method and before any MVC-related code. Place the `UseCors` method before the `UseMvc` or `UseEndpoints` methods.

    Open the application startup file and insert the following code:
    ```csharp
    var builder = WebApplication.CreateBuilder(args);

    builder.Services.AddCors(options => {
        options.AddPolicy("AllowCorsPolicy", builder => {
            // Allow all ports on local host.
            builder.SetIsOriginAllowed(origin => new Uri(origin).Host == "localhost");
            builder.AllowAnyHeader();
            builder.AllowAnyMethod();
        });
    });

    var app = builder.Build();

    app.UseRouting();
    app.UseCors("AllowCorsPolicy");

    app.UseEndpoints(endpoints => {
        endpoints.MapControllerRoute(
            name: "default",
            pattern: "{controller=Home}/{action=Index}/{id?}");
    });

    app.Run();
    ```
4.  To run the server-side application, run the following command:
    ```bash
    cd ServerApp
    dotnet run
    ```

### Use Visual Studio Template

To create a back-end application from a Microsoft or DevExpress Template in Visual Studio, review the following help topics:

*   [Report Designer Server-Side Application (ASP.NET Core)](https://docs.devexpress.com/XtraReports/400196/web-reporting/asp-net-core-reporting/server-side-configuration/report-designer-server-side-configuration-asp-net-core)
*   [Report Designer’s Server-Side Configuration (ASP.NET MVC)](https://docs.devexpress.com/XtraReports/118371/web-reporting/asp-net-mvc-reporting/server-side-configuration/report-designer-server-side-configuration-asp-net-mvc)

## Create a Client Application (Front-End)

1.  In the command prompt, create a React application with Next.js:
    ```bash
    npx create-next-app@latest react-report-designer
    ```
2.  Navigate to the project folder:
    ```bash
    cd react-report-designer
    ```
3.  Install the `devexpress-reporting-react` npm package:
    ```bash
    npm install devexpress-reporting-react@25.1-stable
    ```
4.  Open the `app/page.tsx` file and substitute its contents with the following code excerpt:
    ```javascript
    'use client';
    import ReportDesigner, { RequestOptions} from 'devexpress-reporting-react/dx-report-designer';
    import 'devextreme/dist/css/dx.light.css';
    import '@devexpress/analytics-core/dist/css/dx-analytics.common.css';
    import '@devexpress/analytics-core/dist/css/dx-analytics.light.css';
    import 'devexpress-reporting/dist/css/dx-webdocumentviewer.css';
    import 'ace-builds/css/ace.css';
    import 'ace-builds/css/theme/dreamweaver.css';
    import 'ace-builds/css/theme/ambiance.css';
    import '@devexpress/analytics-core/dist/css/dx-querybuilder.css';
    import 'devexpress-reporting/dist/css/dx-reportdesigner.css';

    function App() {
      return (
        <ReportDesigner reportUrl="TestReport">
            <RequestOptions host="http://localhost:5000/" getDesignerModelAction="DXXRD/GetDesignerModel" />
        </ReportDesigner>
      )
    }

    export default App
    ```
    This code snippet declares the `ReportDesigner` component and returns it with the `App` function. Specify the correct server-side port (the `host` variable) and report name (the `reportUrl` variable).

## Run the Project

1.  Run the server application. Make sure to specify the correct server-side port (5000 in this example) and report name (`TestReport` in this example) in the `app/page.tsx` file.
2.  Run the client application:
    ```bash
    npm run dev
    ```
3.  Open `http://localhost:3000/` in your browser to see the result:
    [Web Report Designer Page](https://docs.devexpress.com/XtraReports/images/web-report-designer-browser-react.png)

## Troubleshooting

When you start the application, you may encounter the following problems:

### Page Is Blank

The Report Designer page is blank. The following error message is displayed at the bottom of the page: The page is blank because the Report Designer failed to load the report. Consult the developer for assistance. Use development mode for detailed information.

Check the following:

*   The backend application is up and running.
*   The specified controller action path matches the back-end application type. If you use the ASP.NET Core backend, specify the `/DXXRD/GetDesignerModel` path; if you use the ASP.NET MVC backend, specify the `/ReportDesigner/GetReportDesignerModel` path.
*   The backend application runs on the port specified in the `host` setting of the Report Designer component.
*   The application’s URI satisfies the CORS policy specified in your back-end application.
*   The `reportUrl` value matches an existing report. For the back-end application, ensure that either the `Reports` folder contains a `reportUrl.repx` file or the `ReportsFactory.Reports` dictionary contains the `reportUrl` entry (if the back-end application originated from the DevExpress template).
*   The version of DevExpress npm packages should match the version of NuGet packages. Enable Development Mode to check for library version mismatch on every request to the server. For details, review the following help document: [Server-Side Libraries Version](https://docs.devexpress.com/XtraReports/401687/web-reporting/troubleshooting/application-diagnostics#server-side-libraries-version).

Refer to the following help topic for more information: [Troubleshooting](https://docs.devexpress.com/XtraReports/401726/web-reporting/troubleshooting).

# Report Designer Client-Side Configuration in React Applications

This help topic describes how to configure the `ReportDesigner` component that integrates the Web Report Designer into your React-based application. Note that Angular Reporting components require an API backend application.

To set the options from the client side, use the `ReportDesignerSettingsBase` class in you application.

## Root Options

The following table lists `ReportDesigner` component options:

| Option | Required / Optional | Description |
| --- | --- | --- |
| `reportUrl` | Required | A string that specifies the initial report’s URL. |
| `width` | Optional | A string that defines Report Designer width. The default value is ‘100%’. |
| `height` | Optional | A string that defines Report Designer height. The default value is ‘700px’. |
| `developmentMode` | Optional | A Boolean value that enables Development mode for extended diagnostics. Review the following help topic for more information: [Troubleshooting: Server-Side Libraries Version](https://docs.devexpress.com/XtraReports/401687/web-reporting/troubleshooting/application-diagnostics#server-side-libraries-version). |
| `cssClass` | Optional | A string that specifies the CSS class name to attach to the root div element. |

## RequestOptions

Allows you to specify where to send requests from the Report Designer.

| Option | Required / Optional | Description |
| --- | --- | --- |
| `host` | Required | A server-side project’s URI. |
| `getDesignerModelAction` | Required | The URI path of the controller action that returns the Report Designer model. |
| `getLocalizationAction` | Optional | The URI path of the controller action used to customize localization strings. |

## Callbacks

Allows you to specify a callback to customize the Report Designer. Callbacks correlate to client-side events at the Report Designer control level.

## DesignerModelSettings

Allows you to specify various Report Designer settings. Review the `ReportDesignerSettingsBase` class description for information about available settings.

Settings in this section are passed to the controller and applied to the server-side model. You should add a parameter to the controller action method and assign the passed value to the model property.

| Setting | Description |
| --- | --- |
| `allowMDI` | Specifies whether a user can close all reports designed in the Report Designer and leave the designer empty or leave it with only a single report.’ |
| `rightToLeft` | Enables a right-to-left layout in the Web Report Designer user interface. |

The `DesignerModelSettings` is a nested component that includes the settings listed below:

### DataSourceSettings

Allows you to hide data source actions from the Field List panel (part of the Web End-User Report Designer). Review the `ReportDesignerDataSourceSettings` class description for more information.

### PreviewSettings

Allows you to specify Report Preview settings. Review the `ReportPreviewSettings` class description for more information.

### WizardSettings

Specifies Report Wizard settings. Review the `ReportDesignerWizardSettings` class description for more information.

### ParameterEditingSettings

Specifies settings that configure user interface elements related to the editing of parameters, parameter groups, and parameter separators in the Web Report Designer. Review the `ReportDesignerParameterEditingSettings` class description for more information.

## Usage

The following code configures the `ReportDesigner` component in a React application. The code does the following:

*   Uses the `CustomizeMenuActions` event to hide the New and Open commands from the Main Menu.
*   Hides the UI elements used to add and remove data sources.
*   Sets the location of the progress bar to top right position.
*   Opens another browser tab for print and export operations.
*   Hides search actions from the Toolbar and Tab Panel in the Report Preview.
*   Uses the Report Wizard in the fullscreen mode.

```javascript
'use client';
import ReportDesigner, { RequestOptions, DesignerModelSettings, PreviewSettings, DataSourceSettings, WizardSettings, Callbacks  } from 'devexpress-reporting-react/dx-report-designer';
import { ActionId } from 'devexpress-reporting/dx-reportdesigner';

import 'ace-builds/css/ace.css';
import 'ace-builds/css/theme/dreamweaver.css';
import 'ace-builds/css/theme/ambiance.css';
import '@devexpress/analytics-core/dist/css/dx-querybuilder.css';
import 'devexpress-reporting/dist/css/dx-reportdesigner.css';
import { ExportSettings, ProgressBarSettings, SearchSettings } from 'devexpress-reporting-react/dx-report-viewer';

function App() {
  const onCustomizeMenuActions = ({args }: {args : any}) => {
      // Hide the "NewReport" and "OpenReport" actions.
      var newReportAction = args.GetById(ActionId.NewReport);
      if (newReportAction)
          newReportAction.visible = false;
      var openAction = args.GetById(ActionId.OpenReport);
      if (openAction)
          openAction.visible = false;
  }
  return (
    <ReportDesigner reportUrl="TestReport">
      <RequestOptions host="http://localhost:5000/" getDesignerModelAction="DXXRD/GetDesignerModel" />
      <Callbacks CustomizeMenuActions={onCustomizeMenuActions} />
      <DesignerModelSettings allowMDI={true}>
        <DataSourceSettings allowAddDataSource={false} allowRemoveDataSource={false}/>
        <PreviewSettings>
          <ExportSettings useSameTab={false}/>
          <ProgressBarSettings position='TopRight'/>
          <SearchSettings searchEnabled={false} />
        </PreviewSettings>
        <WizardSettings useFullscreenWizard={false} />
      </DesignerModelSettings>
    </ReportDesigner>
  )
}

export default App
```

Use the `ReportDesignerSettingsBase` class in you application. Add the code that assigns the settings to the model. The controller method returns the model to the client for rendering.

The following code is a custom controller for the Report Designer component. It processes settings passed from the client and assigns them to the model:

```csharp
using DevExpress.AspNetCore.Reporting.ReportDesigner;
using DevExpress.AspNetCore.Reporting.ReportDesigner.Native.Services;
using DevExpress.XtraReports.Web.ReportDesigner;
using Microsoft.AspNetCore.Mvc
// ...
public class CustomReportDesignerController : ReportDesignerController {
    public CustomReportDesignerController(IReportDesignerMvcControllerService controllerService) : base(controllerService) {
    }
    [HttpPost("[action]")]
    public IActionResult GetDesignerModel(
        [FromForm] string reportUrl,
        [FromForm] ReportDesignerModel designerModelSettings,
        [FromServices] IReportDesignerClientSideModelGenerator modelGenerator) {
        var model = modelGenerator.GetModel(reportUrl, null, ReportDesignerController.DefaultUri, WebDocumentViewerController.DefaultUri, QueryBuilderController.DefaultUri);
        model.Assign(designerModelSettings);
        return DesignerModel(model);
    }
}
```

Run the application to see the results:

[Angular Designer Client Side Configuration Result](https://docs.devexpress.com/XtraReports/images/angular-client-side-designer-configuration-result.png)

# React Apps: Enable Rich Text Editor in Web Report Designer

The [XRRichText](https://docs.devexpress.com/XtraReports/DevExpress.XtraReports.UI.XRRichText) control can display text with rich formatting in your report. You can specify content directly in the control, load text from an RTF/HTML file, or bind the control to a data field.

You can activate an inline Rich Text Editor and allow users to format and edit content in the Web Report Designer:

[Web Report Designer - Rich Text Editor](https://docs.devexpress.com/XtraReports/images/RichTextEditor.png)

**Note**: The inline Rich Text Editor does not support [Right-To-Left mode](https://docs.devexpress.com/XtraReports/115922/detailed-guide-to-devexpress-reporting/globalize-and-localize-reports/right-to-left-support). For more information on limitations, refer to the following help topic: [Rich Text Editor Unsupported Features](https://docs.devexpress.com/AspNetCore/401837/rich-edit/unsupported-features).

Follow the steps below to enable inline editing functionality in the Rich Text control:

1.  Install the `devexpress-richedit` npm package:
    ```bash
    npm install devexpress-richedit@25.1-stable
    ```
2.  Add the following lines to the page with the Report Designer:
    ```javascript
    import 'devexpress-reporting/dx-richedit';
    import 'devexpress-richedit/dist/dx.richedit.css';
    ```

### Get Started

* [Create a React Front-End Application with a Report Designer (Next.js)](https://docs.devexpress.com/XtraReports/119339/web-reporting/react-reporting/report-designer/report-designer-integration-react-nextjs)
* [Report Designer Client-Side Configuration in React Applications](https://docs.devexpress.com/XtraReports/404983/web-reporting/react-reporting/report-designer/report-designer-client-side-configuration-react)
* [Enable the Rich Text Editor](https://docs.devexpress.com/XtraReports/404112/web-reporting/react-reporting/report-designer/enable-rich-text-editor)

# Standalone Report Parameters Panel in React Applications

The Standalone Report Parameters Panel is a component that creates a layout with editors for report parameters. It retrieves information on report parameters from a DevExpress report instance passed from the backend.

[Standalone Report Parameters Panel](https://docs.devexpress.com/XtraReports/images/web-report-parameters-panel.png)

Use this component to programmatically create a report, then export or email it without showing a preview to the end user. The component reduces memory usage by eliminating the need to generate report preview and sending it to the client application.

The Standalone Report Parameters Panel component is based on the Parameters Panel of the [DevExpress Web Report Viewer component](https://docs.devexpress.com/XtraReports/401850/web-reporting/web-document-viewer). Public properties and events are similar to the properties and events implemented in the Web Document Viewer component.

## Add a Standalone Report Parameters Panel to Your Application

The application is based on a backend server project and includes a React client part.

### Backend Part (ASP.NET Core)

For information on how to create the backend, review the corresponding section in the ASP.NET Core tutorial: [Configure the Server Part (Backend)](https://docs.devexpress.com/XtraReports/404888/web-reporting/asp-net-core-reporting/standalone-parameters-panel-asp-net-application/add-the-standalone-parameters-panel-to-asp-net-core-application#configure-the-server-part-backend).

### Client Part (React Application)

1.  Start with a React application. You can create a new React app from a template:
    ```bash
    npm create vite@latest react-parameters-panel -- --template react-ts
    ```
2.  Navigate to the project folder:
    ```bash
    cd react-parameters-panel
    ```
3.  Install the `devexpress-reporting-react` package:
    ```bash
    npm install devexpress-reporting-react@25.1-stable
    ```
    **Note**: Front-end and back-end applications should use the same version of DevExpress controls.
4.  Open the `src/App.tsx` file and replace its contents with the following code snippet:
    ```javascript
    import 'devextreme/dist/css/dx.light.css';
    import '@devexpress/analytics-core/dist/css/dx-analytics.common.css';
    import '@devexpress/analytics-core/dist/css/dx-analytics.light.css';
    import 'devexpress-reporting/dist/css/dx-webdocumentviewer.css';
    import DxParametersPanel from "devexpress-reporting-react/dx-report-viewer/dx-parameters-panel";
    import {RequestOptions, Callbacks} from "devexpress-reporting-react/dx-report-viewer/dx-parameters-panel";

    function App() {

        const host = 'https://localhost:44336/';
        const invokeAction = 'DXXRDV';
        const reportUrl = 'TestReport';

        const customizeButtons = (event: any) => {
            const sender = event.sender;
            const panel = sender.GetParametersModel();
            (window as any)['parametersPanel'] = panel;
            panel.buttons.push({
                text: 'Export',
                onClick: () => {
                    const data = sender.SerializeParametersState();
                    fetch(`${host}Home/ExportWithParameters`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ serializedParameters: data, reportUrl: reportUrl })
                    })
                    .then(response => response.json())
                    .then(result => alert(result.message))
                    .catch(error => console.error('Export error:', error));
                }
            });
            panel.showButtons = true;
        }

    return (

        <DxParametersPanel reportUrl={reportUrl} height="600px" width="500px" >
            <RequestOptions host={host} invokeAction={invokeAction} />
            <Callbacks BeforeRender={customizeButtons} />
        </DxParametersPanel>
    )
    }

    export default App
    ```
    This code snippet declares the `DxParametersPanel` component and returns it with the `App` function. Specify the correct server-side port (the `host` variable) and report name (the `reportUrl` variable).
5.  Remove default project styles to avoid conflicts. To do this, remove the `index.css` import in the `main.tsx` file.

When a user clicks the **Export** button, a request to the controller action is executed, and the resulting PDF file is sent to the client.

[Standalone Report Parameters Panel with Buttons](https://docs.devexpress.com/XtraReports/images/spp-with-buttons.png)

### Implement the Controller Action

The client’s parameter data is sent to the `ExportWithParameters` controller action. In this action, call the `ApplyParametersStateAsync` method to apply parameters to the report.

Once the report instance has all the necessary parameter values, it is ready to generate a document. Call the `ExportToPdf` method to create a PDF document from the report.

```csharp
using DevExpress.XtraReports.Web.ParametersPanel;
using Microsoft.AspNetCore.Mvc;
// ...
public class HomeController : Controller {
    public async Task<IActionResult> ExportWithParameters(
    [FromServices] IReportParametersSerializer reportParametersSerializer,
    [FromServices] IWebHostEnvironment env,
    [FromBody] ExportData exportData) {
        var report = await reportParametersSerializer.ApplyParametersStateAsync(
exportData.reportUrl,
            exportData.serializedParameters);
        string timestamp = DateTime.Now.ToString("yyyyMMdd_HHmmss");
        string fileDir = Path.Combine(env.ContentRootPath,"Reports");
        if (!Directory.Exists(fileDir)) {
            Directory.CreateDirectory(fileDir);
        }
        report.ExportToPdf(Path.Combine(fileDir,$"{exportData.reportUrl}_{timestamp}.pdf"));
        return Ok(new { message = "The report " + " is exported successfully to " + fileDir });
    }
}

public class ExportData {
    public string serializedParameters { get; set; }
    public string reportUrl { get; set; }
}
```

The PDF file is saved to the project’s `Reports` folder.

### Standalone Report Parameters Panel Component Settings

The following component settings are critical for component integration:

*   **reportUrl**: A string that identifies a report. This string is passed to server-side report name resolution services. You can create a `ReportStorageWebExtension` or `IReportProvider` descendant, and register it in your back-end application as a custom report name resolution service. For more information, review the following help topic: [Open a Report in ASP.NET Core Application](https://docs.devexpress.com/XtraReports/402505/web-reporting/asp-net-core-reporting/document-viewer-in-asp-net-applications/open-a-report).
*   **invokeAction**: Specifies a route to the controller that handles requests in your back-end application. A controller with the `DXXRDV` route is an internal MVC controller that is added to the back-end application when the methods `AddDevExpressControls` and `UseDevExpressControls` are called in the `Startup.cs` file. You can implement a `WebDocumentViewerController` descendant and register it as a controller with a custom route. To see a code sample, review the following help topic: [ASP.NET Core and Angular Reporting Best Practices](https://docs.devexpress.com/XtraReports/402190/web-reporting/asp-net-core-reporting/asp-net-core-reporting-best-practices).
*   **host**: The back-end application’s URL.

### Standalone Report Parameters Panel API

#### Client-Side API

The following types and members implement client-side Standalone Report Parameters Panel functionality:

*   [JSReportParametersPanel](https://docs.devexpress.com/XtraReports/js-DevExpress.Reporting.Viewer.JSReportParametersPanel): A class that triggers events for the Standalone Report Parameters Panel and serves as the sender in callback functions.
*   [JSReportParametersPanel.GetParametersModel](https://docs.devexpress.com/XtraReports/js-DevExpress.Reporting.Viewer.JSReportViewerBase-1#js_devexpress_reporting_viewer_jsreportviewerbase_1_getparametersmodel): Allows you to access the report parameters client-side model.
*   [JSReportParametersPanel.SerializeParametersState](https://docs.devexpress.com/XtraReports/js-DevExpress.Reporting.Viewer.JSReportParametersPanel#js_devexpress_reporting_viewer_jsreportparameterspanel_serializeparametersstate): Serializes parameter information from the Standalone Report Parameters Panel to a JSON string.
*   [ParametersPanelModelBase](https://docs.devexpress.com/XtraReports/js-DevExpress.Reporting.Viewer.Parameters.ParametersPanelModelBase): A base class that defines common properties and methods for client models of report parameters.
*   [ParametersPanelStandalone](https://docs.devexpress.com/XtraReports/js-DevExpress.Reporting.Viewer.Parameters.ParametersPanelStandalone): Client-side model for the Standalone Report Parameters Panel component.

#### Server API

The component events (callbacks) are defined using `ReportParametersPanelClientSideEventsBuilder` methods:

*   [BeforeRender(String)](https://docs.devexpress.com/XtraReports/DevExpress.AspNetCore.Reporting.WebDocumentViewer.WebDocumentViewerClientSideEventsBuilderBase-2.BeforeRender(System.String))
*   [CustomizeLocalization(String)](https://docs.devexpress.com/XtraReports/DevExpress.AspNetCore.Reporting.WebDocumentViewer.WebDocumentViewerClientSideEventsBuilderBase-2.CustomizeLocalization(System.String))
*   [CustomizeParameterEditors(String)](https://docs.devexpress.com/XtraReports/DevExpress.AspNetCore.Reporting.WebDocumentViewer.WebDocumentViewerClientSideEventsBuilderBase-2.CustomizeParameterEditors(System.String))
*   [CustomizeParameterLookUpSource(String)](https://docs.devexpress.com/XtraReports/DevExpress.AspNetCore.Reporting.WebDocumentViewer.WebDocumentViewerClientSideEventsBuilderBase-2.CustomizeParameterLookUpSource(System.String))
*   [OnInitializing(String)](https://docs.devexpress.com/XtraReports/DevExpress.AspNetCore.Reporting.WebDocumentViewer.WebDocumentViewerClientSideEventsBuilderBase-2.OnInitializing(System.String))
*   [OnServerError(String)](https://docs.devexpress.com/XtraReports/DevExpress.AspNetCore.Reporting.WebDocumentViewer.WebDocumentViewerClientSideEventsBuilderBase-2.OnServerError(System.String))
*   [ParametersInitialized(String)](https://docs.devexpress.com/XtraReports/DevExpress.AspNetCore.Reporting.WebDocumentViewer.WebDocumentViewerClientSideEventsBuilderBase-2.ParametersInitialized(System.String))
*   [ParametersReset(String)](https://docs.devexpress.com/XtraReports/DevExpress.AspNetCore.Reporting.WebDocumentViewer.WebDocumentViewerClientSideEventsBuilderBase-2.ParametersReset(System.String))

Classes related to the server-side model:

*   [IReportParametersPanelClientSideModelGenerator](https://docs.devexpress.com/XtraReports/DevExpress.XtraReports.Web.ParametersPanel.IReportParametersPanelClientSideModelGenerator): A class used to generate a client-side model for the Standalone Report Parameters Panel component.
*   [ReportParametersPanelModel](https://docs.devexpress.com/XtraReports/DevExpress.XtraReports.Web.ParametersPanel.ReportParametersPanelModel): A class that is the server-side model for the Standalone Report Parameters Panel.

This service allows you to pass a string obtained from the client’s `SerializeParametersState` method. The return object is a report instance with the applied parameters:

*   [IReportParametersSerializer](https://docs.devexpress.com/XtraReports/DevExpress.XtraReports.Web.ParametersPanel.IReportParametersSerializer): Defines methods that enable you to deserialize parameters received from the Standalone Report Parameters Panel component and apply parameters to a report instance.

#### Panel Builder

*   [ParameterPanelFluentBuilder](https://docs.devexpress.com/XtraReports/DevExpress.XtraReports.Parameters.ParameterPanelFluentBuilder): Contains methods that allow you to customize the [Parameters panel](https://docs.devexpress.com/XtraReports/402960/detailed-guide-to-devexpress-reporting/use-report-parameters/parameters-panel).
* [Localize Reporting Tools for React](https://docs.devexpress.com/XtraReports/402603/web-reporting/common-features/localization/localization-in-reporting-for-react)
* [Content Security Policy for React Applications](https://docs.devexpress.com/XtraReports/404557/web-reporting/react-reporting/content-security-policy)

### Customization

* [Tasks and Solutions for ASP.NET Core Applications](https://docs.devexpress.com/XtraReports/402406/web-reporting/asp-net-core-reporting/tasks-and-solutions-for-asp-net-core-applications#report-designer)
* A general technique that allows you to customize the UI elements in Reporting components: [Use Custom HTML Templates](https://docs.devexpress.com/XtraReports/403960/web-reporting/common-features/use-custom-html-templates).
* [AI-powered Extensions for DevExpress Reports](https://docs.devexpress.com/XtraReports/405211/ai-powered-functionality/ai-for-devexpress-reporting)
* Use the [ReportDesignerSettingsBase](https://docs.devexpress.com/CoreLibraries/DevExpress.XtraReports.Web.ReportDesigner.ReportDesignerSettingsBase) class to configure the Web End-User Report Designer on the client. For more information, refer to the following section: [ReportDesignerSettingsBase for JavaScript Frameworks](https://docs.devexpress.com/CoreLibraries/DevExpress.XtraReports.Web.ReportDesigner.ReportDesignerSettingsBase#javascript-frameworks).

### End-User Documentation

* [End-User Report Designer](https://devexpress.github.io/dotnet-eud/reporting-for-web/articles/report-designer.html)

### Client-Side API

#### Client Object

Use the [JSReportDesigner](https://docs.devexpress.com/XtraReports/js-DevExpress.Reporting.Designer.JSReportDesigner) class to access the client-side API in React applications.

#### Events

Client-side events in React are handled with callbacks specified in the [Callbacks](https://docs.devexpress.com/XtraReports/404983/web-reporting/react-reporting/report-designer/report-designer-client-side-configuration-react#callbacks) component.

For a list of event names and their arguments, review [ReportDesignerClientSideEventsBuilder](https://docs.devexpress.com/XtraReports/DevExpress.AspNetCore.Reporting.ReportDesigner.ReportDesignerClientSideEventsBuilder._members) methods. Although that documentation topic is specific to ASP.NET Core, the API for React callbacks is the same.

The following code snippet does the following:
* Displays a message when the Report Designer switches to another tab.
* Specifies a measurement unit when the Report Designer opens a report.
* Hides the Print Page action in Preview.
* Adds a new action button to Preview.

```javascript
'use client';
import dynamic from 'next/dynamic'
import Callbacks from 'devexpress-reporting-react/dx-report-designer/options/Callbacks'
import RequestOptions from 'devexpress-reporting-react/dx-report-designer/options/RequestOptions';
import {ActionId } from 'devexpress-reporting/viewer/constants';
const ReportDesigner = dynamic(() => import('devexpress-reporting-react/dx-report-designer'), {ssr: false})


function App() {
  const onTabChanged = ({ args }: { args: any }): void => {
    alert("The tab was changed to " + args.Tab.displayName());
  };
  const onReportOpened = ({ args }: { args: any }): void => {
    args.Report.measureUnit("TenthsOfAMillimeter");
  };
  const onPreviewCustomizeMenuActions = ({ args }: { args: any }): void => {
    var actions = args.Actions;
    // Get the "Print Page" action and hide it.
    var printPageAction = args.GetById(ActionId.PrintPage);
    if (printPageAction)
      printPageAction.visible = false;
    // Add a new action.
    actions.push({
      text: "Custom Command",
      imageClassName: "customButton",
      imageTemplateName: "dxrd-svg-wizard-warning",
      hasSeparator: false,
      disabled: false,
      visible: true,
      hotKey: { ctrlKey: true, keyCode: "Z".charCodeAt(0) },
      clickAction: function () {
          alert('Clicked.');
      }
    })
  };
  return (
    <ReportDesigner reportUrl="TestReport">
        <RequestOptions host="http://localhost:5000/" getDesignerModelAction="DXXRD/GetDesignerModel" />
        <Callbacks TabChanged={onTabChanged}
                   ReportOpened={onReportOpened}
                   PreviewCustomizeMenuActions={onPreviewCustomizeMenuActions}/>
    </ReportDesigner>
  )
}

export default App;
```

## Standalone Report Parameters Panel

The [Standalone Report Parameters Panel](https://docs.devexpress.com/XtraReports/404883/web-reporting/standalone-parameters-panel) is a component that creates a layout with editors for report parameters. It retrieves information on report parameters from a DevExpress report instance passed from the backend.

This component can be used to programmatically create a report on the server without showing a preview to the end user. The Standalone Report Parameters Panel component is based on the Parameters Panel of the DevExpress Document Viewer component. Public properties and events are similar to the properties and events implemented in the Web Document Viewer component.

### Get Started

* [Standalone Report Parameters Panel in React Applications](https://docs.devexpress.com/XtraReports/404894/web-reporting/react-reporting/standalone-parameters-panel/standalone-parameters-panel-react)

## Examples

Search sample projects and learn how to use and customize Reporting components in React applications:
* [DevExpress GitHub Examples](https://github.com/orgs/DevExpress-Examples/repositories?q=reporting-for-react)

# Create a React Front-End Application with a Document Viewer (Next.js)

The Web Document Viewer is used in applications that contain client and server parts:

*   **Client**: A Web Document Viewer integrated in a client React application displays a report provided by the server-side model.
*   **Server**: The server is an ASP.NET Core application that handles client data requests and provides access to data sources, report storage, and other back-end capabilities.

This tutorial creates and configures a client React application and a server ASP.NET Core backend. The client is created with the help of Next.js and contains the Web Document Viewer control.

[View Example](https://github.com/DevExpress-Examples/reporting-react-integrate-web-document-viewer)

**Tip**: You can also use our DevExpress project templates to create a React Reporting application:

*   [Use DevExpress Visual Studio Templates to Create a React Reporting App with a Document Viewer](https://docs.devexpress.com/XtraReports/405293/web-reporting/react-reporting/document-viewer/react-vs-template-viewer)
*   [Use DevExpress .NET CLI Templates to Create a React Reporting App with a Document Viewer](https://docs.devexpress.com/XtraReports/405285/web-reporting/react-reporting/document-viewer/react-cli-templates)

## Prerequisites

*   Node.js 18.17 or later
*   .NET 8 SDK or later
*   Visual Studio 2022 (v17.0) or higher

Note the following details about package versions:

*   The script version on the client should match the library version on the server.
*   DevExpress npm package versions should be identical.

## Create a Server Application (Back-End)

### Use the DevExpress CLI Template

You can use DevExpress CLI Templates to create an ASP.NET Core back-end application. Begin with the steps below:

1.  Install DevExpress ASP.NET Core project templates from nuget.org:
    ```bash
    dotnet new install DevExpress.AspNetCore.ProjectTemplates
    ```
2.  Create a back-end Reporting application for a Document Viewer:
    ```bash
    dotnet new dx.aspnetcore.reporting.backend -n ServerApp --add-designer false
    ```
    You can use the following parameters to see available command options: `-? | -h | --help`.
3.  Enable cross-origin requests (CORS). Specify the policy that allows any local application to access the report’s back-end. Use the `SetIsOriginAllowed` method to set it up. Call the `UseCors` method and pass the policy name as a parameter. The `UseCors` method should be called after the `UseRouting` method and before any MVC-related code. Place the `UseCors` method before the `UseMvc` or `UseEndpoints` methods.

    Open the application startup file and insert the following code:
    ```csharp
    var builder = WebApplication.CreateBuilder(args);

    builder.Services.AddCors(options => {
        options.AddPolicy("AllowCorsPolicy", builder => {
            // Allow all ports on local host.
            builder.SetIsOriginAllowed(origin => new Uri(origin).Host == "localhost");
            builder.AllowAnyHeader();
            builder.AllowAnyMethod();
        });
    });

    var app = builder.Build();

    app.UseRouting();
    app.UseCors("AllowCorsPolicy");

    app.UseEndpoints(endpoints => {
        endpoints.MapControllerRoute(
            name: "default",
            pattern: "{controller=Home}/{action=Index}/{id?}");
    });

    app.Run();
    ```
4.  To run the server-side application, run the following command:
    ```bash
    cd ServerApp
    dotnet run
    ```

### Use Visual Studio Template

To create a back-end application from a Microsoft or DevExpress Template in Visual Studio, review the following help topics:

*   [Document Viewer Server-Side Application (ASP.NET Core)](https://docs.devexpress.com/XtraReports/400197/web-reporting/asp-net-core-reporting/server-side-configuration/document-viewer-server-side-configuration-asp-net-core)
*   [Document Viewer’s Server-Side Configuration (ASP.NET MVC)](https://docs.devexpress.com/XtraReports/118597/web-reporting/asp-net-mvc-reporting/server-side-configuration/document-viewer-server-side-configuration-asp-net-mvc)

## Create a Client Application (Front-End)

1.  In the command prompt, create a React application with Next.js:
    ```bash
    npx create-next-app@latest react-document-viewer
    ```
2.  Navigate to the project folder:
    ```bash
    cd react-document-viewer
    ```
3.  Install the `devexpress-reporting-react` npm package:
    ```bash
    npm install devexpress-reporting-react@25.1-stable
    ```
4.  Open the `app/page.tsx` file and substitute its contents with the following code excerpt:
    ```javascript
    'use client';
    import 'devextreme/dist/css/dx.light.css';
    import '@devexpress/analytics-core/dist/css/dx-analytics.common.css';
    import '@devexpress/analytics-core/dist/css/dx-analytics.light.css';
    import 'devexpress-reporting/dist/css/dx-webdocumentviewer.css';
    import ReportViewer, { RequestOptions } from 'devexpress-reporting-react/dx-report-viewer';

    function App() {
      return (
        <ReportViewer reportUrl="TestReport">
          <RequestOptions host="http://localhost:5000/" invokeAction="DXXRDV" />
        </ReportViewer>
      )
    }

    export default App
    ```
    This code snippet declares the `ReportViewer` component and returns it with the `App` function. Specify the correct server-side port (the `host` variable) and report name (the `reportUrl` variable).

## Run the Project

1.  Run the server application. Make sure to specify the correct server-side port (5000 in this example) and report name (`TestReport` in this example) in the `app/page.tsx` file.
2.  Run the client application:
    ```bash
    npm run dev
    ```
3.  Open `http://localhost:3000/` in your browser to see the result:
    [Web Document Viewer Page](https://docs.devexpress.com/XtraReports/images/web-document-viewer-browser.png)

## Troubleshooting

You may encounter the following problems:

### Page Is Blank

The Document Viewer page is blank. The following error message is displayed at the bottom of the page:

`Could not open report ‘TestReport’`

Check the following:

*   The backend application is up and running.
*   The backend application runs on the port specified in the `host` setting of the Document Viewer component.
*   The application’s URI is compliant with the CORS policy specified in your back-end application.
*   The `reportUrl` setting value matches an existing report. For the backend application, ensure that either the `Reports` folder contains a `reportUrl.repx` file or the `ReportsFactory.Reports` dictionary contains the `reportUrl` entry (if the back-end application originated from the DevExpress template).
*   The version of DevExpress npm packages should match the version of NuGet packages. Enable Development Mode to check for a library version mismatch on every request to the server. For details, review the following help topic: [Server-Side Libraries Version](https://docs.devexpress.com/XtraReports/401687/web-reporting/troubleshooting/application-diagnostics#server-side-libraries-version).

Refer to the following topic for more information: [Troubleshooting](https://docs.devexpress.com/XtraReports/401726/web-reporting/troubleshooting).

# Document Viewer Client-Side Configuration in React Applications

Use the `ReportViewer` component to integrate the Web Document Viewer into your React-based application.

## Root Options

The following table lists `ReportViewer` component options:

| Option | Required / Optional | Description |
| --- | --- | --- |
| `reportUrl` | Required | A string identifier used by server-side report name resolution services to instantiate a report. For more information, review the following help topic: [Open a Report in ASP.NET Core Application](https://docs.devexpress.com/XtraReports/402505/web-reporting/asp-net-core-reporting/document-viewer-in-asp-net-applications/open-a-report). |
| `width` | Optional | A string that defines Document Viewer width. The default value is ‘100%’. |
| `height` | Optional | A string that defines Document Viewer height. The default value is ‘700px’. |
| `developmentMode` | Optional | A Boolean value that enables Development mode for extended diagnostics. Review the following help topic for more information: [Trooubleshooting: Server-Side Libraries Version](https://docs.devexpress.com/XtraReports/401687/web-reporting/troubleshooting/application-diagnostics#server-side-libraries-version). |
| `cssClass` | Optional | A string that specifies the CSS class name to attach to the root div element. |
| `isMobile` | Optional | A Boolean value that specifies whether to configure the Document Viewer for mobile devices. Refer to the following topic for more information: [Mobile Mode](https://docs.devexpress.com/XtraReports/402353/web-reporting/angular-reporting/mobile-mode). |
| `rtl` | Optional | A Boolean value that specifies if a right-to-left layout is enabled in the Document Viewer’s UI. |

## Nested Options

### RequestOptions

A nested component that allows you to specify where to send requests from the Document Viewer.

| Option | Required / Optional | Description |
| --- | --- | --- |
| `host` | Required | A server-side project’s URI. |
| `invokeAction` | Required | The URI path of the controller action that processes requests. |
| `getLocalizationAction` | Optional | The URI path of the controller action used to customize localization strings. |

### RemoteSettings

A nested component that configures the Web Document Viewer to display documents that are created remotely with the DevExpress Report and Dashboard Server.

| Option | Required / Optional | Description |
| --- | --- | --- |
| `serverUri` | Required | Specifies the Report and Dashboard Server URI. |
| `authToken` | Required | Specifies the Bearer token to access documents on the DevExpress Report and Dashboard Server. |

### MobileModeSettings

A nested component that provides options for the Web Document Viewer’s mobile mode (if the root `isMobile` option is enabled).

| Option | Required / Optional | Description |
| --- | --- | --- |
| `readerMode` | Optional | Specifies whether to enable a reader mode that displays document pages without page borders. |
| `animationEnabled` | Optional | Specifies whether actions are animated. |

### TabPanelSettings

A nested component that allows you to customize the Document Viewer’s tab panel.

| Option | Required / Optional | Description |
| --- | --- | --- |
| `position` | Optional | Specifies the tab panel’s position (“Left” or “Right”). |
| `width` | Optional | Specifies the tab panel’s width. |

### ExportSettings

A nested component that applies Web Document Viewer print and export settings.

| Option | Required / Optional | Description |
| --- | --- | --- |
| `useSameTab` | Optional | Specifies if the print and export operations are performed in the same browser tab as the Document Viewer control. |
| `showPrintNotificationDialog` | Optional | Specifies whether to display an additional dialog that allows users to download the PDF file sent to printing. |
| `useAsynchronousExport` | Optional | Allows you to export documents asynchronously. |

### SearchSettings

A nested component that allows you to specify Document Viewer search settings.

| Option | Required / Optional | Description |
| --- | --- | --- |
| `searchEnabled` | Optional | Allows you to hide search actions. |
| `useAsyncSearch` | Optional | Specifies whether the Document Viewer uses asynchronous search. |

### Callbacks

A nested component that provides callbacks to customize the Document Viewer. These callbacks correspond to client-side events at the Document Viewer control level.

For a list of available events and details on how to use each event, refer to the following help topic: [Document Viewer Client-Side API](https://docs.devexpress.com/XtraReports/401793/web-reporting/common-features/client-side-functionality/document-viewer-client-side-api).

### Usage

The following code configures the `ReportViewer` component in a React application. The code does the following:
*   Uses the `CustomizeMenuActions` event to hide the Print and Print Page commands from the toolbar.
*   Sets the tab panel’s width to 500px and moves it to the left side.
*   Disables asynchronous export and opens another browser tab for print and export operations.
*   Hides search actions from the Toolbar and Tab Panel.

```javascript
'use client';
import ReportViewer, { RequestOptions, Callbacks, TabPanelSettings, ExportSettings, SearchSettings} from 'devexpress-reporting-react/dx-report-viewer';
import { ActionId } from 'devexpress-reporting/dx-webdocumentviewer'

function App() {
  const onCustomizeMenuActions = ({ args }: { args: any }): void => {
    // Hide the "Print" and "PrintPage" actions.
    var printAction = args.GetById(ActionId.Print);
    if (printAction)
        printAction.visible = false;
    var printPageAction = args.GetById(ActionId.PrintPage);
    if (printPageAction)
        printPageAction.visible = false;
    }
  return (
    <ReportViewer reportUrl="TestReport">
      <RequestOptions host="http://localhost:5000/" invokeAction="DXXRDV" />
      <TabPanelSettings width={500} position='Left'/>
      <ExportSettings useSameTab={false} useAsynchronousExport={false}/>
      <SearchSettings searchEnabled={false}/>
      <Callbacks CustomizeMenuActions={onCustomizeMenuActions} />
    </ReportViewer>
  )
}

export default App
```

The image below shows the resulting Web Document Viewer:

[Report Viewer Configuration](https://docs.devexpress.com/XtraReports/images/react-report-viewer-configuration.png)

# Specify Parameter Values in a React Reporting Application

Use report parameters to control data displayed in a report. For more information on web report parameters, review the following help topic: [Use Report Parameters](https://devexpress.github.io/dotnet-eud/reporting-for-web/articles/report-designer/use-report-parameters.html).

## Use the Parameters Panel

Open the [Parameters Panel](https://docs.devexpress.com/XtraReports/402960/detailed-guide-to-devexpress-reporting/use-report-parameters/parameters-panel) and use its editors to specify parameter values. Click Submit to apply the values to the report and display the document.

[Use the Parameters Panel to specify parameter values in a React Reporting application](https://docs.devexpress.com/XtraReports/images/web-use-parameters-panel-to-specify-parameter-values.png)

## Handle the ParametersInitialized Event

You can initialize parameters before the Document Viewer loads the document.

The following code sample handles the client-side `ParametersInitialized` event:

```javascript
'use client';
import React from 'react'
import ReportViewer, { RequestOptions, Callbacks, DxReportViewerRef } from 'devexpress-reporting-react/dx-report-viewer';

function App() {
  const viewerRef = React.useRef<DxReportViewerRef>();
  const onClick = () => viewerRef.current?.instance().ResetParameters();
  const onParametersReset = ({ args }: { args: any }) => {
    console.log("ParametersReset");
    console.log("Parameter " + args.Parameters[0].path + " is reset to " + args.Parameters[0].value);
  };
  const onParametersSubmitted = ({ args }: { args: any }) => {
    console.log("ParametersSubmitted");
    args.Parameters.forEach((parameter: any) => {
      console.log("Parameter " + parameter.Key + " value " + JSON.stringify(parameter.Value));
    });
  };
  const onParametersInitialized = ({ args }: { args: any }) => {
    console.log("ParametersInitialized");
    args.ActualParametersInfo.forEach((parameterModel: any) => {
      console.log("Parameter " + parameterModel.parameterDescriptor.name + " value " + JSON.stringify(parameterModel.parameterDescriptor.value));
    });
    args.ParametersModel['parameter1'] = 10;
    args.ShouldRequestParameters = false;
  };

  return (
    <>
      <button onClick={onClick}>Reset parameters</button>
      <ReportViewer ref={viewerRef} reportUrl="TestExportReport">
        <RequestOptions host="http://localhost:5000/" invokeAction="/DXXRDV" />
        <Callbacks ParametersReset={onParametersReset} ParametersSubmitted={onParametersSubmitted} ParametersInitialized={onParametersInitialized} />
      </ReportViewer>
    </>
  )
}

export default App
```
