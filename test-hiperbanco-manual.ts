import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { HiperbancoAuthService } from './src/financial-providers/hiperbanco/hiperbanco-auth.service';
import { FinancialCredentialsService } from './src/financial-providers/services/financial-credentials.service';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const authService = app.get(HiperbancoAuthService);
    const credentialsService = app.get(FinancialCredentialsService);

    console.log('--- Starting Hiperbanco Manual Verification ---');

    // 1. Setup Dummy Credentials for Hiperbanco
    console.log('1. Setting up credentials...');
    await credentialsService.saveCredentials('hiperbanco', {
        login: 'email@email.com',
        password: 'Senhatest123@',
    });

    // 2. Test Backoffice Login
    console.log('\n2. Testing Backoffice Login...');
    try {
        const result = await authService.loginBackoffice({ email: 'email@email.com', password: 'Senhatest123@' });
        console.log('✅ Backoffice Login Success:', result);
    } catch (error) {
        console.error('❌ Backoffice Login Failed:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        }
    }

    // 3. Test API Bank Login
    console.log('\n3. Testing API Bank Login...');
    try {
        const result = await authService.loginApiBank({ document: '52365478526', password: 'Senhatest123@' });
        console.log('✅ API Bank Login Success:', result);
    } catch (error) {
        console.error('❌ API Bank Login Failed:', error.message);
    }

    await app.close();
}

bootstrap();
