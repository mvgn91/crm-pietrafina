# Checklist de Producción para CRM Pietra Fina

## 1. Tailwind CSS
- Elimina el CDN de Tailwind en `index.html`.
- Usa el comando `npx tailwindcss -i ./style.css -o ./style.prod.css --minify` para compilar el CSS optimizado.
- Cambia la referencia en `index.html` de `style.css` a `style.prod.css`.

## 2. Seguridad Firestore
- Revisa y refuerza las reglas en `firestore.rules`.
- Solo usuarios autenticados pueden leer/escribir.
- Limita el acceso por rol y colección.

## 3. Pruebas
- Haz pruebas manuales de todos los flujos.
- Usa Lighthouse para accesibilidad y rendimiento.

## 4. Optimización
- Elimina librerías y scripts no usados.
- Minifica JS si es posible.

## 5. Despliegue
- Documenta el proceso de despliegue y recuperación.

---

**Comando Tailwind recomendado:**

```
npx tailwindcss -i ./style.css -o ./style.prod.css --minify
```

