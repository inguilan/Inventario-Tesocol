import { test } from '@playwright/test';

test.describe.configure({ mode: 'parallel' });

for (let i = 0; i < 100; i++) {

    test(`usuario_${i} crea material`, async ({ page }) => {

        // Autenticarse primero
        await page.goto('http://localhost:3000/login');
        await page.waitForLoadState('networkidle');
        await page.getByRole('textbox', { name: /usuario/i }).fill('admin');
        await page.getByRole('textbox', { name: /contrase/i }).fill('tesocol2026 05');
        await page.getByRole('button', { name: /ingresar/i }).click();
        await page.waitForURL('**/dashboard', { timeout: 10000 });

        await page.goto('http://localhost:3000/inventario');
        await page.waitForLoadState('networkidle');

        await page.getByRole('button', { name: 'Nuevo Material' }).click();

        await page.getByRole('textbox', { name: 'Ej: PS-550W-MONO' })
            .fill(`Material-Test-${i}`);

        await page.getByRole('textbox', { name: 'Nombre del proveedor' })
            .fill(`Proveedor-${i}`);

        await page.getByRole('spinbutton').fill('10');

        await page.getByRole('button', { name: '💾 Guardar' }).click();

    });

}