const fs = require('fs');
const file = 'src/app/admin/categories/category-form.tsx';
let content = fs.readFileSync(file, 'utf-8');

// Replace the top Card wrapper
content = content.replace(
  /<Card className="max-w-2xl mx-auto shadow-lg">[\s\S]*?<CardHeader>[\s\S]*?<\/CardHeader>\s*<Form \{\.\.\.form\}>\s*<form onSubmit=\{form\.handleSubmit\(onSubmit\)\}>/,
  `<Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">`
);

// Replace the CardContent
content = content.replace(
  /<CardContent className="space-y-6 p-6 bg-secondary\/30">/,
  `<div className="space-y-6 pt-1">`
);

// Replace the CardFooter
const footerRegex = /<\/CardContent>[\s\S]*?<CardFooter className="flex justify-end gap-2 p-6 border-t">[\s\S]*?<\/CardFooter>[\s\S]*?<\/form>[\s\S]*?<\/Form>[\s\S]*?<\/Card>/;
content = content.replace(
  footerRegex,
  `</div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onCancel ? onCancel() : router.push('/admin/categories')}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {submitButtonText}
            </Button>
          </div>
        </form>
      </Form>`
);

content = content.replace(
  /import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@\/components\/ui\/card';\n/,
  ''
);

fs.writeFileSync(file, content);
console.log('Fixed category-form.tsx');
