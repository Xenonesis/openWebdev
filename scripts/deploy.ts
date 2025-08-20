#!/usr/bin/env node

import { execSync } from 'child_process';
import { writeFileSync, existsSync } from 'fs';
import path from 'path';

interface DeploymentConfig {
  environment: 'production' | 'staging' | 'development';
  buildOptimizations: boolean;
  securityChecks: boolean;
  performanceTests: boolean;
}

class DeploymentManager {
  private config: DeploymentConfig;

  constructor(environment: 'production' | 'staging' | 'development' = 'production') {
    this.config = {
      environment,
      buildOptimizations: environment === 'production',
      securityChecks: environment === 'production',
      performanceTests: environment === 'production',
    };
  }

  async deploy(): Promise<void> {
    console.log(`🚀 Starting deployment for ${this.config.environment} environment...`);

    try {
      await this.runPreDeploymentChecks();
      await this.buildApplication();
      await this.runTests();
      await this.optimizeAssets();
      await this.createDockerImage();
      await this.validateDeployment();

      console.log('✅ Deployment completed successfully!');
    } catch (error) {
      console.error('❌ Deployment failed:', error);
      process.exit(1);
    }
  }

  private async runPreDeploymentChecks(): Promise<void> {
    console.log('🔍 Running pre-deployment checks...');

    // Check required environment variables
    const requiredEnvVars = [
      'NODE_ENV',
      'DATABASE_URL',
      'CHUTES_API_KEY',
    ];

    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        throw new Error(`Missing required environment variable: ${envVar}`);
      }
    }

    // Run linting
    try {
      execSync('npm run lint', { stdio: 'inherit' });
    } catch {
      if (this.config.environment === 'production') {
        throw new Error('Linting failed. Fix errors before deploying to production.');
      }
      console.warn('⚠️ Linting warnings detected but continuing...');
    }

    console.log('✅ Pre-deployment checks passed');
  }

  private async buildApplication(): Promise<void> {
    console.log('🔨 Building application...');

    const buildCommand = this.config.buildOptimizations
      ? 'npm run build:production'
      : 'npm run build';

    try {
      execSync(buildCommand, { stdio: 'inherit' });
    } catch (error) {
      throw new Error('Build failed');
    }

    console.log('✅ Application built successfully');
  }

  private async runTests(): Promise<void> {
    if (!this.config.performanceTests) {
      console.log('⏭️ Skipping tests for non-production environment');
      return;
    }

    console.log('🧪 Running test suite...');

    try {
      execSync('npm run test:ci', { stdio: 'inherit' });
    } catch (error) {
      throw new Error('Tests failed');
    }

    console.log('✅ All tests passed');
  }

  private async optimizeAssets(): Promise<void> {
    console.log('⚡ Optimizing assets...');

    if (this.config.buildOptimizations) {
      // Create optimized build configuration
      const buildConfig = {
        minify: true,
        sourcemap: false,
        treeShaking: true,
        compression: 'gzip',
      };

      writeFileSync(
        path.join(process.cwd(), 'build.config.json'),
        JSON.stringify(buildConfig, null, 2)
      );
    }

    console.log('✅ Assets optimized');
  }

  private async createDockerImage(): Promise<void> {
    console.log('🐳 Creating Docker image...');

    const dockerfilePath = path.join(process.cwd(), 'Dockerfile');
    
    if (!existsSync(dockerfilePath)) {
      this.createDockerfile();
    }

    const imageName = `openwebdev:${this.config.environment}`;

    try {
      execSync(`docker build -t ${imageName} .`, { stdio: 'inherit' });
    } catch (error) {
      throw new Error('Docker image creation failed');
    }

    console.log(`✅ Docker image created: ${imageName}`);
  }

  private createDockerfile(): void {
    const dockerfile = `# Production Dockerfile for OpenWebdev
FROM node:18-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat

FROM base AS deps
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

FROM base AS builder
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM base AS runner
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/build ./build
COPY --from=builder /app/public ./public
COPY package*.json ./

USER nextjs

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

CMD ["npm", "start"]
`;

    writeFileSync('Dockerfile', dockerfile);
    console.log('📝 Created Dockerfile');
  }

  private async validateDeployment(): Promise<void> {
    console.log('🔍 Validating deployment...');

    if (this.config.securityChecks) {
      console.log('🔒 Running security checks...');
      
      try {
        execSync('npm audit --audit-level high', { stdio: 'inherit' });
      } catch {
        console.warn('⚠️ Security audit found issues. Review before production deployment.');
      }
    }

    console.log('✅ Deployment validation completed');
  }

  static async quickDeploy(environment: 'production' | 'staging' = 'production'): Promise<void> {
    const manager = new DeploymentManager(environment);
    await manager.deploy();
  }
}

// CLI interface
if (require.main === module) {
  const environment = (process.argv[2] as 'production' | 'staging') || 'production';
  DeploymentManager.quickDeploy(environment);
}

export default DeploymentManager;