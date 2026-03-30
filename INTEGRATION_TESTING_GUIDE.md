# Integration Testing Guide

## Overview

Integration testing (E2E testing) validates that different parts of the system work together correctly.

## Test Types

### 1. E2E Testing (End-to-End)

Tests the complete flow from user action to final result.

**Examples:**
- User registration → Login → Dashboard
- Calculator → Estimate → Order creation
- Contact form → Email sending
- Admin panel → Database update → System notification

### 2. API Testing

Tests individual API endpoints in isolation.

**Examples:**
- POST /api/orders - Create order
- GET /api/materials - Get materials
- POST /api/calculator/fence - Calculate fence price
- Authentication flow test

### 3. Contract Testing

Tests that services work according to their contracts.

**Examples:**
- Authentication service contract
- Database repository contract
- Cache service contract

### 4. Performance Testing

Tests system performance under load.

**Examples:**
- Load testing with k6
- Stress testing
- Response time benchmarks

## Tools

### E2E Testing Tools

- **Cypress** - Fast, reliable E2E testing framework
  - Installation: `npm install -D cypress cypress`
  - Documentation: https://docs.cypress.io/

- **Playwright** - Fast, modern E2E testing framework
  - Installation: `npm install -D playwright @playwright/test`
  - Documentation: https://playwright.dev/docs/intro/

- **Supertest** - HTTP testing for Node.js
  - Installation: `npm install --save-dev supertest`
  - Documentation: https://github.com/visionmedia/supertest

### API Testing Tools

- **Jest** - Already installed in project
  - Use `npm test` to run API tests

- **MSW (Mock Service Worker)** - Mock API for testing
  - Installation: `npm install msw`
  - Documentation: https://mswjs.io/

### Performance Testing Tools

- **k6** - Modern load testing tool
  - Installation: `npm install -g k6`
  - Documentation: https://k6.io/docs/

- **Artillery** - Cloud-native load testing
  - Installation: `npm install -g artillery`
  - Documentation: https://artillery.io/docs/

## Setup

### 1. Cypress Configuration

Install Cypress:

```bash
npm install -D cypress cypress
```

Create configuration:

```javascript
// cypress.config.js
import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    supportFile: false,
  },
  env: {
    DATABASE_URL: 'postgresql://postgres:password@localhost:5432/fences',
    NEXTAUTH_SECRET: 'test-secret-key-for-testing-only',
  },
})
```

Create test example:

```typescript
// cypress/e2e/calculator.test.ts
describe('Fence Calculator Flow', () => {
  it('should calculate fence price correctly', () => {
    cy.visit('/calculator/fence')
    
    // Select fence type
    cy.get('[data-testid="fence-type"]').click()
    cy.get('[data-testid="euro-shtaketnik"]').click()
    
    // Set dimensions
    cy.get('[data-testid="fence-length"]').type('10')
    cy.get('[data-testid="fence-height"]').type('2')
    
    // Calculate
    cy.get('[data-testid="calculate-btn"]').click()
    
    // Verify result
    cy.get('[data-testid="total-price"]').should('be.visible')
    cy.get('[data-testid="total-price"]').should('contain', '15,000 ₽')
  })
  
  it('should save estimate and create order', () => {
    cy.visit('/calculator/fence')
    
    // Complete calculation
    cy.get('[data-testid="calculate-btn"]').click()
    
    // Save estimate
    cy.get('[data-testid="save-estimate-btn"]').click()
    
    // Verify saved
    cy.get('[data-testid="success-message"]').should('be.visible')
    cy.get('[data-testid="success-message"]').should('contain', 'Estimate saved successfully')
    
    // Navigate to orders
    cy.visit('/admin/orders')
    
    // Verify order created
    cy.get('[data-testid="orders-list"]').should('be.visible')
    cy.get('[data-testid="orders-list"]').contains('test estimate')
  })
  
  it('should handle authentication flow', () => {
    // Login
    cy.visit('/admin/login')
    cy.get('[data-testid="email"]').type('admin@fences.ru')
    cy.get('[data-testid="password"]').type('admin123')
    cy.get('[data-testid="login-btn"]').click()
    
    // Verify redirected to dashboard
    cy.url().should('include', '/admin/dashboard')
    cy.get('[data-testid="welcome-message"]').should('be.visible')
    cy.get('[data-testid="welcome-message"]').should('contain', 'Welcome, admin!')
  })
})
```

Run tests:

```bash
# E2E testing
npx cypress open
npx cypress run

# Headless testing (for CI/CD)
npx cypress run --browser chrome --headless
```

### 2. API Integration Tests

Create API integration tests:

```typescript
// __tests__/integration/api.test.ts
import request from 'supertest';
import { app } from '@/app'; // Express app wrapper

describe('API Integration Tests', () => {
  it('should create order successfully', async () => {
    const orderData = {
      customerEmail: 'test@example.com',
      items: [
        {
          type: 'fence',
          quantity: 10,
          price: 15000,
        },
      ],
    };
    
    const response = await request(app)
      .post('/api/orders')
      .send(orderData)
      .set('Content-Type', 'application/json');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id');
    expect(response.body.customerEmail).toBe('test@example.com');
  });
  
  it('should handle calculator API', async () => {
    const calculatorData = {
      fenceType: 'euro-shtaketnik',
      length: 10,
      height: 2,
    };
    
    const response = await request(app)
      .post('/api/calculator/fence')
      .send(calculatorData)
      .set('Content-Type', 'application/json');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('totalPrice');
  });
  
  it('should return 404 for non-existent endpoint', async () => {
    const response = await request(app)
      .get('/api/non-existent');
    
    expect(response.status).toBe(404);
  });
})
```

Run API tests:

```bash
# API integration tests
npm test -- __tests__/integration/api.test.ts
```

### 3. Database Integration Tests

Test database operations:

```typescript
// __tests__/integration/database.test.ts
import { prisma } from '@/lib/prisma';

describe('Database Integration Tests', () => {
  it('should create and retrieve order', async () => {
    const order = await prisma.order.create({
      data: {
        customerEmail: 'test@example.com',
        total: 15000,
        items: {
          create: [
            { type: 'fence', price: 100, quantity: 10 },
          ],
        },
      },
    });
    
    const retrievedOrder = await prisma.order.findUnique({
      where: { id: order.id },
      include: { items: true },
    });
    
    expect(retrievedOrder.customerEmail).toBe('test@example.com');
    expect(retrievedOrder.items).toHaveLength(1);
    expect(retrievedOrder.items[0].price).toBe(100);
  });
  
  it('should update order status', async () => {
    const order = await prisma.order.create({
      data: {
        customerEmail: 'test@example.com',
        status: 'NEW',
        total: 15000,
      },
    });
    
    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: { status: 'PROCESSING' },
    });
    
    expect(updatedOrder.status).toBe('PROCESSING');
  });
  
  it('should delete order', async () => {
    const order = await prisma.order.create({
      data: {
        customerEmail: 'test@example.com',
        total: 15000,
      },
    });
    
    await prisma.order.delete({ where: { id: order.id } });
    
    const deletedOrder = await prisma.order.findUnique({
      where: { id: order.id },
    });
    
    expect(deletedOrder).toBeNull();
  });
})
```

Run database tests:

```bash
# Database integration tests
npm test -- __tests__/integration/database.test.ts
```

### 4. Performance Testing with k6

Create load test script:

```javascript
// k6/tests/load-testing.js
import http from 'k6/http';

export const options = {
  stages: [
    { duration: '30s', target: 10 }, // 10 requests per second
    { duration: '30s', target: 50 }, // 50 requests per second
    { duration: '30s', target: 100 }, // 100 requests per second
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', // 95th percentile < 500ms
    http_req_failed: ['rate<0.01'], // Failure rate < 1%
  },
};

export default function () {
  const responses = http.batch([
    ['GET', 'http://localhost:3000/'],
    ['POST', 'http://localhost:3000/api/calculator/fence'],
    ['GET', 'http://localhost:3000/api/materials'],
    ['GET', 'http://localhost:3000/api/orders'],
  ]);
  
  sleep(10);
}
```

Run load tests:

```bash
# Install k6
npm install -g k6

# Run load test
k6 run --vus 10 --duration 30s k6/tests/load-testing.js

# Visualize results
k6 run --vus 10 --duration 30s --out json=k6/tests/load-testing.js
```

## Continuous Integration

### GitHub Actions Workflow

Create `.github/workflows/integration-tests.yml`:

```yaml
name: Integration Tests

on:
  push:
    branches: [master, main, dev]
  pull_request:
    branches: [master, main, dev]

jobs:
  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci --legacy-peer-deps
      
      - name: Run E2E tests
        run: npx cypress run --browser chrome --headless
      
      - name: Upload artifacts
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: cypress-screenshots
          path: cypress/screenshots
  
  api-tests:
    runs-on: ubuntu-latest
    services:
      db:
        image: postgres:16-alpine
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: fences_test
        options: >-
          --health-cmd pg_isready -U postgres
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci --legacy-peer-deps
      
      - name: Setup test database
        run: npx prisma migrate dev
        
      - name: Run integration tests
        run: npm test -- __tests__/integration/
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/fences_test
          NODE_ENV: test
      
      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          files: ./coverage/coverage-final.json
          flags: unittests
  
  load-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup k6
        run: npm install -g k6
      
      - name: Run load tests
        run: k6 run --vus 100 --duration 60s k6/tests/load-testing.js --out json=load-test-results.json
      
      - name: Upload results
        uses: actions/upload-artifact@v4
        with:
          name: load-test-results
          path: load-test-results.json
```

## Test Data Management

### Test Database

Create test database:

```sql
-- tests/integration/schema.sql

-- Create test user
CREATE OR REPLACE FUNCTION create_test_user() RETURNS void AS $$
BEGIN
  PERFORM prisma.user.create({
    data: {
      name: 'Test User',
      email: 'test@integration.com',
      password: '$2a$10$Xc/test$password', -- hashed
      role: 'ADMIN',
    }
  });
END;
$$;

SELECT create_test_user();
```

### Test Data

Create test fixtures:

```sql
-- tests/integration/fixtures.sql

-- Insert test materials
INSERT INTO prisma.materials (name, price, unit, active) VALUES
('Евроштакетник', 450, 'м²', true),
('Краска', 300, 'м²', true),
('Столб', 450, 'шт', true);

-- Insert test fence types
INSERT INTO prisma.fence_type (name, description, active) VALUES
('Евроштакетник', 'Забор из евроштакетника', true),
('Краска', 'Забор из краски', true);

-- Insert test works
INSERT INTO prisma.work (name, description, unit, price_per_unit, active) VALUES
('Установка', 'Установка забора', 'м²', 500, true);
('Крепление', 'Крепление забора', 'м²', 300, true);
```

## Best Practices

### 1. Test Isolation

Each test should be independent:
- Use fresh database state for each test
- Clean up created resources
- Run tests in random order

### 2. Deterministic Tests

Use fixed test data:
- Fixed test user credentials
- Pre-defined test materials
- Known test scenarios
- Use mock external services

### 3. Environment Configuration

```yaml
# .github/workflows/integration-tests.yml
env:
  DATABASE_URL: postgresql://postgres:postgres@localhost:5432/fences_test
  NEXTAUTH_SECRET: test-secret-for-integration-testing
  REDIS_URL: redis://localhost:6379
```

### 4. Assertion Library

Use comprehensive assertions:

```typescript
// Best practices
expect(response.status).toBe(200);
expect(response.body.id).toBeDefined();
expect(response.body.items).toBeArray();
expect(response.body.items).toHaveLength(3);
expect(response.body).toMatchObject({ // Shape assertion
  customerEmail: expect.string(),
  total: expect.any(Number),
});
```

### 5. Test Organization

Organize tests by feature:

```
__tests__/
├── integration/
│   ├── api.test.ts
│   ├── database.test.ts
│   └── auth.test.ts
├── e2e/
│   ├── calculator/
│   │   ├── calculate.test.ts
│   │   └── save-estimate.test.ts
│   └── admin/
│       ├── login.test.ts
│       └── orders.test.ts
└── load/
    └── performance.test.js
```

## Troubleshooting

### Common Issues

#### E2E Tests Failing

If Cypress tests fail:
- Check baseUrl in cypress.config.js
- Verify application is running on correct port
- Check for timing issues
- Increase defaultCommandTimeout

#### Database Connection Issues

If tests can't connect to database:
- Verify test database is running
- Check DATABASE_URL is correct
- Verify database is accessible

#### Slow Tests

If tests are too slow:
- Profile test execution
- Optimize database queries
- Add indexes to database schema

## Documentation

- **Cypress:** https://docs.cypress.io/
- **Playwright:** https://playwright.dev/
- **Supertest:** https://github.com/visionmedia/supertest
- **k6:** https://k6.io/docs/
- **Jest:** https://jestjs.io/docs/getting-started

## Quick Start

```bash
# Install testing dependencies
npm install -D cypress @playwright/test supertest

# Create test structure
mkdir -p __tests__/integration __tests__/e2e __tests__/load

# Run all tests
npm test

# Run E2E tests with GUI
npx cypress open

# Run load tests
k6 run --vus 10 --duration 30s k6/tests/load-testing.js
```

## Monitoring

Track test metrics in Grafana:

- Test execution time
- Pass/fail rates
- Response times
- Database query performance

Add to existing Prometheus alerts:

```yaml
# prometheus/alert_rules.yml
- alert: HighTestFailureRate
  expr: |
    (
      rate(test_results_total{status="failed"}[5m])
      / rate(test_results_total[5m])
    ) > 0.05
  for: 5m
  labels:
    severity: warning
    service: "tests"
```
