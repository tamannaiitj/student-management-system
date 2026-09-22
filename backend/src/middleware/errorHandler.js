export function errorHandler(error, _request, response, _next) {
  console.error(error);

  if (error.code?.startsWith('SQLITE_CONSTRAINT')) {
    return response.status(409).json({ message: 'A student with that student ID or email already exists.' });
  }

  return response.status(500).json({ message: 'Something went wrong on the server.' });
}
