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
      </body>
    </html>
  `;

  return ejs.render(template, reportDefinition);
};
