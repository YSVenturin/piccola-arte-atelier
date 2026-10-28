# Piccola Arte Atelier

**Full-stack product catalog built with Java, Spring Boot, PostgreSQL, React, and TypeScript.**

[Live website](https://piccolaarteatelier.com.br) · [Source code](https://github.com/YSVenturin/piccola-arte-atelier)

## Overview

Piccola Arte Atelier is a web application developed for a small handmade-goods business specializing in cold porcelain crafts. The goal is to present the brand and its products through a responsive catalog, while providing administrative features for managing the published content.

This is a **product catalog, not an online checkout system**. The project connects a React frontend to a Java/Spring Boot REST API backed by PostgreSQL and is deployed to a Linux server.

## Features

- Responsive public catalog with category-based filtering.
- Individual product pages with descriptions and image galleries.
- Product information such as pricing visibility, availability, and made-to-order status.
- Administrative functionality for managing products, categories, and images.
- REST API for retrieving product and category information.
- Public informational pages and search-engine discovery files, including a sitemap.
- Live deployment with HTTPS and Nginx.

## Technology stack

| Area | Technologies |
| --- | --- |
| Backend | Java 21, Spring Boot, Spring Web, Spring Data JPA / Hibernate, Spring Security |
| Database | PostgreSQL |
| Frontend | React, TypeScript, Vite, Tailwind CSS |
| Infrastructure | Ubuntu Linux, Nginx, HTTPS, DigitalOcean |
| Development | Git, Maven, npm |

## Architecture

The application is divided into three main parts:

1. **Frontend:** a React application responsible for the catalog, product details, and responsive user interface.
2. **Backend:** a Spring Boot REST API responsible for business rules, persistence, and access to administrative operations.
3. **Database:** PostgreSQL stores product, category, and image metadata.

In production, **Nginx serves the built frontend and forwards API requests to the Spring Boot application**, which connects to PostgreSQL.

### Main data entities

- **Product:** descriptive information, price-related settings, visibility, and availability.
- **Category:** catalog organization and filtering; a product may belong to multiple categories.
- **ProductImage:** images associated with each product, including their display order.

### Public API examples

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/products` | List publicly available products |
| `GET` | `/api/products?category={slug}` | Filter products by category |
| `GET` | `/api/products/{slug}` | Retrieve product details |
| `GET` | `/api/categories` | List categories |

Administrative operations are protected and are not intended for public use.

## Repository structure

- **`backend/`** — Java/Spring Boot application and database integration.
- **`frontend/`** — React/TypeScript application and static assets.
- **`ops/`** — infrastructure and operational configuration.

## Running locally

### Requirements

- JDK 21
- Maven
- PostgreSQL
- Node.js and npm

### 1. Clone the repository

`git clone https://github.com/YSVenturin/piccola-arte-atelier.git`

`cd piccola-arte-atelier`

### 2. Start the backend

Create a local PostgreSQL database and configure the connection for the `local` Spring profile. You can supply the standard Spring datasource environment variables (`SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, and `SPRING_DATASOURCE_PASSWORD`) or use your local configuration files.

From the `backend/` directory, run:

`mvn spring-boot:run -Dspring-boot.run.profiles=local`

The API is intended to run locally on port `8080`, unless configured otherwise.

### 3. Start the frontend

From the `frontend/` directory, run:

`npm install`

`npm run dev`

Open the local URL printed by Vite. Make sure the frontend's API configuration points to the running backend.

> **Note:** Local database credentials and any environment-specific configuration must be supplied by the developer. Do not commit production secrets to the repository.

## Development process and AI assistance

I developed this project as a practical opportunity to build and maintain a real application with Java and Spring Boot. I implemented a substantial portion of the backend myself, especially the domain model, persistence, API endpoints, and core application logic.

**AI coding assistants were also used extensively**, particularly for frontend implementation, infrastructure and deployment, security-related configuration, and more complex backend tasks. My work included defining requirements, integrating components, debugging issues, testing the application, and maintaining the deployed result.

The project reflects both my hands-on backend experience and the areas where I am continuing to develop greater independence.

## Next improvements

- Expand automated backend tests, including API and service-level tests.
- Set up continuous integration for builds and tests.
- Improve local setup documentation and configuration management.
- Continue refining accessibility, performance, and search-engine visibility.

## Project status

**Live and maintained.** This is an ongoing project developed for a real business, and implementation details may evolve as the application is improved.
