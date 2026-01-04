import { HttpInterceptorFn } from '@angular/common/http';

// Asegura que las cookies de sesión (JSESSIONID) se envían al backend en cada petición.
export const credentialsInterceptor: HttpInterceptorFn = (req, next) => {
  const withCreds = req.clone({ withCredentials: true });
  return next(withCreds);
};
