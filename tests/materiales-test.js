import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 50, // 50 procesos creando materiales
  duration: '30s',
  thresholds: {
    http_req_failed: ['rate<0.01'],
    checks: ['rate>0.99'],
  },
};

export default function () {

  const payload = JSON.stringify({
    nombre: `Material-${Math.random()}`,
    proveedor: "Proveedor Test",
    cantidad: 10
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const response = http.post('http://localhost:3000/api/materiales', payload, params);

  const ok = check(response, {
    'POST /api/materiales responde 201': (res) => res.status === 201,
  });

  if (!ok) {
    console.error(`Error creando material: status=${response.status} body=${response.body}`);
  }

  sleep(0.5);
}