# Cursor Rules Collection

A comprehensive collection of coding guidelines and best practices for various technologies, designed to be used with the Cursor IDE.

## Overview

This repository contains a set of rules that help maintain consistent coding standards when working with different technologies and frameworks. These rules are automatically applied by Cursor IDE when working with relevant files, providing real-time guidance and ensuring code quality.

## Included Rules

### Database & Backend
- **SQL Formatting** - Guidelines for writing clean, consistent Postgres SQL
- **Database Migrations** - Best practices for creating and managing database migrations
- **Database Functions** - Standards for implementing Postgres database functions
- **Row Level Security Policies** - Guidelines for implementing secure RLS policies
- **Edge Functions** - Best practices for writing serverless edge functions with TypeScript
- **Supabase** - Comprehensive guidelines for Supabase backend development

### Frontend
- **Next.js** - Best practices for Next.js application development
- **Next.js with Supabase Auth** - Implementation guidelines for authentication in Next.js applications
- **React Query** - Standards for data fetching and state management
- **Tailwind CSS** - Standards for using Tailwind utility classes effectively
- **Shadcn UI** - Best practices for implementing Shadcn UI components
- **Radix UI** - Guidelines for accessible component implementation

### Testing & DevOps
- **Playwright** - Guidelines for writing effective end-to-end tests
- **Stripe Integration** - Best practices for implementing payment processing

### Build Tools & Performance
- **Turbopack** - Guidelines for optimizing build performance

## Usage

1. Clone this repository
2. The rules are located in the `.cursor/rules` directory
3. When working with projects in Cursor IDE, these rules will be automatically applied to relevant files based on their glob patterns

## Rule Application

Each rule file includes:
- A description of its purpose
- File glob patterns that determine when the rule is applied
- Detailed guidelines and best practices
- Code examples and anti-patterns to avoid

## Project Structure

```
.
├── .cursor/
│   └── rules/
│       ├── code-format-sql.mdc           # SQL formatting guidelines
│       ├── database-create-migration.mdc # Database migration standards
│       ├── database-functions.mdc        # Database function implementation
│       ├── database-rls-policies.mdc     # Row Level Security policies
│       ├── edge-functions.mdc            # Edge Functions best practices
│       ├── next-js.mdc                   # Next.js development guidelines
│       ├── nextjs-supabase-auth.mdc      # Next.js auth with Supabase
│       ├── playwright.mdc                # Playwright testing standards
│       ├── radix-ui-rule.mdc             # Radix UI implementation
│       ├── react-query.mdc               # React Query data fetching
│       ├── shadcn.mdc                    # Shadcn UI implementation
│       ├── stripe.mdc                    # Stripe integration best practices
│       ├── supabase.mdc                  # Supabase development guidelines
│       ├── tailwind.mdc                  # Tailwind CSS usage patterns
│       └── turbopack.mdc                 # Turbopack configuration
└── README.md                             # Project documentation
```

## License

This project is licensed under [CC0 1.0 Universal](LICENSE) - see the LICENSE file for details.

## Credits

These rules are adapted from the following sources:

- [Supabase Examples and Prompts](https://github.com/supabase/supabase/tree/master/examples/prompts) - Official Supabase guidelines and best practices
- [Awesome Cursor Rules MDC](https://github.com/sanjeed5/awesome-cursor-rules-mdc/tree/main) - Community-driven collection of Cursor rules for various technologies

The MDC (Markdown Cursor) format is designed to work with Cursor IDE to provide contextual guidance when working with specific file types. 