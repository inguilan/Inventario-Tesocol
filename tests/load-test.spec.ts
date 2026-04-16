import { test } from '@playwright/test';

test.describe.configure({ mode: 'parallel' });

for (let i = 0; i < 100; i++) {

    test(`usuario_${i} crea material`, async ({ page }) => {

        await page.goto('http://localhost:3000');

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