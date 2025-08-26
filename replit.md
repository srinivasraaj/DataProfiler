# CSV Data Profiling Application

## Overview

This is a full-stack web application for CSV data profiling and analysis. Users can upload CSV files and get comprehensive insights about their data including row counts, null value analysis, duplicate detection, date range analysis, and data quality metrics. The application provides an intuitive interface for configuring profiling options and generates detailed reports with export capabilities.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript for type safety and component-based development
- **Styling**: TailwindCSS with shadcn/ui component library for consistent, modern UI design
- **State Management**: React Query (TanStack Query) for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation for type-safe form management
- **Build Tool**: Vite for fast development and optimized production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js framework for RESTful API endpoints
- **Language**: TypeScript for type safety across the entire stack
- **Data Processing**: In-memory processing for CSV analysis with extensible storage interface
- **File Parsing**: Papa Parse library for robust CSV parsing and validation
- **Schema Validation**: Zod for runtime type checking and data validation

### Data Storage Solutions
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Connection**: Neon Database serverless PostgreSQL for scalable cloud database hosting
- **Migration Management**: Drizzle Kit for database schema migrations and management
- **Session Storage**: PostgreSQL-backed session storage using connect-pg-simple

### Authentication and Authorization
- Session-based authentication using Express sessions
- PostgreSQL session store for persistent session management
- CORS and security middleware configured for production deployment

### API Design Patterns
- RESTful API structure with clear resource endpoints
- Centralized error handling middleware for consistent error responses
- Request/response validation using Zod schemas
- Structured JSON responses with proper HTTP status codes
- Shared TypeScript types between frontend and backend for API contracts

### Component Architecture
- Modular component structure with clear separation of concerns
- Custom hooks for reusable logic (mobile detection, toast notifications)
- UI components built on Radix UI primitives for accessibility
- Responsive design patterns using Tailwind's utility classes

### Data Processing Pipeline
1. **Upload**: File validation and CSV parsing with error handling
2. **Preview**: Data display with pagination for large datasets
3. **Configuration**: User-selectable profiling options with defaults
4. **Processing**: Server-side analysis with progress indicators
5. **Reporting**: Comprehensive results with export functionality

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL database connection for cloud deployment
- **drizzle-orm & drizzle-kit**: Type-safe ORM and migration tools for database management
- **@tanstack/react-query**: Server state management and caching for React applications
- **express**: Web application framework for Node.js backend services
- **papa-parse**: CSV parsing library for robust file processing

### UI and Styling
- **@radix-ui/***: Accessible, unstyled UI primitives for building design systems
- **tailwindcss**: Utility-first CSS framework for rapid UI development
- **class-variance-authority**: Utility for creating type-safe component variants
- **lucide-react**: Icon library with consistent, customizable SVG icons

### Development and Build Tools
- **vite**: Fast build tool and development server with HMR support
- **typescript**: Static type checking for JavaScript applications
- **zod**: TypeScript-first schema validation library
- **wouter**: Minimalist routing library for React applications

### Additional Integrations
- **date-fns**: Date utility library for date manipulation and formatting
- **react-hook-form**: Performant forms library with minimal re-renders
- **@hookform/resolvers**: Validation resolvers for React Hook Form integration
- **connect-pg-simple**: PostgreSQL session store for Express sessions