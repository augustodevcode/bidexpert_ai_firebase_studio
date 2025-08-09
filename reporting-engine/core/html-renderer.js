import ejs from 'ejs';

export const render = (reportDefinition) => {
  const template = `
    <!DOCTYPE html>
    <html>
      <head>
        <title><%= title %></title>
      </head>
      <body>
        <h1><%= title %></h1>
        <% pages.forEach(page => { %>
          <% page.sections.forEach(section => { %>
            <% section.elements.forEach(element => { %>
              <% if (element.type === 'text') { %>
                <p style="position: absolute; left: <%= element.properties.x %>px; top: <%= element.properties.y %>px; width: <%= element.properties.width %>px; height: <%= element.properties.height %>px;"><%= element.properties.text %></p>
              <% } %>
            <% }); %>
          <% }); %>
        <% }); %>
      </body>
    </html>
  `;

  return ejs.render(template, reportDefinition);
};
