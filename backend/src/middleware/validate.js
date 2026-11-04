// Validate req.body / req.query against a zod schema.
// Errors are forwarded to the central error handler (400 with details).
// NOTE: in Express 5 req.query is read-only, so parsed query lives in req.validatedQuery.
export const validate = (schema, source = "body") => (req, res, next) => {
  const result = schema.safeParse(req[source] ?? {});
  if (!result.success) return next(result.error);

  if (source === "query") req.validatedQuery = result.data;
  else req[source] = result.data;

  next();
};
