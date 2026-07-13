# Architecture Decisions Record (ADR)

## 1. Monorepo Structure
**Date**: 2026-07-13
**Decision**: Use Turborepo.
**Reason**: Better caching and execution speed. Allows sharing TypeScript types and UI components seamlessly between the Next.js frontend and NestJS backend.

## 2. Database ORM
**Date**: 2026-07-13
**Decision**: Use Prisma.
**Reason**: Highly readable schema, strong ecosystem, and excellent developer experience. Better suited for rapidly defining complex relationships (Users, Locations, QRCodes, Reviews).

## 3. AI Engine
**Date**: 2026-07-13
**Decision**: Use OpenAI GPT-4o-mini.
**Reason**: It offers an optimal balance of extremely low cost, low latency, and high-quality generation, which is crucial for scaling to 10M+ reviews without massive AI API overhead.
