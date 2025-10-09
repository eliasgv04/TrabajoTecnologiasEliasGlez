import { HttpInterceptorFn } from '@angular/common/http';

// Ensure cookies (JSESSIONID) are sent to backend
export const credentialsInterceptor: HttpInterceptorFn = (req, next) => {
  const withCreds = req.clone({ withCredentials: true });
  return next(withCreds);
};
