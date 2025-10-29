const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode ? res.statusCode : 500; // Use existing status code or default to 500
  res.status(statusCode);
  res.json({
    message: err.message,
    // Optionally include stack trace in development mode
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};
    
export default errorHandler;
